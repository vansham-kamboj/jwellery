<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/** Store settings: database values (Admin → Settings) over config('store.defaults'). */
class Settings
{
    private const CACHE_KEY = 'store.settings';

    public static function all(): array
    {
        $saved = Cache::rememberForever(self::CACHE_KEY, function () {
            if (! Schema::hasTable('settings')) {
                return [];
            }

            return Setting::all()->mapWithKeys(fn (Setting $s) => [$s->key => json_decode($s->value, true)])->all();
        });

        return array_replace(config('store.defaults'), $saved);
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return self::all()[$key] ?? $default;
    }

    public static function put(array $values): void
    {
        foreach ($values as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => json_encode($value)]);
        }
        Cache::forget(self::CACHE_KEY);
    }

    /** Settings that are safe to show on the storefront. */
    public static function public(): array
    {
        $s = self::all();

        return [
            'store_name' => $s['store_name'],
            'currency' => $s['currency'],
            'announcement' => $s['announcement'],
            'hours' => $s['hours'],
            'address' => $s['address'],
            'contact_email' => $s['contact_email'],
            'contact_phone' => $s['contact_phone'],
            'whatsapp_number' => $s['whatsapp_number'],
            'social' => array_filter([
                'instagram' => $s['social_instagram'],
                'youtube' => $s['social_youtube'],
                'x' => $s['social_x'],
                'facebook' => $s['social_facebook'],
            ]),
            'gift_wrap_fee' => (float) $s['gift_wrap_fee'],
            'gift_wrap_min' => (float) $s['gift_wrap_min'],
            'prices_include_tax' => (bool) $s['prices_include_tax'],
            'show_bullion_prices' => (bool) $s['show_bullion_prices'],
            'spot' => [
                'gold_oz' => $s['spot_gold_oz'] !== null ? (float) $s['spot_gold_oz'] : null,
                'silver_oz' => $s['spot_silver_oz'] !== null ? (float) $s['spot_silver_oz'] : null,
                'updated_at' => $s['spot_updated_at'],
            ],
            'quote_above' => (float) $s['quote_above'],
            'default_province' => $s['default_province'],
            'tax_rates' => $s['tax_rates'],
            'shipping_methods' => $s['shipping_methods'],
            'booking_days' => $s['booking_days'],
            'booking_slots' => $s['booking_slots'],
        ];
    }
}
