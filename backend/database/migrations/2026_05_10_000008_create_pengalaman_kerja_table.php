<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengalaman_kerja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->enum('tipe', ['kerja', 'pelatihan', 'organisasi', 'penghargaan']);
            $table->string('nama'); // nama perusahaan/pelatihan/organisasi
            $table->string('jabatan_peran')->nullable();
            $table->string('bidang', 100)->nullable();
            $table->year('tahun_mulai');
            $table->year('tahun_selesai')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('sertifikat_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengalaman_kerja');
    }
};
