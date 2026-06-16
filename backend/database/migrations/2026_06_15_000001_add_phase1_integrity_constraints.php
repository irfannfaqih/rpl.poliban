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
            'pleno_mk',
            ['pendaftaran_id', 'mata_kuliah_id'],
            'Duplicate pleno_mk harus dibersihkan sebelum migration.',
        );
        $this->failOnDuplicates(
            'penugasan_asesor',
            ['pendaftaran_id', 'asesor_id'],
            'Asesor yang sama masih ditugaskan dua kali pada satu pendaftaran.',
        );
        $this->failOnDuplicates(
            'sk_keputusan',
            ['nomor_sk'],
            'Nomor SK duplikat harus dibersihkan sebelum migration.',
            ['nomor_sk'],
        );
        $this->failOnDuplicates(
            'pendaftaran',
            ['midtrans_order_id'],
            'midtrans_order_id duplikat harus dibersihkan sebelum migration.',
            ['midtrans_order_id'],
        );

        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->string('penerbit_nama')->nullable()->after('diterbitkan_oleh');
            $table->string('penerbit_nip', 20)->nullable()->after('penerbit_nama');
            $table->string('penerbit_jabatan')->nullable()->after('penerbit_nip');
            $table->timestamp('published_at')->nullable()->after('tanggal_terbit');
            $table->unsignedInteger('version')->default(1)->after('published_at');
            $table->char('content_hash', 64)->nullable()->after('version');
            $table->unique('nomor_sk', 'uq_sk_nomor');
        });

        $this->backfillPublishedSkSnapshots();

        Schema::table('pleno_mk', function (Blueprint $table) {
            $table->unique(
                ['pendaftaran_id', 'mata_kuliah_id'],
                'uq_pleno_pendaftaran_mk',
            );
        });
        Schema::table('penugasan_asesor', function (Blueprint $table) {
            $table->unique(
                ['pendaftaran_id', 'asesor_id'],
                'uq_penugasan_pendaftaran_asesor',
            );
        });
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->unique('midtrans_order_id', 'uq_pendaftaran_midtrans_order');
        });
    }

    public function down(): void
    {
        Schema::table('pendaftaran', function (Blueprint $table) {
            $table->dropUnique('uq_pendaftaran_midtrans_order');
        });
        Schema::table('penugasan_asesor', function (Blueprint $table) {
            $table->dropUnique('uq_penugasan_pendaftaran_asesor');
        });
        Schema::table('pleno_mk', function (Blueprint $table) {
            $table->dropUnique('uq_pleno_pendaftaran_mk');
        });
        Schema::table('sk_keputusan', function (Blueprint $table) {
            $table->dropUnique('uq_sk_nomor');
            $table->dropColumn([
                'penerbit_nama',
                'penerbit_nip',
                'penerbit_jabatan',
                'published_at',
                'version',
                'content_hash',
            ]);
        });
    }

    private function failOnDuplicates(
        string $table,
        array $columns,
        string $message,
        array $notNullColumns = [],
    ): void {
        $query = DB::table($table)
            ->select($columns)
            ->groupBy($columns)
            ->havingRaw('COUNT(*) > 1');

        foreach ($notNullColumns as $column) {
            $query->whereNotNull($column);
        }

        if ($query->exists()) {
            throw new RuntimeException($message);
        }
    }

    private function backfillPublishedSkSnapshots(): void
    {
        DB::table('sk_keputusan')
            ->where('status', 'sk_terbit')
            ->orderBy('id')
            ->chunkById(100, function ($rows) {
                foreach ($rows as $row) {
                    $penerbit = $row->diterbitkan_oleh
                        ? DB::table('users')
                            ->where('id', $row->diterbitkan_oleh)
                            ->first(['nama', 'nip', 'jabatan'])
                        : null;

                    $snapshot = [
                        'nomor_sk' => $row->nomor_sk,
                        'pendaftaran_id' => $row->pendaftaran_id,
                        'total_sks_diakui' => $row->total_sks_diakui,
                        'penerbit' => [
                            $penerbit?->nama,
                            $penerbit?->nip,
                            $penerbit?->jabatan,
                        ],
                    ];

                    DB::table('sk_keputusan')
                        ->where('id', $row->id)
                        ->update([
                            'penerbit_nama' => $penerbit?->nama,
                            'penerbit_nip' => $penerbit?->nip,
                            'penerbit_jabatan' => $penerbit?->jabatan,
                            'published_at' => $row->tanggal_terbit
                                ?? $row->updated_at
                                ?? $row->created_at,
                            'content_hash' => hash(
                                'sha256',
                                json_encode($snapshot, JSON_THROW_ON_ERROR),
                            ),
                        ]);
                }
            });
    }
};
