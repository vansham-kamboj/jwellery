<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReviewsAndImagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_reviews_until_admin_adds_visible_ones(): void
    {
        $this->getJson('/api/site')->assertJsonCount(0, 'reviews');

        $admin = User::factory()->create();
        $this->actingAs($admin)->get('/admin/reviews')->assertOk()->assertSee('No reviews yet');
        $this->actingAs($admin)->post('/admin/reviews', ['author_name' => 'Priya S.', 'city' => 'Brampton', 'rating' => 5, 'body' => 'Lovely ring.', 'is_visible' => 1, 'is_featured' => 1])->assertRedirect();
        Review::create(['author_name' => 'Hidden', 'rating' => 4, 'body' => 'Not shown', 'is_visible' => false]);

        $this->getJson('/api/site')->assertJsonCount(1, 'reviews')->assertJsonPath('reviews.0.name', 'Priya S.');
    }

    public function test_category_photo_upload_reaches_the_api(): void
    {
        Storage::fake('public');
        $cat = Category::create(['name' => 'Kada', 'slug' => 'kids-kada', 'group' => 'Kids']);

        $this->actingAs(User::factory()->create())->patch('/admin/categories/'.$cat->id, [
            'name' => 'Kada', 'slug' => 'kids-kada', 'kind' => 'jewellery', 'group' => 'Kids', 'is_visible' => 1,
            'image' => UploadedFile::fake()->image('kada.jpg', 900, 900),
        ])->assertRedirect()->assertSessionHasNoErrors();

        $path = $cat->fresh()->image;
        $this->assertStringEndsWith('.webp', $path);
        Storage::disk('public')->assertExists($path);
        $this->assertStringEndsWith('/uploads/'.$path, $this->getJson('/api/site')->json('categories.0.image'));
    }

    public function test_uploaded_photos_are_resized_to_webp(): void
    {
        Storage::fake('public');
        $cat = Category::create(['name' => 'Rings', 'slug' => 'rings']);
        $product = Product::create(['category_id' => $cat->id, 'name' => 'Ring', 'slug' => 'ring', 'price' => 50]);

        $this->actingAs(User::factory()->create())->put('/admin/products/'.$product->id, [
            'name' => 'Ring', 'slug' => 'ring', 'category_id' => $cat->id, 'kind' => 'jewellery', 'price' => 50, 'is_visible' => 1, 'in_stock' => 1,
            'images' => [UploadedFile::fake()->image('big.jpg', 4000, 3000)],
        ])->assertRedirect();

        $path = $product->images()->first()->path;
        $this->assertStringStartsWith('products/ring/', $path);
        $this->assertStringEndsWith('.webp', $path);
        [$w, $h] = getimagesizefromstring(Storage::disk('public')->get($path));
        $this->assertSame([1600, 1200], [$w, $h]);
    }
}
