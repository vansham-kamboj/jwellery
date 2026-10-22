<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Menu sections the client chose: Silver Jewellery · Gold Jewellery · Bullion · Silver Utensils · Kids. */
    private const SECTIONS = [
        'silver-pendant-sets' => 'Silver Jewellery',
        'silver-earrings' => 'Silver Jewellery',
        'silver-bracelets' => 'Silver Jewellery',
        'silver-rings' => 'Silver Jewellery',
        'gold-earrings' => 'Gold Jewellery',
        'mens-gold-chains' => 'Gold Jewellery',
        'gold-bars' => 'Bullion',
        'gold-coins' => 'Bullion',
        'silver-bars' => 'Bullion',
        'silver-coins' => 'Bullion',
        'silver-bowls' => 'Silver Utensils',
        'silver-spoons' => 'Silver Utensils',
        'kids-nazariya' => 'Kids',
        'kids-kada' => 'Kids',
    ];

    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Shown on the product page: product code for every piece, the rest for bullion.
            $table->string('sku', 60)->nullable()->after('slug');
            $table->string('brand', 80)->nullable()->after('purity');
            $table->string('design', 120)->nullable()->after('brand');
            $table->string('packaging', 120)->nullable()->after('design');
            $table->boolean('certificate')->default(false)->after('packaging');
        });

        foreach (self::SECTIONS as $slug => $group) {
            DB::table('categories')->where('slug', $slug)->update(['group' => $group]);
        }

        // The client asked not to mention serial numbers or buy-back on product pages.
        $tidy = [
            'with the manufacturer’s serial number and assay certificate' => 'with its assay certificate',
            ' with the mint’s serial number and certificate' => ' with the mint’s certificate',
            ', serial-numbered' => '', 'serial-numbered, ' => '', 'serial-numbered and ' => '', 'serial-numbered ' => '',
        ];
        foreach (['products' => ['description', 'care'], 'categories' => ['description']] as $table => $columns) {
            foreach (DB::table($table)->get(array_merge(['id'], $columns)) as $row) {
                $changes = [];
                foreach ($columns as $col) {
                    if ($row->$col !== null && str_contains($row->$col, 'serial')) {
                        $changes[$col] = strtr($row->$col, $tidy);
                    }
                }
                if ($changes) {
                    DB::table($table)->where('id', $row->id)->update($changes);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn(['sku', 'brand', 'design', 'packaging', 'certificate']));
    }
};
