<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah kolom pendukung untuk implementasi VATC sesuai F03 Asesmen Mandiri.
 *
 * F03 memiliki dua sisi:
 * 1. Pemohon: isi profisiensi (1/2/4/5) + lampirkan kode/nomor bukti dokumen
 * 2. Asesor : evaluasi kualitas bukti dengan VATC (Valid, Autentik, Terkini, Cukup)
 *
 * Perubahan:
 * - evaluasi_diri: tambah kolom dokumen_pendukung (JSON) untuk menyimpan
 *   referensi dokumen yang dilampirkan pemohon sebagai bukti per CPMK
 * - penilaian_cpmk: tambah kolom valid/autentik/terkini/cukup (boolean nullable)
 *   untuk evaluasi VATC asesor terhadap bukti yang dilampirkan
 */
return new class extends Migration
{
    public function up(): void
    {
        // Tambah dokumen_pendukung ke evaluasi_diri (sisi pemohon)
        Schema::table('evaluasi_diri', function (Blueprint $table) {
            $table->json('dokumen_pendukung')->nullable()->after('profisiensi')
                  ->comment('Array ID dokumen yang dilampirkan pemohon sebagai bukti klaim CPMK');
        });

        // Tambah VATC ke penilaian_cpmk (sisi asesor)
        Schema::table('penilaian_cpmk', function (Blueprint $table) {
            $table->boolean('valid')->nullable()->after('catatan')
                  ->comment('V: Terdapat hubungan jelas antara bukti dan indikator CP');
            $table->boolean('autentik')->nullable()->after('valid')
                  ->comment('A: Bukti dapat diverifikasi di tempat kerja pemohon');
            $table->boolean('terkini')->nullable()->after('autentik')
                  ->comment('T: Bukti mendemonstrasikan pengetahuan/keterampilan terkini');
            $table->boolean('cukup')->nullable()->after('terkini')
                  ->comment('C: Bukti cukup untuk menilai kinerja indikator pembelajaran');
        });
    }

    public function down(): void
    {
        Schema::table('evaluasi_diri', function (Blueprint $table) {
            $table->dropColumn('dokumen_pendukung');
        });

        Schema::table('penilaian_cpmk', function (Blueprint $table) {
            $table->dropColumn(['valid', 'autentik', 'terkini', 'cukup']);
        });
    }
};
