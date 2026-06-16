<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Perluas enum tipe dokumen sesuai PRD:
     * - Tambah 'ktp' (wajib di Section A)
     * - Tambah 'portofolio_p01' – 'portofolio_p10' (Section D, 10 jenis dokumen)
     *
     * CATATAN: Menggunakan raw SQL MODIFY COLUMN yang memerlukan MySQL/MariaDB.
     * SQLite (development lokal) tidak mendukung MODIFY COLUMN.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("
                ALTER TABLE dokumen
                MODIFY COLUMN tipe ENUM(
                    'ktp',
                    'ijazah',
                    'transkrip',
                    'sertifikat',
                    'portofolio_p01',
                    'portofolio_p02',
                    'portofolio_p03',
                    'portofolio_p04',
                    'portofolio_p05',
                    'portofolio_p06',
                    'portofolio_p07',
                    'portofolio_p08',
                    'portofolio_p09',
                    'portofolio_p10',
                    'portofolio',
                    'tambahan'
                ) NOT NULL
            ");
        }
        // SQLite: tidak perlu perubahan karena SQLite tidak enforce enum secara ketat.
        // Validasi tipe dilakukan di application layer (BorangController).
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("
                ALTER TABLE dokumen
                MODIFY COLUMN tipe ENUM(
                    'ijazah',
                    'transkrip',
                    'sertifikat',
                    'portofolio',
                    'tambahan'
                ) NOT NULL
            ");
        }
    }
};
