@extends('pdf.layout')

@section('title', 'Surat Keputusan RPL')

@section('content')
<style>
    @page { margin: 1.5cm; size: A4 portrait; }
    .sk-title { text-align: center; margin: 18px 0 16px; }
    .sk-title h2 { font-size: 14px; text-transform: uppercase; margin: 3px 0; }
    .sk-title p { font-size: 11px; margin: 2px 0; }
    .section { margin-bottom: 12px; text-align: justify; }
    .consideration { width: 100%; border-collapse: collapse; margin: 8px 0 14px; }
    .consideration td { border: none; padding: 2px 3px; vertical-align: top; }
    .consideration .label { width: 15%; font-weight: bold; }
    .consideration .colon { width: 2%; }
    .consideration .number { width: 4%; text-align: right; }
    .identity { width: 82%; margin: 8px auto 12px; border-collapse: collapse; }
    .identity td { border: none; padding: 3px 4px; vertical-align: top; }
    .identity .label { width: 32%; font-weight: bold; }
    .identity .colon { width: 3%; }
    .table-data { width: 100%; border-collapse: collapse; margin: 10px 0 14px; font-size: 10px; }
    .table-data th, .table-data td { border: 1px solid black; padding: 5px 6px; vertical-align: middle; }
    .table-data th { font-weight: bold; text-align: center; }
    .text-center { text-align: center; }
    .signature-table { width: 82%; margin-left: auto; margin-right: 0; margin-top: 22px; border-collapse: collapse; page-break-inside: avoid; }
    .signature-table td { border: none; padding: 0; vertical-align: top; }
    .qr-code { width: 105px; height: 105px; }
    .qr-caption { font-size: 8px; margin-top: 3px; line-height: 1.25; }
    .footer-note { margin-top: 20px; padding-top: 7px; border-top: 1px solid #999; text-align: center; font-size: 8px; }
</style>

@php
    $snapshot = $skSnapshot ?? $sk?->document_snapshot ?? [];
    $plenoDiakui = collect($snapshot['mata_kuliah'] ?? [])
        ->where('diakui', true)
        ->values();
    $nomorSk = $snapshot['nomor_sk'] ?? '-';
    $tanggalTerbit = $snapshot['tanggal_terbit'] ?? null;
    $namaPemohon = data_get($snapshot, 'pemohon.nama', '-');
    $nomorPendaftaran = $snapshot['nomor_pendaftaran'] ?? '-';
    $namaProdi = data_get($snapshot, 'prodi.nama', '-');
    $jenjangProdi = data_get($snapshot, 'prodi.jenjang', '-');
    $totalSks = $snapshot['total_sks_diakui'] ?? 0;
    $penerbitNama = data_get($snapshot, 'penerbit.nama');
    $penerbitNip = data_get($snapshot, 'penerbit.nip');
@endphp

<div class="sk-title">
    <h2>Surat Keputusan Direktur Politeknik Negeri Banjarmasin</h2>
    <p>Nomor: <strong>{{ $nomorSk }}</strong></p>
    <p>Tentang</p>
    <h2>Pengakuan Hasil Rekognisi Pembelajaran Lampau (RPL)</h2>
</div>

<div class="section">
    <table class="consideration">
        <tr>
            <td class="label">Menimbang</td>
            <td class="colon">:</td>
            <td class="number">a.</td>
            <td>bahwa berdasarkan hasil asesmen dan sidang pleno Rekognisi Pembelajaran Lampau, pemohon telah memenuhi ketentuan pengakuan capaian pembelajaran;</td>
        </tr>
        <tr>
            <td></td><td></td>
            <td class="number">b.</td>
            <td>bahwa hasil asesmen tersebut perlu ditetapkan dalam Surat Keputusan Direktur Politeknik Negeri Banjarmasin.</td>
        </tr>
        <tr>
            <td class="label">Mengingat</td>
            <td class="colon">:</td>
            <td class="number">1.</td>
            <td>ketentuan peraturan perundang-undangan mengenai penyelenggaraan pendidikan tinggi dan Rekognisi Pembelajaran Lampau;</td>
        </tr>
        <tr>
            <td></td><td></td>
            <td class="number">2.</td>
            <td>peraturan akademik dan pedoman penyelenggaraan Rekognisi Pembelajaran Lampau Politeknik Negeri Banjarmasin;</td>
        </tr>
        <tr>
            <td class="label">Memperhatikan</td>
            <td class="colon">:</td>
            <td></td>
            <td>hasil sidang pleno Tim Asesor RPL Program Studi {{ $namaProdi }}.</td>
        </tr>
    </table>
</div>

<div class="sk-title" style="margin: 10px 0;">
    <h2>Memutuskan</h2>
</div>

<div class="section">
    <p><strong>Menetapkan:</strong></p>
    <p><strong>PERTAMA:</strong> Memberikan pengakuan hasil Rekognisi Pembelajaran Lampau kepada:</p>

    <table class="identity">
        <tr>
            <td class="label">Nama</td><td class="colon">:</td>
            <td>{{ $namaPemohon }}</td>
        </tr>
        <tr>
            <td class="label">Nomor Pendaftaran</td><td class="colon">:</td>
            <td>{{ $nomorPendaftaran }}</td>
        </tr>
        <tr>
            <td class="label">Program Studi</td><td class="colon">:</td>
            <td>{{ $namaProdi }}</td>
        </tr>
        <tr>
            <td class="label">Jenjang</td><td class="colon">:</td>
            <td>{{ $jenjangProdi }}</td>
        </tr>
        <tr>
            <td class="label">Total SKS Diakui</td><td class="colon">:</td>
            <td><strong>{{ $totalSks }} SKS</strong></td>
        </tr>
    </table>
</div>

<div class="section">
    <p><strong>KEDUA:</strong> Mata kuliah yang diakui berdasarkan hasil asesmen adalah sebagai berikut:</p>

    <table class="table-data">
        <thead>
            <tr>
                <th width="6%">No.</th>
                <th width="15%">Kode MK</th>
                <th width="43%">Mata Kuliah</th>
                <th width="10%">SKS</th>
                <th width="12%">Nilai</th>
                <th width="14%">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($plenoDiakui as $index => $pleno)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $pleno['kode'] ?? '-' }}</td>
                    <td>{{ $pleno['nama'] ?? '-' }}</td>
                    <td class="text-center">{{ $pleno['sks'] ?? '-' }}</td>
                    <td class="text-center">{{ $pleno['nilai'] ?? '-' }}</td>
                    <td class="text-center">Diakui</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center">Tidak ada mata kuliah yang diakui.</td>
                </tr>
            @endforelse
            <tr>
                <td colspan="3" style="text-align: right; font-weight: bold;">Total SKS Diakui</td>
                <td class="text-center" style="font-weight: bold;">{{ $totalSks }}</td>
                <td colspan="2"></td>
            </tr>
        </tbody>
    </table>
