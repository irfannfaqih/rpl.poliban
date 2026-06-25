<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE jadwal_asesmen MODIFY tempat VARCHAR(150) NOT NULL');
        DB::statement('ALTER TABLE uji_lanjutan MODIFY tempat VARCHAR(150) NULL');
        DB::statement('ALTER TABLE dokumen MODIFY deskripsi VARCHAR(150) NULL');
        DB::statement('ALTER TABLE notifications MODIFY href VARCHAR(150) NULL');
        DB::statement('ALTER TABLE pengalaman_kerja MODIFY nama VARCHAR(150) NOT NULL');
        DB::statement('ALTER TABLE pengalaman_kerja MODIFY jabatan_peran VARCHAR(100) NULL');
        DB::statement('ALTER TABLE sk_keputusan MODIFY penerbit_nama VARCHAR(150) NULL');
        DB::statement('ALTER TABLE sk_keputusan MODIFY penerbit_jabatan VARCHAR(100) NULL');
        DB::statement('ALTER TABLE mata_kuliah MODIFY profil_lulusan VARCHAR(150) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE mata_kuliah MODIFY profil_lulusan VARCHAR(255) NULL');
        DB::statement('ALTER TABLE sk_keputusan MODIFY penerbit_jabatan VARCHAR(255) NULL');
        DB::statement('ALTER TABLE sk_keputusan MODIFY penerbit_nama VARCHAR(255) NULL');
        DB::statement('ALTER TABLE pengalaman_kerja MODIFY jabatan_peran VARCHAR(255) NULL');
        DB::statement('ALTER TABLE pengalaman_kerja MODIFY nama VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE notifications MODIFY href VARCHAR(255) NULL');
        DB::statement('ALTER TABLE dokumen MODIFY deskripsi VARCHAR(255) NULL');
        DB::statement('ALTER TABLE uji_lanjutan MODIFY tempat VARCHAR(500) NULL');
        DB::statement('ALTER TABLE jadwal_asesmen MODIFY tempat VARCHAR(500) NOT NULL');
    }
};
