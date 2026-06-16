<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transkrip_asal', function (Blueprint $table) {
            // PRD Section B.1: "Kode MK" wajib diisi per baris transkrip
            $table->string('kode_mk', 20)->nullable()->after('pendaftaran_id');
        });
    }

    public function down(): void
    {
        Schema::table('transkrip_asal', function (Blueprint $table) {
            $table->dropColumn('kode_mk');
        });
    }
};
