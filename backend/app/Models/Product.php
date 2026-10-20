<?php

namespace App\Models;

use App\Support\Settings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id', 'name', 'slug', 'short_name', 'material', 'description', 'care', 'price', 'tag', 'kind',
        'metal', 'weight_grams', 'purity', 'tax_exempt', 'size_label', 'default_size', 'in_stock', 'stock_qty', 'is_visible',
        'is_featured', 'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2', 'weight_grams' => 'decimal:4', 'tax_exempt' => 'boolean', 'in_stock' => 'boolean',
        'is_visible' => 'boolean', 'is_featured' => 'boolean', 'sort_order' => 'integer', 'stock_qty' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function sizes(): HasMany
    {
        return $this->hasMany(ProductSize::class)->orderBy('sort_order');
    }

    public function finishes(): BelongsToMany
    {
        return $this->belongsToMany(Finish::class)->withPivot('price_adjustment', 'in_stock')->orderBy('sort_order');
    }

    public function offers(): BelongsToMany
    {
        return $this->belongsToMany(Offer::class);
    }

    public function scopeVisible(Builder $q): Builder
    {
        return $q->where('is_visible', true)->whereHas('category', fn ($c) => $c->where('is_visible', true));
    }

    public function isBullion(): bool
    {
        return $this->kind === 'bullion';
    }

    /** Bars and coins can be set to "price on request" (Admin → Settings). */
    public function priceHidden(): bool
    {
        return $this->isBullion() && ! Settings::get('show_bullion_prices');
    }

    /** High-value bullion is reserved (price confirmed by the team) and limited to one per order. */
    public function needsQuote(?float $price = null): bool
    {
        return $this->isBullion() && ($price ?? (float) $this->price) >= (float) Settings::get('quote_above');
    }
}
