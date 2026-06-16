<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PRD Bab 3.4 Jalur 2: Banding ke Pimpinan PT.
     * Tabel ini disebut eksplisit di PRD ("tabel banding_eksternal") namun
     * tidak pernah dibuat — ini adalah oversight yang perlu diperbaiki.
     */
    public function up(): void
    {
        Schema::create('banding_eksternal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete(); // pemohon pengaju
            $table->text('alasan');
            $table->string('bukti_path')->nullable();
            $table->enum('status', ['diajukan', 'diproses', 'diterima', 'ditolak'])->default('diajukan');
            $table->text('respon_pimpinan')->nullable();
            $table->foreignId('diproses_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('diputus_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banding_eksternal');
    }
};
