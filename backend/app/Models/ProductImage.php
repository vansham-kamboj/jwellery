<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    protected $fillable = ['product_id', 'path', 'type', 'alt', 'sort_order'];

    protected $casts = ['sort_order' => 'integer'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function url(): string
    {
        // Built from the address the site is served at (e.g. https://avyajewels.ca/backend), so links stay right
        // even if APP_URL in .env is out of date.
        return asset('uploads/'.$this->path);
    }
}
