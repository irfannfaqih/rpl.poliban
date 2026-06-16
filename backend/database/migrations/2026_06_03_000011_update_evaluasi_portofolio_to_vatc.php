<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ganti skema evaluasi portofolio dari sesuai/tidak_sesuai
     * ke framework VATC (Valid, Autentik, Terkini, Cukup) sesuai PRD Bab 4.4 Halaman 3.2a.
     *
     * PERHATIAN: Kolom kesesuaian dan rekomendasi_at2 akan di-drop.
     * Pastikan tidak ada data produksi sebelum migrasi ini dijalankan.
     */
    public function up(): void
    {
        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            // Hapus kolom skema lama yang tidak sesuai PRD
            $table->dropColumn('kesesuaian');
            $table->dropColumn('rekomendasi_at2');

            // Tambah 4 dimensi VATC (boolean nullable = N/A jika null)
            $table->boolean('valid')->nullable()->after('status_dokumen');
            $table->boolean('autentik')->nullable()->after('valid');
            $table->boolean('terkini')->nullable()->after('autentik');
            $table->boolean('cukup')->nullable()->after('terkini');
            $table->text('catatan_evaluasi')->nullable()->after('cukup');
        });
    }

    public function down(): void
    {
        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->dropColumn(['valid', 'autentik', 'terkini', 'cukup', 'catatan_evaluasi']);

            $table->enum('kesesuaian', ['sesuai', 'tidak_sesuai'])->nullable()->after('status_dokumen');
            $table->text('rekomendasi_at2')->nullable();
        });
    }
};
