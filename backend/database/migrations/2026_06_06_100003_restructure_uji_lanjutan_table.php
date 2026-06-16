<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Restrukturisasi uji_lanjutan dari per-asesor menjadi per-pendaftaran.
 *
 * Perubahan:
 * - DROP asesor_id (FK + unique constraint) — jadwal sekarang satu per pendaftaran
 * - DROP catatan_akhir, rekomendasi_akhir — dipindah ke uji_lanjutan_catatan_asesor
 * - ADD dibuat_oleh, updated_by — audit trail anti-konflik dua asesor
 * - ADD instrumen_updated_at — tampilkan "terakhir diubah oleh siapa" di UI
 * - ADD durasi_menit — batas waktu pengerjaan C3 (ujian tulis)
 * - ADD nilai_at2_final — nilai gabungan kedua asesor untuk pleno
 * - ADD UNIQUE(pendaftaran_id) — satu sesi AT2 per pendaftaran
 */
return new class extends Migration
{
    public function up(): void
    {
        if (
            \DB::table('uji_lanjutan')->exists() ||
            \DB::table('uji_lanjutan_item')->exists()
        ) {
            throw new \RuntimeException(
                'Migration AT2 dihentikan karena data lama masih ada. '.
                'Lakukan backup dan backfill ke struktur per-pendaftaran sebelum melanjutkan.',
            );
        }

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->index(
                'pendaftaran_id',
                'idx_uji_lanjutan_pendaftaran_migration',
            );
        });
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->dropForeign(['asesor_id']);
            $table->dropUnique(
                'uji_lanjutan_pendaftaran_id_asesor_id_unique',
            );
            $table->dropColumn([
                'asesor_id',
                'catatan_akhir',
                'rekomendasi_akhir',
            ]);
        });

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            // Audit trail — siapa yang set/edit
            $table->foreignId('dibuat_oleh')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()
                  ->after('pendaftaran_id');

            $table->foreignId('updated_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete()
                  ->after('dibuat_oleh');

            $table->timestamp('instrumen_updated_at')
                  ->nullable()
                  ->after('updated_by');

            // Batas waktu pengerjaan C3
            $table->unsignedSmallInteger('durasi_menit')
                  ->nullable()
                  ->after('link_meeting')
                  ->comment('Durasi pengerjaan C3 dalam menit, null = tidak dibatasi');

            // Nilai gabungan AT2 final (setelah semua asesor submit)
            $table->decimal('nilai_at2_final', 5, 2)
                  ->nullable()
                  ->after('durasi_menit');

            // Satu sesi AT2 per pendaftaran
            $table->unique('pendaftaran_id', 'uq_uji_lanjutan_per_pendaftaran');
            $table->dropIndex('idx_uji_lanjutan_pendaftaran_migration');
        });
    }

    public function down(): void
    {
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->index('pendaftaran_id', 'idx_uji_lanjutan_pendaftaran_rollback');
        });

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->dropUnique('uq_uji_lanjutan_per_pendaftaran');
            $table->dropForeign(['dibuat_oleh']);
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['dibuat_oleh', 'updated_by', 'instrumen_updated_at', 'durasi_menit', 'nilai_at2_final']);

            // Restore
            $table->foreignId('asesor_id')->constrained('users')->restrictOnDelete();
            $table->text('catatan_akhir')->nullable();
            $table->text('rekomendasi_akhir')->nullable();
            $table->unique(['pendaftaran_id', 'asesor_id']);
        });

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->dropIndex('idx_uji_lanjutan_pendaftaran_rollback');
        });
    }
};
