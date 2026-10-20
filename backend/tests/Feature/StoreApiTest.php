<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Finish;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Product;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreApiTest extends TestCase
{
    use RefreshDatabase;

    private Product $ring;

    private Product $coin;

    protected function setUp(): void
    {
        parent::setUp();
        // These tests cover the general pricing engine, so they use tax-on-top and paid shipping.
        Settings::put([
            'whatsapp_number' => '918320495754', 'order_prefix' => 'AVY', 'prices_include_tax' => false, 'show_bullion_prices' => true,
            'gift_wrap_fee' => 6, 'gift_wrap_min' => 0,
            'shipping_methods' => [['code' => 'standard', 'name' => 'Standard', 'fee' => 12, 'free_over' => 150], ['code' => 'pickup', 'name' => 'Pick-up', 'fee' => 0, 'free_over' => null]],
        ]);

        $rings = Category::create(['name' => 'Rings', 'slug' => 'rings']);
        $coins = Category::create(['name' => 'Gold coins', 'slug' => 'gold-coins', 'kind' => 'bullion']);
        $silver = Finish::create(['name' => 'Sterling silver', 'slug' => 'sterling-silver']);
        $rose = Finish::create(['name' => 'Rose gold tone', 'slug' => 'rose-gold-tone']);

        $this->ring = Product::create(['category_id' => $rings->id, 'name' => 'Wing Ring', 'slug' => 'wing-ring', 'price' => 100, 'material' => 'Silver', 'size_label' => 'Ring size', 'default_size' => '7']);
        $this->ring->sizes()->createMany([['label' => '6'], ['label' => '7'], ['label' => '8', 'in_stock' => false]]);
        $this->ring->finishes()->sync([$silver->id => ['price_adjustment' => 0], $rose->id => ['price_adjustment' => 12]]);

        $this->coin = Product::create(['category_id' => $coins->id, 'name' => 'Gold Maple Leaf 1 oz', 'slug' => 'maple-1oz', 'short_name' => '1 oz coin', 'price' => 4964, 'kind' => 'bullion', 'metal' => 'gold', 'tax_exempt' => true]);
        Product::create(['category_id' => $rings->id, 'name' => 'Hidden Ring', 'slug' => 'hidden-ring', 'price' => 50, 'is_visible' => false]);
    }

    public function test_site_returns_public_settings_and_categories(): void
    {
        $this->getJson('/api/site')
            ->assertOk()
            ->assertJsonPath('settings.whatsapp_number', '918320495754')
            ->assertJsonMissingPath('settings.order_prefix');
        $rings = collect($this->getJson('/api/site')->json('categories'))->firstWhere('slug', 'rings');
        $this->assertSame(1, $rings['count']); // the hidden ring is not counted
    }

    public function test_products_list_hides_hidden_products_and_filters(): void
    {
        $this->getJson('/api/products')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/products?kind=bullion')->assertJsonCount(1, 'data')->assertJsonPath('data.0.needs_quote', true);
        $this->getJson('/api/products?q=wing')->assertJsonCount(1, 'data')->assertJsonPath('data.0.slug', 'wing-ring');
        $this->getJson('/api/products/hidden-ring')->assertNotFound();
        $this->getJson('/api/products')->assertJsonMissingPath('data.0.gallery');
        $this->getJson('/api/products?full=1&q=wing')->assertJsonPath('data.0.sizes.default', '7');
    }

    public function test_product_detail_has_sizes_and_finishes(): void
    {
        $this->getJson('/api/products/wing-ring')
            ->assertOk()
            ->assertJsonPath('data.sizes.default', '7')
            ->assertJsonPath('data.sizes.options.2.in_stock', false)
            ->assertJsonPath('data.finishes.1.price_adjustment', 12);
    }

    public function test_quote_prices_on_the_server_with_finish_offer_tax_and_shipping(): void
    {
        $offer = Offer::create(['name' => 'Autumn', 'badge' => '−10%', 'type' => 'percent', 'value' => 10, 'is_active' => true]);
        $offer->products()->sync([$this->ring->id]);

        $res = $this->postJson('/api/cart/quote', [
            'items' => [['product' => 'wing-ring', 'finish' => 'rose-gold-tone', 'size' => '7', 'qty' => 2, 'price' => 1]],
            'province' => 'ON', 'delivery' => 'standard',
        ])->assertOk()->json();

        $this->assertSame(100.8, $res['items'][0]['unit_price']);  // (100 + 12) − 10%
        $this->assertSame(201.6, $res['subtotal']);
        $this->assertSame(0.0, (float) $res['delivery_fee']);       // free over $150
        $this->assertSame(26.21, $res['tax']);                      // 13% HST
        $this->assertSame(227.81, $res['total']);
    }

    public function test_bullion_is_tax_exempt_and_reserved_one_at_a_time(): void
    {
        $res = $this->postJson('/api/cart/quote', ['items' => [['product' => 'maple-1oz', 'qty' => 3]], 'province' => 'ON'])->json();

        $this->assertSame(1, $res['items'][0]['qty']);
        $this->assertTrue($res['needs_quote']);
        $this->assertSame(0.0, (float) $res['tax']);
        $this->assertCount(1, $res['problems']);
    }

    public function test_sold_out_size_is_rejected(): void
    {
        $res = $this->postJson('/api/cart/quote', ['items' => [['product' => 'wing-ring', 'size' => '8', 'qty' => 1]]])->json();
        $this->assertSame([], $res['items']);
        $this->assertCount(1, $res['problems']);
    }

    public function test_order_is_saved_and_returns_whatsapp_link(): void
    {
        $res = $this->postJson('/api/orders', [
            'items' => [['product' => 'wing-ring', 'size' => '7', 'qty' => 1]],
            'province' => 'ON', 'delivery' => 'standard', 'gift_wrap' => true,
            'customer' => ['name' => 'Priya Sharma', 'phone' => '+1 416 555 0182', 'address' => '12 King St W', 'city' => 'Toronto', 'postal_code' => 'm5h 1a1'],
        ])->assertCreated();

        $order = Order::with('items')->first();
        $this->assertSame('AVY-1001', $res->json('code'));
        $this->assertSame('new', $order->status);
        $this->assertSame('M5H 1A1', $order->postal_code);
        $this->assertSame(100.0, (float) $order->subtotal);
        $this->assertSame(133.34, (float) $order->total);    // (100 + $12 shipping + $6 wrap) × 1.13
        $this->assertStringStartsWith(config('store.whatsapp_url').'/918320495754?text=', $res->json('whatsapp_url'));
        $this->assertStringContainsString('Order: AVY-1001', $order->whatsapp_message);
        $this->assertSame('Wing Ring', $order->items[0]->name);
    }

    public function test_order_validation_and_honeypot(): void
    {
        $this->postJson('/api/orders', ['items' => [['product' => 'wing-ring', 'qty' => 1]], 'customer' => ['name' => 'X']])
            ->assertStatus(422)->assertJsonValidationErrors('customer.phone');
        $this->postJson('/api/orders', ['items' => [['product' => 'wing-ring', 'qty' => 1]], 'customer' => ['name' => 'Bot', 'phone' => '4165550182'], 'website' => 'spam'])
            ->assertStatus(422)->assertJsonValidationErrors('website');
        $this->assertSame(0, Order::count());
    }

    public function test_forms_bookings_and_subscribe(): void
    {
        $date = now()->next('Tuesday')->toDateString();
        $this->getJson('/api/bookings/slots?date='.$date)->assertOk()->assertJsonPath('slots.0.free', true);
        $this->postJson('/api/bookings', ['name' => 'A', 'phone' => '4165550182', 'date' => $date, 'time_slot' => '11:00'])->assertCreated();
        $this->postJson('/api/bookings', ['name' => 'B', 'phone' => '4165550183', 'date' => $date, 'time_slot' => '11:00'])->assertStatus(422);
        $this->postJson('/api/custom-requests', ['name' => 'C', 'phone' => '4165550184', 'details' => 'A ring like my grandmother’s'])->assertCreated();
        $this->postJson('/api/subscribe', ['email' => 'Hello@Example.com'])->assertCreated();
        $this->postJson('/api/subscribe', ['email' => 'hello@example.com'])->assertCreated();
        $this->assertDatabaseCount('subscribers', 1);
    }

    public function test_cors_allows_only_configured_frontends(): void
    {
        config(['cors.allowed_origins' => ['https://shop.example', 'https://other.example']]);
        $this->getJson('/api/site', ['Origin' => 'https://shop.example'])->assertHeader('Access-Control-Allow-Origin', 'https://shop.example');
        $this->assertNotSame('https://evil.example', $this->getJson('/api/site', ['Origin' => 'https://evil.example'])->headers->get('Access-Control-Allow-Origin'));
    }
}
