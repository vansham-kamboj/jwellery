<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Remembers which orders took pieces out of stock, so cancelling only ever returns what was actually taken. */
    public function up(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->boolean('stock_taken')->default(false)->after('needs_quote'));
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('stock_taken'));
    }
};
