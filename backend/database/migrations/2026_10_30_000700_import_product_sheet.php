<?php

use Database\Seeders\ProductSheetSeeder;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /** Loads the client's product sheet (Oct 30 2026) — runs from Admin → Settings → Run database updates on the live site. */
    public function up(): void
    {
        (new ProductSheetSeeder)->run();
    }

    public function down(): void
    {
        // Catalogue data — nothing to undo automatically.
    }
};
