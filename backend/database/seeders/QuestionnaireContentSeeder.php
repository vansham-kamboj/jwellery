<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Finish;
use App\Models\Product;
use App\Support\Settings;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Brings an existing database in line with the client questionnaire (Oct 2026):
 * new category sections, 925 / 99.99% wording, ring sizes 5–14 and the store's
 * contact, delivery and pricing settings. Keeps orders, admin users and uploads.
 *   php artisan db:seed --class=QuestionnaireContentSeeder
 */
class QuestionnaireContentSeeder extends Seeder
{
    private const OLD_CATEGORY = ['rings' => 'silver-rings', 'earrings' => 'silver-earrings'];

    private const OLD_FINISH = ['sterling-silver' => 'plainsilver', 'rose-gold-tone' => 'rosetone', '9999-fine-gold' => 'finegold', '999-fine-silver' => 'finesilver'];

    public function run(): void
    {
        $data = json_decode(file_get_contents(database_path('seeders/data/catalog.json')), true);

        DB::transaction(function () use ($data) {
            foreach (self::OLD_CATEGORY as $old => $new) {
                if (! Category::where('slug', $new)->exists()) {
                    Category::where('slug', $old)->update(['slug' => $new]);
                }
            }
            $categories = [];
            foreach ($data['categories'] as $c) {
                $categories[$c['slug']] = Category::updateOrCreate(['slug' => $c['slug']], [
                    'name' => $c['name'], 'kind' => $c['kind'], 'group' => $c['group'], 'description' => $c['description'], 'sort_order' => $c['sort_order'],
                ]);
            }

            foreach (self::OLD_FINISH as $oldSlug => $key) {
                $f = $data['finishes'][$key];
                Finish::where('slug', $oldSlug)->update(['name' => $f['name'], 'slug' => Str::slug($f['name'])]);
            }

            foreach ($data['products'] as $p) {
                $product = Product::withTrashed()->where('slug', $p['slug'])->first();
                if (! $product) {
                    continue;
                }
                $product->update([
                    'category_id' => $categories[$p['category']]->id, 'material' => $p['material'], 'care' => $p['care'],
                    'purity' => $p['purity'], 'size_label' => $p['size_label'], 'default_size' => $p['default_size'],
                ]);
                if ($p['sizes']) {
                    $product->sizes()->delete();
                    foreach ($p['sizes'] as $n => $label) {
                        $product->sizes()->create(['label' => $label, 'sort_order' => $n]);
                    }
                }
            }

            // Leave any category the client may have added; remove old ones that are now empty.
            Category::whereIn('slug', array_keys(self::OLD_CATEGORY))->whereDoesntHave('products', fn ($q) => $q->withTrashed())->delete();
        });

        Settings::put([
            'store_name' => 'Avya Jewels',
            'whatsapp_number' => '16477185454',
            'contact_phone' => '+1 647-718-5454',
            'contact_email' => 'avyajewels0210@gmail.com',
            'address' => 'Mississauga, Ontario — visits by appointment',
            'hours' => 'Mon–Sun · 11 am – 7 pm · visits by appointment',
            'announcement' => 'Free home delivery across the GTA on orders over $200',
            'social_instagram' => 'https://www.instagram.com/avyajewels.ca',
            'social_youtube' => null,
            'social_x' => null,
            'social_facebook' => null,
            'order_prefix' => 'AVY',
            'prices_include_tax' => true,
            'show_bullion_prices' => false,
            'gift_wrap_fee' => 0,
            'gift_wrap_min' => 150,
            'default_province' => 'ON',
            'shipping_methods' => config('store.defaults.shipping_methods'),
        ]);

        $this->command?->info('Catalogue and settings updated from the questionnaire.');
    }
}
