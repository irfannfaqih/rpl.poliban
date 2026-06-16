<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pra_asesmen', function (Blueprint $table) {
            // PRD Bab 3.2: diperlukan untuk audit trail kapan Form 02 di-submit
            // Saat ini hanya ada is_submitted (boolean) tanpa timestamp
            $table->timestamp('submitted_at')->nullable()->after('is_submitted');
        });
    }

    public function down(): void
    {
        Schema::table('pra_asesmen', function (Blueprint $table) {
            $table->dropColumn('submitted_at');
        });
    }
};
