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
        Schema::create('uji_lanjutan_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uji_lanjutan_id')->constrained('uji_lanjutan')->cascadeOnDelete();
            $table->enum('tipe', ['tulis', 'wawancara']);
            $table->string('mata_kuliah')->nullable();
            $table->text('pertanyaan_instruksi');
            $table->text('kunci_jawaban')->nullable();
            $table->text('jawaban_pemohon')->nullable();
            $table->integer('skor')->nullable(); // 1-5 untuk tulis, 1(K)/0(BK) untuk wawancara
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('uji_lanjutan_item');
    }
};
