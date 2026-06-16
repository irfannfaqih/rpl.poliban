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
        Schema::create('matriks_asesmen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliah')->onDelete('cascade');
            $table->boolean('c1')->default(false)->comment('Sertifikat');
            $table->boolean('c2')->default(false)->comment('Observasi');
            $table->boolean('c3')->default(false)->comment('Lisan');
            $table->boolean('c4')->default(false)->comment('Praktik');
            $table->boolean('c5')->default(false)->comment('Penilaian Pekerjaan');
            $table->boolean('c6')->default(false)->comment('Review Pekerjaan');
            $table->boolean('c7')->default(false)->comment('Tulis');
            $table->boolean('c8')->default(false)->comment('Pertanyaan Tertulis');
            $table->boolean('c9')->default(false)->comment('Laporan Supervisor');
            $table->boolean('c10')->default(false)->comment('Log Book');
            $table->boolean('c11')->default(false)->comment('Portofolio');
            $table->timestamps();
            
            // 1 Mata Kuliah hanya punya 1 matriks (1-to-1)
            $table->unique('mata_kuliah_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matriks_asesmen');
    }
};
