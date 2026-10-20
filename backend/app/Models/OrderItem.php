<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'unit_price' => 'decimal:2', 'original_price' => 'decimal:2', 'line_total' => 'decimal:2',
        'tax_exempt' => 'boolean', 'needs_quote' => 'boolean', 'qty' => 'integer',
    ];
}
