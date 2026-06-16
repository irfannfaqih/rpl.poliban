<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MigrationSafetyTest extends TestCase
{
    private string $temporaryDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useTemporaryMysqlDatabase();
    }

    protected function tearDown(): void
    {
        if (isset($this->temporaryDatabase)) {
            DB::purge('migration_test');
            $env = $this->readEnvironmentFile();
            $pdo = $this->mysqlPdo($env);
            $pdo->exec(
                'DROP DATABASE IF EXISTS `'.$this->temporaryDatabase.'`',
            );
        }
        parent::tearDown();
    }

    public function test_fresh_and_data_filled_migrations_are_safe(): void
    {
        $this->assertSame(0, Artisan::call('migrate:fresh', ['--force' => true]));

        $nilaiMigration = require database_path(
            'migrations/2026_05_22_021612_update_penilaian_cpmk_enum_to_diakui.php',
        );
        $nilaiMigration->down();
        Schema::disableForeignKeyConstraints();
        DB::table('penilaian_cpmk')->insert([
            [
                'penugasan_asesor_id' => 1,
                'cpmk_id' => 1,
                'nilai' => 'K',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'penugasan_asesor_id' => 2,
                'cpmk_id' => 1,
                'nilai' => 'M',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
        Schema::enableForeignKeyConstraints();
        $nilaiMigration->up();

        $this->assertSame(2, DB::table('penilaian_cpmk')->count());
        $this->assertSame(
            ['belum_diakui', 'diakui'],
            DB::table('penilaian_cpmk')->orderBy('id')->pluck('nilai')->all(),
        );

        $phase2b1 = require database_path(
            'migrations/2026_06_15_000004_optimize_phase2b1_backend.php',
        );
        $phase2b1->down();
        $this->assertFalse(
            Schema::hasColumn('sk_keputusan', 'generation_token'),
        );
        $this->assertFalse(
            Schema::hasIndex('pendaftaran', 'idx_pend_prodi_created'),
        );
        $phase2b1->up();
        $this->assertTrue(
            Schema::hasColumn('sk_keputusan', 'generation_token'),
        );
        $this->assertTrue(
            Schema::hasIndex('pendaftaran', 'idx_pend_prodi_created'),
        );
        $this->assertTrue(
            Schema::hasIndex('sk_keputusan', 'idx_sk_status_created'),
        );

        $phase16 = require database_path(
            'migrations/2026_06_15_000002_harden_phase1_6_integrity.php',
        );
        $phase16->down();
        $this->assertFalse(
            Schema::hasColumn('sk_keputusan', 'document_snapshot'),
        );
        $phase16->up();
        $this->assertTrue(
            Schema::hasColumn('sk_keputusan', 'document_snapshot'),
        );
    }

    private function useTemporaryMysqlDatabase(): void
    {
        $env = $this->readEnvironmentFile();
        $this->temporaryDatabase = 'sirpl_migration_'.bin2hex(random_bytes(5));
        $pdo = $this->mysqlPdo($env);
        $pdo->exec(
            'CREATE DATABASE `'.$this->temporaryDatabase.
            '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        );
        $base = config('database.connections.mysql');
        config([
            'database.default' => 'migration_test',
            'database.connections.migration_test' => array_merge($base, [
                'host' => $env['DB_HOST'] ?? '127.0.0.1',
                'port' => $env['DB_PORT'] ?? '3306',
                'database' => $this->temporaryDatabase,
                'username' => $env['DB_USERNAME'] ?? 'root',
                'password' => $env['DB_PASSWORD'] ?? '',
            ]),
        ]);
        DB::purge();
        DB::setDefaultConnection('migration_test');
    }

    private function mysqlPdo(array $env): \PDO
    {
        return new \PDO(
            sprintf(
                'mysql:host=%s;port=%s;charset=utf8mb4',
                $env['DB_HOST'] ?? '127.0.0.1',
                $env['DB_PORT'] ?? '3306',
            ),
            $env['DB_USERNAME'] ?? 'root',
            $env['DB_PASSWORD'] ?? '',
            [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION],
        );
    }

    private function readEnvironmentFile(): array
    {
        $values = [];
        foreach (file(base_path('.env'), FILE_IGNORE_NEW_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $values[trim($key)] = trim(trim($value), "\"'");
        }

        return $values;
    }
}
