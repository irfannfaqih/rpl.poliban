<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sanggah', function (Blueprint $table) {
            // Merekam apakah pemohon menyetujui penjelasan prosedur banding sebelum submit
            $table->boolean('paham_prosedur')->default(false)->after('bukti_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sanggah', function (Blueprint $table) {
            $table->dropColumn('paham_prosedur');
        });
    }
};
