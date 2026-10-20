<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete(); // optional: shown on that product too
            $table->string('author_name', 80);
            $table->string('city', 80)->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('body');
            $table->date('reviewed_on')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->boolean('is_featured')->default(true);   // featured reviews appear on the home page
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
