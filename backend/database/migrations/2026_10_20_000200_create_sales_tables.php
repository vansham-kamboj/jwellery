<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('status', 20)->default('new'); // new | confirmed | shipped | completed | cancelled
            $table->string('customer_name');
            $table->string('customer_phone', 40);
            $table->string('customer_email')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('province', 4)->nullable();
            $table->string('postal_code', 12)->nullable();
            $table->text('note')->nullable();
            $table->string('delivery_method', 30)->nullable();
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->boolean('gift_wrap')->default(false);
            $table->decimal('gift_wrap_fee', 10, 2)->default(0);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->string('currency', 3)->default('CAD');
            $table->boolean('needs_quote')->default(false);
            $table->text('whatsapp_message')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('finish')->nullable();
            $table->string('size')->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->decimal('original_price', 12, 2);
            $table->string('offer_name')->nullable();
            $table->unsignedInteger('qty');
            $table->decimal('line_total', 12, 2);
            $table->boolean('tax_exempt')->default(false);
            $table->boolean('needs_quote')->default(false);
        });

        Schema::create('custom_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 40);
            $table->string('email')->nullable();
            $table->string('piece_type')->nullable();
            $table->string('metal')->nullable();
            $table->string('budget')->nullable();
            $table->text('details');
            $table->string('reference_image')->nullable();
            $table->string('status', 20)->default('new'); // new | in_progress | done | closed
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 40);
            $table->string('email')->nullable();
            $table->date('date');
            $table->string('time_slot', 10);
            $table->string('purpose')->nullable();
            $table->text('note')->nullable();
            $table->string('status', 20)->default('booked'); // booked | done | cancelled
            $table->timestamps();
            $table->index(['date', 'time_slot']);
        });

        Schema::create('subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('source', 40)->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['settings', 'subscribers', 'bookings', 'custom_requests', 'order_items', 'orders'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
