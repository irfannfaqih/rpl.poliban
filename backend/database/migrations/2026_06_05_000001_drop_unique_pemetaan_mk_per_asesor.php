<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop unique constraint uq_pemetaan_mk_per_asesor dari tabel pemetaan_mk.
 *
 * Alasan: Secara bisnis sah jika dua MK asal (dengan isi/capaian mirip)
 * dipetakan ke MK Poliban yang sama oleh satu asesor.
 * Constraint ini terlalu ketat dan menyebabkan error saat kasus tersebut terjadi.
 *
 * Index performa (idx_pemetaan_compound) tetap dipertahankan.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasIndex('pemetaan_mk', 'uq_pemetaan_mk_per_asesor')) {
            Schema::table('pemetaan_mk', function (Blueprint $table) {
                $table->dropUnique('uq_pemetaan_mk_per_asesor');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasIndex('pemetaan_mk', 'uq_pemetaan_mk_per_asesor')) {
            Schema::table('pemetaan_mk', function (Blueprint $table) {
                $table->unique(
                    ['penugasan_asesor_id', 'mk_poliban_id'],
                    'uq_pemetaan_mk_per_asesor',
                );
            });
        }
    }
};
