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
        Schema::table('users', function (Blueprint $table) {
            $table->text('alamat')->nullable();
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('jenis_kelamin')->nullable();
            $table->string('pendidikan_terakhir')->nullable();
            $table->string('bidang_keilmuan')->nullable();
            $table->string('instansi')->nullable();
            $table->string('jabatan_instansi')->nullable();
            $table->string('asosiasi_profesi')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'alamat',
                'tempat_lahir',
                'tanggal_lahir',
                'jenis_kelamin',
                'pendidikan_terakhir',
                'bidang_keilmuan',
                'instansi',
                'jabatan_instansi',
                'asosiasi_profesi',
                'nip'
            ]);
        });
    }
};
