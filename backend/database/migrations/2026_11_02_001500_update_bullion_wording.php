<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Client wording for bars and coins: ".9999 pure gold" / "0.9999 pure silver", and no "In mint condition",
 * "Sealed as issued by the refiner" or packaging text. Texts come from the product sheet data, matched by SKU.
 */
return new class extends Migration
{
    public function up(): void
    {
        $data = json_decode(file_get_contents(database_path('seeders/data/product-sheet.json')), true);
        foreach ($data['products'] as $p) {
            if ($p['kind'] !== 'bullion') {
                continue;
            }
            DB::table('products')->where('sku', $p['sku'])->update([
                'description' => $p['description'], 'material' => $p['material'], 'care' => null,
            ]);
        }
    }

    public function down(): void
    {
        // The earlier wording is not restored.
    }
};
