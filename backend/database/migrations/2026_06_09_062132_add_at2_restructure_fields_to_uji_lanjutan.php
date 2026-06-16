<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            // Penjadwalan oleh Admin Prodi
            $table->foreignId('dijadwalkan_oleh')->nullable()->constrained('users')->nullOnDelete()->after('instrumen_updated_at');
            $table->timestamp('dijadwalkan_at')->nullable()->after('dijadwalkan_oleh');

            // Mulai ujian oleh Asesor (menggantikan window berbasis waktu string)
            $table->timestamp('ujian_dimulai_at')->nullable()->after('dijadwalkan_at');

            // Reschedule
            $table->enum('reschedule_status', ['diajukan', 'disetujui', 'ditolak'])->nullable()->after('ujian_dimulai_at');
            $table->text('reschedule_alasan')->nullable()->after('reschedule_status');
            $table->text('reschedule_catatan')->nullable()->after('reschedule_alasan');
            $table->tinyInteger('reschedule_count')->unsigned()->default(0)->after('reschedule_catatan');
        });

        // Ubah enum fase_tulis untuk tambahkan nilai 'tidak_hadir'
        // MySQL tidak support ALTER COLUMN untuk enum via Blueprint secara langsung
        DB::statement("ALTER TABLE uji_lanjutan MODIFY COLUMN fase_tulis ENUM('buat_soal','menunggu_jawaban','koreksi','selesai','tidak_hadir') NOT NULL DEFAULT 'buat_soal'");
    }

    public function down(): void
    {
        // Kembalikan enum fase_tulis
        DB::statement("ALTER TABLE uji_lanjutan MODIFY COLUMN fase_tulis ENUM('buat_soal','menunggu_jawaban','koreksi','selesai') NOT NULL DEFAULT 'buat_soal'");

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->dropForeign(['dijadwalkan_oleh']);
            $table->dropColumn([
                'dijadwalkan_oleh',
                'dijadwalkan_at',
                'ujian_dimulai_at',
                'reschedule_status',
                'reschedule_alasan',
                'reschedule_catatan',
                'reschedule_count',
            ]);
        });
    }
};
