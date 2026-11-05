<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Homepage hero slides, editable in Admin → Homepage slides.
 * Seeds the five slides the site shipped with (their photos stay in assets/web/hero) when the table is empty.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_slides', function (Blueprint $table) {
            $table->id();
            $table->string('image');                 // 'hero/…' (uploaded) or 'assets/…' (built-in photo)
            $table->string('mobile_image')->nullable();
            $table->string('kicker', 80)->nullable();
            $table->string('title', 160);            // text between *stars* is shown in italics
            $table->string('text', 300)->nullable();
            $table->string('button_one_label', 40)->nullable();
            $table->string('button_one_link', 300)->nullable();
            $table->string('button_two_label', 40)->nullable();
            $table->string('button_two_link', 300)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        if (DB::table('hero_slides')->exists()) {
            return;
        }
        $wa = 'https://wa.me/16477185454?text=';
        $now = now();
        DB::table('hero_slides')->insert([
            ['image' => 'assets/web/hero/jewellery.webp', 'mobile_image' => 'assets/web/hero/jewellery-m.webp',
                'kicker' => 'Avya Jewels · Mississauga', 'title' => 'Silver jewellery. *Gold & silver bars.*',
                'text' => '925 sterling silver jewellery, and 99.99% pure gold and silver bars and coins — all in one place.',
                'button_one_label' => 'Shop jewellery', 'button_one_link' => '#/shop/silver-jewellery',
                'button_two_label' => 'Shop gold & silver', 'button_two_link' => '#/shop/bullion',
                'is_active' => true, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['image' => 'assets/web/hero/gold-bar.webp', 'mobile_image' => 'assets/web/hero/gold-bar-m.webp',
                'kicker' => '99.99% pure gold', 'title' => 'Gold bars, *at today’s rate.*',
                'text' => 'RCM, PAMP and Valcambi bars from 1 g to 100 g — sealed and certified.',
                'button_one_label' => 'Shop gold bars', 'button_one_link' => '#/shop/gold-bars',
                'button_two_label' => 'Ask today’s price', 'button_two_link' => $wa.rawurlencode('Hi Avya Jewels, could you share today’s gold price?'),
                'is_active' => true, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['image' => 'assets/web/hero/diwali.webp', 'mobile_image' => 'assets/web/hero/diwali-m.webp',
                'kicker' => 'Diwali & festive gifting', 'title' => 'Lakshmi gold *for the Festival of Lights.*',
                'text' => 'Lakshmi Diwali gold bars and Ganpati silver coins — a blessing that keeps its value.',
                'button_one_label' => 'Shop festive gold', 'button_one_link' => '#/shop/gold-bars',
                'button_two_label' => 'Silver coins', 'button_two_link' => '#/shop/silver-coins',
                'is_active' => true, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['image' => 'assets/web/hero/silver-ring.webp', 'mobile_image' => 'assets/web/hero/silver-ring-m.webp',
                'kicker' => '925 sterling silver', 'title' => 'Rings that *catch the light.*',
                'text' => 'Hallmarked and stamped — each one of a kind, in its own Canadian size.',
                'button_one_label' => 'Shop rings', 'button_one_link' => '#/shop/silver-rings',
                'button_two_label' => 'All jewellery', 'button_two_link' => '#/shop/silver-jewellery',
                'is_active' => true, 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['image' => 'assets/web/hero/silver-bars.webp', 'mobile_image' => 'assets/web/hero/silver-bars-m.webp',
                'kicker' => '99.99% pure silver', 'title' => 'Silver bars *and coins.*',
                'text' => 'Royal Canadian Mint 1 kg and 100 oz bars, plus 1 oz coins.',
                'button_one_label' => 'Shop silver bars', 'button_one_link' => '#/shop/silver-bars',
                'button_two_label' => 'Ask today’s price', 'button_two_link' => $wa.rawurlencode('Hi Avya Jewels, could you share today’s silver price?'),
                'is_active' => true, 'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_slides');
    }
};
