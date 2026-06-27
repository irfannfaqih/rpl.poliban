<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateway_events', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('payment_id')->nullable();
            $table->string('gateway', 50)->default('midtrans');
            $table->string('event_type', 50)->default('notification');
            $table->string('order_id', 50)->nullable();
            $table->string('transaction_status', 32)->nullable();
            $table->string('fraud_status', 32)->nullable();
            $table->boolean('signature_valid')->default(false);
            $table->json('payload');
            $table->timestamp('received_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('processing_result')->nullable();
            $table->timestamps();

            $table->foreign('payment_id')
                ->references('id')
                ->on('payments')
                ->nullOnDelete();

            $table->index('payment_id');
            $table->index('order_id');
            $table->index('transaction_status');
            $table->index('signature_valid');
            $table->index('received_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_events');
    }
};
