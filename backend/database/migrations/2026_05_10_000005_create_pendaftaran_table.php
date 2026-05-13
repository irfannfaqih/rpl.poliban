<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pendaftaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gelombang_id')->constrained('gelombang')->restrictOnDelete();
            $table->foreignId('prodi_id')->constrained('prodi')->restrictOnDelete();
            $table->string('nomor_pendaftaran', 20)->unique();
            $table->enum('status_alur', [
                'pre_submit',
                'waiting_payment',
                'payment_verified',
                'waiting_verification',
                'pra_asesmen',
                'asesmen_tahap2',
                'pleno',
                'finished',
                'ditolak',
            ])->default('pre_submit');
            $table->string('midtrans_order_id', 50)->nullable();
            $table->string('midtrans_status', 30)->nullable();
            $table->text('catatan_admin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pendaftaran');
    }
};
