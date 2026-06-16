<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catatan dan nilai akhir AT2 per asesor.
 * Memindahkan catatan_akhir dan rekomendasi_akhir dari uji_lanjutan
 * (yang sebelumnya per-asesor) ke tabel terpisah ini, agar nilai
 * tiap asesor tersimpan mandiri dan bisa digabungkan untuk pleno.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uji_lanjutan_catatan_asesor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uji_lanjutan_id')
                  ->constrained('uji_lanjutan')
                  ->cascadeOnDelete();
            $table->foreignId('asesor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->text('catatan_akhir')->nullable();
            $table->decimal('nilai_akhir', 5, 2)->nullable(); // rata-rata skor × 20, maks 100
            $table->boolean('is_submitted')->default(false);
            $table->timestamps();

            $table->unique(['uji_lanjutan_id', 'asesor_id'], 'uq_catatan_at2_per_asesor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uji_lanjutan_catatan_asesor');
    }
};
