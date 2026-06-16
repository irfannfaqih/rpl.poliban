<?php

use Illuminate\Database\Migrations\Migration;
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Nilai 2 tetap dipertahankan agar migrasi tidak menghapus asesmen historis.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak ada perubahan skema yang perlu dibalik.
    }
};
