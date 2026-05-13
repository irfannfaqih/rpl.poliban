<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verifikasi_berkas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->string('kode_dokumen', 30);
            $table->enum('status', ['valid', 'invalid'])->nullable();
            $table->text('catatan')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['pendaftaran_id', 'kode_dokumen']);
        });

        Schema::create('penugasan_asesor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->foreignId('asesor_id')->constrained('users')->restrictOnDelete();
            $table->enum('urutan', ['asesor_1', 'asesor_2']);
            $table->enum('status', ['belum_dinilai', 'sedang_dinilai', 'submit_final'])->default('belum_dinilai');
            $table->timestamps();

            $table->unique(['pendaftaran_id', 'urutan']);
        });

        Schema::create('jadwal_asesmen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->date('tanggal');
            $table->string('waktu', 30);
            $table->text('tempat');
            $table->string('link_meeting')->nullable();
            $table->text('catatan')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jadwal_asesmen');
        Schema::dropIfExists('penugasan_asesor');
        Schema::dropIfExists('verifikasi_berkas');
    }
};
