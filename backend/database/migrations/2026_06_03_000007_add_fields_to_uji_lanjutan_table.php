<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            // PRD Bab 4.4 Halaman 3.3: jenis ujian wajib ditentukan
            $table->enum('jenis_ujian', ['tulis', 'wawancara', 'praktek'])
                  ->nullable()->after('asesor_id');

            // PRD Bab 4.2 Halaman 1.6: pemohon bisa konfirmasi kehadiran via sistem
            $table->boolean('konfirmasi_kehadiran')->default(false)->after('catatan_akhir');
            $table->timestamp('konfirmasi_at')->nullable()->after('konfirmasi_kehadiran');
        });
    }

    public function down(): void
    {
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->dropColumn(['jenis_ujian', 'konfirmasi_kehadiran', 'konfirmasi_at']);
        });
    }
};
