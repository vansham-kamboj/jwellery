<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Offer extends Model
{
    protected $fillable = ['name', 'badge', 'type', 'value', 'starts_at', 'ends_at', 'is_active', 'applies_to_all', 'min_price', 'max_price'];

    protected $casts = [
        'value' => 'decimal:2', 'min_price' => 'decimal:2', 'max_price' => 'decimal:2',
        'starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_active' => 'boolean', 'applies_to_all' => 'boolean',
    ];

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class);
    }

    public function scopeRunning(Builder $q): Builder
    {
        return $q->where('is_active', true)
            ->where(fn ($w) => $w->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($w) => $w->whereNull('ends_at')->orWhere('ends_at', '>=', now()));
    }

    public function appliesTo(Product $p): bool
    {
        $price = (float) $p->price;
        if ($this->min_price !== null && $price < (float) $this->min_price) {
            return false;
        }
        if ($this->max_price !== null && $price > (float) $this->max_price) {
            return false;
        }

        return $this->applies_to_all
            || $this->categories->contains('id', $p->category_id)
            || $this->products->contains('id', $p->id);
    }

    public function discountOn(float $price): float
    {
        $off = $this->type === 'percent' ? $price * (float) $this->value / 100 : (float) $this->value;

        return round(min(max($off, 0), $price), 2);
    }
}
