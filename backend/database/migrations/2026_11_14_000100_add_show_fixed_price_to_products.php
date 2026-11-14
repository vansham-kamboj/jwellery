<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A bar or coin can show a fixed price set in Admin, instead of "price on request" (for items not priced at the live rate). */
    public function up(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->boolean('show_fixed_price')->default(false)->after('show_weight'));
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('show_fixed_price'));
    }
};
