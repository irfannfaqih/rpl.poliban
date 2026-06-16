<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop bobot_persen dan panduan_penilaian dari uji_lanjutan_item.
 *
 * Keduanya tidak ada di master formulir RPL manapun (Form 04, 09, 10, 11).
 * Nilai akhir dihitung sebagai rata-rata sederhana skor 1-5 per instrumen,
 * sesuai Form 10 (Lembar Jawaban Tulis): nilai rata-rata × 20.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->dropColumn(['bobot_persen', 'panduan_penilaian']);
        });
    }

    public function down(): void
    {
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->tinyInteger('bobot_persen')->unsigned()->nullable()->after('kunci_jawaban');
            $table->text('panduan_penilaian')->nullable()->after('bobot_persen');
        });
    }
};
