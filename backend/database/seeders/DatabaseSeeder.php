<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([AdminSeeder::class, ProductSheetSeeder::class]);   // the client's product sheet (CatalogSeeder holds the older demo catalogue)
    }
}
