<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table("penilaian_cpmk", function (Blueprint $table) {
            $table->string("nilai_migrated")->nullable()->after("nilai");
        });
        DB::table('penilaian_cpmk')
            ->select(['id', 'nilai'])
            ->orderBy('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('penilaian_cpmk')
                        ->where('id', $row->id)
                        ->update([
                            'nilai_migrated' => match ($row->nilai) {
                                'M', 'C', 'CK' => 'diakui',
                                'K' => 'belum_diakui',
                                default => null,
                            },
                        ]);
                }
            });
        Schema::table("penilaian_cpmk", fn (Blueprint $table) =>
            $table->dropColumn("nilai")
        );
        Schema::table("penilaian_cpmk", fn (Blueprint $table) =>
            $table->renameColumn("nilai_migrated", "nilai")
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("penilaian_cpmk", function (Blueprint $table) {
            $table->string("nilai_legacy")->nullable()->after("nilai");
        });
        DB::table('penilaian_cpmk')
            ->select(['id', 'nilai'])
            ->orderBy('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('penilaian_cpmk')
                        ->where('id', $row->id)
                        ->update([
                            'nilai_legacy' => match ($row->nilai) {
                                'diakui' => 'M',
                                'belum_diakui' => 'K',
                                default => null,
                            },
                        ]);
                }
            });
        Schema::table("penilaian_cpmk", fn (Blueprint $table) =>
            $table->dropColumn("nilai")
        );
        Schema::table("penilaian_cpmk", fn (Blueprint $table) =>
            $table->renameColumn("nilai_legacy", "nilai")
        );
    }
};
