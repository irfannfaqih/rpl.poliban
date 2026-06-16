<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambahkan semua index yang hilang berdasarkan audit schema.
 * Index dipilih berdasarkan query yang paling sering dijalankan
 * di setiap controller.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── notifications ──────────────────────────────────────────────────
        // Query paling sering: unread count per user + list ordered by date
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'is_read'],    'idx_notif_user_read');
            $table->index(['user_id', 'created_at'], 'idx_notif_user_created');
        });

        // ── pendaftaran ─────────────────────────────────────────────────────
        // Admin prodi: WHERE prodi_id = ? AND status_alur = ?
        // Pemohon:     WHERE user_id  = ? AND status_alur = ?
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->index(['prodi_id', 'status_alur'], 'idx_pend_prodi_status');
            $table->index(['user_id',  'status_alur'], 'idx_pend_user_status');
        });

        // ── penugasan_asesor ─────────────────────────────────────────────────
        // Asesor dashboard: WHERE asesor_id = ?
        Schema::table('penugasan_asesor', function (Blueprint $table) {
            $table->index('asesor_id', 'idx_penugasan_asesor_id');
        });

        // ── pemetaan_mk ──────────────────────────────────────────────────────
        // compilePlenoMk: WHERE penugasan_asesor_id = ? AND mk_poliban_id = ?
        // + unique constraint: satu asesor tidak bisa petakan MK yang sama dua kali
        Schema::table('pemetaan_mk', function (Blueprint $table) {
            $table->index(
                ['penugasan_asesor_id', 'mk_poliban_id'],
                'idx_pemetaan_compound',
            );
            $table->unique(
                ['penugasan_asesor_id', 'mk_poliban_id'],
                'uq_pemetaan_mk_per_asesor',
            );
        });

        // ── pleno_mk ─────────────────────────────────────────────────────────
        // Sering di-query: WHERE pendaftaran_id = ? AND mata_kuliah_id = ?
        Schema::table('pleno_mk', function (Blueprint $table) {
            $table->index(
                ['pendaftaran_id', 'mata_kuliah_id'],
                'idx_pleno_compound',
            );
        });

        // ── evaluasi_diri ─────────────────────────────────────────────────────
        // WHERE pendaftaran_id = ? (sering dipanggil saat load borang)
        Schema::table('evaluasi_diri', function (Blueprint $table) {
            $table->index('pendaftaran_id', 'idx_evaluasi_diri_pendaftaran');
        });

        // ── transkrip_asal ────────────────────────────────────────────────────
        // WHERE pendaftaran_id = ? (sering di-load saat compilePlenoMk)
        Schema::table('transkrip_asal', function (Blueprint $table) {
            $table->index('pendaftaran_id', 'idx_transkrip_pendaftaran');
        });

        // ── dokumen ───────────────────────────────────────────────────────────
        // WHERE pendaftaran_id = ? AND tipe = ? (cek dokumen per tipe)
        Schema::table('dokumen', function (Blueprint $table) {
            $table->index(['pendaftaran_id', 'tipe'], 'idx_dokumen_pendaftaran_tipe');
        });

        // ── cpmk ──────────────────────────────────────────────────────────────
        // Unique kode per MK — cegah duplikat kode CPMK dalam satu MK
        Schema::table('cpmk', function (Blueprint $table) {
            $table->unique(['mata_kuliah_id', 'kode'], 'uq_cpmk_per_mk');
        });
        $this->dropIndexIfExists('cpmk', 'idx_cpmk_mata_phase14_rollback');
        $this->dropIndexIfExists('dokumen', 'idx_dokumen_pendaftaran_phase14_rollback');
        $this->dropIndexIfExists('transkrip_asal', 'idx_transkrip_pendaftaran_phase14_rollback');
        $this->dropIndexIfExists('evaluasi_diri', 'idx_evaluasi_pendaftaran_phase14_rollback');
        $this->dropIndexIfExists('pleno_mk', 'idx_pleno_pendaftaran_phase14_rollback');
        $this->dropIndexIfExists('pemetaan_mk', 'idx_pemetaan_penugasan_phase14_rollback');
        $this->dropIndexIfExists('penugasan_asesor', 'idx_penugasan_asesor_phase14_rollback');
        $this->dropIndexIfExists('pendaftaran', 'idx_pend_user_phase14_rollback');
        $this->dropIndexIfExists('pendaftaran', 'idx_pend_prodi_phase14_rollback');
        $this->dropIndexIfExists('notifications', 'idx_notif_user_phase14_rollback');
    }

    public function down(): void
    {
        $this->addIndexIfMissing('cpmk', 'mata_kuliah_id', 'idx_cpmk_mata_phase14_rollback');
        Schema::table('cpmk', fn($t) => $t->dropUnique('uq_cpmk_per_mk'));
        $this->addIndexIfMissing('dokumen', 'pendaftaran_id', 'idx_dokumen_pendaftaran_phase14_rollback');
        Schema::table('dokumen', fn($t) => $t->dropIndex('idx_dokumen_pendaftaran_tipe'));
        $this->addIndexIfMissing('transkrip_asal', 'pendaftaran_id', 'idx_transkrip_pendaftaran_phase14_rollback');
        Schema::table('transkrip_asal', fn($t) => $t->dropIndex('idx_transkrip_pendaftaran'));
        $this->addIndexIfMissing('evaluasi_diri', 'pendaftaran_id', 'idx_evaluasi_pendaftaran_phase14_rollback');
        Schema::table('evaluasi_diri', fn($t) => $t->dropIndex('idx_evaluasi_diri_pendaftaran'));
        $this->addIndexIfMissing('pleno_mk', 'pendaftaran_id', 'idx_pleno_pendaftaran_phase14_rollback');
        Schema::table('pleno_mk', fn($t) => $t->dropIndex('idx_pleno_compound'));
        Schema::table('pemetaan_mk', function (Blueprint $table) {
            $table->dropUnique('uq_pemetaan_mk_per_asesor');
        });
        $this->addIndexIfMissing(
            'pemetaan_mk',
            'penugasan_asesor_id',
            'idx_pemetaan_penugasan_phase14_rollback',
        );
        Schema::table('pemetaan_mk', function (Blueprint $table) {
            $table->dropIndex('idx_pemetaan_compound');
        });
        $this->addIndexIfMissing('penugasan_asesor', 'asesor_id', 'idx_penugasan_asesor_phase14_rollback');
        Schema::table('penugasan_asesor', fn($t) => $t->dropIndex('idx_penugasan_asesor_id'));
        $this->addIndexIfMissing('pendaftaran', 'user_id', 'idx_pend_user_phase14_rollback');
        $this->addIndexIfMissing('pendaftaran', 'prodi_id', 'idx_pend_prodi_phase14_rollback');
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->dropIndex('idx_pend_user_status');
            $table->dropIndex('idx_pend_prodi_status');
        });
        $this->addIndexIfMissing('notifications', 'user_id', 'idx_notif_user_phase14_rollback');
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notif_user_created');
            $table->dropIndex('idx_notif_user_read');
        });
    }

    private function addIndexIfMissing(
        string $tableName,
        string $column,
        string $index,
    ): void {
        if (! Schema::hasIndex($tableName, $index)) {
            Schema::table(
                $tableName,
                fn (Blueprint $table) => $table->index($column, $index),
            );
        }
    }

    private function dropIndexIfExists(string $tableName, string $index): void
    {
        if (Schema::hasIndex($tableName, $index)) {
            Schema::table(
                $tableName,
                fn (Blueprint $table) => $table->dropIndex($index),
            );
        }
    }
};
