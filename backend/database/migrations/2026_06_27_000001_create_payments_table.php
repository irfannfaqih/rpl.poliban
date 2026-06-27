<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('pendaftaran_id');
            $table->string('gateway', 50)->default('midtrans');
            $table->string('order_id', 50)->unique();
            $table->unsignedBigInteger('amount');
            $table->string('currency', 3)->default('IDR');
            $table->string('status', 32)->default('pending');
            $table->string('snap_token', 255)->nullable();
            $table->text('redirect_url')->nullable();
            $table->string('payment_type', 50)->nullable();
            $table->string('va_number', 50)->nullable();
            $table->text('qr_string')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamps();

            $table->foreign('pendaftaran_id')
                ->references('id')
                ->on('pendaftaran')
                ->cascadeOnDelete();

            $table->index('pendaftaran_id');
            $table->index('status');
            $table->index('gateway');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
