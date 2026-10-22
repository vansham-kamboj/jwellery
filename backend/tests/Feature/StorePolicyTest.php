<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The store's own rules from the client questionnaire (default settings). */
class StorePolicyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $rings = Category::create(['name' => 'Rings', 'slug' => 'silver-rings', 'group' => 'Silver Jewellery']);
        $bars = Category::create(['name' => 'Gold bars', 'slug' => 'gold-bars', 'group' => 'Bullion', 'kind' => 'bullion']);
        Product::create(['category_id' => $rings->id, 'name' => 'Ring', 'slug' => 'ring', 'price' => 120, 'stock_qty' => 2]);
        Product::create(['category_id' => $bars->id, 'name' => 'Gold Bar 10 g', 'slug' => 'bar', 'price' => 1600, 'kind' => 'bullion', 'tax_exempt' => true]);
    }

    public function test_bullion_shows_price_on_request_and_cannot_be_ordered(): void
    {
        $this->getJson('/api/products/bar')->assertJsonPath('data.price', null)->assertJsonPath('data.price_on_request', true);
        $res = $this->postJson('/api/cart/quote', ['items' => [['product' => 'bar', 'qty' => 1]]])->json();
        $this->assertSame([], $res['items']);
        $this->assertStringContainsString('today’s price', $res['problems'][0]['message']);
    }

    public function test_gold_jewellery_follows_the_gold_rate(): void
    {
        $rings = Category::where('slug', 'silver-rings')->first();
        Product::create(['category_id' => $rings->id, 'name' => 'Gold Chain', 'slug' => 'chain', 'price' => 900, 'metal' => 'gold', 'sku' => 'AV-77', 'stock_qty' => 1]);
        $this->getJson('/api/products/chain')->assertJsonPath('data.price', null)->assertJsonPath('data.price_on_request', true)->assertJsonPath('data.sku', 'AV-77');
        $this->getJson('/api/products/ring')->assertJsonPath('data.price_on_request', false);
    }

    public function test_prices_include_tax_and_stock_is_respected(): void
    {
        $this->getJson('/api/products/ring')->assertJsonPath('data.stock', 2)->assertJsonPath('data.in_stock', true);
        $res = $this->postJson('/api/cart/quote', ['items' => [['product' => 'ring', 'qty' => 5]], 'delivery' => 'pickup'])->json();
        $this->assertSame(2, $res['items'][0]['qty']);
        $this->assertTrue($res['tax_included']);
        $this->assertSame(0.0, (float) $res['tax']);
        $this->assertSame(240.0, (float) $res['total']);
    }

    public function test_gta_delivery_needs_200_and_gift_wrap_needs_150(): void
    {
        $small = $this->postJson('/api/cart/quote', ['items' => [['product' => 'ring', 'qty' => 1]], 'delivery' => 'gta', 'gift_wrap' => true])->json();
        $this->assertSame('pickup', $small['delivery_method']);
        $this->assertFalse($small['gift_wrap']);

        $big = $this->postJson('/api/cart/quote', ['items' => [['product' => 'ring', 'qty' => 2]], 'delivery' => 'gta', 'gift_wrap' => true])->json();
        $this->assertSame('gta', $big['delivery_method']);
        $this->assertSame(0.0, (float) $big['delivery_fee']);
        $this->assertTrue($big['gift_wrap']);
        $this->assertSame(240.0, (float) $big['total']);
    }

    public function test_site_lists_category_sections(): void
    {
        $site = $this->getJson('/api/site')->assertJsonPath('settings.prices_include_tax', true)->assertJsonPath('settings.show_bullion_prices', false);
        $this->assertSame('Silver Jewellery', collect($site->json('categories'))->firstWhere('slug', 'silver-rings')['group']);
    }
}
