<?php

namespace App\Exports;

use App\Models\PlenoMk;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class PlenoExport implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithChunkReading
{
    protected $prodiId;

    public function __construct($prodiId)
    {
        $this->prodiId = $prodiId;
    }

    public function query()
    {
        return PlenoMk::query()
            ->with(['pendaftaran.user', 'mataKuliah'])
            ->whereHas('pendaftaran', function ($q) {
                $q->where('prodi_id', $this->prodiId)
                  ->whereIn('status_alur', ['pleno', 'finished']);
            });
    }

    public function chunkSize(): int
    {
        return 100;
    }

    public function headings(): array
    {
        return [
            'Nama Pemohon',
            'Nomor Pendaftaran',
            'Kode MK (Poliban)',
            'Nama MK (Poliban)',
            'SKS',
            'Nilai Asesor 1',
            'Nilai Asesor 2',
            'Rata-rata Bobot',
            'Status Pleno',
            'Nilai Keputusan Final',
            'Keterangan',
        ];
    }

    public function map($pleno): array
    {
        return [
            $pleno->pendaftaran->user->nama ?? '-',
            $pleno->pendaftaran->nomor_pendaftaran ?? 'RPL-' . $pleno->pendaftaran->id,
            $pleno->mataKuliah->kode ?? '-',
            $pleno->mataKuliah->nama ?? '-',
            $pleno->mataKuliah->sks ?? '-',
            $pleno->nilai_a1 ?? '-',
            $pleno->nilai_a2 ?? '-',
            $pleno->rata_rata ?? '-',
            strtoupper(str_replace('_', ' ', $pleno->status)),
            $pleno->keputusan_final ?? '-',
            $pleno->catatan_pleno ?? '-',
        ];
    }
}
