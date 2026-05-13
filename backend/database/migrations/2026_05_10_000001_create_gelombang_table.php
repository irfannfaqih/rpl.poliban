<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gelombang', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->date('tgl_buka');
            $table->date('tgl_tutup');
            $table->date('tgl_sanggah');
            $table->decimal('biaya', 12, 0);
            $table->enum('status', ['aktif', 'draft', 'selesai'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gelombang');
    }
};
