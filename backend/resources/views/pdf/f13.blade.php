@extends('pdf.layout')
@section('title', 'F13 - Matriks Asesmen MK')
@section('content')
<style>
    @page { margin: 1cm; size: A4 landscape; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    .table-info td { padding: 4px; vertical-align: top; }
    .table-info .label { width: 15%; font-weight: bold; }
    .table-info .colon { width: 2%; }
    .table-data { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9px; table-layout: fixed; word-wrap: break-word; }
    .table-data th, .table-data td { border: 1px solid black; padding: 4px; text-align: center; vertical-align: middle; }
    .table-data th { font-weight: bold; }
    .col-c { width: 5%; }
    .doc-kode { position: absolute; top: 0; right: 0; border: 1px solid black; padding: 5px 10px; font-weight: bold; font-size: 14px; margin-top: -10px; }
    .header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  }
    .keterangan-wrap { font-size: 9px; margin-top: 10px; page-break-inside: avoid; }
</style>

<div class="doc-kode">F13</div>
<div class="header">FORMULIR 13: MATRIKS ASESMEN MATA KULIAH</div>

<table class="table-info">
    <tr>
        <td class="label">Nama PT</td>
        <td class="colon">:</td>
        <td style="width: 33%">Politeknik Negeri Banjarmasin</td>
        <td class="label">Profil Lulusan</td>
        <td class="colon">:</td>
        <td>Ahli Madya / Sarjana Terapan</td>
    </tr>
    <tr>
        <td class="label">Jurusan</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->prodi->jurusanData->nama_jurusan ?? ($pendaftaran->prodi->jurusan ?? '-') }}</td>
        <td class="label">Level KKNI</td>
        <td class="colon">:</td>
        <td>{{ str_contains(strtolower($pendaftaran->prodi->jenjang ?? ''), 'd3') ? 'Level 5' : 'Level 6' }}</td>
    </tr>
    <tr>
        <td class="label">Program Studi</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->prodi->nama ?? '-' }}</td>
        <td class="label">Posisi di Pekerjaan</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->dataDiri->pekerjaan ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label">Jenjang Pendidikan</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->prodi->jenjang ?? '-' }}</td>
        <td colspan="3"></td>
    </tr>
</table>

<table class="table-data">
    <thead>
        <tr>
            <th rowspan="3" style="width:3%">No</th>
            <th rowspan="3" style="width:10%">Kode Mata Kuliah</th>
            <th rowspan="3" style="width:20%">Mata Kuliah</th>
            <th colspan="11">Metode Asesmen (C1 - C11)</th>
        </tr>
        <tr>
            <th class="col-c">C1</th>
            <th class="col-c">C2</th>
            <th class="col-c">C3</th>
            <th class="col-c">C4</th>
            <th class="col-c">C5</th>
            <th class="col-c">C6</th>
            <th class="col-c">C7</th>
            <th class="col-c">C8</th>
            <th class="col-c">C9</th>
            <th class="col-c">C10</th>
            <th class="col-c">C11</th>
        </tr>
        <tr>
            <th class="col-c" style="font-size:7px;">Lisan</th>
            <th class="col-c" style="font-size:7px;">Atasan</th>
            <th class="col-c" style="font-size:7px;">Tertulis</th>
            <th class="col-c" style="font-size:7px;">Peragaan</th>
            <th class="col-c" style="font-size:7px;">Dok.</th>
            <th class="col-c" style="font-size:7px;">Review</th>
            <th class="col-c" style="font-size:7px;">Tes</th>
            <th class="col-c" style="font-size:7px;">Pertanyaan</th>
            <th class="col-c" style="font-size:7px;">Laporan</th>
            <th class="col-c" style="font-size:7px;">Log Book</th>
            <th class="col-c" style="font-size:7px;">Dokumen</th>
        </tr>
    </thead>
    <tbody>
        @php
            $evaluasiDiriList = $evaluasiDiri ?? [];
            if(count($evaluasiDiriList) == 0 && isset($pendaftaran->evaluasiDiri)) {
                $evaluasiDiriList = $pendaftaran->evaluasiDiri;
            }
            $uniqueMks = $evaluasiDiriList->map(function($ev) { return $ev->cpmk->mataKuliah ?? null; })->filter()->unique('id')->values();
            $instrumenTipes = collect();
            if ($pendaftaran->ujiLanjutan) {
                $instrumenTipes = $pendaftaran->ujiLanjutan->items->pluck('tipe')->unique();
            }
            $chk = '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>';
        @endphp

        @forelse($uniqueMks as $index => $mk)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $mk->kode ?? $mk->kode_mk ?? '-' }}</td>
            <td style="text-align: left">{{ $mk->nama ?? $mk->nama_mk ?? '-' }}</td>
            <td>{!! $instrumenTipes->contains('c1') ? $chk : '' !!}</td>
            <td>{!! $instrumenTipes->contains('c2') ? $chk : '' !!}</td>
            <td>{!! $instrumenTipes->contains('c3') ? $chk : '' !!}</td>
            <td>{!! $instrumenTipes->contains('c4') ? $chk : '' !!}</td>
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        </tr>
        @empty
        @for($i=1; $i<=10; $i++)
        <tr>
            <td>{{ $i }}</td>
            <td></td><td></td><td></td><td></td><td></td><td></td>
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        </tr>
        @endfor
        @endforelse
    </tbody>
