<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    public const STATUSES = ['new' => 'New', 'confirmed' => 'Confirmed', 'shipped' => 'Shipped', 'completed' => 'Completed', 'cancelled' => 'Cancelled'];

    protected $guarded = ['id'];

    protected $casts = [
        'gift_wrap' => 'boolean', 'needs_quote' => 'boolean', 'stock_taken' => 'boolean',
        'delivery_fee' => 'decimal:2', 'gift_wrap_fee' => 'decimal:2', 'subtotal' => 'decimal:2', 'discount_total' => 'decimal:2',
        'tax_rate' => 'decimal:2', 'tax' => 'decimal:2', 'total' => 'decimal:2',
        'confirmed_at' => 'datetime', 'shipped_at' => 'datetime', 'completed_at' => 'datetime', 'cancelled_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function setStatus(string $status): void
    {
        DB::transaction(function () use ($status) {
            // A piece is taken off sale only when the order is confirmed (or later). A new order, or a cancelled one, leaves it on sale.
            if (in_array($status, ['confirmed', 'shipped', 'completed'], true)) {
                $this->takeStock();
            } else {
                $this->returnStock();
            }
            $this->status = $status;
            $stamp = $status.'_at';
            if (in_array($stamp, ['confirmed_at', 'shipped_at', 'completed_at', 'cancelled_at'], true) && ! $this->{$stamp}) {
                $this->{$stamp} = now();
            }
            $this->save();
        });
    }

    /** Takes the ordered pieces out of stock. Products without a stock count (bullion) are left alone. */
    public function takeStock(): void
    {
        if ($this->stock_taken) {
            return;
        }
        foreach ($this->items as $item) {
            $product = Product::withTrashed()->whereKey($item->product_id)->whereNotNull('stock_qty')->lockForUpdate()->first();
            $product?->update(['stock_qty' => max(0, $product->stock_qty - $item->qty)]);
        }
        $this->stock_taken = true;
        $this->save();
    }

    public function returnStock(): void
    {
        if (! $this->stock_taken) {
            return;
        }
        foreach ($this->items as $item) {
            $product = Product::withTrashed()->whereKey($item->product_id)->whereNotNull('stock_qty')->lockForUpdate()->first();
            $product?->update(['stock_qty' => $product->stock_qty + $item->qty]);
        }
        $this->stock_taken = false;
        $this->save();
    }

    public function whatsappToCustomer(): string
    {
        $digits = preg_replace('/\D+/', '', $this->customer_phone);
        if (strlen($digits) === 10) {
            $digits = '1'.$digits; // Canadian number without country code
        }

        return config('store.whatsapp_url').'/'.$digits.'?text='.rawurlencode("Hi {$this->customer_name}, this is about your order {$this->code}.");
    }
}
