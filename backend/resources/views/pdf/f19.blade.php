@extends('pdf.layout')

@section('title', 'F19 - Berita Acara Penetapan Kelulusan')

@section('content')
<style>
    @page { margin: 1.8cm 1.6cm; size: A4 portrait; }
    body { font-size: 12px; line-height: 1.5; }
    .kop-surat { margin-bottom: 26px; }
    .judul-utama {
        margin: 8px 0 0;
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        line-height: 1.35;
    }
    .isi-berita { margin-top: 18px; text-align: justify; }
    .isi-berita p { margin: 0 0 12px; }
    .tabel-lulus {
        width: 100%;
        margin: 12px 0 18px;
        border-collapse: collapse;
        font-size: 11.5px;
    }
    .tabel-lulus th,
    .tabel-lulus td {
        border: 1px solid #000;
        padding: 6px 8px;
        vertical-align: top;
    }
    .tabel-lulus th {
        text-align: center;
        font-weight: bold;
    }
    .text-center { text-align: center; }
    .signature-table {
        width: 100%;
        margin-top: 28px;
        border-collapse: collapse;
        page-break-inside: avoid;
    }
    .signature-table td {
        width: 50%;
        border: none;
        padding: 0 12px;
        vertical-align: top;
        text-align: center;
    }
    .signature-space { height: 72px; }
    .signature-name { font-weight: bold; text-decoration: underline; }
    .signature-nip { margin-top: 2px; }
</style>

@php
    $prodi = $pendaftaran->prodi;
    $jurusan = $prodi?->jurusanData?->nama_jurusan ?? $prodi?->jurusan ?? '-';
    $prodiLabel = trim(($prodi?->jenjang ? $prodi->jenjang.' ' : '').($prodi?->nama ?? 'Program Studi'));
    $approval = $pendaftaran->plenoApproval;
    $tanggalRapat = $approval?->pimpinan_approved_at
        ?? $approval?->kaprodi_approved_at
        ?? $pendaftaran->updated_at
        ?? now();
    $tanggalCarbon = \Carbon\Carbon::parse($tanggalRapat)->locale('id');
    $hariRapat = $tanggalCarbon->translatedFormat('l');
    $tanggalTeks = $tanggalCarbon->translatedFormat('d F Y');
    $jamMulai = $tanggalCarbon->format('H:i');
    $jamSelesai = '-';
    $tempatRapat = $jurusan !== '-'
        ? 'Ruang Rapat Jurusan '.$jurusan.' Politeknik Negeri Banjarmasin'
        : 'Ruang Rapat Politeknik Negeri Banjarmasin';
    $pesertaLulus = ($f19PendaftarLulus ?? collect())->values();
    $koordinator = $approval?->kaprodiApprover?->nama ?? '................................';
    $ketuaJurusan = '................................';
    $nipKetuaJurusan = '-';
    $nipKoordinator = '-';
@endphp

<div class="judul-utama">
    <div>Berita Acara</div>
    <div>Penetapan Kelulusan Calon Mahasiswa Kelas RPL {{ $prodiLabel }}</div>
</div>

<div class="isi-berita">
    <p>
        Pada hari ini {{ $hariRapat }} tanggal {{ $tanggalTeks }} jam {{ $jamMulai }}
        sampai {{ $jamSelesai }} WITA yang bertempat di {{ $tempatRapat }}
        telah dilakukan rapat pleno.
    </p>

    <p>
        Kami yang bertanda tangan di bawah ini, Koordinator Program Studi {{ $prodiLabel }}
        bersama Asesor RPL (daftar hadir terlampir) telah mengadakan rapat pleno
        penetapan kelulusan mahasiswa kelas RPL dan menghasilkan keputusan bahwa
        nama-nama calon mahasiswa yang mendaftar Kelas RPL {{ $prodiLabel }} yang
        tercantum dalam berita acara ini dinyatakan <strong>LULUS SELEKSI</strong>.
        Adapun nama-nama calon mahasiswa yang berhasil lulus seleksi adalah sebagai berikut:
    </p>
</div>

<table class="tabel-lulus">
    <thead>
        <tr>
            <th style="width: 10%;">No.</th>
            <th style="width: 28%;">Kode Pendaftar</th>
            <th>Nama Calon Mahasiswa</th>
        </tr>
    </thead>
    <tbody>
        @foreach($pesertaLulus as $index => $peserta)
            <tr>
                <td class="text-center">{{ $index + 1 }}.</td>
                <td>{{ $peserta->nomor_pendaftaran ?? ('RPL-'.$peserta->id) }}</td>
                <td>{{ $peserta->user->nama ?? '-' }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="isi-berita">
    <p>
        Demikian Berita Acara Penetapan Kelulusan Calon Mahasiswa ini dibuat agar
        dapat dipergunakan sebagaimana mestinya.
    </p>
</div>

<table class="signature-table">
    <tr>
        <td>Mengetahui</td>
        <td>Banjarmasin, {{ $tanggalTeks }}</td>
    </tr>
    <tr>
        <td>Ketua Jurusan {{ $jurusan }}</td>
        <td>Koordinator P.S. {{ $prodiLabel }}</td>
    </tr>
    <tr>
        <td class="signature-space"></td>
        <td class="signature-space"></td>
    </tr>
    <tr>
        <td>
            <div class="signature-name">{{ $ketuaJurusan }}</div>
            <div class="signature-nip">NIP {{ $nipKetuaJurusan }}</div>
        </td>
        <td>
            <div class="signature-name">{{ $koordinator }}</div>
            <div class="signature-nip">NIP {{ $nipKoordinator }}</div>
        </td>
    </tr>
</table>
@endsection
