<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mata_kuliah', function (Blueprint $table) {
            // Kolom kurikulum yang diperlukan PRD (Bab 4.3 Halaman 2.2)
            $table->tinyInteger('semester')->unsigned()->nullable()->after('sks');       // 1–8
            $table->tinyInteger('level_kkni')->unsigned()->nullable()->after('semester'); // 1–9
            $table->text('cp_sikap')->nullable()->after('deskripsi');
            $table->text('cp_pengetahuan')->nullable()->after('cp_sikap');
            $table->text('cp_keterampilan')->nullable()->after('cp_pengetahuan');
            $table->text('indikator_kinerja')->nullable()->after('cp_keterampilan');
            $table->string('profil_lulusan')->nullable()->after('indikator_kinerja');
            $table->boolean('is_active')->default(true)->after('profil_lulusan');

            // FIX: unique kode seharusnya per prodi, bukan global
            $table->dropUnique('mata_kuliah_kode_unique');
            $table->unique(['prodi_id', 'kode'], 'mata_kuliah_prodi_kode_unique');
        });

        if (Schema::hasIndex('mata_kuliah', 'idx_mata_kuliah_prodi_phase3_rollback')) {
            Schema::table('mata_kuliah', fn (Blueprint $table) =>
                $table->dropIndex('idx_mata_kuliah_prodi_phase3_rollback')
            );
        }
    }

    public function down(): void
    {
        if (! Schema::hasIndex('mata_kuliah', 'idx_mata_kuliah_prodi_phase3_rollback')) {
            Schema::table('mata_kuliah', fn (Blueprint $table) =>
                $table->index('prodi_id', 'idx_mata_kuliah_prodi_phase3_rollback')
            );
        }

        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->dropUnique('mata_kuliah_prodi_kode_unique');
            $table->unique('kode', 'mata_kuliah_kode_unique');

            $table->dropColumn([
                'semester', 'level_kkni', 'cp_sikap', 'cp_pengetahuan',
                'cp_keterampilan', 'indikator_kinerja', 'profil_lulusan', 'is_active',
            ]);
        });
    }
};
