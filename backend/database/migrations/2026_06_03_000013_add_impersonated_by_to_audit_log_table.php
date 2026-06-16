<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_log', function (Blueprint $table) {
            // PRD Bab 4.6: audit_logs harus catat impersonated_by saat Super Admin
            // menggunakan fitur "Login Sebagai" user lain
            $table->foreignId('impersonated_by')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('audit_log', function (Blueprint $table) {
            $table->dropForeign(['impersonated_by']);
            $table->dropColumn('impersonated_by');
        });
    }
};
