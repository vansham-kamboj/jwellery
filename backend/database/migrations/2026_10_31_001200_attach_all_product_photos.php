<?php

use Database\Seeders\ProductSheetSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Attaches every product photo found in assets/ (bullion, bracelets, kada, nazariya …) — Admin → Settings → Run database updates. */
    public function up(): void
    {
        (new ProductSheetSeeder)->run();
    }

    public function down(): void
    {
        // Catalogue data — nothing to undo automatically.
    }
};
