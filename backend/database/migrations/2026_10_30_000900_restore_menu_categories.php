<?php

use Database\Seeders\ProductSheetSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Brings back Gold Jewellery, Silver Utensils, Woman Pendant Sets & Necklaces and Woman Earrings, which the sheet import had hidden. */
    public function up(): void
    {
        (new ProductSheetSeeder)->run();
    }

    public function down(): void
    {
        // Catalogue data — nothing to undo automatically.
    }
};
