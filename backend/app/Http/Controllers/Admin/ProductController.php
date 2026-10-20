<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Finish;
use App\Models\Product;
use App\Services\ImageOptimizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('q'));
        $products = Product::with(['category', 'images'])
            ->when($request->filled('category'), fn ($q) => $q->where('category_id', $request->integer('category')))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w->where('name', 'like', "%{$search}%")->orWhere('slug', 'like', "%{$search}%")))
            ->orderBy('sort_order')->orderBy('id')->paginate(30)->withQueryString();

        return view('admin.products.index', ['products' => $products, 'categories' => Category::orderBy('sort_order')->get(), 'search' => $search]);
    }

    public function create()
    {
        return $this->form(new Product(['in_stock' => true, 'is_visible' => true, 'kind' => 'jewellery']));
    }

    public function edit(Product $product)
    {
        return $this->form($product->load(['images', 'sizes', 'finishes']));
    }

    public function store(Request $request)
    {
        $product = DB::transaction(fn () => $this->save($request, new Product));

        return redirect()->route('admin.products.edit', $product)->with('ok', $product->name.' created.');
    }

    public function update(Request $request, Product $product)
    {
        DB::transaction(fn () => $this->save($request, $product));

        return redirect()->route('admin.products.edit', $product)->with('ok', $product->name.' saved.');
    }

    public function destroy(Product $product)
    {
        $product->delete(); // soft delete: past orders keep their snapshot

        return redirect()->route('admin.products.index')->with('ok', $product->name.' deleted.');
    }

    public function duplicate(Product $product)
    {
        $copy = DB::transaction(function () use ($product) {
            $copy = $product->replicate(['slug']);
            $copy->name = $product->name.' (copy)';
            $copy->slug = $this->uniqueSlug($product->slug.'-copy');
            $copy->is_visible = false;
            $copy->save();
            foreach ($product->sizes as $s) {
                $copy->sizes()->create($s->only('label', 'in_stock', 'sort_order'));
            }
            $copy->finishes()->sync($product->finishes->mapWithKeys(fn ($f) => [$f->id => $f->pivot->only('price_adjustment', 'in_stock')]));
            foreach ($product->images as $img) {
                $copy->images()->create($img->only('path', 'type', 'alt', 'sort_order'));
            }

            return $copy;
        });

        return redirect()->route('admin.products.edit', $copy)->with('ok', 'Copy created (hidden until you publish it).');
    }

    private function form(Product $product)
    {
        return view('admin.products.form', [
            'product' => $product,
            'categories' => Category::orderBy('sort_order')->get(),
            'finishes' => Finish::orderBy('sort_order')->get(),
        ]);
    }

    private function save(Request $request, Product $product): Product
    {
        $d = $request->validate([
            'name' => 'required|string|max:160',
            'slug' => ['nullable', 'string', 'max:160', 'alpha_dash', Rule::unique('products', 'slug')->ignore($product->id)],
            'category_id' => 'required|exists:categories,id',
            'kind' => 'required|in:jewellery,bullion',
            'short_name' => 'nullable|string|max:80',
            'material' => 'nullable|string|max:160',
            'description' => 'nullable|string|max:5000',
            'care' => 'nullable|string|max:5000',
            'price' => 'required|numeric|min:0|max:9999999',
            'tag' => 'nullable|string|max:40',
            'metal' => 'nullable|in:gold,silver,platinum',
            'weight_grams' => 'nullable|numeric|min:0',
            'purity' => 'nullable|string|max:20',
            'size_label' => 'nullable|string|max:40',
            'sizes' => 'nullable|string|max:300',
            'sold_out_sizes' => 'nullable|string|max:300',
            'default_size' => 'nullable|string|max:20',
            'sort_order' => 'nullable|integer|min:0',
            'stock_qty' => 'nullable|integer|min:0|max:100000',
            'finish' => 'array',
            'finish.*.on' => 'nullable|boolean',
            'finish.*.adjust' => 'nullable|numeric|min:-99999|max:99999',
            'finish.*.in_stock' => 'nullable|boolean',
            'images' => 'array|max:20',
            'images.*' => 'file|mimes:jpg,jpeg,png,webp,mp4,webm|max:51200',
            'media' => 'array',
            'media.*.sort' => 'nullable|integer|min:0',
            'media.*.alt' => 'nullable|string|max:160',
            'media.*.remove' => 'nullable|boolean',
        ]);

        $product->fill([
            'name' => $d['name'],
            'slug' => ($d['slug'] ?? null) ?: $this->uniqueSlug(Str::slug($d['name']), $product->id),
            'category_id' => $d['category_id'],
            'kind' => $d['kind'],
            'short_name' => $d['short_name'] ?? null,
            'material' => $d['material'] ?? null,
            'description' => $d['description'] ?? null,
            'care' => $d['care'] ?? null,
            'price' => $d['price'],
            'tag' => $d['tag'] ?? null,
            'metal' => $d['metal'] ?? null,
            'weight_grams' => $d['weight_grams'] ?? null,
            'purity' => $d['purity'] ?? null,
            'size_label' => $d['size_label'] ?? null,
            'default_size' => $d['default_size'] ?? null,
            'sort_order' => $d['sort_order'] ?? 0,
            'stock_qty' => $d['stock_qty'] ?? null,
            'tax_exempt' => $request->boolean('tax_exempt'),
            'in_stock' => $request->boolean('in_stock'),
            'is_visible' => $request->boolean('is_visible'),
            'is_featured' => $request->boolean('is_featured'),
        ])->save();

        // Sizes: "5, 6, 7" plus an optional list of sold-out ones.
        $labels = array_values(array_unique(array_filter(array_map('trim', explode(',', $d['sizes'] ?? '')), 'strlen')));
        $soldOut = array_map('trim', explode(',', $d['sold_out_sizes'] ?? ''));
        $product->sizes()->delete();
        foreach ($labels as $i => $label) {
            $product->sizes()->create(['label' => $label, 'sort_order' => $i, 'in_stock' => ! in_array($label, $soldOut, true)]);
        }

        $sync = [];
        foreach ($d['finish'] ?? [] as $id => $f) {
            if (! empty($f['on'])) {
                $sync[(int) $id] = ['price_adjustment' => (float) ($f['adjust'] ?? 0), 'in_stock' => ! empty($f['in_stock'])];
            }
        }
        $product->finishes()->sync($sync);

        foreach ($d['media'] ?? [] as $id => $m) {
            $image = $product->images()->find($id);
            if (! $image) {
                continue;
            }
            if (! empty($m['remove'])) {
                $shared = $image->newQuery()->where('path', $image->path)->where('id', '!=', $image->id)->exists();
                if (! $shared) {
                    Storage::disk('public')->delete($image->path);
                }
                $image->delete();
            } else {
                $image->update(['sort_order' => (int) ($m['sort'] ?? 0), 'alt' => $m['alt'] ?? null]);
            }
        }
        $next = (int) $product->images()->max('sort_order') + 1;
        $optimizer = app(ImageOptimizer::class);
        foreach ($request->file('images', []) as $file) {
            $type = str_starts_with((string) $file->getMimeType(), 'video/') ? 'video' : 'image';
            $path = $optimizer->store($file, 'products/'.$product->slug);   // photos are resized and saved as WebP
            $product->images()->create(['path' => $path, 'type' => $type, 'sort_order' => $next++]);
        }

        return $product;
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $base = $base ?: 'product';
        $slug = $base;
        for ($i = 2; Product::withTrashed()->where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists(); $i++) {
            $slug = $base.'-'.$i;
        }

        return $slug;
    }
}
