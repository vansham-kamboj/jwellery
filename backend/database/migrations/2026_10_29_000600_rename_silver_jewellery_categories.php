<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** The client wants the Silver Jewellery menu to read Woman Pendant Sets & Necklaces · Woman Earrings · Woman Bracelets · Woman Rings. */
    private const NAMES = [
        'silver-pendant-sets' => ['Pendant sets & necklaces', 'Woman Pendant Sets & Necklaces'],
        'silver-earrings' => ['Silver earrings', 'Woman Earrings'],
        'silver-bracelets' => ['Bracelets', 'Woman Bracelets'],
        'silver-rings' => ['Rings', 'Woman Rings'],
    ];

    public function up(): void
    {
        foreach (self::NAMES as $slug => [, $new]) {
            DB::table('categories')->where('slug', $slug)->update(['name' => $new]);
        }
    }

    public function down(): void
    {
        foreach (self::NAMES as $slug => [$old]) {
            DB::table('categories')->where('slug', $slug)->update(['name' => $old]);
        }
    }
};
