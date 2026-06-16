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
        Schema::table('jadwal_asesmen', function (Blueprint $table) {
            $table->text('link_meeting')->nullable()->change();
        });

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->text('link_meeting')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jadwal_asesmen', function (Blueprint $table) {
            $table->string('link_meeting')->nullable()->change();
        });

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->string('link_meeting')->nullable()->change();
        });
    }
};
