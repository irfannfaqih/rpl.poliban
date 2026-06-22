<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE users MODIFY role ENUM('pemohon','admin_prodi','kaprodi','asesor','pimpinan','super_admin') NOT NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::table('users')->where('role', 'kaprodi')->update(['role' => 'admin_prodi']);
        DB::statement("ALTER TABLE users MODIFY role ENUM('pemohon','admin_prodi','asesor','pimpinan','super_admin') NOT NULL");
    }
};
