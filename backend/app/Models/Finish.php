<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Finish extends Model
{
    protected $fillable = ['name', 'slug', 'swatch_hex', 'sort_order'];

    protected $casts = ['sort_order' => 'integer'];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)->withPivot('price_adjustment', 'in_stock');
    }
}
