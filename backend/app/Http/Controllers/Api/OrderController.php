<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CartPricer;
use App\Services\OrderPlacer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    private const LINE_RULES = [
        'items' => 'required|array|min:1|max:30',
        'items.*.product' => 'required|string|max:120',
        'items.*.finish' => 'nullable|string|max:80',
        'items.*.size' => 'nullable|string|max:20',
        'items.*.qty' => 'required|integer|min:1|max:99',
        'delivery' => 'nullable|string|max:30',
        'province' => 'nullable|string|size:2',
        'gift_wrap' => 'nullable|boolean',
    ];

    /** POST /api/cart/quote — price a bag for the bag and checkout pages. */
    public function quote(Request $request, CartPricer $pricer): JsonResponse
    {
        $d = $request->validate(self::LINE_RULES);

        return response()->json($pricer->quote($d['items'], $d['delivery'] ?? null, $d['province'] ?? null, (bool) ($d['gift_wrap'] ?? false)));
    }

    /** POST /api/orders — save the order and return the WhatsApp link that sends it. */
    public function store(Request $request, OrderPlacer $placer): JsonResponse
    {
        $d = $request->validate(self::LINE_RULES + [
            'customer.name' => 'required|string|max:120',
            'customer.phone' => ['required', 'string', 'max:40', 'regex:/^[0-9+()\-\s.]{7,}$/'],
            'customer.email' => 'nullable|email|max:160',
            'customer.address' => 'nullable|string|max:200',
            'customer.city' => 'nullable|string|max:80',
            'customer.postal_code' => 'nullable|string|max:12',
            'customer.note' => 'nullable|string|max:1000',
            'website' => 'prohibited', // honeypot: real customers never fill this hidden field
        ]);
        $customer = $d['customer'] + ['province' => $d['province'] ?? null];

        $result = $placer->place($customer, $d['items'], $d['delivery'] ?? null, (bool) ($d['gift_wrap'] ?? false), $request->ip());
        if (! $result['order']) {
            return response()->json(['message' => 'None of these pieces can be ordered right now.', 'problems' => $result['quote']['problems']], 422);
        }

        $order = $result['order'];

        return response()->json([
            'code' => $order->code,
            'status' => $order->status,
            'total' => (float) $order->total,
            'currency' => $order->currency,
            'needs_quote' => $order->needs_quote,
            'whatsapp_url' => $placer->whatsappLink($order),
            'message' => 'Order request '.$order->code.' created — send the WhatsApp message to confirm. Our team will reply with payment details.',
            'quote' => $result['quote'],
        ], 201);
    }
}
