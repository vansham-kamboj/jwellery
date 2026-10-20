<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Finish;
use App\Models\Product;
use App\Models\Review;
use App\Support\Settings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /** Everything a storefront needs on first load. */
    public function site(): JsonResponse
    {
        return response()->json([
            'settings' => Settings::public(),
            'categories' => Category::visible()->withCount(['products' => fn ($q) => $q->visible()])->get()
                ->map(fn ($c) => ['slug' => $c->slug, 'name' => $c->name, 'kind' => $c->kind, 'group' => $c->group, 'description' => $c->description, 'count' => $c->products_count]),
            'finishes' => Finish::orderBy('sort_order')->get(['slug', 'name', 'swatch_hex']),
            // Home-page reviews; empty until the team adds real ones in Admin → Reviews.
            'reviews' => Review::visible()->where('is_featured', true)->with('product:id,slug,name')->limit(12)->get()->map->toPublic(),
        ]);
    }

    /** GET /api/products?category=&kind=&metal=&finish=&q=&featured=1&sort=price_asc|price_desc|newest&per_page=&full=1 (full = include gallery, sizes, description) */
    public function index(Request $request)
    {
        $data = $request->validate([
            'category' => 'nullable|string|max:80', 'kind' => 'nullable|in:jewellery,bullion', 'metal' => 'nullable|string|max:20',
            'finish' => 'nullable|string|max:80', 'q' => 'nullable|string|max:80', 'featured' => 'nullable|boolean',
            'sort' => 'nullable|in:featured,price_asc,price_desc,newest,name', 'per_page' => 'nullable|integer|min:1|max:100', 'full' => 'nullable|boolean',
        ]);

        $q = Product::visible()->with(['category', 'images', 'finishes', ...(! empty($data['full']) ? ['sizes'] : [])]);
        if (! empty($data['category'])) {
            $q->whereHas('category', fn ($c) => $c->where('slug', $data['category']));
        }
        if (! empty($data['kind'])) {
            $q->where('kind', $data['kind']);
        }
        if (! empty($data['metal'])) {
            $q->where('metal', $data['metal']);
        }
        if (! empty($data['finish'])) {
            $q->whereHas('finishes', fn ($f) => $f->where('slug', $data['finish']));
        }
        if (! empty($data['featured'])) {
            $q->where('is_featured', true);
        }
        if (! empty($data['q'])) {
            foreach (preg_split('/\s+/', trim($data['q'])) as $word) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $word).'%';
                $q->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('material', 'like', $like)
                    ->orWhere('description', 'like', $like)->orWhere('metal', 'like', $like)
                    ->orWhereHas('category', fn ($c) => $c->where('name', 'like', $like))
                    ->orWhereHas('finishes', fn ($f) => $f->where('name', 'like', $like)));
            }
        }
        match ($data['sort'] ?? 'featured') {
            'price_asc' => $q->orderBy('price'),
            'price_desc' => $q->orderByDesc('price'),
            'newest' => $q->latest('id'),
            'name' => $q->orderBy('name'),
            default => $q->orderByDesc('is_featured')->orderBy('sort_order')->orderBy('id'),
        };

        return ProductResource::collection($q->paginate($data['per_page'] ?? 48)->withQueryString());
    }

    public function show(string $slug)
    {
        $product = Product::visible()->with(['category', 'images', 'finishes', 'sizes'])->where('slug', $slug)->firstOrFail();

        return new ProductResource($product);
    }
}
