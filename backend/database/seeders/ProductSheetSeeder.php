<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Finish;
use App\Models\Product;
use App\Services\ImageOptimizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Makes the catalogue match the client's product sheet (database/seeders/data/product-sheet.json,
 * made by `node tools/product-sheet.js <sheet.xlsx>`). Products are matched by SKU:
 * new ones are added, existing ones updated, and products not on the sheet are removed
 * (soft-deleted, so past orders keep their history). The client's menu categories are kept, even when empty.
 *
 * Photos: drop them in assets/products/ or assets/Bullion/ (sub-folders are fine) and run this again; a product's photos
 * are replaced only when new files are found. A photo is matched by its file name — see photosFor(): the SKU
 * (AVY-SW-RG-001.jpg, AVY-SW-RG-001-1.jpg …), or the sheet's number inside the tab's folder (Woman Rings/1.jpg, Woman Rings/1-1.jpg …),
 * or, for bullion, the sheet's photo name ("1 gm gold bar PAMP.jpg").
 *   php artisan db:seed --class=ProductSheetSeeder
 */
class ProductSheetSeeder extends Seeder
{
    /** The menu the client chose, in order: slug => [name, menu section, kind]. Categories with no pieces yet stay
        in the menu and show "new pieces are on their way". Any category added in the admin is left alone. */
    private const CATEGORIES = [
        'silver-pendant-sets' => ['Woman Pendant Sets & Necklaces', 'Silver Jewellery', 'jewellery'],
        'silver-earrings' => ['Woman Earrings', 'Silver Jewellery', 'jewellery'],
        'silver-bracelets' => ['Woman Bracelets', 'Silver Jewellery', 'jewellery'],
        'silver-rings' => ['Woman Rings', 'Silver Jewellery', 'jewellery'],
        'gold-earrings' => ['Gold earrings', 'Gold Jewellery', 'jewellery'],
        'mens-gold-chains' => ['Gold chains', 'Gold Jewellery', 'jewellery'],
        'gold-bars' => ['Gold bars', 'Bullion', 'bullion'],
        'gold-coins' => ['Gold coins', 'Bullion', 'bullion'],
        'silver-bars' => ['Silver bars', 'Bullion', 'bullion'],
        'silver-coins' => ['Silver coins', 'Bullion', 'bullion'],
        'silver-bowls' => ['Silver bowls', 'Silver Utensils', 'jewellery'],
        'silver-spoons' => ['Silver spoons', 'Silver Utensils', 'jewellery'],
        'kids-kada' => ['Kada', 'Kids', 'jewellery'],
        'kids-nazariya' => ['Nazariya', 'Kids', 'jewellery'],
    ];

    /** Category text that has to follow the sheet (rings are one of a kind, each in its own size). */
    private const DESCRIPTIONS = [
        'silver-rings' => 'Rings in 925 sterling silver, hallmarked and stamped — each one of a kind, in its own Canadian size.',
    ];

    private const FINISHES = [
        'plainsilver' => ['925-sterling-silver', '925 sterling silver', '#D8DCDD'],
        'finegold' => ['9999-fine-gold', '99.99% fine gold', '#D9B46A'],
        'finesilver' => ['9999-fine-silver', '99.99% fine silver', '#E4E6E8'],
    ];

    /** Tab folder names (lower-case letters and digits only) => the SKU prefix of that tab, for photos named like the sheet's "1", "1-1", "1-2". */
    private const TAB_FOLDERS = [
        'kidskada' => 'AVY-SK-KD', 'kada' => 'AVY-SK-KD',
        'kidsnazariya' => 'AVY-SK-NZ', 'nazariya' => 'AVY-SK-NZ',
        'bracelets' => 'AVY-SW-BR', 'womanbracelets' => 'AVY-SW-BR', 'womanbracelet' => 'AVY-SW-BR',
        'womanrings' => 'AVY-SW-RG', 'rings' => 'AVY-SW-RG', 'womanring' => 'AVY-SW-RG',
    ];

