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
        Schema::table('transkrip_asal', function (Blueprint $table) {
            $table->foreignId('mk_poliban_id')
                ->nullable()
                ->constrained('mata_kuliah')
                ->nullOnDelete()
                ->after('pendaftaran_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transkrip_asal', function (Blueprint $table) {
            $table->dropForeign(['mk_poliban_id']);
            $table->dropColumn('mk_poliban_id');
        });
    }
};
