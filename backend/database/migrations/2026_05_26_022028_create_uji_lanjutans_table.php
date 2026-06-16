<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('uji_lanjutan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->foreignId('asesor_id')->constrained('users')->restrictOnDelete();
            $table->enum('status', ['menjadwalkan', 'menunggu_ujian', 'sedang_dinilai', 'selesai'])->default('menjadwalkan');
            $table->enum('fase_tulis', ['buat_soal', 'menunggu_jawaban', 'koreksi', 'selesai'])->default('buat_soal');
            $table->date('tanggal_ujian')->nullable();
            $table->string('waktu_ujian', 30)->nullable();
            $table->text('tempat')->nullable();
            $table->string('link_meeting')->nullable();
            $table->text('catatan_akhir')->nullable();
            $table->text('rekomendasi_akhir')->nullable();
            $table->timestamps();

            // Seorang asesor hanya bisa mengelola satu uji lanjutan untuk satu pendaftaran
            $table->unique(['pendaftaran_id', 'asesor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uji_lanjutan');
    }
};
