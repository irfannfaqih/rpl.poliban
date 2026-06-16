<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kembalikan evaluasi_portofolio ke skema F04 yang benar.
 *
 * F04 Asesmen Portofolio menggunakan:
 *   - status_dokumen (Ada/Tidak Ada)
 *   - kesesuaian (Sesuai/Tidak Sesuai)
 *   - rekomendasi_at2 (catatan tindak lanjut AT2)
 *
 * VATC (Valid/Autentik/Terkini/Cukup) sesuai F03 Asesmen Mandiri
 * digunakan untuk evaluasi bukti per indikator CPMK, bukan per
 * kategori dokumen portofolio.
 *
 * Semua kolom VATC masih NULL (belum ada data), aman untuk dihapus.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->dropColumn(['valid', 'autentik', 'terkini', 'cukup', 'catatan_evaluasi']);
        });

        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->enum('kesesuaian', ['sesuai', 'tidak_sesuai'])->nullable()->after('status_dokumen');
            $table->text('rekomendasi_at2')->nullable()->after('kesesuaian');
        });
    }

    public function down(): void
    {
        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->dropColumn(['kesesuaian', 'rekomendasi_at2']);
        });

        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->boolean('valid')->nullable()->after('status_dokumen');
            $table->boolean('autentik')->nullable()->after('valid');
            $table->boolean('terkini')->nullable()->after('autentik');
            $table->boolean('cukup')->nullable()->after('terkini');
            $table->text('catatan_evaluasi')->nullable()->after('cukup');
        });
    }
};
