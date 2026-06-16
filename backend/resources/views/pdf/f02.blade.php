@extends('pdf.layout')

@section('title', 'F02 - Pra Asesmen')

@section('content')
<style>
    h4.doc-title { text-align: center; font-size: 13px; margin: 15px 0 10px 0; text-transform: uppercase; font-weight: bold; }
    .kode-doc { float: right; border: 1px solid black; padding: 4px 10px; font-weight: bold; font-size: 13px; margin-top: -10px; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
    .table-info td { padding: 3px 4px; vertical-align: top; }
    .table-info .label { width: 28%; font-weight: bold; }
    .table-info .colon { width: 2%; }
    .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 25px; font-size: 10px; }
    .table-data th, .table-data td { border: 1px solid black; padding: 5px 6px; vertical-align: top; }
    .table-data th {  font-weight: bold; text-align: center; }
    .text-center { text-align: center; }
    .signature-table { width: 100%; margin-top: 40px; font-size: 11px; page-break-inside: avoid; }
    .signature-table td { width: 50%; text-align: center; }
    .sig-space { height: 65px; }
</style>

<div class="kode-doc">F02</div>

@php
    $checkmark = '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>';
    $praData = $pendaftaran->penugasanAsesor->first()?->praAsesmen ?? null;
    $cek = fn($langkah) => ($praData && $praData->{'langkah_' . $langkah}) ? $checkmark : '';
@endphp

<h4 class="doc-title">FORMULIR KONSULTASI PRA ASESMEN PEMOHON RPL</h4>

<table class="table-info">
    <tr>
        <td class="label">Nama Pemohon</td>
        <td class="colon">:</td>
        <td>{{ $user->nama ?? ($pendaftaran->user->nama ?? '-') }}</td>
        <td width="5%"></td>
        <td class="label">Tanggal</td>
        <td class="colon">:</td>
        <td>{{ isset($jadwal) && $jadwal->tanggal ? \Carbon\Carbon::parse($jadwal->tanggal)->translatedFormat('d F Y') : date('d F Y') }}</td>
    </tr>
    <tr>
        <td class="label">Nama Asesor RPL</td>
        <td class="colon">:</td>
        <td>
            @if(isset($pendaftaran) && $pendaftaran->penugasanAsesor->count() > 0)
                {{ $pendaftaran->penugasanAsesor->pluck('asesor.nama')->filter()->join(', ') }}
            @else
                -
            @endif
        </td>
        <td></td>
        <td class="label">Waktu</td>
        <td class="colon">:</td>
        <td>{{ $jadwal->waktu ?? '.........................' }}</td>
    </tr>
    <tr>
        <td class="label">Prodi</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->prodi->nama ?? '-' }}</td>
        <td></td>
        <td class="label">Tempat</td>
        <td class="colon">:</td>
        <td>{{ $jadwal->tempat ?? '.........................' }}</td>
    </tr>
    <tr>
        <td class="label">Nama PT</td>
        <td class="colon">:</td>
        <td>Politeknik Negeri Banjarmasin</td>
        <td colspan="4"></td>
    </tr>
</table>

