<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dokumen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->enum('tipe', ['ijazah', 'transkrip', 'sertifikat', 'portofolio', 'tambahan']);
            $table->string('deskripsi')->nullable();
            $table->string('file_path');
            $table->string('file_name');
            $table->unsignedInteger('file_size'); // bytes
            $table->timestamps();
        });

        Schema::create('evaluasi_diri', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->foreignId('cpmk_id')->constrained('cpmk')->cascadeOnDelete();
            $table->enum('profisiensi', ['1', '2', '4', '5']);
            $table->timestamps();

            $table->unique(['pendaftaran_id', 'cpmk_id']);
        });

        Schema::create('evaluasi_diri_dokumen', function (Blueprint $table) {
            $table->foreignId('evaluasi_diri_id')->constrained('evaluasi_diri')->cascadeOnDelete();
            $table->foreignId('dokumen_id')->constrained('dokumen')->cascadeOnDelete();
            $table->primary(['evaluasi_diri_id', 'dokumen_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluasi_diri_dokumen');
        Schema::dropIfExists('evaluasi_diri');
        Schema::dropIfExists('dokumen');
    }
};
