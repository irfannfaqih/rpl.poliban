<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Form 09: Soal ujian tulis dari asesor
        Schema::create('ujian_tulis_soal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penugasan_asesor_id')->constrained('penugasan_asesor')->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliah')->cascadeOnDelete();
            $table->tinyInteger('nomor_soal')->unsigned();
            $table->text('pertanyaan');
            $table->timestamps();
        });

        // Form 10: Jawaban ujian tulis dari pemohon
        Schema::create('ujian_tulis_jawaban', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ujian_tulis_soal_id')->constrained('ujian_tulis_soal')->cascadeOnDelete();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->text('jawaban');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ujian_tulis_jawaban');
        Schema::dropIfExists('ujian_tulis_soal');
    }
};
