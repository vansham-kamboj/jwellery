<?php

use Database\Seeders\ProductSheetSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Attaches the first bullion photos from assets/products/ (named by SKU) — Admin → Settings → Run database updates. */
    public function up(): void
    {
        (new ProductSheetSeeder)->run();
    }

    public function down(): void
    {
        // Catalogue data — nothing to undo automatically.
    }
};
