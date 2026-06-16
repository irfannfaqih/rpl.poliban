<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'notifikasi',
            'ujian_tulis_jawaban',
            'ujian_tulis_soal',
            'evaluasi_diri_dokumen',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && DB::table($table)->exists()) {
                throw new \RuntimeException(
                    "Migration dihentikan: tabel {$table} masih berisi data. ".
                    'Backup dan backfill data sebelum tabel dihapus.',
                );
            }
        }

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way migration
    }
};
