@extends('pdf.layout')

@section('title', 'F11 - Lembar Pertanyaan Lisan')

@section('content')
<style>
    .kop-surat { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  text-transform: uppercase; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    .table-info td { border: 1px solid black; padding: 6px; vertical-align: top; }
    .table-info td:first-child { width: 5%; font-weight: bold; text-align: center; }
    .table-info td:nth-child(2) { width: 35%; }
    
    .table-data { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    .table-data th, .table-data td { border: 1px solid black; padding: 6px; vertical-align: top; text-align: left; }
    .table-data th { font-weight: bold; text-align: center; }
    
    .doc-kode { position: absolute; top: 0; right: 0; border: 1px solid black; padding: 5px 10px; font-weight: bold; font-size: 14px; }
</style>

@php
    $asesorList = [];
    if(isset($pendaftaran->penugasanAsesor)) {
        foreach($pendaftaran->penugasanAsesor as $tugas) {
            if($tugas->asesor) $asesorList[] = $tugas->asesor->nama;
        }
    }
    $namaAsesor = count($asesorList) > 0 ? implode(', ', $asesorList) : '-';
    
    $uji = $pendaftaran->ujiLanjutan ?? null;
    $tglUjian = $uji && $uji->tanggal_ujian ? date('d-m-Y', strtotime($uji->tanggal_ujian)) : '-';

    // C1 = Uji Lisan / Wawancara
    $lisanItems = $pendaftaran->ujiLanjutan
        ? $pendaftaran->ujiLanjutan->items->where('tipe', 'c1')
        : collect();

    $groupedItems = $lisanItems->groupBy('mata_kuliah_id');
@endphp

@forelse($groupedItems as $mkId => $items)
    @php
        $mataKuliah = \App\Models\MataKuliah::find($mkId);
        $mkKode = $mataKuliah ? $mataKuliah->kode : '-';
        $mkNama = $mataKuliah ? $mataKuliah->nama : '-';
    @endphp

    <div class="doc-kode">F11</div>
    <div class="kop-surat">FORM : 11 LEMBAR PERTANYAAN LISAN</div>
    
    <div style="text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 15px;">LEMBAR PERTANYAAN LISAN (UNTUK PEMOHON)</div>

    <table class="table-info" style="margin-bottom: 0; border-bottom: none;">
        <tr><td>1</td><td>Perangkat Asesmen</td><td>Daftar pertanyaan lisan/wawancara</td></tr>
        <tr><td>2</td><td>Nama Pemohon</td><td>{{ $pendaftaran->user->nama ?? '-' }}</td></tr>
        <tr><td>3</td><td>Nama Asesor RPL</td><td>{{ $namaAsesor }}</td></tr>
        <tr><td>4</td><td>Kode Mata Kuliah</td><td>{{ $mkKode }}</td></tr>
        <tr><td>5</td><td>Judul Mata Kuliah</td><td>{{ $mkNama }}</td></tr>
        <tr><td>6</td><td>Tanggal Asesmen</td><td>{{ $tglUjian }}</td></tr>
        <tr><td>7</td><td>Waktu</td><td>30 menit</td></tr>
        <tr><td colspan="3" style="text-align: center;">Setiap pertanyaan mengacu kepada indikator kinerja dan CP program studi</td></tr>
    </table>

    <br>

    <table class="table-data">
        <thead>
            <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th style="width: 45%; text-align: center;">Pertanyaan</th>
                <th style="width: 50%; text-align: center;">Jawaban Pemohon</th>
            </tr>
        </thead>
        <tbody>
            @forelse($items as $idx => $item)
            <tr>
                <td style="text-align: center;">{{ $idx + 1 }}</td>
                <td>{{ $item->pertanyaan_instruksi }}</td>
                <td style="min-height: 40px;">{{ $item->jawaban_pemohon ?? '-' }}</td>
            </tr>
            @empty
            @for($i = 1; $i <= 5; $i++)
            <tr>
                <td style="text-align: center;">{{ $i }}</td>
                <td style="height: 40px;"></td>
                <td></td>
            </tr>
            @endfor
            @endforelse
        </tbody>
    </table>

    <table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid;">
        <tr>
            <td style="width: 50%; border: none; padding: 0;"></td>
            <td style="width: 50%; border: none; padding: 0; text-align: left;">
                Banjarmasin, {{ date('d F Y') }}
            </td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor RPL I/II
            </td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="height: 70px; border: none; padding: 0;"></td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">(...................................................)</strong>
            </td>
        </tr>
    </table>

    @if(!$loop->last)
        <div style="page-break-after: always;"></div>
    @endif

@empty
    <div class="doc-kode">F11</div>
    <div class="kop-surat">FORM : 11 LEMBAR PERTANYAAN LISAN</div>
    <p>Belum ada data mata kuliah yang diujikan secara lisan.</p>
@endforelse

@endsection
