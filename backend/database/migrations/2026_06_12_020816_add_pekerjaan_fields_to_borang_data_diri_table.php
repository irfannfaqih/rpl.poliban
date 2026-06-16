<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borang_data_diri', function (Blueprint $table) {
            $table->string('instansi')->nullable();
            $table->string('pekerjaan')->nullable();
            $table->text('alamat_instansi')->nullable();
            $table->string('telp_instansi', 50)->nullable();
            $table->string('golongan')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('borang_data_diri', function (Blueprint $table) {
            $table->dropColumn([
                'instansi', 'pekerjaan', 'alamat_instansi', 'telp_instansi', 'golongan'
            ]);
        });
    }
};
