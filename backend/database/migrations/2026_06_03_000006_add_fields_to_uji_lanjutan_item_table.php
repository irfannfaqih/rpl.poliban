<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            // PRD Bab 4.4 Halaman 3.3a: bobot persen wajib ada untuk scoring berbobot
            $table->tinyInteger('bobot_persen')->unsigned()->nullable()
                  ->comment('Bobot 1-100 untuk kalkulasi nilai rata-rata berbobot')
                  ->after('kunci_jawaban');

            // PRD Bab 4.4 Halaman 3.3b: panduan penilaian untuk wawancara
            $table->text('panduan_penilaian')->nullable()->after('bobot_persen');

            // Fix: mata_kuliah seharusnya FK ke tabel mata_kuliah, bukan plain string
            // Kolom string lama (mata_kuliah) dipertahankan sebagai fallback
            $table->unsignedBigInteger('mata_kuliah_id')->nullable()->after('mata_kuliah');
            $table->foreign('mata_kuliah_id')
                  ->references('id')
                  ->on('mata_kuliah')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->dropForeign(['mata_kuliah_id']);
            $table->dropColumn(['bobot_persen', 'panduan_penilaian', 'mata_kuliah_id']);
        });
    }
};
