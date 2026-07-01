<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $drops = [];

        if (Schema::hasColumn('uji_lanjutan', 'konfirmasi_kehadiran')) {
            $drops[] = 'DROP COLUMN `konfirmasi_kehadiran`';
        }
        if (Schema::hasColumn('uji_lanjutan', 'konfirmasi_at')) {
            $drops[] = 'DROP COLUMN `konfirmasi_at`';
        }

        if ($drops !== []) {
            DB::statement('ALTER TABLE `uji_lanjutan` '.implode(', ', $drops));
        }
    }

    public function down(): void
    {
        Schema::table('uji_lanjutan', function (Blueprint $table) {
            if (! Schema::hasColumn('uji_lanjutan', 'konfirmasi_kehadiran')) {
                $table->boolean('konfirmasi_kehadiran')->default(false)->after('nilai_at2_final');
            }
            if (! Schema::hasColumn('uji_lanjutan', 'konfirmasi_at')) {
                $table->timestamp('konfirmasi_at')->nullable()->after('konfirmasi_kehadiran');
            }
        });
    }
};
