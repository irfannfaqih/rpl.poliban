<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borang_data_diri', function (Blueprint $table) {
            // Kolom Section A yang disyaratkan PRD (Bab 4.1)
            $table->enum('agama', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'])
                  ->nullable()->after('jenis_kelamin');
            $table->string('kebangsaan', 50)->default('Indonesia')->after('agama');
            $table->char('kode_pos', 5)->nullable()->after('alamat');
            $table->string('no_telp_rumah', 20)->nullable()->after('no_hp');
        });
    }

    public function down(): void
    {
        Schema::table('borang_data_diri', function (Blueprint $table) {
            $table->dropColumn(['agama', 'kebangsaan', 'kode_pos', 'no_telp_rumah']);
        });
    }
};
