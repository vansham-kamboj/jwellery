<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Finish;
use App\Models\Product;
use App\Services\ImageOptimizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Loads the storefront catalogue from database/seeders/data/catalog.json
 * (made by `node tools/export-catalog.js`) and copies its photos into storage.
 * Safe to re-run: existing products (matched by slug) are left alone.
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $data = json_decode(file_get_contents(database_path('seeders/data/catalog.json')), true);
        $assets = rtrim(base_path(config('store.seed_assets_path')), '/\\');
        $disk = Storage::disk('public');

        DB::transaction(function () use ($data, $assets, $disk) {
            $categories = [];
            foreach ($data['categories'] as $c) {
                $categories[$c['slug']] = Category::firstOrCreate(['slug' => $c['slug']], [
                    'name' => $c['name'], 'kind' => $c['kind'], 'group' => $c['group'], 'description' => $c['description'], 'sort_order' => $c['sort_order'],
                ]);
            }

            $finishes = [];
            $i = 0;
            foreach ($data['finishes'] as $key => $f) {
                $finishes[$key] = Finish::firstOrCreate(['slug' => Str::slug($f['name'])], ['name' => $f['name'], 'swatch_hex' => $f['swatch'], 'sort_order' => $i++]);
            }

            $added = 0;
            foreach ($data['products'] as $p) {
                if (Product::withTrashed()->where('slug', $p['slug'])->exists()) {
                    continue;
                }
                $product = Product::create([
                    'category_id' => $categories[$p['category']]->id,
                    'slug' => $p['slug'], 'name' => $p['name'], 'short_name' => $p['short_name'], 'kind' => $p['kind'],
                    'metal' => $p['metal'], 'weight_grams' => $p['weight_grams'], 'purity' => $p['purity'],
                    'material' => $p['material'], 'description' => $p['description'], 'care' => $p['care'],
                    'price' => $p['price'], 'tag' => $p['tag'], 'tax_exempt' => $p['tax_exempt'], 'is_featured' => $p['featured'],
                    'size_label' => $p['size_label'], 'default_size' => $p['default_size'], 'sort_order' => $p['sort_order'],
                ]);
                foreach ($p['sizes'] as $n => $label) {
                    $product->sizes()->create(['label' => $label, 'sort_order' => $n]);
                }
                $product->finishes()->sync(collect($p['finishes'])->mapWithKeys(fn ($k) => [$finishes[$k]->id => ['price_adjustment' => 0, 'in_stock' => true]]));

                foreach ($p['media'] as $n => $m) {
                    $source = $assets.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $m['src']);
                    if (! is_file($source)) {
                        $this->command?->warn("Missing file {$m['src']} for {$p['slug']}");

                        continue;
                    }
                    if ($m['type'] === 'image') {
                        $target = app(ImageOptimizer::class)->storeBytes(file_get_contents($source), 'products/'.$p['slug'], $source);
                    } else {
                        $target = 'products/'.$p['slug'].'/'.basename($m['src']);
                        if (! $disk->exists($target)) {
                            $disk->put($target, file_get_contents($source));
                        }
                    }
                    $product->images()->create(['path' => $target, 'type' => $m['type'], 'alt' => $p['name'], 'sort_order' => $n]);
                }
                $added++;
            }
            $this->command?->info("Catalogue: {$added} products added.");
        });
    }
}
