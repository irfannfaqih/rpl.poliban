<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sanggah', function (Blueprint $table) {
            // Menentukan asesor yang bertanggung jawab atas sanggahan ini
            $table->foreignId('asesor_id')
                  ->nullable()
                  ->after('mata_kuliah_id')
                  ->constrained('users')
                  ->nullOnDelete();

            // PRD Bab 3.4: "kolom diputus_at menjadi kunci penolakan request berikutnya"
            $table->timestamp('diputus_at')->nullable()->after('respon_asesor');
        });
    }

    public function down(): void
    {
        Schema::table('sanggah', function (Blueprint $table) {
            $table->dropForeign(['asesor_id']);
            $table->dropColumn(['asesor_id', 'diputus_at']);
        });
    }
};
