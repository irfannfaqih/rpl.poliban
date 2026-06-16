<?php

namespace App\Services;

use App\Models\Pendaftaran;
use App\Models\User;

class SkSnapshotService
{
    public function build(
        Pendaftaran $pendaftaran,
        User $penerbit,
        string $nomorSk,
        string $tanggalTerbit,
    ): array {
        $pendaftaran->loadMissing([
            'user:id,nama',
            'prodi:id,kode,nama,jenjang',
            'plenoMk.mataKuliah:id,kode,nama,sks',
        ]);

        $mataKuliah = $pendaftaran->plenoMk
            ->sortBy('mata_kuliah_id')
            ->map(fn ($item) => [
                'id' => $item->mata_kuliah_id,
                'kode' => $item->mataKuliah?->kode,
                'nama' => $item->mataKuliah?->nama,
                'sks' => (int) ($item->mataKuliah?->sks ?? 0),
                'nilai' => $item->keputusan_final,
                'diakui' => $item->keputusan_final !== 'T',
            ])
            ->values()
            ->all();

        return [
            'schema_version' => 1,
            'nomor_sk' => $nomorSk,
            'tanggal_terbit' => $tanggalTerbit,
            'pendaftaran_id' => $pendaftaran->id,
            'nomor_pendaftaran' => $pendaftaran->nomor_pendaftaran,
            'pemohon' => [
                'nama' => $pendaftaran->user?->nama,
            ],
            'prodi' => [
                'kode' => $pendaftaran->prodi?->kode,
                'nama' => $pendaftaran->prodi?->nama,
                'jenjang' => $pendaftaran->prodi?->jenjang,
            ],
            'mata_kuliah' => $mataKuliah,
            'total_sks_diakui' => collect($mataKuliah)
                ->where('diakui', true)
                ->sum('sks'),
            'penerbit' => [
                'nama' => $penerbit->nama,
                'nip' => $penerbit->nip,
                'jabatan' => $penerbit->jabatan,
            ],
        ];
    }

    public function hash(array $snapshot): string
    {
        return hash(
            'sha256',
            json_encode($snapshot, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
        );
    }
}
