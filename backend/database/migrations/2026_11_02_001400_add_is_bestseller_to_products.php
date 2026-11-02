<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // "Featured" and "Best selling" are two separate lists in the shop; this is the second one.
        if (! Schema::hasColumn('products', 'is_bestseller')) {
            Schema::table('products', fn (Blueprint $table) => $table->boolean('is_bestseller')->default(false)->after('is_featured'));
        }
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('is_bestseller'));
    }
};
