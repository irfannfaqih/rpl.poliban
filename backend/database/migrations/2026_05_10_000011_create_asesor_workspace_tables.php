<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Form 02: Pra-Asesmen (konsultasi awal oleh asesor)
        Schema::create('pra_asesmen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penugasan_asesor_id')->unique()->constrained('penugasan_asesor')->cascadeOnDelete();
            $table->boolean('langkah_1')->default(false);
            $table->boolean('langkah_2')->default(false);
            $table->boolean('langkah_3')->default(false);
            $table->boolean('langkah_4')->default(false);
            $table->boolean('langkah_5')->default(false);
            $table->boolean('langkah_6')->default(false);
            $table->boolean('langkah_7')->default(false);
            $table->boolean('langkah_8')->default(false);
            $table->text('catatan_observasi')->nullable();
            $table->text('kebutuhan_khusus')->nullable();
            $table->enum('rekomendasi', ['lanjut_penuh', 'lanjut_catatan', 'tidak_memenuhi'])->nullable();
            $table->text('catatan_rekomendasi')->nullable();
            $table->boolean('is_submitted')->default(false);
            $table->timestamps();
        });

        // Form 04: Evaluasi Portofolio (10 kategori dokumen)
        Schema::create('evaluasi_portofolio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penugasan_asesor_id')->constrained('penugasan_asesor')->cascadeOnDelete();
            $table->tinyInteger('kategori_no')->unsigned(); // 1-10
            $table->enum('status_dokumen', ['ada', 'tidak_ada'])->nullable();
            $table->enum('kesesuaian', ['sesuai', 'tidak_sesuai'])->nullable();
            $table->text('rekomendasi_at2')->nullable();
            $table->timestamps();

            $table->unique(['penugasan_asesor_id', 'kategori_no']);
        });

        // Form 05: Penilaian CPMK
        Schema::create('penilaian_cpmk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penugasan_asesor_id')->constrained('penugasan_asesor')->cascadeOnDelete();
            $table->foreignId('cpmk_id')->constrained('cpmk')->cascadeOnDelete();
            $table->enum('nilai', ['K', 'CK', 'C', 'M'])->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['penugasan_asesor_id', 'cpmk_id']);
        });

        // Form 12: Pemetaan MK Asal → MK Poliban
        Schema::create('pemetaan_mk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('penugasan_asesor_id')->constrained('penugasan_asesor')->cascadeOnDelete();
            $table->string('mk_asal_kode', 20);
            $table->string('mk_asal_nama');
            $table->foreignId('mk_poliban_id')->constrained('mata_kuliah')->cascadeOnDelete();
            $table->enum('kesenjangan', ['sesuai', 'sebagian_sesuai', 'tidak_sesuai'])->nullable();
            $table->enum('keputusan', ['diakui_penuh', 'diakui_sebagian', 'tidak_diakui'])->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pemetaan_mk');
        Schema::dropIfExists('penilaian_cpmk');
        Schema::dropIfExists('evaluasi_portofolio');
        Schema::dropIfExists('pra_asesmen');
    }
};
