<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Restrukturisasi uji_lanjutan_item.
 *
 * Perubahan:
 * - DROP mata_kuliah (string) — redundan dengan mata_kuliah_id FK (Temuan 2)
 * - DROP skor — dipindah ke uji_lanjutan_penilaian per asesor (Temuan 6)
 * - ADD submitted_at — kapan pemohon submit jawaban soal ini
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->dropColumn(['mata_kuliah', 'skor']);
        });

        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->timestamp('submitted_at')
                  ->nullable()
                  ->after('jawaban_pemohon')
                  ->comment('Kapan pemohon mengumpulkan jawaban soal ini');
        });
    }

    public function down(): void
    {
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->dropColumn('submitted_at');
            $table->string('mata_kuliah')->nullable();
            $table->integer('skor')->nullable();
        });
    }
};
