<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Orders that did not come from the website (shop, phone, WhatsApp chat…): the admin picks
 * the pieces, adds an optional note, and a confirmed order is saved for the records.
 * There are no customer fields — anything worth keeping (a name, how it was paid) goes in the note.
 */
class ManualOrderController extends Controller
{
    public function create()
    {
        $products = Product::with(['category:id,name', 'finishes:id,name', 'sizes:id,product_id,label'])
            ->orderBy('category_id')->orderBy('sort_order')->orderBy('name')->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'category' => $p->category?->name ?? 'Other',
                'price' => (float) $p->price,
                'inStock' => (bool) $p->in_stock,
                'visible' => (bool) $p->is_visible,
                'finishes' => $p->finishes->map(fn ($f) => ['id' => $f->id, 'name' => $f->name, 'adjust' => (float) $f->pivot->price_adjustment])->values(),
                'sizes' => $p->sizes->pluck('label')->values(),
            ])->values();

        return view('admin.orders.manual', ['products' => $products]);
    }

    public function store(Request $request)
    {
        $d = $request->validate([
            'lines' => 'required|array|min:1|max:100',
            'lines.*.product_id' => 'required|integer|exists:products,id',
            'lines.*.qty' => 'required|integer|min:1|max:999',
            'lines.*.price' => 'required|numeric|min:0|max:1000000',
            'lines.*.finish_id' => 'nullable|integer',
            'lines.*.size' => 'nullable|string|max:60',
            'note' => 'nullable|string|max:2000',
        ], [
            'lines.required' => 'Add at least one product to the order.',
            'lines.min' => 'Add at least one product to the order.',
        ]);

        $products = Product::with(['finishes', 'sizes'])->whereIn('id', collect($d['lines'])->pluck('product_id'))->get()->keyBy('id');
        $items = [];
        foreach ($d['lines'] as $l) {
            $p = $products->get((int) $l['product_id']);
            $price = round((float) $l['price'], 2);
            $qty = (int) $l['qty'];
            $items[] = [
                'product_id' => $p->id,
                'name' => $p->name,
                'finish' => $p->finishes->firstWhere('id', (int) ($l['finish_id'] ?? 0))?->name,
                'size' => $p->sizes->firstWhere('label', $l['size'] ?? null)?->label,
                'unit_price' => $price,
                'original_price' => $price,
                'offer_name' => null,
                'qty' => $qty,
                'line_total' => round($price * $qty, 2),
                'tax_exempt' => $p->tax_exempt,
                'needs_quote' => false,
            ];
        }
        $total = round(collect($items)->sum('line_total'), 2);
        $note = trim((string) ($d['note'] ?? ''));

        $order = DB::transaction(function () use ($items, $total, $note) {
            $order = Order::create([
                'code' => 'TEMP-'.bin2hex(random_bytes(4)),
                'status' => 'confirmed',
                'confirmed_at' => now(),
                'customer_name' => Order::MANUAL_NAME,
                'customer_phone' => '',
                'note' => $note !== '' ? $note : null,
                'subtotal' => $total,
                'total' => $total,
                'currency' => 'CAD',
            ]);
            $order->code = Settings::get('order_prefix').'-'.(1000 + $order->id);
            $order->items()->createMany($items);
            $order->save();

            return $order;
        });

        return redirect()->route('admin.orders.show', $order)->with('ok', 'Manual order '.$order->code.' saved as confirmed.');
    }
}
