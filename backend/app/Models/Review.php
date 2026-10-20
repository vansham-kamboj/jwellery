<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = ['product_id', 'author_name', 'city', 'rating', 'body', 'reviewed_on', 'is_visible', 'is_featured', 'sort_order'];

    protected $casts = ['rating' => 'integer', 'reviewed_on' => 'date', 'is_visible' => 'boolean', 'is_featured' => 'boolean', 'sort_order' => 'integer'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeVisible(Builder $q): Builder
    {
        return $q->where('is_visible', true)->orderBy('sort_order')->latest('reviewed_on')->latest('id');
    }

    /** The shape storefronts receive. */
    public function toPublic(): array
    {
        return [
            'id' => $this->id, 'name' => $this->author_name, 'city' => $this->city, 'rating' => $this->rating, 'body' => $this->body,
            'date' => $this->reviewed_on?->toDateString(), 'product' => $this->product?->slug, 'product_name' => $this->product?->name,
        ];
    }
}
