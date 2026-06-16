<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengalaman_kerja', function (Blueprint $table) {
            // PRD Section A.3: status kepegawaian wajib ada
            $table->enum('status_kepegawaian', ['tetap', 'kontrak', 'freelance', 'magang'])
                  ->nullable()->after('jabatan_peran');

            // PRD Section A.3: periode menggunakan MM/YYYY (bulan + tahun)
            // Simpan bulan terpisah dari tahun yang sudah ada
            $table->tinyInteger('bulan_mulai')->unsigned()->nullable()->comment('1-12')->after('tahun_mulai');
            $table->tinyInteger('bulan_selesai')->unsigned()->nullable()->comment('1-12')->after('tahun_selesai');
        });
    }

    public function down(): void
    {
        Schema::table('pengalaman_kerja', function (Blueprint $table) {
            $table->dropColumn(['status_kepegawaian', 'bulan_mulai', 'bulan_selesai']);
        });
    }
};
