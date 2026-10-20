<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUSES = ['new' => 'New', 'confirmed' => 'Confirmed', 'shipped' => 'Shipped', 'completed' => 'Completed', 'cancelled' => 'Cancelled'];

    protected $guarded = ['id'];

    protected $casts = [
        'gift_wrap' => 'boolean', 'needs_quote' => 'boolean',
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
        $this->status = $status;
        $stamp = $status.'_at';
        if (in_array($stamp, ['confirmed_at', 'shipped_at', 'completed_at', 'cancelled_at'], true) && ! $this->{$stamp}) {
            $this->{$stamp} = now();
        }
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
