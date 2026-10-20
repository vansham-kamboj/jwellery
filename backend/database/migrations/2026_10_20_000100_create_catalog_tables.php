<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('kind', 20)->default('jewellery'); // jewellery | bullion
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });

        Schema::create('finishes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('swatch_hex', 9)->default('#cccccc');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('short_name')->nullable();
            $table->string('material')->nullable();
            $table->text('description')->nullable();
            $table->text('care')->nullable();
            $table->decimal('price', 12, 2);
            $table->string('tag', 40)->nullable();
            $table->string('kind', 20)->default('jewellery'); // jewellery | bullion
            $table->string('metal', 20)->nullable();           // gold | silver (bullion)
            $table->decimal('weight_grams', 10, 4)->nullable();
            $table->string('purity', 20)->nullable();
            $table->boolean('tax_exempt')->default(false);
            $table->string('size_label', 40)->nullable();      // e.g. "Ring size"
            $table->string('default_size', 20)->nullable();
            $table->boolean('in_stock')->default(true);
            $table->boolean('is_visible')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['is_visible', 'sort_order']);
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('type', 10)->default('image'); // image | video
            $table->string('alt')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('product_sizes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('label', 40);
            $table->boolean('in_stock')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
        });

        Schema::create('finish_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('finish_id')->constrained()->cascadeOnDelete();
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->boolean('in_stock')->default(true);
            $table->unique(['product_id', 'finish_id']);
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('badge', 40)->nullable();
            $table->string('type', 10)->default('percent'); // percent | fixed
            $table->decimal('value', 10, 2);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('applies_to_all')->default(false);
            $table->decimal('min_price', 12, 2)->nullable();
            $table->decimal('max_price', 12, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('category_offer', function (Blueprint $table) {
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->primary(['offer_id', 'category_id']);
        });

        Schema::create('offer_product', function (Blueprint $table) {
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['offer_id', 'product_id']);
        });
    }

    public function down(): void
    {
        foreach (['offer_product', 'category_offer', 'offers', 'finish_product', 'product_sizes', 'product_images', 'products', 'finishes', 'categories'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