<table class="table-data">
    <thead>
        <tr>
            <th width="5%">No</th>
            <th width="35%">Langkah - langkah</th>
            <th width="15%">Dilaksanakan (&#10004;)</th>
            <th width="45%">Keterangan</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="text-center">1</td>
            <td>Menjelaskan tujuan pra asesmen</td>
            <td class="text-center">{!! $cek(1) !!}</td>
            <td>Pemberian informasi pra asesmen berjalan sesuai prosedur</td>
        </tr>
        <tr>
            <td class="text-center">2</td>
            <td>Menjelaskan Standar / kriteria unjuk kerja</td>
            <td class="text-center">{!! $cek(2) !!}</td>
            <td>Penjelasan jelas dan mudah dipahami</td>
        </tr>
        <tr>
            <td class="text-center">3</td>
            <td>Menjelaskan metode asesmen dan buktinya</td>
            <td class="text-center">{!! $cek(3) !!}</td>
            <td>Asesor memastikan pemohon memahami metode asesmen</td>
        </tr>
        <tr>
            <td class="text-center">4</td>
            <td>Mengidentifikasi ketersediaan bukti dan jadwal pelaksanaannya</td>
            <td class="text-center">{!! $cek(4) !!}</td>
            <td>Diskusi jadwal disepakati kedua belah pihak</td>
        </tr>
        <tr>
            <td class="text-center">5</td>
            <td>Mengidentifikasi kesiapan pemohon dan menetapkan rencana asesmen</td>
            <td class="text-center">{!! $cek(5) !!}</td>
            <td>Kesiapan pemohon telah teridentifikasi dengan baik</td>
        </tr>
        <tr>
            <td class="text-center">6</td>
            <td>Mengidentifikasi kebutuhan spesifik dan aturan penyesuaian yang relevan</td>
            <td class="text-center">{!! $cek(6) !!}</td>
            <td>Kebutuhan penyesuaian khusus telah didiskusikan (jika ada)</td>
        </tr>
        <tr>
            <td class="text-center">7</td>
            <td>Membuat kesepakatan pra asesmen</td>
            <td class="text-center">{!! $cek(7) !!}</td>
            <td>Kesepakatan tercapai dan ditandatangani</td>
        </tr>
        <tr>
            <td class="text-center">8</td>
            <td>Selesai</td>
            <td class="text-center">{!! $cek(8) !!}</td>
            <td>Seluruh proses pra asesmen telah selesai</td>
        </tr>
    </tbody>
</table>

<div style="margin-top: 10px; margin-bottom: 20px; font-size: 11px;">
    <strong>Catatan Observasi selama pra asesmen:</strong><br>
    {{ $praData->catatan_observasi ?? '............................................................................................................................' }}
    <br><br>
    <strong>Kebutuhan Khusus / Penyesuaian (jika ada):</strong><br>
    {{ $praData->kebutuhan_khusus ?? '............................................................................................................................' }}
    <br><br>
    <strong>Rekomendasi:</strong> 
    @php
        $rekLabel = [
            'lanjut_penuh'    => 'Lanjut Penuh',
            'lanjut_catatan'  => 'Lanjut dengan Catatan',
            'tidak_memenuhi'  => 'Tidak Memenuhi Syarat',
        ];
    @endphp
    {{ $rekLabel[$praData->rekomendasi ?? ''] ?? ($praData->rekomendasi ?? '.......................................................................................') }}
    <br><br>
    <strong>Catatan Rekomendasi:</strong><br>
    {{ $praData->catatan_rekomendasi ?? '............................................................................................................................' }}
</div>
@php
    $asesors = isset($pendaftaran) ? $pendaftaran->penugasanAsesor->pluck('asesor.nama')->filter()->values() : collect();
@endphp

<table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid;">
    <tr>
        <td style="width: 33.33%; border: none; padding: 0;"></td>
        <td style="width: 33.33%; border: none; padding: 0;"></td>
        <td style="width: 33.33%; border: none; padding: 0; text-align: left;">
            Banjarmasin, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}
        </td>
    </tr>
    <tr>
        <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
            Pemohon RPL
        </td>
        @if($asesors->count() > 0)
            @foreach($asesors as $index => $asesorName)
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor RPL {{ $asesors->count() > 1 ? ($index + 1) : '' }}
            </td>
            @endforeach
            @if($asesors->count() === 1)
            <td style="border: none; padding: 0;"></td>
            @endif
        @else
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor RPL
            </td>
            <td style="border: none; padding: 0;"></td>
        @endif
    </tr>
    <tr>
        <td style="height: 70px; border: none; padding: 0;"></td>
        @if($asesors->count() > 0)
            @foreach($asesors as $asesorName)
            <td style="border: none; padding: 0;"></td>
            @endforeach
            @if($asesors->count() === 1)
            <td style="border: none; padding: 0;"></td>
            @endif
        @else
            <td style="border: none; padding: 0;"></td>
            <td style="border: none; padding: 0;"></td>
        @endif
    </tr>
    <tr>
        <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
            <strong style="white-space: nowrap;">({{ $user->nama ?? ($pendaftaran->user->nama ?? '..................................') }})</strong>
        </td>
        @if($asesors->count() > 0)
            @foreach($asesors as $asesorName)
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $asesorName }})</strong>
            </td>
            @endforeach
            @if($asesors->count() === 1)
            <td style="border: none; padding: 0;"></td>
            @endif
        @else
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">(.........................................)</strong>
            </td>
            <td style="border: none; padding: 0;"></td>
        @endif
    </tr>
</table>
@endsection


