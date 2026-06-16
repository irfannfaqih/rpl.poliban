@extends('pdf.layout')

@section('title', 'F10 - Lembar Jawaban Tulis')

@section('content')
<style>
    .kop-surat { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  text-transform: uppercase; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    .table-info td { border: 1px solid black; padding: 6px; vertical-align: top; }
    .table-info td:first-child { width: 5%; font-weight: bold; text-align: center; }
    .table-info td:nth-child(2) { width: 35%; }
    
    .table-data { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    .table-data th, .table-data td { border: 1px solid black; padding: 6px; vertical-align: middle; }
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

    // C3 = Uji Tertulis
    $jawabItems = $pendaftaran->ujiLanjutan
        ? $pendaftaran->ujiLanjutan->items->where('tipe', 'c3')->load('penilaian')
        : collect();

    $groupedItems = $jawabItems->groupBy('mata_kuliah_id');
@endphp

@forelse($groupedItems as $mkId => $items)
    @php
        $mataKuliah = \App\Models\MataKuliah::find($mkId);
        $mkKode = $mataKuliah ? $mataKuliah->kode : '-';
        $mkNama = $mataKuliah ? $mataKuliah->nama : '-';

        // Hitung total skor dan rata-rata
        $totalSkor = 0;
        $totalItems = count($items);
        
        foreach($items as $item) {
            $avgItemSkor = $item->penilaian->avg('skor') ?? 0;
            $totalSkor += $avgItemSkor;
        }
        
        $rataRata = $totalItems > 0 ? ($totalSkor / $totalItems) : 0;
        $nilaiAkhir = $rataRata * 20;
    @endphp

    <div class="doc-kode">F10</div>
    <div class="kop-surat">FORM : 10 LEMBAR JAWABAN TULIS</div>
    
    <table class="table-info">
        <tr><td>1</td><td>Perangkat Asesmen</td><td>Tertulis</td></tr>
        <tr><td>2</td><td>Nama Pemohon</td><td>{{ $pendaftaran->user->nama ?? '-' }}</td></tr>
        <tr><td>3</td><td>Nama Asesor RPL</td><td>{{ $namaAsesor }}</td></tr>
        <tr><td>4</td><td>Mata Kuliah</td><td>{{ $mkNama }}</td></tr>
        <tr><td>5</td><td>Kode Mata Kuliah</td><td>{{ $mkKode }}</td></tr>
        <tr><td>6</td><td>Tanggal</td><td>{{ $tglUjian }}</td></tr>
    </table>

    <table class="table-data">
        <thead>
            <tr>
                <th rowspan="2" style="width: 5%">No.</th>
                <th rowspan="2" style="width: 70%">Jawaban Pemohon</th>
                <th colspan="5" style="width: 25%">Nilai</th>
            </tr>
            <tr>
                <th style="width: 5%">1</th>
                <th style="width: 5%">2</th>
                <th style="width: 5%">3</th>
                <th style="width: 5%">4</th>
                <th style="width: 5%">5</th>
            </tr>
        </thead>
        <tbody>
            @forelse($items as $idx => $item)
                @php
                    $skor = $item->penilaian->avg('skor') ?? null;
                    $skorRound = $skor !== null ? round($skor) : null;
                @endphp
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td style="min-height: 40px;">{{ $item->jawaban_pemohon ?? '-' }}</td>
                    <td style="text-align: center;">{!! $skorRound === 1.0 ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '' !!}</td>
                    <td style="text-align: center;">{!! $skorRound === 2.0 ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '' !!}</td>
                    <td style="text-align: center;">{!! $skorRound === 3.0 ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '' !!}</td>
                    <td style="text-align: center;">{!! $skorRound === 4.0 ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '' !!}</td>
                    <td style="text-align: center;">{!! $skorRound === 5.0 ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '' !!}</td>
                </tr>
            @empty
                @for($i = 1; $i <= 5; $i++)
                <tr>
                    <td style="text-align: center;">{{ $i }}</td>
                    <td style="height: 40px;"></td>
                    <td></td><td></td><td></td><td></td><td></td>
                </tr>
                @endfor
            @endforelse
            <tr>
                <td colspan="2" style="text-align: center; font-weight: bold;">Nilai rata-rata x 20</td>
                <td colspan="5" style="text-align: center; font-weight: bold;">{{ number_format($nilaiAkhir, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div style="font-size: 11px; margin-bottom: 30px;">
        Keterangan:<br>
        1 = Ketepatan menjawab <20%<br>
        2 = Ketepatan menjawab 21-40%<br>
        3 = Ketepatan menjawab 41-60%<br>
        4 = Ketepatan menjawab 61-80%<br>
        5 = Ketepatan menjawab 81-100%
    </div>

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
    <div class="doc-kode">F10</div>
    <div class="kop-surat">FORM : 10 LEMBAR JAWABAN TULIS</div>
    <p>Belum ada data mata kuliah yang diujikan secara tertulis.</p>
@endforelse

@endsection
