<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Convert BIGINT UNSIGNED to INT UNSIGNED for primary and foreign key columns.
     * Based on clean 56-FK manifest from production backup.
     */
    public function up(): void
    {
        echo "Starting BIGINT to INT UNSIGNED conversion (56 FKs, 98 columns)...\n";
        
        echo "Phase 1: Validating max values for safe conversion...\n";
        
        // Check max values for critical IDs
        $maxUserId = DB::table('users')->max('id');
        $maxPendaftaranId = DB::table('pendaftaran')->max('id');
        $maxProdiId = DB::table('prodi')->max('id');
        
        $intMax = 4294967295; // INT UNSIGNED max value
        
        if ($maxUserId > $intMax || $maxPendaftaranId > $intMax || $maxProdiId > $intMax) {
            throw new \Exception("ID values exceed INT UNSIGNED range. Conversion not safe.");
        }
        
        echo "✓ All primary keys within INT range\n";
        
        echo "\nPhase 2: Dropping foreign key constraints (56 FKs)...\n";
        
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->dropForeign('arsip_dokumens_pendaftaran_id_foreign');
            $table->dropForeign('arsip_dokumens_uploaded_by_foreign');
        });
        
        Schema::table('audit_log', function (Blueprint $table) {
            $table->dropForeign('audit_log_impersonated_by_foreign');
        });
        
        Schema::table('banding_eksternal', function (Blueprint $table) {
            $table->dropForeign('banding_eksternal_diproses_oleh_foreign');
            $table->dropForeign('banding_eksternal_pendaftaran_id_foreign');
        });
        
        Schema::table('borang_data_diri', function (Blueprint $table) {
            $table->dropForeign('borang_data_diri_pendaftaran_id_foreign');
        });
        
        Schema::table('cpmk', function (Blueprint $table) {
            $table->dropForeign('cpmk_mata_kuliah_id_foreign');
        });
        
        Schema::table('dokumen', function (Blueprint $table) {
            $table->dropForeign('dokumen_pendaftaran_id_foreign');
        });
        
        Schema::table('evaluasi_diri', function (Blueprint $table) {
            $table->dropForeign('evaluasi_diri_cpmk_id_foreign');
            $table->dropForeign('evaluasi_diri_pendaftaran_id_foreign');
        });
        
        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->dropForeign('evaluasi_portofolio_penugasan_asesor_id_foreign');
        });
        
        Schema::table('jadwal_asesmen', function (Blueprint $table) {
            $table->dropForeign('jadwal_asesmen_created_by_foreign');
            $table->dropForeign('jadwal_asesmen_pendaftaran_id_foreign');
        });
        
        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->dropForeign('mata_kuliah_prodi_id_foreign');
        });
        
        Schema::table('matriks_asesmen', function (Blueprint $table) {
            $table->dropForeign('matriks_asesmen_mata_kuliah_id_foreign');
        });
        
        Schema::table('pemetaan_mk', function (Blueprint $table) {
            $table->dropForeign('pemetaan_mk_mk_poliban_id_foreign');
            $table->dropForeign('pemetaan_mk_penugasan_asesor_id_foreign');
        });
        
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->dropForeign('pendaftaran_gelombang_id_foreign');
            $table->dropForeign('pendaftaran_prodi_id_foreign');
        });
        
        Schema::table('pengalaman_kerja', function (Blueprint $table) {
            $table->dropForeign('pengalaman_kerja_pendaftaran_id_foreign');
        });
        
        Schema::table('penilaian_cpmk', function (Blueprint $table) {
            $table->dropForeign('penilaian_cpmk_cpmk_id_foreign');
            $table->dropForeign('penilaian_cpmk_penugasan_asesor_id_foreign');
        });
        
        Schema::table('penugasan_asesor', function (Blueprint $table) {
            $table->dropForeign('penugasan_asesor_asesor_id_foreign');
            $table->dropForeign('penugasan_asesor_pendaftaran_id_foreign');
        });
        
        Schema::table('pleno_approvals', function (Blueprint $table) {
            $table->dropForeign('pleno_approvals_kaprodi_approved_by_foreign');
            $table->dropForeign('pleno_approvals_kaprodi_rejected_by_foreign');
            $table->dropForeign('pleno_approvals_pendaftaran_id_foreign');
            $table->dropForeign('pleno_approvals_pimpinan_approved_by_foreign');
            $table->dropForeign('pleno_approvals_pimpinan_rejected_by_foreign');
            $table->dropForeign('pleno_approvals_submitted_by_foreign');
        });
        
        Schema::table('pleno_mk', function (Blueprint $table) {
            $table->dropForeign('pleno_mk_disahkan_oleh_foreign');
            $table->dropForeign('pleno_mk_mata_kuliah_id_foreign');
            $table->dropForeign('pleno_mk_pendaftaran_id_foreign');
        });
        
        Schema::table('pra_asesmen', function (Blueprint $table) {
            $table->dropForeign('pra_asesmen_penugasan_asesor_id_foreign');
        });
        
        Schema::table('prodi', function (Blueprint $table) {
            $table->dropForeign('prodi_jurusan_id_foreign');
        });
        
        Schema::table('riwayat_pendidikan', function (Blueprint $table) {
            $table->dropForeign('riwayat_pendidikan_pendaftaran_id_foreign');
        });
        
        Schema::table('sanggah', function (Blueprint $table) {
            $table->dropForeign('sanggah_asesor_id_foreign');
            $table->dropForeign('sanggah_mata_kuliah_id_foreign');
            $table->dropForeign('sanggah_pendaftaran_id_foreign');
        });
        
        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->dropForeign('sk_keputusan_diterbitkan_oleh_foreign');
            $table->dropForeign('sk_keputusan_pendaftaran_id_foreign');
        });
        
        Schema::table('transkrip_asal', function (Blueprint $table) {
            $table->dropForeign('transkrip_asal_mk_poliban_id_foreign');
            $table->dropForeign('transkrip_asal_pendaftaran_id_foreign');
        });
        
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->dropForeign('uji_lanjutan_dibuat_oleh_foreign');
            $table->dropForeign('uji_lanjutan_dijadwalkan_oleh_foreign');
            $table->dropForeign('uji_lanjutan_pendaftaran_id_foreign');
            $table->dropForeign('uji_lanjutan_updated_by_foreign');
        });
        
        Schema::table('uji_lanjutan_catatan_asesor', function (Blueprint $table) {
            $table->dropForeign('uji_lanjutan_catatan_asesor_asesor_id_foreign');
            $table->dropForeign('uji_lanjutan_catatan_asesor_uji_lanjutan_id_foreign');
        });
        
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->dropForeign('uji_lanjutan_item_mata_kuliah_id_foreign');
            $table->dropForeign('uji_lanjutan_item_uji_lanjutan_id_foreign');
        });
        
        Schema::table('uji_lanjutan_penilaian', function (Blueprint $table) {
            $table->dropForeign('uji_lanjutan_penilaian_asesor_id_foreign');
            $table->dropForeign('uji_lanjutan_penilaian_uji_lanjutan_item_id_foreign');
        });
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign('users_prodi_id_foreign');
        });
        
        Schema::table('verifikasi_berkas', function (Blueprint $table) {
            $table->dropForeign('verifikasi_berkas_pendaftaran_id_foreign');
            $table->dropForeign('verifikasi_berkas_verified_by_foreign');
        });
        
        echo "✓ All 56 foreign keys dropped\n";
        
        echo "\nPhase 3: Converting BIGINT UNSIGNED to INT UNSIGNED (98 columns)...\n";
        
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
            $table->unsignedInteger('uploaded_by')->nullable()->change();
        });
        
        Schema::table('audit_log', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('impersonated_by')->nullable()->change();
        });
        
        Schema::table('banding_eksternal', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('diproses_oleh')->nullable()->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('borang_data_diri', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('cpmk', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('mata_kuliah_id')->change();
        });
        
        Schema::table('dokumen', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('evaluasi_diri', function (Blueprint $table) {
            $table->unsignedInteger('cpmk_id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('penugasan_asesor_id')->change();
        });
        
        Schema::table('gelombang', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
        });
        
        Schema::table('jadwal_asesmen', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('created_by')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('jurusan', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
        });
        
        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('prodi_id')->change();
        });
        
        Schema::table('matriks_asesmen', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('mata_kuliah_id')->nullable()->change();
        });
        
        Schema::table('pemetaan_mk', function (Blueprint $table) {
            $table->unsignedInteger('mk_poliban_id')->change();
            $table->unsignedInteger('penugasan_asesor_id')->change();
        });
        
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('gelombang_id')->change();
            $table->unsignedInteger('prodi_id')->change();
        });
        
        Schema::table('pengalaman_kerja', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('penilaian_cpmk', function (Blueprint $table) {
            $table->unsignedInteger('cpmk_id')->change();
            $table->unsignedInteger('penugasan_asesor_id')->change();
        });
        
        Schema::table('penugasan_asesor', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('asesor_id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('pleno_approvals', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('kaprodi_approved_by')->nullable()->change();
            $table->unsignedInteger('kaprodi_rejected_by')->nullable()->change();
            $table->unsignedInteger('pendaftaran_id')->change();
            $table->unsignedInteger('pimpinan_approved_by')->nullable()->change();
            $table->unsignedInteger('pimpinan_rejected_by')->nullable()->change();
            $table->unsignedInteger('submitted_by')->nullable()->change();
        });
        
        Schema::table('pleno_mk', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('disahkan_oleh')->nullable()->change();
            $table->unsignedInteger('mata_kuliah_id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('pra_asesmen', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('penugasan_asesor_id')->change();
        });
        
        Schema::table('prodi', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('jurusan_id')->nullable()->change();
        });
        
        Schema::table('riwayat_pendidikan', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('sanggah', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('asesor_id')->nullable()->change();
            $table->unsignedInteger('mata_kuliah_id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('diterbitkan_oleh')->nullable()->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('transkrip_asal', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('mk_poliban_id')->nullable()->change();
            $table->unsignedInteger('pendaftaran_id')->change();
        });
        
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('dibuat_oleh')->nullable()->change();
            $table->unsignedInteger('dijadwalkan_oleh')->nullable()->change();
            $table->unsignedInteger('pendaftaran_id')->change();
            $table->unsignedInteger('updated_by')->nullable()->change();
        });
        
        Schema::table('uji_lanjutan_catatan_asesor', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('asesor_id')->change();
            $table->unsignedInteger('uji_lanjutan_id')->change();
        });
        
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('mata_kuliah_id')->nullable()->change();
            $table->unsignedInteger('uji_lanjutan_id')->change();
        });
        
        Schema::table('uji_lanjutan_penilaian', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('asesor_id')->change();
            $table->unsignedInteger('uji_lanjutan_item_id')->change();
        });
        
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('prodi_id')->nullable()->change();
        });
        
        Schema::table('verifikasi_berkas', function (Blueprint $table) {
            $table->unsignedInteger('id')->change();
            $table->unsignedInteger('pendaftaran_id')->change();
            $table->unsignedInteger('verified_by')->nullable()->change();
        });
        
        echo "✓ All 98 columns converted to INT UNSIGNED\n";
        
        echo "\nPhase 4: Recreating foreign key constraints (56 FKs)...\n";
        
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->foreign('pendaftaran_id', 'arsip_dokumens_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
            $table->foreign('uploaded_by', 'arsip_dokumens_uploaded_by_foreign')->references('id')->on('users')->onDelete('set null');
        });
        
        Schema::table('audit_log', function (Blueprint $table) {
            $table->foreign('impersonated_by', 'audit_log_impersonated_by_foreign')->references('id')->on('users')->onDelete('set null');
        });
        
        Schema::table('banding_eksternal', function (Blueprint $table) {
            $table->foreign('diproses_oleh', 'banding_eksternal_diproses_oleh_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('pendaftaran_id', 'banding_eksternal_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('borang_data_diri', function (Blueprint $table) {
            $table->foreign('pendaftaran_id', 'borang_data_diri_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('cpmk', function (Blueprint $table) {
            $table->foreign('mata_kuliah_id', 'cpmk_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('cascade');
        });
        
        Schema::table('dokumen', function (Blueprint $table) {
            $table->foreign('pendaftaran_id', 'dokumen_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('evaluasi_diri', function (Blueprint $table) {
            $table->foreign('cpmk_id', 'evaluasi_diri_cpmk_id_foreign')->references('id')->on('cpmk')->onDelete('cascade');
            $table->foreign('pendaftaran_id', 'evaluasi_diri_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->foreign('penugasan_asesor_id', 'evaluasi_portofolio_penugasan_asesor_id_foreign')->references('id')->on('penugasan_asesor')->onDelete('cascade');
        });
        
        Schema::table('jadwal_asesmen', function (Blueprint $table) {
            $table->foreign('created_by', 'jadwal_asesmen_created_by_foreign')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('pendaftaran_id', 'jadwal_asesmen_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->foreign('prodi_id', 'mata_kuliah_prodi_id_foreign')->references('id')->on('prodi')->onDelete('cascade');
        });
        
        Schema::table('matriks_asesmen', function (Blueprint $table) {
            $table->foreign('mata_kuliah_id', 'matriks_asesmen_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('cascade');
        });
        
        Schema::table('pemetaan_mk', function (Blueprint $table) {
            $table->foreign('mk_poliban_id', 'pemetaan_mk_mk_poliban_id_foreign')->references('id')->on('mata_kuliah')->onDelete('cascade');
            $table->foreign('penugasan_asesor_id', 'pemetaan_mk_penugasan_asesor_id_foreign')->references('id')->on('penugasan_asesor')->onDelete('cascade');
        });
        
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->foreign('gelombang_id', 'pendaftaran_gelombang_id_foreign')->references('id')->on('gelombang')->onDelete('restrict');
            $table->foreign('prodi_id', 'pendaftaran_prodi_id_foreign')->references('id')->on('prodi')->onDelete('restrict');
        });
        
        Schema::table('pengalaman_kerja', function (Blueprint $table) {
            $table->foreign('pendaftaran_id', 'pengalaman_kerja_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('penilaian_cpmk', function (Blueprint $table) {
            $table->foreign('cpmk_id', 'penilaian_cpmk_cpmk_id_foreign')->references('id')->on('cpmk')->onDelete('cascade');
            $table->foreign('penugasan_asesor_id', 'penilaian_cpmk_penugasan_asesor_id_foreign')->references('id')->on('penugasan_asesor')->onDelete('cascade');
        });
        
        Schema::table('penugasan_asesor', function (Blueprint $table) {
            $table->foreign('asesor_id', 'penugasan_asesor_asesor_id_foreign')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('pendaftaran_id', 'penugasan_asesor_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('pleno_approvals', function (Blueprint $table) {
            $table->foreign('kaprodi_approved_by', 'pleno_approvals_kaprodi_approved_by_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('kaprodi_rejected_by', 'pleno_approvals_kaprodi_rejected_by_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('pendaftaran_id', 'pleno_approvals_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
            $table->foreign('pimpinan_approved_by', 'pleno_approvals_pimpinan_approved_by_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('pimpinan_rejected_by', 'pleno_approvals_pimpinan_rejected_by_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('submitted_by', 'pleno_approvals_submitted_by_foreign')->references('id')->on('users')->onDelete('set null');
        });
        
        Schema::table('pleno_mk', function (Blueprint $table) {
            $table->foreign('disahkan_oleh', 'pleno_mk_disahkan_oleh_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('mata_kuliah_id', 'pleno_mk_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('restrict');
            $table->foreign('pendaftaran_id', 'pleno_mk_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('pra_asesmen', function (Blueprint $table) {
            $table->foreign('penugasan_asesor_id', 'pra_asesmen_penugasan_asesor_id_foreign')->references('id')->on('penugasan_asesor')->onDelete('cascade');
        });
        
        Schema::table('prodi', function (Blueprint $table) {
            $table->foreign('jurusan_id', 'prodi_jurusan_id_foreign')->references('id')->on('jurusan')->onDelete('set null');
        });
        
        Schema::table('riwayat_pendidikan', function (Blueprint $table) {
            $table->foreign('pendaftaran_id', 'riwayat_pendidikan_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('sanggah', function (Blueprint $table) {
            $table->foreign('asesor_id', 'sanggah_asesor_id_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('mata_kuliah_id', 'sanggah_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('restrict');
            $table->foreign('pendaftaran_id', 'sanggah_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->foreign('diterbitkan_oleh')->references('id')->on('users')->onDelete('set null');
            $table->foreign('pendaftaran_id')->references('id')->on('pendaftaran')->onDelete('restrict');
        });
        
        Schema::table('transkrip_asal', function (Blueprint $table) {
            $table->foreign('mk_poliban_id', 'transkrip_asal_mk_poliban_id_foreign')->references('id')->on('mata_kuliah')->onDelete('set null');
            $table->foreign('pendaftaran_id', 'transkrip_asal_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
        });
        
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->foreign('dibuat_oleh', 'uji_lanjutan_dibuat_oleh_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('dijadwalkan_oleh', 'uji_lanjutan_dijadwalkan_oleh_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('pendaftaran_id', 'uji_lanjutan_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
            $table->foreign('updated_by', 'uji_lanjutan_updated_by_foreign')->references('id')->on('users')->onDelete('set null');
        });
        
        Schema::table('uji_lanjutan_catatan_asesor', function (Blueprint $table) {
            $table->foreign('asesor_id', 'uji_lanjutan_catatan_asesor_asesor_id_foreign')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('uji_lanjutan_id', 'uji_lanjutan_catatan_asesor_uji_lanjutan_id_foreign')->references('id')->on('uji_lanjutan')->onDelete('cascade');
        });
        
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->foreign('mata_kuliah_id', 'uji_lanjutan_item_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('set null');
            $table->foreign('uji_lanjutan_id', 'uji_lanjutan_item_uji_lanjutan_id_foreign')->references('id')->on('uji_lanjutan')->onDelete('cascade');
        });
        
        Schema::table('uji_lanjutan_penilaian', function (Blueprint $table) {
            $table->foreign('asesor_id', 'uji_lanjutan_penilaian_asesor_id_foreign')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('uji_lanjutan_item_id', 'uji_lanjutan_penilaian_uji_lanjutan_item_id_foreign')->references('id')->on('uji_lanjutan_item')->onDelete('cascade');
        });
        
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('prodi_id', 'users_prodi_id_foreign')->references('id')->on('prodi')->onDelete('set null');
        });
        
        Schema::table('verifikasi_berkas', function (Blueprint $table) {
            $table->foreign('pendaftaran_id', 'verifikasi_berkas_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade');
            $table->foreign('verified_by', 'verifikasi_berkas_verified_by_foreign')->references('id')->on('users')->onDelete('set null');
        });
        
        echo "✓ All 56 foreign keys recreated\n";
        echo "\n✓ Migration complete!\n";
    }
    
    /**
     * Reverse the migrations.
     * Rollback INT UNSIGNED back to BIGINT UNSIGNED.
     */
    public function down(): void
    {
        echo "Rolling back BIGINT to INT UNSIGNED conversion...\n";
        
        echo "Phase 1: Dropping foreign key constraints...\n";
        
        Schema::table('arsip_dokumen', function (Blueprint $table) { $table->dropForeign('arsip_dokumens_pendaftaran_id_foreign'); $table->dropForeign('arsip_dokumens_uploaded_by_foreign'); });
        Schema::table('audit_log', function (Blueprint $table) { $table->dropForeign('audit_log_impersonated_by_foreign'); });
        Schema::table('banding_eksternal', function (Blueprint $table) { $table->dropForeign('banding_eksternal_diproses_oleh_foreign'); $table->dropForeign('banding_eksternal_pendaftaran_id_foreign'); });
        Schema::table('borang_data_diri', function (Blueprint $table) { $table->dropForeign('borang_data_diri_pendaftaran_id_foreign'); });
        Schema::table('cpmk', function (Blueprint $table) { $table->dropForeign('cpmk_mata_kuliah_id_foreign'); });
        Schema::table('dokumen', function (Blueprint $table) { $table->dropForeign('dokumen_pendaftaran_id_foreign'); });
        Schema::table('evaluasi_diri', function (Blueprint $table) { $table->dropForeign('evaluasi_diri_cpmk_id_foreign'); $table->dropForeign('evaluasi_diri_pendaftaran_id_foreign'); });
        Schema::table('evaluasi_portofolio', function (Blueprint $table) { $table->dropForeign('evaluasi_portofolio_penugasan_asesor_id_foreign'); });
        Schema::table('jadwal_asesmen', function (Blueprint $table) { $table->dropForeign('jadwal_asesmen_created_by_foreign'); $table->dropForeign('jadwal_asesmen_pendaftaran_id_foreign'); });
        Schema::table('mata_kuliah', function (Blueprint $table) { $table->dropForeign('mata_kuliah_prodi_id_foreign'); });
        Schema::table('matriks_asesmen', function (Blueprint $table) { $table->dropForeign('matriks_asesmen_mata_kuliah_id_foreign'); });
        Schema::table('pemetaan_mk', function (Blueprint $table) { $table->dropForeign('pemetaan_mk_mk_poliban_id_foreign'); $table->dropForeign('pemetaan_mk_penugasan_asesor_id_foreign'); });
        Schema::table('pendaftaran', function (Blueprint $table) { $table->dropForeign('pendaftaran_gelombang_id_foreign'); $table->dropForeign('pendaftaran_prodi_id_foreign'); });
        Schema::table('pengalaman_kerja', function (Blueprint $table) { $table->dropForeign('pengalaman_kerja_pendaftaran_id_foreign'); });
        Schema::table('penilaian_cpmk', function (Blueprint $table) { $table->dropForeign('penilaian_cpmk_cpmk_id_foreign'); $table->dropForeign('penilaian_cpmk_penugasan_asesor_id_foreign'); });
        Schema::table('penugasan_asesor', function (Blueprint $table) { $table->dropForeign('penugasan_asesor_asesor_id_foreign'); $table->dropForeign('penugasan_asesor_pendaftaran_id_foreign'); });
        Schema::table('pleno_approvals', function (Blueprint $table) { $table->dropForeign('pleno_approvals_kaprodi_approved_by_foreign'); $table->dropForeign('pleno_approvals_kaprodi_rejected_by_foreign'); $table->dropForeign('pleno_approvals_pendaftaran_id_foreign'); $table->dropForeign('pleno_approvals_pimpinan_approved_by_foreign'); $table->dropForeign('pleno_approvals_pimpinan_rejected_by_foreign'); $table->dropForeign('pleno_approvals_submitted_by_foreign'); });
        Schema::table('pleno_mk', function (Blueprint $table) { $table->dropForeign('pleno_mk_disahkan_oleh_foreign'); $table->dropForeign('pleno_mk_mata_kuliah_id_foreign'); $table->dropForeign('pleno_mk_pendaftaran_id_foreign'); });
        Schema::table('pra_asesmen', function (Blueprint $table) { $table->dropForeign('pra_asesmen_penugasan_asesor_id_foreign'); });
        Schema::table('prodi', function (Blueprint $table) { $table->dropForeign('prodi_jurusan_id_foreign'); });
        Schema::table('riwayat_pendidikan', function (Blueprint $table) { $table->dropForeign('riwayat_pendidikan_pendaftaran_id_foreign'); });
        Schema::table('sanggah', function (Blueprint $table) { $table->dropForeign('sanggah_asesor_id_foreign'); $table->dropForeign('sanggah_mata_kuliah_id_foreign'); $table->dropForeign('sanggah_pendaftaran_id_foreign'); });
        Schema::table('sk_keputusan', function (Blueprint $table) { $table->dropForeign(['diterbitkan_oleh']); $table->dropForeign(['pendaftaran_id']); });
        Schema::table('transkrip_asal', function (Blueprint $table) { $table->dropForeign('transkrip_asal_mk_poliban_id_foreign'); $table->dropForeign('transkrip_asal_pendaftaran_id_foreign'); });
        Schema::table('uji_lanjutan', function (Blueprint $table) { $table->dropForeign('uji_lanjutan_dibuat_oleh_foreign'); $table->dropForeign('uji_lanjutan_dijadwalkan_oleh_foreign'); $table->dropForeign('uji_lanjutan_pendaftaran_id_foreign'); $table->dropForeign('uji_lanjutan_updated_by_foreign'); });
        Schema::table('uji_lanjutan_catatan_asesor', function (Blueprint $table) { $table->dropForeign('uji_lanjutan_catatan_asesor_asesor_id_foreign'); $table->dropForeign('uji_lanjutan_catatan_asesor_uji_lanjutan_id_foreign'); });
        Schema::table('uji_lanjutan_item', function (Blueprint $table) { $table->dropForeign('uji_lanjutan_item_mata_kuliah_id_foreign'); $table->dropForeign('uji_lanjutan_item_uji_lanjutan_id_foreign'); });
        Schema::table('uji_lanjutan_penilaian', function (Blueprint $table) { $table->dropForeign('uji_lanjutan_penilaian_asesor_id_foreign'); $table->dropForeign('uji_lanjutan_penilaian_uji_lanjutan_item_id_foreign'); });
        Schema::table('users', function (Blueprint $table) { $table->dropForeign('users_prodi_id_foreign'); });
        Schema::table('verifikasi_berkas', function (Blueprint $table) { $table->dropForeign('verifikasi_berkas_pendaftaran_id_foreign'); $table->dropForeign('verifikasi_berkas_verified_by_foreign'); });
        
        echo "✓ All 56 foreign keys dropped\n";
        
        echo "\nPhase 2: Converting INT UNSIGNED back to BIGINT UNSIGNED (98 columns)...\n";
        
        Schema::table('arsip_dokumen', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
            $table->unsignedBigInteger('uploaded_by')->nullable()->change();
        });
        
        Schema::table('audit_log', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('impersonated_by')->nullable()->change();
        });
        
        Schema::table('banding_eksternal', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('diproses_oleh')->nullable()->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('borang_data_diri', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('cpmk', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('mata_kuliah_id')->change();
        });
        
        Schema::table('dokumen', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('evaluasi_diri', function (Blueprint $table) {
            $table->unsignedBigInteger('cpmk_id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('evaluasi_portofolio', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('penugasan_asesor_id')->change();
        });
        
        Schema::table('gelombang', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
        });
        
        Schema::table('jadwal_asesmen', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('created_by')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('jurusan', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
        });
        
        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('prodi_id')->change();
        });
        
        Schema::table('matriks_asesmen', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('mata_kuliah_id')->nullable()->change();
        });
        
        Schema::table('pemetaan_mk', function (Blueprint $table) {
            $table->unsignedBigInteger('mk_poliban_id')->change();
            $table->unsignedBigInteger('penugasan_asesor_id')->change();
        });
        
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('gelombang_id')->change();
            $table->unsignedBigInteger('prodi_id')->change();
        });
        
        Schema::table('pengalaman_kerja', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('penilaian_cpmk', function (Blueprint $table) {
            $table->unsignedBigInteger('cpmk_id')->change();
            $table->unsignedBigInteger('penugasan_asesor_id')->change();
        });
        
        Schema::table('penugasan_asesor', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('asesor_id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('pleno_approvals', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('kaprodi_approved_by')->nullable()->change();
            $table->unsignedBigInteger('kaprodi_rejected_by')->nullable()->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
            $table->unsignedBigInteger('pimpinan_approved_by')->nullable()->change();
            $table->unsignedBigInteger('pimpinan_rejected_by')->nullable()->change();
            $table->unsignedBigInteger('submitted_by')->nullable()->change();
        });
        
        Schema::table('pleno_mk', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('disahkan_oleh')->nullable()->change();
            $table->unsignedBigInteger('mata_kuliah_id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('pra_asesmen', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('penugasan_asesor_id')->change();
        });
        
        Schema::table('prodi', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('jurusan_id')->nullable()->change();
        });
        
        Schema::table('riwayat_pendidikan', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('sanggah', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('asesor_id')->nullable()->change();
            $table->unsignedBigInteger('mata_kuliah_id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('diterbitkan_oleh')->nullable()->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('transkrip_asal', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('mk_poliban_id')->nullable()->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
        });
        
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('dibuat_oleh')->nullable()->change();
            $table->unsignedBigInteger('dijadwalkan_oleh')->nullable()->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
            $table->unsignedBigInteger('updated_by')->nullable()->change();
        });
        
        Schema::table('uji_lanjutan_catatan_asesor', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('asesor_id')->change();
            $table->unsignedBigInteger('uji_lanjutan_id')->change();
        });
        
        Schema::table('uji_lanjutan_item', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('mata_kuliah_id')->nullable()->change();
            $table->unsignedBigInteger('uji_lanjutan_id')->change();
        });
        
        Schema::table('uji_lanjutan_penilaian', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('asesor_id')->change();
            $table->unsignedBigInteger('uji_lanjutan_item_id')->change();
        });
        
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('prodi_id')->nullable()->change();
        });
        
        Schema::table('verifikasi_berkas', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->change();
            $table->unsignedBigInteger('pendaftaran_id')->change();
            $table->unsignedBigInteger('verified_by')->nullable()->change();
        });
        
        echo "✓ All 98 columns converted back to BIGINT UNSIGNED\n";
        
        echo "\nPhase 3: Recreating foreign key constraints...\n";
        
        Schema::table('arsip_dokumen', function (Blueprint $table) { $table->foreign('pendaftaran_id', 'arsip_dokumens_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); $table->foreign('uploaded_by', 'arsip_dokumens_uploaded_by_foreign')->references('id')->on('users')->onDelete('set null'); });
        Schema::table('audit_log', function (Blueprint $table) { $table->foreign('impersonated_by', 'audit_log_impersonated_by_foreign')->references('id')->on('users')->onDelete('set null'); });
        Schema::table('banding_eksternal', function (Blueprint $table) { $table->foreign('diproses_oleh', 'banding_eksternal_diproses_oleh_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('pendaftaran_id', 'banding_eksternal_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('borang_data_diri', function (Blueprint $table) { $table->foreign('pendaftaran_id', 'borang_data_diri_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('cpmk', function (Blueprint $table) { $table->foreign('mata_kuliah_id', 'cpmk_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('cascade'); });
        Schema::table('dokumen', function (Blueprint $table) { $table->foreign('pendaftaran_id', 'dokumen_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('evaluasi_diri', function (Blueprint $table) { $table->foreign('cpmk_id', 'evaluasi_diri_cpmk_id_foreign')->references('id')->on('cpmk')->onDelete('cascade'); $table->foreign('pendaftaran_id', 'evaluasi_diri_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('evaluasi_portofolio', function (Blueprint $table) { $table->foreign('penugasan_asesor_id', 'evaluasi_portofolio_penugasan_asesor_id_foreign')->references('id')->on('penugasan_asesor')->onDelete('cascade'); });
        Schema::table('jadwal_asesmen', function (Blueprint $table) { $table->foreign('created_by', 'jadwal_asesmen_created_by_foreign')->references('id')->on('users')->onDelete('restrict'); $table->foreign('pendaftaran_id', 'jadwal_asesmen_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('mata_kuliah', function (Blueprint $table) { $table->foreign('prodi_id', 'mata_kuliah_prodi_id_foreign')->references('id')->on('prodi')->onDelete('cascade'); });
        Schema::table('matriks_asesmen', function (Blueprint $table) { $table->foreign('mata_kuliah_id', 'matriks_asesmen_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('cascade'); });
        Schema::table('pemetaan_mk', function (Blueprint $table) { $table->foreign('mk_poliban_id', 'pemetaan_mk_mk_poliban_id_foreign')->references('id')->on('mata_kuliah')->onDelete('cascade'); $table->foreign('penugasan_asesor_id', 'pemetaan_mk_penugasan_asesor_id_foreign')->references('id')->on('penugasan_asesor')->onDelete('cascade'); });
        Schema::table('pendaftaran', function (Blueprint $table) { $table->foreign('gelombang_id', 'pendaftaran_gelombang_id_foreign')->references('id')->on('gelombang')->onDelete('restrict'); $table->foreign('prodi_id', 'pendaftaran_prodi_id_foreign')->references('id')->on('prodi')->onDelete('restrict'); });
        Schema::table('pengalaman_kerja', function (Blueprint $table) { $table->foreign('pendaftaran_id', 'pengalaman_kerja_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('penilaian_cpmk', function (Blueprint $table) { $table->foreign('cpmk_id', 'penilaian_cpmk_cpmk_id_foreign')->references('id')->on('cpmk')->onDelete('cascade'); $table->foreign('penugasan_asesor_id', 'penilaian_cpmk_penugasan_asesor_id_foreign')->references('id')->on('penugasan_asesor')->onDelete('cascade'); });
        Schema::table('penugasan_asesor', function (Blueprint $table) { $table->foreign('asesor_id', 'penugasan_asesor_asesor_id_foreign')->references('id')->on('users')->onDelete('restrict'); $table->foreign('pendaftaran_id', 'penugasan_asesor_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('pleno_approvals', function (Blueprint $table) { $table->foreign('kaprodi_approved_by', 'pleno_approvals_kaprodi_approved_by_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('kaprodi_rejected_by', 'pleno_approvals_kaprodi_rejected_by_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('pendaftaran_id', 'pleno_approvals_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); $table->foreign('pimpinan_approved_by', 'pleno_approvals_pimpinan_approved_by_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('pimpinan_rejected_by', 'pleno_approvals_pimpinan_rejected_by_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('submitted_by', 'pleno_approvals_submitted_by_foreign')->references('id')->on('users')->onDelete('set null'); });
        Schema::table('pleno_mk', function (Blueprint $table) { $table->foreign('disahkan_oleh', 'pleno_mk_disahkan_oleh_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('mata_kuliah_id', 'pleno_mk_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('restrict'); $table->foreign('pendaftaran_id', 'pleno_mk_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('pra_asesmen', function (Blueprint $table) { $table->foreign('penugasan_asesor_id', 'pra_asesmen_penugasan_asesor_id_foreign')->references('id')->on('penugasan_asesor')->onDelete('cascade'); });
        Schema::table('prodi', function (Blueprint $table) { $table->foreign('jurusan_id', 'prodi_jurusan_id_foreign')->references('id')->on('jurusan')->onDelete('set null'); });
        Schema::table('riwayat_pendidikan', function (Blueprint $table) { $table->foreign('pendaftaran_id', 'riwayat_pendidikan_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('sanggah', function (Blueprint $table) { $table->foreign('asesor_id', 'sanggah_asesor_id_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('mata_kuliah_id', 'sanggah_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('restrict'); $table->foreign('pendaftaran_id', 'sanggah_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('sk_keputusan', function (Blueprint $table) { $table->foreign('diterbitkan_oleh')->references('id')->on('users')->onDelete('set null'); $table->foreign('pendaftaran_id')->references('id')->on('pendaftaran')->onDelete('restrict'); });
        Schema::table('transkrip_asal', function (Blueprint $table) { $table->foreign('mk_poliban_id', 'transkrip_asal_mk_poliban_id_foreign')->references('id')->on('mata_kuliah')->onDelete('set null'); $table->foreign('pendaftaran_id', 'transkrip_asal_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); });
        Schema::table('uji_lanjutan', function (Blueprint $table) { $table->foreign('dibuat_oleh', 'uji_lanjutan_dibuat_oleh_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('dijadwalkan_oleh', 'uji_lanjutan_dijadwalkan_oleh_foreign')->references('id')->on('users')->onDelete('set null'); $table->foreign('pendaftaran_id', 'uji_lanjutan_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); $table->foreign('updated_by', 'uji_lanjutan_updated_by_foreign')->references('id')->on('users')->onDelete('set null'); });
        Schema::table('uji_lanjutan_catatan_asesor', function (Blueprint $table) { $table->foreign('asesor_id', 'uji_lanjutan_catatan_asesor_asesor_id_foreign')->references('id')->on('users')->onDelete('cascade'); $table->foreign('uji_lanjutan_id', 'uji_lanjutan_catatan_asesor_uji_lanjutan_id_foreign')->references('id')->on('uji_lanjutan')->onDelete('cascade'); });
        Schema::table('uji_lanjutan_item', function (Blueprint $table) { $table->foreign('mata_kuliah_id', 'uji_lanjutan_item_mata_kuliah_id_foreign')->references('id')->on('mata_kuliah')->onDelete('set null'); $table->foreign('uji_lanjutan_id', 'uji_lanjutan_item_uji_lanjutan_id_foreign')->references('id')->on('uji_lanjutan')->onDelete('cascade'); });
        Schema::table('uji_lanjutan_penilaian', function (Blueprint $table) { $table->foreign('asesor_id', 'uji_lanjutan_penilaian_asesor_id_foreign')->references('id')->on('users')->onDelete('cascade'); $table->foreign('uji_lanjutan_item_id', 'uji_lanjutan_penilaian_uji_lanjutan_item_id_foreign')->references('id')->on('uji_lanjutan_item')->onDelete('cascade'); });
        Schema::table('users', function (Blueprint $table) { $table->foreign('prodi_id', 'users_prodi_id_foreign')->references('id')->on('prodi')->onDelete('set null'); });
        Schema::table('verifikasi_berkas', function (Blueprint $table) { $table->foreign('pendaftaran_id', 'verifikasi_berkas_pendaftaran_id_foreign')->references('id')->on('pendaftaran')->onDelete('cascade'); $table->foreign('verified_by', 'verifikasi_berkas_verified_by_foreign')->references('id')->on('users')->onDelete('set null'); });
        
        echo "✓ All 56 foreign keys recreated\n";
        echo "\n✓ Rollback complete!\n";
    }
};
