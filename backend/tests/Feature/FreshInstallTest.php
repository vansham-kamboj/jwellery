<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** A brand-new server: seeding builds the full catalogue, with every photo resized to WebP. */
class FreshInstallTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalogue_seeds_with_optimised_photos(): void
    {
        Storage::fake('public');
        $this->seed(CatalogSeeder::class);

        $this->assertSame(40, Product::count());
        $this->assertSame(14, Category::count());
        $photos = ProductImage::where('type', 'image')->get();
        $this->assertGreaterThan(90, $photos->count());
        $this->assertTrue($photos->every(fn ($i) => str_ends_with($i->path, '.webp') && Storage::disk('public')->exists($i->path)));

        $this->getJson('/api/products?full=1&per_page=100')->assertOk()->assertJsonCount(40, 'data');
    }
}
