<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->uuid('generation_token')->nullable()->after('pdf_hash');
            $table->timestamp('generation_started_at')
                ->nullable()
                ->after('generation_token');
        });

        $this->addIndex(
            'pendaftaran',
            ['prodi_id', 'created_at'],
            'idx_pend_prodi_created',
        );
        $this->addIndex(
            'pendaftaran',
            ['prodi_id', 'status_alur', 'created_at'],
            'idx_pend_prodi_status_created',
        );
        $this->addIndex(
            'penugasan_asesor',
            ['asesor_id', 'created_at'],
            'idx_penugasan_asesor_created',
        );
        $this->addIndex(
            'jadwal_asesmen',
            ['tanggal', 'waktu'],
            'idx_jadwal_tanggal_waktu',
        );
        $this->addIndex(
            'sk_keputusan',
            ['status', 'created_at'],
            'idx_sk_status_created',
        );
        $this->addIndex(
            'audit_log',
            ['created_at'],
            'idx_audit_created',
        );
        $this->addIndex(
            'audit_log',
            ['action', 'created_at'],
            'idx_audit_action_created',
        );

        $this->dropIndexIfExists('pleno_mk', 'idx_pleno_compound');
        $this->dropIndexIfExists(
            'penugasan_asesor',
            'idx_penugasan_asesor_id',
        );
    }

    public function down(): void
    {
        $this->addIndex(
            'penugasan_asesor',
            ['asesor_id'],
            'idx_penugasan_asesor_id',
        );
        $this->addIndex(
            'pleno_mk',
            ['pendaftaran_id', 'mata_kuliah_id'],
            'idx_pleno_compound',
        );

        foreach ([
            ['audit_log', 'idx_audit_action_created'],
            ['audit_log', 'idx_audit_created'],
            ['sk_keputusan', 'idx_sk_status_created'],
            ['jadwal_asesmen', 'idx_jadwal_tanggal_waktu'],
            ['penugasan_asesor', 'idx_penugasan_asesor_created'],
            ['pendaftaran', 'idx_pend_prodi_status_created'],
            ['pendaftaran', 'idx_pend_prodi_created'],
        ] as [$table, $index]) {
            $this->dropIndexIfExists($table, $index);
        }

        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->dropColumn([
                'generation_token',
                'generation_started_at',
            ]);
        });
    }

    private function addIndex(
        string $tableName,
        array $columns,
        string $name,
    ): void {
        if (! Schema::hasIndex($tableName, $name)) {
            Schema::table(
                $tableName,
                fn (Blueprint $table) => $table->index($columns, $name),
            );
        }
    }

    private function dropIndexIfExists(string $tableName, string $name): void
    {
        if (Schema::hasIndex($tableName, $name)) {
            Schema::table(
                $tableName,
                fn (Blueprint $table) => $table->dropIndex($name),
            );
        }
    }
};
