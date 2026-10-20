<?php

namespace App\Services;

use App\Models\Order;
use App\Support\Settings;
use Illuminate\Support\Facades\DB;

/** Turns a priced bag into a saved order and the WhatsApp message the customer sends. */
class OrderPlacer
{
    public function __construct(private CartPricer $pricer) {}

    public function place(array $customer, array $lines, ?string $delivery, bool $giftWrap, ?string $ip = null): array
    {
        $quote = $this->pricer->quote($lines, $delivery, $customer['province'] ?? null, $giftWrap);
        if (! $quote['items']) {
            return ['quote' => $quote, 'order' => null];
        }

        $order = DB::transaction(function () use ($quote, $customer, $ip) {
            $order = Order::create([
                'code' => 'TEMP-'.bin2hex(random_bytes(4)),
                'customer_name' => $customer['name'],
                'customer_phone' => $customer['phone'],
                'customer_email' => $customer['email'] ?? null,
                'address' => $customer['address'] ?? null,
                'city' => $customer['city'] ?? null,
                'province' => $quote['province'],
                'postal_code' => isset($customer['postal_code']) ? strtoupper($customer['postal_code']) : null,
                'note' => $customer['note'] ?? null,
                'delivery_method' => $quote['delivery_method'],
                'delivery_fee' => $quote['delivery_fee'],
                'gift_wrap' => $quote['gift_wrap'],
                'gift_wrap_fee' => $quote['gift_wrap_fee'],
                'subtotal' => $quote['subtotal'],
                'discount_total' => $quote['discount_total'],
                'tax_rate' => $quote['tax_rate'],
                'tax' => $quote['tax'],
                'total' => $quote['total'],
                'currency' => $quote['currency'],
                'needs_quote' => $quote['needs_quote'],
                'ip_hash' => $ip ? hash('sha256', $ip.config('app.key')) : null,
            ]);
            $order->code = Settings::get('order_prefix').'-'.(1000 + $order->id);

            foreach ($quote['items'] as $l) {
                $order->items()->create([
                    'product_id' => $l['product_id'], 'name' => $l['name'], 'finish' => $l['finish'], 'size' => $l['size'],
                    'unit_price' => $l['unit_price'], 'original_price' => $l['original_price'], 'offer_name' => $l['offer'],
                    'qty' => $l['qty'], 'line_total' => $l['line_total'], 'tax_exempt' => $l['tax_exempt'], 'needs_quote' => $l['needs_quote'],
                ]);
            }
            $order->whatsapp_message = $this->message($order, $quote);
            $order->save();

            return $order;
        });

        return ['quote' => $quote, 'order' => $order];
    }

    public function whatsappLink(Order $order): ?string
    {
        $number = preg_replace('/\D+/', '', (string) Settings::get('whatsapp_number'));

        return $number && config('store.whatsapp_url') ? config('store.whatsapp_url').'/'.$number.'?text='.rawurlencode($order->whatsapp_message) : null;
    }

    private function message(Order $order, array $q): string
    {
        $m = fn ($n) => '$'.number_format((float) $n, 2);
        $out = ['Hi '.Settings::get('store_name').'! I would like to place an order.', '', 'Order: '.$order->code];
        foreach ($q['items'] as $i => $l) {
            $opts = implode(', ', array_filter([$l['finish'], $l['size'] ? 'size '.$l['size'] : null]));
            $line = ($i + 1).'. '.$l['name'].($opts ? ' — '.$opts : '').' × '.$l['qty'].' — '.$m($l['line_total']);
            if ($l['offer']) {
                $line .= ' (was '.$m($l['original_price'] * $l['qty']).', '.$l['offer'].')';
            }
            if ($l['needs_quote']) {
                $line .= ' [reserve — price to be confirmed]';
            }
            $out[] = $line;
        }
        $out[] = '';
        $out[] = 'Subtotal: '.$m($q['subtotal']);
        $out[] = 'Delivery ('.$q['delivery_name'].'): '.($q['delivery_fee'] > 0 ? $m($q['delivery_fee']) : 'Free');
        if ($q['gift_wrap']) {
            $out[] = 'Gift wrap: '.$m($q['gift_wrap_fee']);
        }
        if (! $q['tax_included']) {
            $out[] = 'Tax ('.rtrim(rtrim(number_format($q['tax_rate'], 3), '0'), '.').'% '.$q['province'].'): '.$m($q['tax']);
        }
        $out[] = 'Total: '.$m($q['total']).' '.$q['currency'].($q['tax_included'] ? ' (taxes included)' : '');
        $out[] = '';
        $out[] = 'Name: '.$order->customer_name;
        $out[] = 'Phone: '.$order->customer_phone;
        if ($order->address) {
            $out[] = 'Address: '.implode(', ', array_filter([$order->address, $order->city, trim($order->province.' '.$order->postal_code)]));
        }
        if ($order->note) {
            $out[] = 'Note: '.$order->note;
        }

        return implode("\n", $out);
    }
}
