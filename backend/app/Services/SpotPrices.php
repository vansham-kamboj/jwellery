<?php

namespace App\Services;

use App\Support\Settings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Today's gold and silver price in CAD per troy ounce, for the top bar and the bullion pages.
 *
 * Automatic (default): the server asks the price feed at most once every few minutes and keeps the answer, so every
 * visitor gets the same number quickly and the feed is never called per visitor. If the feed is down, the last good
 * price is kept for up to two days; after that — or in Manual mode — the rates typed in Admin → Settings are used.
 * The feed addresses are in config/store.php (set SPOT_* in .env to change provider) — nothing else needs to change.
 */
class SpotPrices
{
    private const FRESH_MINUTES = 5;        // how long a fetched price is reused
    private const RETRY_SECONDS = 90;       // after a failed fetch, wait this long before asking again
    private const STALE_HOURS = 48;         // a last good price older than this is no longer shown

    /** @return array{gold_oz: ?float, silver_oz: ?float, updated_at: ?string, source: string} */
    public function current(bool $fetch = true): array
    {
        if (Settings::get('spot_mode', 'auto') === 'manual') {
            return $this->manual();
        }

        $fresh = Cache::get('spot.fresh');
        if (! $fresh && $fetch && ! Cache::has('spot.retry')) {
            $fresh = $this->refresh();
        }
        $price = $fresh ?: $this->lastGood();

        return $price ?: $this->manual();
    }

    /** Asks the feed now and stores the answer; null (and a short pause) if it can't be reached or looks wrong. */
    public function refresh(): ?array
    {
        $cfg = config('store.spot');
        try {
            $gold = (float) Http::timeout($cfg['timeout'])->acceptJson()->get($cfg['gold_url'])->throw()->json('price');
            $silver = (float) Http::timeout($cfg['timeout'])->acceptJson()->get($cfg['silver_url'])->throw()->json('price');
            $fx = (float) Http::timeout($cfg['timeout'])->acceptJson()->get($cfg['fx_url'])->throw()->json('rates.CAD');
        } catch (Throwable $e) {
            report($e);
            Cache::put('spot.retry', true, self::RETRY_SECONDS);

            return null;
        }
        // Reject numbers that can't be right, so a bad answer from the feed never reaches the website.
        if (! ($gold >= 100 && $gold <= 100000 && $silver >= 1 && $silver <= 5000 && $fx >= 0.5 && $fx <= 3)) {
            report(new \RuntimeException("Spot feed returned odd numbers: gold {$gold}, silver {$silver}, CAD {$fx}"));
            Cache::put('spot.retry', true, self::RETRY_SECONDS);

            return null;
        }

        $price = ['gold_oz' => round($gold * $fx, 2), 'silver_oz' => round($silver * $fx, 2), 'updated_at' => now()->toIso8601String(), 'source' => 'live'];
        Cache::put('spot.fresh', $price, now()->addMinutes(self::FRESH_MINUTES));
        Cache::put('spot.last', $price, now()->addHours(self::STALE_HOURS));
        Cache::forget('spot.retry');

        return $price;
    }

    private function lastGood(): ?array
    {
        return Cache::get('spot.last');
    }

    /** The rates typed in Admin → Settings (empty when none were entered). */
    private function manual(): array
    {
        $s = Settings::all();

        return [
            'gold_oz' => $s['spot_gold_oz'] !== null ? (float) $s['spot_gold_oz'] : null,
            'silver_oz' => $s['spot_silver_oz'] !== null ? (float) $s['spot_silver_oz'] : null,
            'updated_at' => $s['spot_updated_at'],
            'source' => 'manual',
        ];
    }
}
