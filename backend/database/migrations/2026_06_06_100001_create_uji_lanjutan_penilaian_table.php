<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel penilaian per asesor per instrumen AT2.
 * Memisahkan skor dari uji_lanjutan_item agar tiap asesor bisa
 * memberikan skor secara mandiri (blind review) pada instrumen yang sama.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uji_lanjutan_penilaian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uji_lanjutan_item_id')
                  ->constrained('uji_lanjutan_item')
                  ->cascadeOnDelete();
            $table->foreignId('asesor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->tinyInteger('skor')->unsigned()->nullable(); // 1-5
            $table->timestamps();

            $table->unique(['uji_lanjutan_item_id', 'asesor_id'], 'uq_penilaian_item_asesor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uji_lanjutan_penilaian');
    }
};
