<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->failOnDuplicates(
            'sanggah',
            ['pendaftaran_id', 'mata_kuliah_id'],
            'Sanggah duplikat harus diselesaikan sebelum migration Phase 1.6.',
        );

        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->json('document_snapshot')->nullable()->after('content_hash');
            $table->string('pdf_path')->nullable()->after('qr_code_path');
            $table->char('pdf_hash', 64)->nullable()->after('pdf_path');
        });

        $this->backfillPublishedSnapshots();

        Schema::table('sanggah', function (Blueprint $table) {
            $table->unique(
                ['pendaftaran_id', 'mata_kuliah_id'],
                'uq_sanggah_pendaftaran_mk',
            );
        });
        foreach ([
            'idx_sanggah_pendaftaran_phase16_rollback',
        ] as $index) {
            if (Schema::hasIndex('sanggah', $index)) {
                Schema::table('sanggah', fn (Blueprint $table) =>
                    $table->dropIndex($index)
                );
            }
        }

        if ($this->supportsForeignKeyAlter()) {
            $this->replaceForeignKey(
                'pendaftaran',
                'user_id',
                'users',
                'id',
                'restrict',
            );
            $this->replaceForeignKey(
                'sk_keputusan',
                'pendaftaran_id',
                'pendaftaran',
                'id',
                'restrict',
            );
            $this->replaceForeignKey(
                'pleno_mk',
                'mata_kuliah_id',
                'mata_kuliah',
                'id',
                'restrict',
            );
            $this->replaceForeignKey(
                'sanggah',
                'mata_kuliah_id',
                'mata_kuliah',
                'id',
                'restrict',
            );
        }
    }

    public function down(): void
    {
        if (
            DB::table('sk_keputusan')
                ->where('status', 'sk_terbit')
                ->exists()
        ) {
            throw new RuntimeException(
                'Rollback Phase 1.6 ditolak karena terdapat SK terbit.',
            );
        }

        if ($this->supportsForeignKeyAlter()) {
            $this->addIndexIfMissing(
                'sanggah',
                'pendaftaran_id',
                'idx_sanggah_pendaftaran_phase16_rollback',
            );
            $this->addIndexIfMissing(
                'sanggah',
                'mata_kuliah_id',
                'idx_sanggah_mata_phase16_rollback',
            );
            $this->replaceForeignKey(
                'sanggah',
                'mata_kuliah_id',
                'mata_kuliah',
                'id',
                'cascade',
            );
            $this->replaceForeignKey(
                'pleno_mk',
                'mata_kuliah_id',
                'mata_kuliah',
                'id',
                'cascade',
            );
            $this->replaceForeignKey(
                'sk_keputusan',
                'pendaftaran_id',
                'pendaftaran',
                'id',
                'cascade',
            );
            $this->replaceForeignKey(
                'pendaftaran',
                'user_id',
                'users',
                'id',
                'cascade',
            );
        }

        Schema::table('sanggah', function (Blueprint $table) {
            $table->dropUnique('uq_sanggah_pendaftaran_mk');
        });
        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->dropColumn(['document_snapshot', 'pdf_path', 'pdf_hash']);
        });
    }

    private function supportsForeignKeyAlter(): bool
    {
        return in_array(DB::getDriverName(), ['mysql', 'mariadb'], true);
    }

    private function addIndexIfMissing(
        string $tableName,
        string $column,
        string $index,
    ): void {
        if (! Schema::hasIndex($tableName, $index)) {
            Schema::table(
                $tableName,
                fn (Blueprint $table) => $table->index($column, $index),
            );
        }
    }

    private function replaceForeignKey(
        string $tableName,
        string $column,
        string $referencesTable,
        string $referencesColumn,
        string $onDelete,
    ): void {
        Schema::table($tableName, function (Blueprint $table) use (
            $column,
            $referencesTable,
            $referencesColumn,
            $onDelete,
        ) {
            $table->dropForeign([$column]);
            $foreign = $table->foreign($column)
                ->references($referencesColumn)
                ->on($referencesTable);

            $onDelete === 'cascade'
                ? $foreign->cascadeOnDelete()
                : $foreign->restrictOnDelete();
        });
    }

    private function failOnDuplicates(
        string $table,
        array $columns,
        string $message,
    ): void {
        if (
            DB::table($table)
                ->select($columns)
                ->groupBy($columns)
                ->havingRaw('COUNT(*) > 1')
                ->exists()
        ) {
            throw new RuntimeException($message);
        }
    }

    private function backfillPublishedSnapshots(): void
    {
        DB::table('sk_keputusan')
            ->where('status', 'sk_terbit')
            ->orderBy('id')
            ->chunkById(100, function ($rows) {
                foreach ($rows as $sk) {
                    $pendaftaran = DB::table('pendaftaran')
                        ->where('id', $sk->pendaftaran_id)
                        ->first();
                    $pemohon = $pendaftaran
                        ? DB::table('users')->where('id', $pendaftaran->user_id)->first()
                        : null;
                    $prodi = $pendaftaran
                        ? DB::table('prodi')->where('id', $pendaftaran->prodi_id)->first()
                        : null;
                    $mataKuliah = DB::table('pleno_mk')
                        ->join(
                            'mata_kuliah',
                            'mata_kuliah.id',
                            '=',
                            'pleno_mk.mata_kuliah_id',
                        )
                        ->where('pleno_mk.pendaftaran_id', $sk->pendaftaran_id)
                        ->orderBy('pleno_mk.mata_kuliah_id')
                        ->get([
                            'mata_kuliah.id',
                            'mata_kuliah.kode',
                            'mata_kuliah.nama',
                            'mata_kuliah.sks',
                            'pleno_mk.keputusan_final',
                        ])
                        ->map(fn ($item) => [
                            'id' => $item->id,
                            'kode' => $item->kode,
                            'nama' => $item->nama,
                            'sks' => (int) $item->sks,
                            'nilai' => $item->keputusan_final,
                            'diakui' => $item->keputusan_final !== 'T',
                        ])
                        ->all();
                    $snapshot = [
                        'schema_version' => 1,
                        'nomor_sk' => $sk->nomor_sk,
                        'tanggal_terbit' => $sk->tanggal_terbit,
                        'pendaftaran_id' => $sk->pendaftaran_id,
                        'nomor_pendaftaran' => $pendaftaran?->nomor_pendaftaran,
                        'pemohon' => ['nama' => $pemohon?->nama],
                        'prodi' => [
                            'kode' => $prodi?->kode,
                            'nama' => $prodi?->nama,
                            'jenjang' => $prodi?->jenjang,
                        ],
                        'mata_kuliah' => $mataKuliah,
                        'total_sks_diakui' => (int) $sk->total_sks_diakui,
                        'penerbit' => [
                            'nama' => $sk->penerbit_nama,
                            'nip' => $sk->penerbit_nip,
                            'jabatan' => $sk->penerbit_jabatan,
                        ],
                    ];

                    DB::table('sk_keputusan')->where('id', $sk->id)->update([
                        'document_snapshot' => json_encode(
                            $snapshot,
                            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE,
                        ),
                        'content_hash' => hash(
                            'sha256',
                            json_encode(
                                $snapshot,
                                JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE,
                            ),
                        ),
                        'qr_code_path' => null,
                    ]);
                }
            });
    }
};