</div>

<div class="section">
    <p><strong>KETIGA:</strong> Hasil pengakuan mata kuliah menjadi dasar proses administrasi akademik pada Program Studi {{ $namaProdi }}.</p>
    <p><strong>KEEMPAT:</strong> Keputusan ini berlaku sejak tanggal ditetapkan. Apabila kemudian terdapat kekeliruan, akan dilakukan perbaikan sebagaimana mestinya.</p>
</div>

<table class="signature-table">
    <tr>
        <td style="width: 48%;">
            @if($qrCodeBase64 && $qrCodeMime)
                <img src="data:{{ $qrCodeMime }};base64,{{ $qrCodeBase64 }}" class="qr-code" alt="QR Verifikasi">
                <div class="qr-caption">Pindai QR untuk memverifikasi<br>keaslian Surat Keputusan.</div>
            @endif
        </td>
        <td style="width: 52%;">
            Ditetapkan di Banjarmasin<br>
            pada tanggal {{ $tanggalTerbit ? \Carbon\Carbon::parse($tanggalTerbit)->translatedFormat('d F Y') : '-' }}<br><br>
            Direktur Politeknik Negeri Banjarmasin,
            <div style="height: 65px;"></div>
            <strong>{{ $penerbitNama ?? '................................................' }}</strong><br>
            NIP. {{ $penerbitNip ?? '................................................' }}
        </td>
    </tr>
</table>

<div class="footer-note">
    Dokumen ini diterbitkan secara elektronik melalui SIRPL Politeknik Negeri Banjarmasin.
    Keaslian dokumen dapat diverifikasi melalui kode QR.
</div>
@endsection
