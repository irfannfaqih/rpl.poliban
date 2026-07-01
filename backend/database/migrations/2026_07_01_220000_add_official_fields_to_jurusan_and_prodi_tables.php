<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jurusan', function (Blueprint $table) {
            $table->string('ketua_jurusan_nama')->nullable()->after('nama_jurusan');
            $table->string('ketua_jurusan_nip', 50)->nullable()->after('ketua_jurusan_nama');
        });

        Schema::table('prodi', function (Blueprint $table) {
            $table->string('koordinator_prodi_nama')->nullable()->after('jurusan_id');
            $table->string('koordinator_prodi_nip', 50)->nullable()->after('koordinator_prodi_nama');
        });
    }

    public function down(): void
    {
        Schema::table('prodi', function (Blueprint $table) {
            $table->dropColumn(['koordinator_prodi_nama', 'koordinator_prodi_nip']);
        });

        Schema::table('jurusan', function (Blueprint $table) {
            $table->dropColumn(['ketua_jurusan_nama', 'ketua_jurusan_nip']);
        });
    }
};
