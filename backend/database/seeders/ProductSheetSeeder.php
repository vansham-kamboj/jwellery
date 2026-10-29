<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Finish;
use App\Models\Product;
use App\Services\ImageOptimizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Makes the catalogue match the client's product sheet (database/seeders/data/product-sheet.json,
 * made by `node tools/product-sheet.js <sheet.xlsx>`). Products are matched by SKU:
 * new ones are added, existing ones updated, and products not on the sheet are removed
 * (soft-deleted, so past orders keep their history). Categories with nothing left are hidden.
 *
 * Photos: put files named by SKU in assets/products/ — AVY-SW-RG-001.jpg (main), AVY-SW-RG-001-1.jpg,
 * AVY-SW-RG-001-2.jpg … — and run this again; a product's photos are replaced only when new files are found.
 *   php artisan db:seed --class=ProductSheetSeeder
 */
class ProductSheetSeeder extends Seeder
{
    /** Categories the sheet uses: slug => [name, menu section, kind]. */
    private const CATEGORIES = [
        'silver-rings' => ['Woman Rings', 'Silver Jewellery', 'jewellery'],
        'silver-bracelets' => ['Woman Bracelets', 'Silver Jewellery', 'jewellery'],
        'gold-bars' => ['Gold bars', 'Bullion', 'bullion'],
        'gold-coins' => ['Gold coins', 'Bullion', 'bullion'],
        'silver-bars' => ['Silver bars', 'Bullion', 'bullion'],
        'silver-coins' => ['Silver coins', 'Bullion', 'bullion'],
        'kids-kada' => ['Kada', 'Kids', 'jewellery'],
        'kids-nazariya' => ['Nazariya', 'Kids', 'jewellery'],
    ];

    private const FINISHES = [
        'plainsilver' => ['925-sterling-silver', '925 sterling silver', '#D8DCDD'],
        'finegold' => ['9999-fine-gold', '99.99% fine gold', '#D9B46A'],
        'finesilver' => ['9999-fine-silver', '99.99% fine silver', '#E4E6E8'],
    ];

    public function run(): void
    {
        $data = json_decode(file_get_contents(database_path('seeders/data/product-sheet.json')), true);
        $photoDir = rtrim(base_path(config('store.seed_assets_path')), '/\\').DIRECTORY_SEPARATOR.'assets'.DIRECTORY_SEPARATOR.'products';
        $photos = is_dir($photoDir) ? array_values(array_filter(scandir($photoDir), fn ($f) => preg_match('/\.(jpe?g|png|webp)$/i', $f))) : [];

        $stats = DB::transaction(function () use ($data, $photoDir, $photos) {
            $categories = [];
            $n = 0;
            foreach (self::CATEGORIES as $slug => [$name, $group, $kind]) {
                $categories[$slug] = Category::updateOrCreate(['slug' => $slug], ['name' => $name, 'group' => $group, 'kind' => $kind, 'is_visible' => true, 'sort_order' => $n++]);
            }

            $finishes = [];
            foreach (self::FINISHES as $key => [$slug, $name, $hex]) {
                $finishes[$key] = Finish::firstOrCreate(['slug' => $slug], ['name' => $name, 'swatch_hex' => $hex, 'sort_order' => count($finishes)]);
            }

            $added = $updated = $withPhotos = 0;
            $skus = [];
            foreach ($data['products'] as $p) {
                $skus[] = $p['sku'];
                $product = Product::withTrashed()->where('sku', $p['sku'])->first()
                    ?? Product::withTrashed()->where('slug', $p['slug'])->first();
                $size = $p['size'] ? $p['size']['size'].($p['size']['adjustable'] ? ' (adjustable)' : '') : null;
                $fields = [
                    'category_id' => $categories[$p['category']]->id, 'sku' => $p['sku'], 'name' => $p['name'], 'slug' => $p['slug'],
                    'kind' => $p['kind'], 'metal' => $p['metal'], 'purity' => $p['purity'], 'material' => $p['material'],
                    'weight_grams' => $p['weight_grams'], 'price' => $p['price'], 'description' => $p['description'], 'care' => $p['care'],
                    'brand' => $p['brand'], 'design' => $p['design'], 'certificate' => $p['certificate'], 'tag' => $p['tag'],
                    'in_stock' => $p['in_stock'], 'stock_qty' => $p['stock_qty'], 'tax_exempt' => $p['kind'] === 'bullion',
                    'size_label' => $p['size']['label'] ?? null, 'default_size' => $size,
                    'is_visible' => true, 'sort_order' => $p['sort_order'],
                ];
                if ($product) {
                    $product->restore();
                    $product->update($fields);
                    $updated++;
                } else {
                    $product = Product::create($fields);
                    $added++;
                }

                $product->sizes()->delete();
                if ($size) {
                    $product->sizes()->create(['label' => $size, 'sort_order' => 0]);   // each piece is one of a kind, in one size
                }
                $product->finishes()->sync([$finishes[$p['finish']]->id => ['price_adjustment' => 0, 'in_stock' => true]]);

                // AVY-SW-RG-001.jpg first, then AVY-SW-RG-001-1.jpg, -2 … in order.
                $files = [];
                foreach ($photos as $f) {
                    if (preg_match('/^'.preg_quote($p['sku'], '/').'(?:-(\d+))?\.[a-z]+$/i', $f, $m)) {
                        $files[(int) ($m[1] ?? 0)] = $f;
                    }
                }
                ksort($files);
                $files = array_values($files);
                if ($files) {
                    $product->images()->delete();
                    foreach ($files as $i => $f) {
                        $source = $photoDir.DIRECTORY_SEPARATOR.$f;
                        $path = app(ImageOptimizer::class)->storeBytes(file_get_contents($source), 'products/'.$p['slug'], $source);
                        $product->images()->create(['path' => $path, 'type' => 'image', 'alt' => $p['name'], 'sort_order' => $i]);
                    }
                    $withPhotos++;
                }
            }

            // Not on the sheet: remove from the store (soft delete) and hide categories that are now empty.
            $removed = Product::whereNull('sku')->orWhereNotIn('sku', $skus)->get()->each->delete()->count();
            Category::whereNotIn('slug', array_keys(self::CATEGORIES))->update(['is_visible' => false]);

            return compact('added', 'updated', 'removed', 'withPhotos');
        });

        $this->command?->info("Product sheet: {$stats['added']} added, {$stats['updated']} updated, {$stats['removed']} removed, {$stats['withPhotos']} with photos.");
    }
}
