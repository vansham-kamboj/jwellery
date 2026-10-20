<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'kind', 'group', 'description', 'image', 'sort_order', 'is_visible'];

    protected $casts = ['is_visible' => 'boolean', 'sort_order' => 'integer'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeVisible(Builder $q): Builder
    {
        return $q->where('is_visible', true)->orderBy('sort_order')->orderBy('name');
    }
}
