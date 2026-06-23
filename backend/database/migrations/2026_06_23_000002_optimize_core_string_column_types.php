<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var array<string, array<string, int>>
     */
    private const TARGET_LENGTHS = [
        'notifications' => [
            'type' => 32,
            'title' => 150,
        ],
        'users' => [
            'nama' => 150,
            'email' => 254,
        ],
        'prodi' => ['nama' => 150],
        'mata_kuliah' => ['nama' => 150],
        'gelombang' => ['nama' => 150],
        'jadwal_asesmen' => [
            'waktu' => 50,
            'tempat' => 500,
        ],
        'uji_lanjutan' => ['tempat' => 500],
    ];

    public function up(): void
    {
        $this->assertDataFitsTargets();

        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type', 32)->change();
            $table->string('title', 150)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('nama', 150)->change();
            $table->string('email', 254)->change();
        });

        Schema::table('prodi', function (Blueprint $table) {
            $table->string('nama', 150)->change();
        });

        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->string('nama', 150)->change();
        });

        Schema::table('gelombang', function (Blueprint $table) {
            $table->string('nama', 150)->change();
        });

        Schema::table('jadwal_asesmen', function (Blueprint $table) {
            $table->string('waktu', 50)->change();
            $table->string('tempat', 500)->change();
        });

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->string('tempat', 500)->nullable()->change();
        });
    }

    public function down(): void
    {
        $this->assertColumnFits('jadwal_asesmen', 'waktu', 30, 'Rollback');

        Schema::table('uji_lanjutan', function (Blueprint $table) {
            $table->text('tempat')->nullable()->change();
        });

        Schema::table('jadwal_asesmen', function (Blueprint $table) {
            $table->string('waktu', 30)->change();
            $table->text('tempat')->change();
        });

        Schema::table('gelombang', function (Blueprint $table) {
            $table->string('nama')->change();
        });

        Schema::table('mata_kuliah', function (Blueprint $table) {
            $table->string('nama')->change();
        });

        Schema::table('prodi', function (Blueprint $table) {
            $table->string('nama')->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('nama')->change();
            $table->string('email')->change();
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type')->change();
            $table->string('title')->change();
        });
    }

    private function assertDataFitsTargets(): void
    {
        $lengthFunction = DB::getDriverName() === 'sqlite'
            ? 'LENGTH'
            : 'CHAR_LENGTH';

        foreach (self::TARGET_LENGTHS as $table => $columns) {
            foreach ($columns as $column => $targetLength) {
                $this->assertColumnFits(
                    $table,
                    $column,
                    $targetLength,
                    'Migration',
                    $lengthFunction,
                );
            }
        }
    }

    private function assertColumnFits(
        string $table,
        string $column,
        int $targetLength,
        string $operation,
        ?string $lengthFunction = null,
    ): void {
        $lengthFunction ??= DB::getDriverName() === 'sqlite'
            ? 'LENGTH'
            : 'CHAR_LENGTH';

        $maxLength = DB::table($table)
            ->whereNotNull($column)
            ->selectRaw("MAX({$lengthFunction}(`{$column}`)) AS max_length")
            ->value('max_length');

        if ((int) $maxLength > $targetLength) {
            throw new RuntimeException(sprintf(
                '%s dibatalkan: %s.%s memiliki panjang maksimum %d, melebihi target %d.',
                $operation,
                $table,
                $column,
                $maxLength,
                $targetLength,
            ));
        }
    }
};
