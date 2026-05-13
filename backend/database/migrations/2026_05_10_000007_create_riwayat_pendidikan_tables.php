<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riwayat_pendidikan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->string('jenjang', 50);
            $table->string('institusi');
            $table->string('program_studi')->nullable();
            $table->year('tahun_masuk');
            $table->year('tahun_lulus');
            $table->timestamps();
        });

        Schema::create('transkrip_asal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->tinyInteger('semester')->unsigned();
            $table->string('nama_mk');
            $table->tinyInteger('sks')->unsigned();
            $table->char('nilai_huruf', 2);
            $table->decimal('nilai_angka', 3, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transkrip_asal');
        Schema::dropIfExists('riwayat_pendidikan');
    }
};
