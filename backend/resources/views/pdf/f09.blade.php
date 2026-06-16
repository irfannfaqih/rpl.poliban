@extends('pdf.layout')

@section('title', 'F09 - Perangkat Asesmen Tulis')

@section('content')
<style>
    .kop-surat { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  text-transform: uppercase; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    .table-info td { border: 1px solid black; padding: 6px; vertical-align: top; }
    .table-info td:first-child { width: 25%; font-weight: bold; }
    
    .table-data { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
    .table-data td { border: 1px solid black; padding: 6px; vertical-align: top; }
    
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
    $waktuUjian = $uji && $uji->waktu_ujian ? $uji->waktu_ujian : '-';
    $tahun = $uji && $uji->tanggal_ujian ? date('Y', strtotime($uji->tanggal_ujian)) : date('Y');

    // C3 = Uji Tertulis
    $ujiItems = $pendaftaran->ujiLanjutan
        ? $pendaftaran->ujiLanjutan->items->where('tipe', 'c3')
        : collect();

    $groupedItems = $ujiItems->groupBy('mata_kuliah_id');
@endphp

@forelse($groupedItems as $mkId => $items)
    @php
        $mataKuliah = \App\Models\MataKuliah::find($mkId);
        $mkKode = $mataKuliah ? $mataKuliah->kode : '-';
        $mkNama = $mataKuliah ? $mataKuliah->nama : '-';
    @endphp

    <div class="doc-kode">F09</div>
    <div class="kop-surat">FORM : 09 PERANGKAT ASESMEN TULIS</div>
    
    <table class="table-info">
        <tr>
            <td>Kode Mata Kuliah</td>
            <td>{{ $mkKode }}</td>
        </tr>
        <tr>
            <td>Judul Mata Kuliah</td>
            <td>{{ $mkNama }}</td>
        </tr>
        <tr>
            <td>Perumus</td>
            <td>{{ $namaAsesor }}</td>
        </tr>
        <tr>
            <td style="border: none; border-left: 1px solid black; border-bottom: 1px solid black;"></td>
            <td style="text-align: left; border-top: none;">Tahun {{ $tahun }}</td>
        </tr>
    </table>

    <div style="background-color: #dbe4f0; text-align: center; padding: 5px; font-weight: bold; border: 1px solid black; margin-bottom: 20px;">PERTANYAAN TERTULIS – JAWABAN SINGKAT</div>

    <table class="table-data" style="margin-bottom: 0;">
        <tr><td style="width: 5%; text-align: center;">1</td><td style="width: 35%">Perangkat Asesmen</td><td>Daftar pertanyaan tertulis – jawaban singkat</td></tr>
        <tr><td style="text-align: center;">2</td><td>Nama Pemohon</td><td>{{ $pendaftaran->user->nama ?? '-' }}</td></tr>
        <tr><td style="text-align: center;">3</td><td>Nama Asesor RPL</td><td>{{ $namaAsesor }}</td></tr>
        <tr><td style="text-align: center;">4</td><td>Kode Mata Kuliah</td><td>{{ $mkKode }}</td></tr>
        <tr><td style="text-align: center;">5</td><td>Judul Mata Kuliah</td><td>{{ $mkNama }}</td></tr>
        <tr><td style="text-align: center;">6</td><td>Tanggal Asesmen</td><td>{{ $tglUjian }}</td></tr>
        <tr><td style="text-align: center;">7</td><td>Metode Asesmen</td><td>Ujian Tulis</td></tr>
        <tr><td style="text-align: center;">8</td><td>Waktu</td><td>{{ $waktuUjian }}</td></tr>
        <tr><td colspan="3" style="text-align: center;">Setiap pertanyaan mengacu kepada indikator Kinerja dan CP program studi</td></tr>
    </table>

    <div style="page-break-before: always;"></div>

    <div class="doc-kode">F09</div>
    <div class="kop-surat">FORM : 09 PERANGKAT ASESMEN TULIS</div>
    
    <p style="font-size: 11px;">Petunjuk:<br>Jawablah pertanyaan di bawah ini pada lembar jawaban yang disediakan dengan singkat dan jelas</p>
    
    <table class="table-data">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th>Pertanyaan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $idx => $item)
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td>{{ $item->pertanyaan_instruksi }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="background-color: #dbe4f0; text-align: center; padding: 5px; font-weight: bold; border: 1px solid black; margin-bottom: 20px;">KUNCI JAWABAN TULIS</div>

    <table class="table-data">
        <tr><td style="width: 5%; text-align: center;">1</td><td style="width: 35%">Perangkat Asesmen</td><td>Tertulis</td></tr>
        <tr><td style="text-align: center;">2</td><td>Nama Pemohon</td><td>{{ $pendaftaran->user->nama ?? '-' }}</td></tr>
        <tr><td style="text-align: center;">3</td><td>Nama Asesor RPL</td><td>{{ $namaAsesor }}</td></tr>
        <tr><td style="text-align: center;">4</td><td>Mata Kuliah</td><td>{{ $mkNama }}</td></tr>
        <tr><td style="text-align: center;">5</td><td>Kode Mata Kuliah</td><td>{{ $mkKode }}</td></tr>
        <tr><td style="text-align: center;">6</td><td>Tanggal</td><td>{{ $tglUjian }}</td></tr>
    </table>

    <table class="table-data">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th>Kunci Jawaban</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $idx => $item)
                <tr>
                    <td style="text-align: center;">{{ $idx + 1 }}</td>
                    <td>{{ $item->kunci_jawaban ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if(!$loop->last)
        <div style="page-break-after: always;"></div>
    @endif

@empty
    <div class="doc-kode">F09</div>
    <div class="kop-surat">FORM : 09 PERANGKAT ASESMEN TULIS</div>
    <p>Belum ada data mata kuliah yang diujikan secara tertulis.</p>
@endforelse

@endsection
