<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->assertMaxLength('users', 'jenis_kelamin', 16);
        $this->assertMaxLength('users', 'tempat_lahir', 100);
        $this->assertMaxLength('users', 'instansi', 150);
        $this->assertMaxLength('users', 'jabatan_instansi', 100);
        $this->assertMaxLength('users', 'asosiasi_profesi', 150);
        $this->assertMaxLength('users', 'bidang_keilmuan', 150);
        $this->assertMaxLength('users', 'pendidikan_terakhir', 150);
        $this->assertMaxLength('riwayat_pendidikan', 'institusi', 150);
        $this->assertMaxLength('riwayat_pendidikan', 'program_studi', 150);
        $this->assertAllowedValues('penilaian_cpmk', 'nilai', ['diakui', 'belum_diakui']);
        $this->assertMaxLength('borang_data_diri', 'nama_lengkap', 150);
        $this->assertMaxLength('borang_data_diri', 'email_pribadi', 254);

        DB::statement("ALTER TABLE users MODIFY jenis_kelamin VARCHAR(16) NULL");
        DB::statement("ALTER TABLE users MODIFY tempat_lahir VARCHAR(100) NULL");
        DB::statement("ALTER TABLE users MODIFY instansi VARCHAR(150) NULL");
        DB::statement("ALTER TABLE users MODIFY jabatan_instansi VARCHAR(100) NULL");
        DB::statement("ALTER TABLE users MODIFY asosiasi_profesi VARCHAR(150) NULL");
        DB::statement("ALTER TABLE users MODIFY bidang_keilmuan VARCHAR(150) NULL");
        DB::statement("ALTER TABLE users MODIFY pendidikan_terakhir VARCHAR(150) NULL");

        DB::statement("ALTER TABLE riwayat_pendidikan MODIFY institusi VARCHAR(150) NOT NULL");
        DB::statement("ALTER TABLE riwayat_pendidikan MODIFY program_studi VARCHAR(150) NULL");

        DB::statement("ALTER TABLE penilaian_cpmk MODIFY nilai ENUM('diakui', 'belum_diakui') NULL");

        DB::statement("ALTER TABLE borang_data_diri MODIFY nama_lengkap VARCHAR(150) NOT NULL");
        DB::statement("ALTER TABLE borang_data_diri MODIFY email_pribadi VARCHAR(254) NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE borang_data_diri MODIFY email_pribadi VARCHAR(255) NOT NULL");
        DB::statement("ALTER TABLE borang_data_diri MODIFY nama_lengkap VARCHAR(255) NOT NULL");

        DB::statement("ALTER TABLE penilaian_cpmk MODIFY nilai VARCHAR(255) NULL");

        DB::statement("ALTER TABLE riwayat_pendidikan MODIFY program_studi VARCHAR(255) NULL");
        DB::statement("ALTER TABLE riwayat_pendidikan MODIFY institusi VARCHAR(255) NOT NULL");

        DB::statement("ALTER TABLE users MODIFY pendidikan_terakhir VARCHAR(255) NULL");
        DB::statement("ALTER TABLE users MODIFY bidang_keilmuan VARCHAR(255) NULL");
        DB::statement("ALTER TABLE users MODIFY asosiasi_profesi VARCHAR(255) NULL");
        DB::statement("ALTER TABLE users MODIFY jabatan_instansi VARCHAR(255) NULL");
        DB::statement("ALTER TABLE users MODIFY instansi VARCHAR(255) NULL");
        DB::statement("ALTER TABLE users MODIFY tempat_lahir VARCHAR(255) NULL");
        DB::statement("ALTER TABLE users MODIFY jenis_kelamin VARCHAR(255) NULL");
    }

    private function assertMaxLength(string $table, string $column, int $maxLength): void
    {
        $actualMax = DB::table($table)->whereNotNull($column)->max(DB::raw("CHAR_LENGTH(`{$column}`)"));

        if ($actualMax !== null && (int) $actualMax > $maxLength) {
            throw new RuntimeException("Cannot shrink {$table}.{$column}: max length {$actualMax} exceeds {$maxLength}.");
        }
    }

    /**
     * @param array<int, string> $allowedValues
     */
    private function assertAllowedValues(string $table, string $column, array $allowedValues): void
    {
        $invalidCount = DB::table($table)
            ->whereNotNull($column)
            ->whereNotIn($column, $allowedValues)
            ->count();

        if ($invalidCount > 0) {
            throw new RuntimeException("Cannot convert {$table}.{$column} to enum: found {$invalidCount} invalid value(s).");
        }
    }
};
