<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductSize extends Model
{
    public $timestamps = false;

    protected $fillable = ['product_id', 'label', 'in_stock', 'sort_order'];

    protected $casts = ['in_stock' => 'boolean', 'sort_order' => 'integer'];
}
