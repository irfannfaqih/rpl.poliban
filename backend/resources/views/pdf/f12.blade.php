@extends('pdf.layout')

@section('title', 'F12 - Matriks Alih Kredit Pemohon RPL')

@section('content')
<style>
    h4.doc-title { text-align: center; font-size: 13px; margin: 15px 0 10px 0; text-transform: uppercase;  font-weight: bold; }
    .kode-doc { float: right; border: 1px solid black; padding: 4px 10px; font-weight: bold; font-size: 13px; margin-top: -10px; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
    .table-info td { padding: 3px 4px; vertical-align: top; }
    .table-info .label { width: 28%; font-weight: bold; }
    .table-info .colon { width: 2%; }
    .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 25px; font-size: 10px; }
    .table-data th, .table-data td { border: 1px solid #444; padding: 5px 6px; vertical-align: middle; text-align: center; }
    .table-data th {  font-weight: bold; }
    .table-data td.text-left { text-align: left; vertical-align: top; }
    .badge-diakui {   padding: 1px 5px; border-radius: 3px; font-weight: bold; }
    .badge-sebagian {   padding: 1px 5px; border-radius: 3px; font-weight: bold; }
    .badge-tidak {   padding: 1px 5px; border-radius: 3px; font-weight: bold; }
    .signature-table { width: 100%; margin-top: 40px; font-size: 11px; page-break-inside: avoid; border: none; }
    .signature-table td { text-align: left; vertical-align: top; border: none; padding: 0; }
    .sig-space { height: 65px; }
    .summary-row {  font-weight: bold; }
</style>

<div class="kode-doc">F12</div>

<h4 class="doc-title">FORMULIR 12: MATRIKS ALIH KREDIT PEMOHON RPL</h4>

<table class="table-info">
    <tr>
        <td class="label">Nama Pemohon</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->dataDiri->nama_lengkap ?? $pendaftaran->user->nama ?? '-' }}</td>
        <td width="5%"></td>
        <td class="label">Nomor Pendaftaran</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->nomor_pendaftaran ?? 'RPL-'.$pendaftaran->id }}</td>
    </tr>
    <tr>
        <td class="label">Program Studi Tujuan</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->prodi->nama ?? '-' }}</td>
        <td></td>
        <td class="label">Tanggal</td>
        <td class="colon">:</td>
        <td>{{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</td>
    </tr>
</table>

<table class="table-data">
    <thead>
        <tr>
            <th rowspan="2" width="4%">No.</th>
            <th colspan="2" width="30%">Mata Kuliah Asal (PT Asal)</th>
            <th colspan="2" width="30%">Mata Kuliah Prodi Tujuan</th>
            <th rowspan="2" width="10%">Kesenjangan</th>
            <th rowspan="2" width="12%">Hasil</th>
            <th rowspan="2" width="14%">Catatan Asesor</th>
        </tr>
        <tr>
            <th>Kode MK</th>
            <th>Nama Mata Kuliah</th>
            <th>Kode MK</th>
            <th>Nama Mata Kuliah (SKS)</th>
        </tr>
    </thead>
    <tbody>
        @php
            // Kumpulkan semua pemetaan dari semua asesor (deduplikasi by mk_poliban_id)
            $semuaPemetaan = collect();
            foreach($pendaftaran->penugasanAsesor ?? [] as $penugasan) {
                foreach($penugasan->pemetaanMk ?? [] as $peta) {
                    $semuaPemetaan->push([
                        'peta' => $peta,
                        'asesor_nama' => $penugasan->asesor->nama ?? 'Asesor',
                        'urutan' => $penugasan->urutan,
                    ]);
                }
            }
            // Jika tidak ada pemetaan, coba dari data evaluasi diri sebagai fallback
            $kosong = $semuaPemetaan->isEmpty();
        @endphp

        @if($kosong)
            @for($i = 1; $i <= 5; $i++)
            <tr>
                <td>{{ $i }}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
            @endfor
        @else
            @foreach($semuaPemetaan as $idx => $item)
            @php
                $peta = $item['peta'];
                $keputusan = strtolower($peta->keputusan ?? '');
                $kesenjangan = strtolower($peta->kesenjangan ?? '');
                if (str_contains($keputusan, 'penuh')) {
                    $hasilLabel = 'Diakui Penuh';
                    $hasilClass = 'badge-diakui';
                } elseif (str_contains($keputusan, 'sebagian')) {
                    $hasilLabel = 'Diakui Sebagian';
                    $hasilClass = 'badge-sebagian';
                } else {
                    $hasilLabel = 'Tidak Diakui';
                    $hasilClass = 'badge-tidak';
                }
                if (str_contains($kesenjangan, 'sebagian')) {
                    $kesenjanganLabel = 'Sebagian Sesuai';
                } elseif (str_contains($kesenjangan, 'tidak')) {
                    $kesenjanganLabel = 'Tidak Sesuai';
                } else {
                    $kesenjanganLabel = 'Sesuai';
                }
            @endphp
            <tr>
                <td>{{ $idx + 1 }}</td>
                <td class="text-left">{{ $peta->mk_asal_kode ?? '-' }}</td>
                <td class="text-left">{{ $peta->mk_asal_nama ?? '-' }}</td>
                <td class="text-left">{{ $peta->mkPoliban->kode ?? '-' }}</td>
                <td class="text-left">
                    {{ $peta->mkPoliban->nama ?? '-' }}
                    @if($peta->mkPoliban)
                        <br><small style="">({{ $peta->mkPoliban->sks ?? '?' }} SKS)</small>
                    @endif
                </td>
                <td>{{ $kesenjanganLabel }}</td>
                <td><span class="{{ $hasilClass }}">{{ $hasilLabel }}</span></td>
                <td class="text-left">
                    {{ !empty($peta->catatan) && $peta->catatan !== '-' ? $peta->catatan : 'Tidak ada catatan' }}
                    <br><small style="">{{ $item['asesor_nama'] }}</small>
                </td>
            </tr>
            @endforeach
        @endif
    </tbody>
</table>

<table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid;">
    <tr>
        <td style="width: 50%; border: none; padding: 0;"></td>
        <td style="width: 50%; border: none; padding: 0; text-align: left;">
            Banjarmasin, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}
        </td>
    </tr>
    <tr>
        <td style="border: none; padding: 0;"></td>
        <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
            Pejabat Berwenang (Minimal Dekan atau setara),<br>
            Program Studi {{ $pendaftaran->prodi->nama ?? '..........................' }}<br>
            Politeknik Negeri Banjarmasin
        </td>
    </tr>
    <tr>
        <td style="border: none; padding: 0;"></td>
        <td style="height: 70px; border: none; padding: 0;"></td>
    </tr>
    <tr>
        <td style="border: none; padding: 0;"></td>
        <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
            <strong style="white-space: nowrap;">(........................................................)</strong>
        </td>
    </tr>
</table>
@endsection


