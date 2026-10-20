<?php

namespace App\Http\Resources;

use App\Models\Review;
use App\Services\CartPricer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $p = $this->resource;
        $price = app(CartPricer::class)->priceFor($p);
        $media = $p->images;
        $images = $media->where('type', 'image')->values();
        $detail = $request->route('slug') !== null || $request->boolean('full');
        $hidden = $p->priceHidden();

        return [
            'id' => $p->id,
            'slug' => $p->slug,
            'name' => $p->name,
            'short_name' => $p->short_name,
            'category' => ['slug' => $p->category->slug, 'name' => $p->category->name],
            'kind' => $p->kind,
            'metal' => $p->metal,
            'material' => $p->material,
            'tag' => $p->tag,
            'price' => $hidden ? null : $price['price'],
            'original_price' => $hidden ? null : $price['original'],
            'offer_badge' => $hidden ? null : $price['badge'],
            'price_on_request' => $hidden,
            'needs_quote' => ! $hidden && $p->needsQuote($price['price']),
            'tax_exempt' => $p->tax_exempt,
            'in_stock' => $p->in_stock && $p->stock_qty !== 0,
            'stock' => $p->stock_qty,
            'is_featured' => $p->is_featured,
            'image' => $images->first()?->url(),
            'image_alt' => $images->get(1)?->url(),
            'finishes' => $p->finishes->map(fn ($f) => [
                'slug' => $f->slug, 'name' => $f->name, 'swatch' => $f->swatch_hex,
                'price_adjustment' => (float) $f->pivot->price_adjustment, 'in_stock' => $f->pivot->in_stock,
            ])->values(),
            $this->mergeWhen($detail, fn () => [
                'description' => $p->description,
                'care' => $p->care,
                'weight_grams' => $p->weight_grams !== null ? (float) $p->weight_grams : null,
                'purity' => $p->purity,
                'reviews' => Review::visible()->where('product_id', $p->id)->limit(10)->get()->map->toPublic(),
                'gallery' => $media->map(fn ($m) => ['url' => $m->url(), 'type' => $m->type, 'alt' => $m->alt ?: $p->name])->values(),
                'sizes' => $p->sizes->isEmpty() ? null : [
                    'label' => $p->size_label ?: 'Size',
                    'default' => $p->default_size,
                    'options' => $p->sizes->map(fn ($s) => ['label' => $s->label, 'in_stock' => $s->in_stock])->values(),
                ],
            ]),
        ];
    }
}
