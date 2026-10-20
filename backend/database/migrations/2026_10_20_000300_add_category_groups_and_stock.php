<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Top-level section on the storefront, e.g. "Women", "Kids", "Gold & silver".
            $table->string('group', 60)->nullable()->after('kind');
        });
        Schema::table('products', function (Blueprint $table) {
            // Units on hand; null = not tracked (just In stock / Sold out).
            $table->unsignedInteger('stock_qty')->nullable()->after('in_stock');
        });
    }

    public function down(): void
    {
        Schema::table('categories', fn (Blueprint $table) => $table->dropColumn('group'));
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('stock_qty'));
    }
};
