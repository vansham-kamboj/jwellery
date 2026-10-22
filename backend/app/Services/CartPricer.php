<?php

namespace App\Services;

use App\Models\Offer;
use App\Models\Product;
use App\Support\Settings;
use Illuminate\Support\Collection;

/**
 * Prices a bag from the database. The browser only sends what was picked
 * (product, finish, size, qty) — every amount is computed here.
 */
class CartPricer
{
    private ?Collection $offers = null;

    /** Price of one product after the single best running offer. */
    public function priceFor(Product $product, float $adjustment = 0): array
    {
        $original = round((float) $product->price + $adjustment, 2);
        $best = null;
        $off = 0.0;
        foreach ($this->runningOffers() as $offer) {
            if ($offer->appliesTo($product) && ($d = $offer->discountOn($original)) > $off) {
                [$best, $off] = [$offer, $d];
            }
        }

        return ['price' => round($original - $off, 2), 'original' => $original, 'offer' => $best?->name, 'badge' => $best?->badge];
    }

    /**
     * @param  array  $lines  [['product' => slug, 'finish' => slug|null, 'size' => label|null, 'qty' => int], ...]
     */
    public function quote(array $lines, ?string $delivery = null, ?string $province = null, bool $giftWrap = false): array
    {
        $settings = Settings::all();
        $slugs = collect($lines)->pluck('product')->filter()->unique();
        $products = Product::visible()->with(['finishes', 'sizes'])->whereIn('slug', $slugs)->get()->keyBy('slug');

        $items = [];
        $problems = [];
        foreach (array_values($lines) as $i => $line) {
            $p = $products->get($line['product'] ?? '');
            if (! $p || ! $p->in_stock || $p->stock_qty === 0) {
                $problems[] = ['line' => $i, 'message' => 'This piece is no longer available.'];

                continue;
            }
            if ($p->priceHidden()) {
                $problems[] = ['line' => $i, 'message' => 'Gold prices change daily — message us for today’s price on '.$p->name.'.'];

                continue;
            }

            $finish = null;
            $adjust = 0.0;
            if ($p->finishes->isNotEmpty()) {
                $finish = ! empty($line['finish']) ? $p->finishes->firstWhere('slug', $line['finish']) : $p->finishes->first();
                if (! $finish || ! $finish->pivot->in_stock) {
                    $problems[] = ['line' => $i, 'message' => 'That finish is not available for '.$p->name.'.'];

                    continue;
                }
                $adjust = (float) $finish->pivot->price_adjustment;
            }

            $size = null;
            if ($p->sizes->isNotEmpty()) {
                $size = $p->sizes->firstWhere('label', (string) ($line['size'] ?? $p->default_size));
                if (! $size || ! $size->in_stock) {
                    $problems[] = ['line' => $i, 'message' => 'Please choose an available size for '.$p->name.'.'];

                    continue;
                }
            }

            $qty = max(1, min((int) ($line['qty'] ?? 1), (int) $settings['max_qty_per_line']));
            if ($p->stock_qty !== null && $qty > $p->stock_qty) {
                $qty = $p->stock_qty;
                $problems[] = ['line' => $i, 'message' => 'Only '.$p->stock_qty.' left of '.$p->name.'.'];
            }
            $price = $this->priceFor($p, $adjust);
            $needsQuote = $p->needsQuote($price['price']);
            if ($needsQuote && $qty > 1) {
                $qty = 1;
                $problems[] = ['line' => $i, 'message' => 'For more than one '.($p->short_name ?: $p->name).', request a quote — the price is confirmed on the day.'];
            }

            $items[] = [
                'product_id' => $p->id,
                'product' => $p->slug,
                'name' => $p->name,
                'finish' => $finish?->name,
                'size' => $size?->label,
                'qty' => $qty,
                'unit_price' => $price['price'],
                'original_price' => $price['original'],
                'offer' => $price['offer'],
                'line_total' => round($price['price'] * $qty, 2),
                'tax_exempt' => $p->tax_exempt,
                'needs_quote' => $needsQuote,
            ];
        }

        $subtotal = round(array_sum(array_column($items, 'line_total')), 2);
        $discount = round(array_sum(array_map(fn ($l) => ($l['original_price'] - $l['unit_price']) * $l['qty'], $items)), 2);

        $methods = collect($settings['shipping_methods']);
        $allowed = $methods->filter(fn ($m) => empty($m['min_order']) || $subtotal >= (float) $m['min_order']);
        $method = $methods->firstWhere('code', $delivery) ?? $allowed->first() ?? $methods->first();
        if ($items && ! empty($method['min_order']) && $subtotal < (float) $method['min_order']) {
            $problems[] = ['line' => null, 'message' => $method['name'].' is for orders of $'.number_format((float) $method['min_order'], 0).' or more.'];
            $method = $allowed->first() ?? $method;
        }
        $deliveryFee = 0.0;
        if ($method && $items) {
            $free = $method['free_over'] ?? null;
            $deliveryFee = ($free !== null && $subtotal >= (float) $free) ? 0.0 : (float) $method['fee'];
        }
        $giftWrap = $giftWrap && $items && $subtotal >= (float) ($settings['gift_wrap_min'] ?? 0);
        $giftFee = $giftWrap ? (float) $settings['gift_wrap_fee'] : 0.0;

        $province = strtoupper($province ?: $settings['default_province']);
        $taxIncluded = (bool) $settings['prices_include_tax'];
        $rate = $taxIncluded ? 0.0 : (float) ($settings['tax_rates'][$province] ?? 0);
        $taxable = array_sum(array_map(fn ($l) => $l['tax_exempt'] ? 0 : $l['line_total'], $items)) + $deliveryFee + $giftFee;
        $tax = round($taxable * $rate / 100, 2);

        return [
            'items' => $items,
            'problems' => $problems,
            'currency' => $settings['currency'],
            'subtotal' => $subtotal,
            'discount_total' => $discount,
            'delivery_method' => $method['code'] ?? null,
            'delivery_name' => $method['name'] ?? null,
            'delivery_fee' => $deliveryFee,
            'gift_wrap' => $giftWrap,
            'gift_wrap_fee' => $giftFee,
            'province' => $province,
            'tax_rate' => $rate,
            'tax_included' => $taxIncluded,
            'tax' => $tax,
            'total' => round($subtotal + $deliveryFee + $giftFee + $tax, 2),
            'needs_quote' => collect($items)->contains('needs_quote', true),
        ];
    }

    private function runningOffers(): Collection
    {
        return $this->offers ??= Offer::running()->with(['categories:id', 'products:id'])->get();
    }
}
