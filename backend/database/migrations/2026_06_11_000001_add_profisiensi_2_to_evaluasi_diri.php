<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Tambah nilai '2' (kurang mampu) ke enum profisiensi evaluasi_diri.
 *
 * Sesuai master formulir F03 Asesmen Mandiri:
 * 1 = tidak mampu, 2 = kurang mampu, 4 = mampu, 5 = sangat mampu.
 * Nilai 2 sebelumnya tidak ada di enum — ini perbaikan kekeliruan awal.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE evaluasi_diri MODIFY COLUMN profisiensi ENUM('1','2','4','5') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE evaluasi_diri MODIFY COLUMN profisiensi ENUM('1','4','5') NOT NULL");
    }
};
