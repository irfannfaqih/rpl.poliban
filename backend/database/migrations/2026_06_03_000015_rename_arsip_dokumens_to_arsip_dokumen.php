<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Rename tabel arsip_dokumens → arsip_dokumen.
 *
 * Alasan: seluruh tabel lain mengikuti konvensi singular Indonesia,
 * tapi arsip_dokumens menggunakan pluralisasi Inggris Laravel (+ 's').
 * Ini satu-satunya tabel yang melanggar konvensi penamaan project.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('arsip_dokumens', 'arsip_dokumen');
    }

    public function down(): void
    {
        Schema::rename('arsip_dokumen', 'arsip_dokumens');
    }
};