</table>

{{-- Keterangan + TTD dalam satu wrapper agar tidak terpotong --}}
<div class="keterangan-wrap">
    <strong>Keterangan:</strong><br>
    <span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span> : Dilakukan asesmen<br>
    <table style="width:100%; border:none; margin-top:5px;">
        <tr>
            <td style="border:none; text-align:left; vertical-align:top; width:50%;">
                C1 = Sertifikat asosiasi nasional/ internasional<br>
                C2 = Observasi langsung /kunjungan ke industri<br>
                C3 = Ujian lisan /wawancara<br>
                C4 = Peragaan /praktik<br>
                C5 = Penilaian terhadap pekerjaan<br>
                C6 = Review terhadap pekerjaan yang telah dilakukan<br>
            </td>
            <td style="border:none; text-align:left; vertical-align:top; width:50%;">
                C7 = Tes tertulis<br>
                C8 = Pertanyaan tertulis pelamar<br>
                C9 = Lap tertulis dari supervisor<br>
                C10 = Catatan harian pekerjaan (log book)<br>
                C11 = Bukti /Dokumen laporan pekerjaan<br>
            </td>
        </tr>
    </table>
</div>

@php
    $asesors = isset($pendaftaran) ? $pendaftaran->penugasanAsesor->pluck('asesor.nama')->filter()->values() : collect();
    $jumlahKolom = max($asesors->count(), 1);
@endphp

{{-- TTD: width 80% margin auto seragam dengan form lain --}}
<table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 20px; border-collapse: collapse; page-break-inside: avoid;">

    {{-- Baris 1: tanggal di kolom terakhir --}}
    <tr>
        @for($i = 0; $i < $jumlahKolom - 1; $i++)
        <td style="width: {{ 100 / $jumlahKolom }}%; border: none; padding: 0;"></td>
        @endfor
        <td style="width: {{ 100 / $jumlahKolom }}%; border: none; padding: 0; text-align: left;">
            Banjarmasin, {{ date('d F Y') }}
        </td>
    </tr>

    {{-- Baris 2: label jabatan --}}
    <tr>
        @if($asesors->count() >= 1)
            @foreach($asesors as $index => $asesorName)
            <td style="width: {{ 100 / $jumlahKolom }}%; border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor / Ketua Tim RPL {{ $asesors->count() > 1 ? ($index + 1) : '' }},
            </td>
            @endforeach
        @else
            <td style="width: 100%; border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor / Ketua Tim RPL,
            </td>
        @endif
    </tr>

    {{-- Baris 3: ruang tanda tangan --}}
    <tr>
        @if($asesors->count() >= 1)
            @foreach($asesors as $asesorName)
            <td style="height: 60px; border: none; padding: 0;"></td>
            @endforeach
        @else
            <td style="height: 60px; border: none; padding: 0;"></td>
        @endif
    </tr>

    {{-- Baris 4: nama --}}
    <tr>
        @if($asesors->count() >= 1)
            @foreach($asesors as $asesorName)
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $asesorName }})</strong>
            </td>
            @endforeach
        @else
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">(.....................................................)</strong>
            </td>
        @endif
    </tr>

</table>
@endsection
