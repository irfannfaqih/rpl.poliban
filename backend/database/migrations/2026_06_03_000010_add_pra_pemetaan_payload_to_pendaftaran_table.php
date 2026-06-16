<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pendaftaran', function (Blueprint $table) {
            // PRD Bab 4.3 Halaman 2.3: Admin bisa buat pra-pemetaan MK (opsional)
            // sebagai saran untuk asesor. Disimpan sebagai JSON.
            $table->json('pra_pemetaan_payload')->nullable()->after('catatan_admin');
        });
    }

    public function down(): void
    {
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->dropColumn('pra_pemetaan_payload');
        });
    }
};