    /** Every photo in assets/products/, assets/Bullion/ and the tab folders (assets/Woman Rings/, assets/kids kada/ …), sub-folders too: [file name, full path, folder name]. */
    private function photos(string $assets): array
    {
        $found = [];
        $folders = ['products', 'Bullion'];
        foreach (scandir($assets) as $dir) {
            if (is_dir($assets.DIRECTORY_SEPARATOR.$dir) && isset(self::TAB_FOLDERS[$this->norm($dir)])) {
                $folders[] = $dir;
            }
        }
        foreach ($folders as $folder) {
            if (! is_dir($assets.DIRECTORY_SEPARATOR.$folder)) {
                continue;
            }
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($assets.DIRECTORY_SEPARATOR.$folder, \FilesystemIterator::SKIP_DOTS)) as $file) {
                if (preg_match('/\.(jpe?g|png|webp)$/i', $file->getFilename())) {
                    $found[] = ['name' => $file->getFilename(), 'path' => $file->getPathname(), 'folder' => $this->norm(basename($file->getPath()))];
                }
            }
        }

        return $found;
    }

    private function norm(string $s): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '', $s));
    }

    /**
     * The photos that belong to one product, main photo first. A file belongs to a product when its name is
     *   1. the SKU:                           AVY-SW-RG-001.jpg, AVY-SW-RG-001-1.jpg …
     *   2. the sheet's number, in the tab's folder:   Woman Rings/1.jpg, Woman Rings/1-1.jpg … (Kids Kada, Kids Nazariya, Bracelets, Woman Rings)
     *   3. the sheet's photo name (bullion):  "1 gm gold bar PAMP.jpg", "1 gm gold bar PAMP-1.jpg" …
     * Returns the file paths, ordered by the number after the dash.
     */
    private function photosFor(array $p, array $photos): array
    {
        $number = (int) substr($p['sku'], strrpos($p['sku'], '-') + 1);
        $prefix = substr($p['sku'], 0, strrpos($p['sku'], '-'));
        $sheetName = $this->norm(trim(explode(',', (string) ($p['photos'] ?? ''))[0], " .-…"));
        $hits = [];
        foreach ($photos as $f) {
            $base = pathinfo($f['name'], PATHINFO_FILENAME);
            $index = null;
            if (preg_match('/^'.preg_quote($p['sku'], '/').'(?:-(\d+))?$/i', $base, $m)) {
                $index = (int) ($m[1] ?? 0);
            } elseif ((self::TAB_FOLDERS[$f['folder']] ?? null) === $prefix && preg_match('/^(\d+)(?:-(\d+))?$/', $base, $m) && (int) $m[1] === $number) {
                $index = (int) ($m[2] ?? 0);
            } elseif (preg_match('/[a-z]/i', $sheetName) && preg_match('/^(.*?)(?:-(\d+))?$/', $base, $m) && $this->norm($m[1]) === $sheetName) {
                $index = (int) ($m[2] ?? 0);
            }
            if ($index !== null) {
                $hits[$index] = $f['path'];
            }
        }
        ksort($hits);

        // Extra angles without the main photo are not used: the shop photo would otherwise be a side view.
        return isset($hits[0]) ? array_values($hits) : [];
    }

    public function run(): void
    {
        @set_time_limit(0);   // many photos: don't stop part-way on hosts with a short PHP time limit
        $data = json_decode(file_get_contents(database_path('seeders/data/product-sheet.json')), true);
        $photos = $this->photos(rtrim(base_path(config('store.seed_assets_path')), '/\\').DIRECTORY_SEPARATOR.'assets');

        $stats = DB::transaction(function () use ($data, $photos) {
            $categories = [];
            $n = 0;
            foreach (self::CATEGORIES as $slug => [$name, $group, $kind]) {
                $categories[$slug] = Category::updateOrCreate(['slug' => $slug], ['name' => $name, 'group' => $group, 'kind' => $kind, 'is_visible' => true, 'sort_order' => $n++]
                    + (isset(self::DESCRIPTIONS[$slug]) ? ['description' => self::DESCRIPTIONS[$slug]] : []));
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
                    // The admin decides later whether a weight shows. (On a database that is still being brought up to date
                    // the column may not exist yet; the update that adds it also fills it in for every product with a weight.)
                    $product = Product::create($fields + (Schema::hasColumn('products', 'show_weight') ? ['show_weight' => $p['weight_grams'] !== null] : []));
                    $added++;
                }

                $product->sizes()->delete();
                if ($size) {
                    $product->sizes()->create(['label' => $size, 'sort_order' => 0]);   // each piece is one of a kind, in one size
                }
                $product->finishes()->sync([$finishes[$p['finish']]->id => ['price_adjustment' => 0, 'in_stock' => true]]);

                $files = $this->photosFor($p, $photos);
                if ($files) {
                    Storage::disk('public')->delete($product->images()->pluck('path')->all());   // replaced photos leave no files behind
                    $product->images()->delete();
                    foreach ($files as $i => $source) {
                        // WebP files from assets/ are already resized and compressed: copy them as they are (fast on shared hosting).
                        // Other formats (JPG, PNG) are resized and converted to WebP.
                        if (preg_match('/\.webp$/i', $source)) {
                            $path = 'products/'.$p['slug'].'/'.Str::random(24).'.webp';
                            Storage::disk('public')->put($path, file_get_contents($source));
                        } else {
                            $path = app(ImageOptimizer::class)->storeBytes(file_get_contents($source), 'products/'.$p['slug'], $source);
                        }
                        $product->images()->create(['path' => $path, 'type' => 'image', 'alt' => $p['name'], 'sort_order' => $i]);
                    }
                    $withPhotos++;
                }
            }

            // Not on the sheet: remove from the store (soft delete). Categories stay, so the menu keeps all five sections.
            $removed = Product::whereNull('sku')->orWhereNotIn('sku', $skus)->get()->each->delete()->count();

            return compact('added', 'updated', 'removed', 'withPhotos');
        });

        $this->command?->info("Product sheet: {$stats['added']} added, {$stats['updated']} updated, {$stats['removed']} removed, {$stats['withPhotos']} with photos.");
    }
}
