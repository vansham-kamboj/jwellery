<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Weight is optional: it can be stored for the team's own use and shown on the website only when "Show weight" is ticked. */
    public function up(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->boolean('show_weight')->default(false)->after('weight_grams'));

        // Until now every piece with a weight showed it, so keep it that way; the team can switch it off per product.
        DB::table('products')->whereNotNull('weight_grams')->update(['show_weight' => true]);

        // The weight used to be written into the descriptions as well, which would still show after switching it off.
        foreach (DB::table('products')->whereNotNull('sku')->get(['id', 'sku', 'name', 'description']) as $p) {
            $text = $p->description;
            if (str_starts_with($p->sku, 'AVY-SK-KD')) {
                $text = preg_replace('/ for little ones, [\d.]+ g\./', ' for little ones.', $text);
            } elseif (preg_match('/^AVY-(G|S)[BC]-/', $p->sku)) {
                $text = preg_replace('/^(.*?) — [\d.,]+ ?(?:g|kg|oz) of 99\.99% pure/u', '$1 — 99.99% pure', $text);
            }
            if ($text !== $p->description) {
                DB::table('products')->where('id', $p->id)->update(['description' => $text]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('show_weight'));
    }
};
