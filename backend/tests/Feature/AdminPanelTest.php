<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Finish;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['email' => 'owner@example.com', 'password' => 'correct-horse-9']);
    }

    public function test_guests_are_sent_to_login(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->get('/admin/login')->assertOk()->assertSee('Sign in');
    }

    public function test_login_logout_and_wrong_password(): void
    {
        $this->post('/admin/login', ['email' => 'owner@example.com', 'password' => 'nope'])->assertSessionHasErrors('email');
        $this->assertGuest();

        $this->post('/admin/login', ['email' => 'owner@example.com', 'password' => 'correct-horse-9'])->assertRedirect('/admin');
        $this->assertAuthenticatedAs($this->admin);
        $this->post('/admin/logout')->assertRedirect('/admin/login');
        $this->assertGuest();
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/admin/login', ['email' => 'owner@example.com', 'password' => 'nope']);
        }
        $this->post('/admin/login', ['email' => 'owner@example.com', 'password' => 'correct-horse-9'])->assertStatus(429);
    }

    public function test_every_admin_page_renders(): void
    {
        $cat = Category::create(['name' => 'Rings', 'slug' => 'rings']);
        $product = Product::create(['category_id' => $cat->id, 'name' => 'Ring', 'slug' => 'ring', 'price' => 50]);
        $offer = Offer::create(['name' => 'Sale', 'type' => 'percent', 'value' => 10, 'applies_to_all' => true]);
        $order = Order::create(['code' => 'AVY-1001', 'customer_name' => 'P', 'customer_phone' => '4165550182', 'subtotal' => 50, 'total' => 56.5, 'whatsapp_message' => 'hi']);
        Finish::create(['name' => 'Silver', 'slug' => 'silver']);

        $this->actingAs($this->admin);
        foreach (['/admin', '/admin/orders', '/admin/orders/'.$order->id, '/admin/products', '/admin/products/create', '/admin/products/'.$product->id.'/edit',
            '/admin/categories', '/admin/finishes', '/admin/offers', '/admin/offers/create', '/admin/offers/'.$offer->id.'/edit',
            '/admin/requests', '/admin/bookings', '/admin/subscribers', '/admin/settings'] as $url) {
            $this->get($url)->assertOk();
        }
        $this->get('/admin/subscribers/export')->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_create_product_with_photo_sizes_and_finish(): void
    {
        Storage::fake('public');
        $cat = Category::create(['name' => 'Rings', 'slug' => 'rings']);
        $finish = Finish::create(['name' => 'Rose gold tone', 'slug' => 'rose']);

        $this->actingAs($this->admin)->post('/admin/products', [
            'name' => 'Starflower Ring', 'category_id' => $cat->id, 'kind' => 'jewellery', 'price' => 112,
            'sizes' => '5, 6, 7', 'sold_out_sizes' => '5', 'default_size' => '7', 'is_visible' => 1, 'in_stock' => 1,
            'finish' => [$finish->id => ['on' => 1, 'adjust' => 8, 'in_stock' => 1]],
            'images' => [UploadedFile::fake()->image('ring.jpg', 800, 800)],
        ])->assertRedirect();

        $p = Product::with(['sizes', 'finishes', 'images'])->firstWhere('slug', 'starflower-ring');
        $this->assertSame(['5', '6', '7'], $p->sizes->pluck('label')->all());
        $this->assertFalse($p->sizes[0]->in_stock);
        $this->assertSame(8.0, (float) $p->finishes[0]->pivot->price_adjustment);
        Storage::disk('public')->assertExists($p->images[0]->path);
    }

    public function test_live_check_reports_new_orders_and_changes(): void
    {
        $this->getJson('/admin/live')->assertUnauthorized();   // never open to the public

        $this->actingAs($this->admin);
        $first = $this->getJson('/admin/live?since=0')->assertOk()->assertJsonPath('latest_id', 0)->json();

        $order = Order::create(['code' => 'AVY-1001', 'customer_name' => 'Priya', 'customer_phone' => '4165550182', 'subtotal' => 112, 'total' => 112]);
        $res = $this->getJson('/admin/live?since=0')->assertOk()
            ->assertJsonPath('latest_id', $order->id)
            ->assertJsonPath('new_orders.0.code', 'AVY-1001')
            ->assertJsonPath('new_orders.0.total', '$112.00')
            ->assertJsonPath('counts.orders', 1);
        $this->assertNotSame($first['signature'], $res->json('signature'));
        $this->getJson('/admin/live?since='.$order->id)->assertJsonCount(0, 'new_orders');

        $this->get('/admin/orders')->assertSee('data-live-region', false)->assertSee('data-live-url', false);
    }

    public function test_status_can_be_changed_from_the_order_list(): void
    {
        $order = Order::create(['code' => 'AVY-1001', 'customer_name' => 'P', 'customer_phone' => '4165550182', 'subtotal' => 50, 'total' => 50, 'admin_notes' => 'keep me']);
        $this->actingAs($this->admin);
        $this->get('/admin/orders')->assertOk()->assertSee('class="status-select new"', false);
        $this->get('/admin')->assertOk()->assertSee('aria-label="Status of order AVY-1001"', false);

        $this->from('/admin/orders?status=new')->patch('/admin/orders/'.$order->id, ['status' => 'shipped'])->assertRedirect('/admin/orders?status=new');
        $order->refresh();
        $this->assertSame('shipped', $order->status);
        $this->assertNotNull($order->shipped_at);
        $this->assertSame('keep me', $order->admin_notes);   // notes untouched by a list change
    }

    public function test_order_status_change_is_timestamped(): void
    {
        $order = Order::create(['code' => 'AVY-1001', 'customer_name' => 'P', 'customer_phone' => '4165550182', 'subtotal' => 50, 'total' => 56.5]);
        $this->actingAs($this->admin)->patch('/admin/orders/'.$order->id, ['status' => 'confirmed', 'admin_notes' => 'Paid by e-transfer'])->assertRedirect();
        $order->refresh();
        $this->assertSame('confirmed', $order->status);
        $this->assertNotNull($order->confirmed_at);
        $this->assertSame('Paid by e-transfer', $order->admin_notes);
    }

    public function test_database_updates_button_runs_migrations(): void
    {
        $this->actingAs($this->admin)->get('/admin/settings')->assertOk()->assertSee('The database is up to date.');
        $this->actingAs($this->admin)->post('/admin/database-updates')->assertRedirect()->assertSessionHas('ok', 'The database is already up to date.');
    }

    public function test_settings_save_and_reach_the_api(): void
    {
        $this->actingAs($this->admin)->put('/admin/settings', [
            'store_name' => 'Avya Jewels', 'whatsapp_number' => '14165550100', 'order_prefix' => 'av', 'gift_wrap_fee' => 8, 'gift_wrap_min' => 150, 'spot_gold_oz' => 3650.5, 'show_bullion_prices' => 1,
            'quote_above' => 3000, 'max_qty_per_line' => 5, 'default_province' => 'on', 'tax_rates' => ['ON' => 13, 'BC' => 12],
            'shipping' => [['code' => 'standard', 'name' => 'Standard', 'fee' => 10, 'free_over' => 200]],
            'booking_days' => [2, 3], 'booking_slots' => '11:00, 14:00, nonsense', 'social_instagram' => 'https://instagram.com/avya',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->getJson('/api/site')->assertJsonPath('settings.whatsapp_number', '14165550100')
            ->assertJsonPath('settings.gift_wrap_fee', 8)->assertJsonPath('settings.booking_slots', ['11:00', '14:00'])
            ->assertJsonPath('settings.social.instagram', 'https://instagram.com/avya')
            ->assertJsonPath('settings.spot.gold_oz', 3650.5)->assertJsonPath('settings.show_bullion_prices', true)
            ->assertJsonPath('settings.prices_include_tax', false);
        $this->assertNotNull(Settings::get('spot_updated_at'));
    }
    public function test_dashboard_figures_follow_the_period_filter(): void
    {
        $make = function (string $code, string $status, float $total, $when) {
            $o = Order::create(['code' => $code, 'customer_name' => 'P', 'customer_phone' => '4165550182', 'subtotal' => $total, 'total' => $total, 'status' => $status]);
            $o->created_at = $when;
            $o->save();
        };
        $make('AVY-1', 'new', 35, now());
        $make('AVY-2', 'confirmed', 65, now());
        $make('AVY-3', 'cancelled', 20, now());
        $make('AVY-4', 'completed', 100, now()->subMonthNoOverflow()->startOfMonth()->addDays(2));

        $this->actingAs($this->admin);
        $this->get('/admin')->assertOk()
            ->assertViewHas('stats', fn ($s) => $s['sales'] == 65 && $s['pending'] == 35 && $s['orders'] === 2 && $s['cancelled'] === 1);
        $this->get('/admin?period=last_month')->assertOk()
            ->assertViewHas('stats', fn ($s) => $s['sales'] == 100 && $s['pending'] == 0 && $s['salesCount'] === 1);
        $this->get('/admin?period=all')->assertOk()
            ->assertViewHas('stats', fn ($s) => $s['sales'] == 165 && $s['orderValue'] == 200 && $s['average'] == 82.5)
            ->assertSee('All time');
        $this->get('/admin?period=nonsense')->assertOk()->assertViewHas('period', 'month');
    }
    public function test_manual_order_is_saved_as_confirmed_with_only_a_note(): void
    {
        $cat = Category::create(['name' => 'Rings', 'slug' => 'rings']);
        $ring = Product::create(['category_id' => $cat->id, 'name' => 'Starflower Ring', 'slug' => 'starflower', 'price' => 50]);
        $bowl = Product::create(['category_id' => $cat->id, 'name' => 'Silver Bowl', 'slug' => 'bowl', 'price' => 288, 'is_visible' => false]);
        $this->actingAs($this->admin);

        $this->get('/admin/manual-orders/create')->assertOk()->assertSee('Starflower Ring')->assertSee('Silver Bowl');

        // Nothing picked: refused.
        $this->post('/admin/manual-orders', ['note' => 'x'])->assertSessionHasErrors('lines');

        // No note, no customer: still fine.
        $this->post('/admin/manual-orders', ['lines' => [['product_id' => $ring->id, 'qty' => 2, 'price' => 45]]])->assertRedirect();
        $plain = Order::latest('id')->first();
        $this->assertSame('confirmed', $plain->status);
        $this->assertNotNull($plain->confirmed_at);
        $this->assertNull($plain->note);
        $this->assertTrue($plain->isManual());
        $this->assertEquals(90, $plain->total);
        $this->get('/admin/orders/'.$plain->id)->assertOk()->assertSee('Manual')->assertDontSee('Chat on WhatsApp');

        // With a note and two lines.
        $this->post('/admin/manual-orders', [
            'lines' => [['product_id' => $ring->id, 'qty' => 1, 'price' => 50], ['product_id' => $bowl->id, 'qty' => 1, 'price' => 280.5]],
            'note' => 'Priya, paid cash at the shop',
        ])->assertRedirect();
        $order = Order::latest('id')->first();
        $this->assertSame(2, $order->items()->count());
        $this->assertEquals(330.5, $order->total);
        $this->assertSame('Priya, paid cash at the shop', $order->note);

        $this->get('/admin/orders?q=Priya')->assertOk()->assertSee($order->code);
        $this->patch('/admin/orders/'.$order->id.'/note', ['note' => 'Priya K., paid by e-Transfer'])->assertRedirect();
        $this->assertSame('Priya K., paid by e-Transfer', $order->fresh()->note);

        // It counts as a sale on the dashboard.
        $this->get('/admin?period=all')->assertViewHas('stats', fn ($s) => $s['sales'] == 420.5 && $s['salesCount'] === 2);
    }
}
