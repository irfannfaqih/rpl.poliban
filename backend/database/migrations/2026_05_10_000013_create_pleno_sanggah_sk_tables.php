<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pleno_mk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliah')->cascadeOnDelete();
            $table->char('nilai_a1', 2)->nullable();
            $table->decimal('bobot_a1', 3, 1)->nullable();
            $table->enum('keputusan_a1', ['diakui', 'tidak_diakui'])->nullable();
            $table->char('nilai_a2', 2)->nullable();
            $table->decimal('bobot_a2', 3, 1)->nullable();
            $table->enum('keputusan_a2', ['diakui', 'tidak_diakui'])->nullable();
            $table->decimal('rata_rata', 3, 1)->nullable();
            $table->enum('status', ['aman', 'selisih_minor', 'selisih_mayor', 'konflik'])->nullable();
            $table->char('keputusan_final', 2)->nullable();
            $table->text('catatan_pleno')->nullable();
            $table->foreignId('disahkan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('disahkan_at')->nullable();
            $table->timestamps();
        });

        // Form 17: Sanggah (keberatan pemohon)
        Schema::create('sanggah', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->constrained('pendaftaran')->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')->constrained('mata_kuliah')->cascadeOnDelete();
            $table->text('alasan');
            $table->string('bukti_path')->nullable();
            $table->enum('status', ['diajukan', 'diterima', 'ditolak'])->default('diajukan');
            $table->text('respon_asesor')->nullable();
            $table->timestamps();
        });

        // SK Keputusan dari Pimpinan
        Schema::create('sk_keputusan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->unique()->constrained('pendaftaran')->cascadeOnDelete();
            $table->unsignedInteger('total_sks_diakui')->default(0);
            $table->enum('status', ['menunggu_sk', 'sk_terbit', 'ditolak'])->default('menunggu_sk');
            $table->string('nomor_sk', 50)->nullable();
            $table->date('tanggal_terbit')->nullable();
            $table->foreignId('diterbitkan_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->string('qr_code_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sk_keputusan');
        Schema::dropIfExists('sanggah');
        Schema::dropIfExists('pleno_mk');
    }
};
