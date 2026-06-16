<?php

namespace App\Exports;

use App\Models\Pendaftaran;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use PhpOffice\PhpSpreadsheet\Cell\StringValueBinder;

class PendaftarExport extends StringValueBinder implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithCustomValueBinder, WithChunkReading
{
    protected $prodiId;

    public function __construct($prodiId)
    {
        $this->prodiId = $prodiId;
    }

    public function query()
    {
        return Pendaftaran::query()
            ->select([
                'id',
                'user_id',
                'gelombang_id',
                'nomor_pendaftaran',
                'status_alur',
                'created_at',
            ])
            ->with([
                'user:id,nama,email',
                'gelombang:id,nama',
                'dataDiri:id,pendaftaran_id,no_hp,nik,alamat',
            ])
            ->where('prodi_id', $this->prodiId)
            ->orderBy('id');
    }

    public function chunkSize(): int
    {
        return 500;
    }

    public function headings(): array
    {
        return [
            'Nomor Pendaftaran',
            'Gelombang',
            'Nama Pemohon',
            'Email',
            'No. HP',
            'NIK',
            'Alamat',
            'Status Pendaftaran',
            'Tanggal Daftar',
        ];
    }

    public function map($pendaftaran): array
    {
        return [
            $pendaftaran->nomor_pendaftaran ?? 'RPL-' . $pendaftaran->id,
            $pendaftaran->gelombang->nama ?? '-',
            $pendaftaran->user->nama ?? '-',
            $pendaftaran->user->email ?? '-',
            $pendaftaran->dataDiri->no_hp ?? '-',
            $pendaftaran->dataDiri->nik ?? '-',
            $pendaftaran->dataDiri->alamat ?? '-',
            strtoupper(str_replace('_', ' ', $pendaftaran->status_alur)),
            $pendaftaran->created_at ? $pendaftaran->created_at->format('Y-m-d') : '-',
        ];
    }
}
