@extends('pdf.layout')

@section('title', 'F08 - Asesmen Tahap 2')

@section('content')
<style>
        
        .header { text-align: center; margin-bottom: 30px; font-weight: bold; font-size: 14px;  }
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid black; }
        .table-info td { border: 1px solid black; padding: 8px; }
        .table-info td:first-child { font-weight: bold; width: 35%;  }
        
        .signature-table { width: 100%; margin-top: 50px; page-break-inside: avoid; }
        .signature-table td { width: 50%; text-align: center; vertical-align: top; }
        .signature-box { height: 80px; }
        .doc-kode { position: absolute; top: 0; right: 0; border: 1px solid black; padding: 5px 10px; font-weight: bold; font-size: 14px; }
    </style>
<div class="doc-kode">F08</div>
    
    <div class="header">FORMULIR 8: ASESMEN TAHAP 2</div>
    
    <p>Asesmen tahap 2 dilaksanakan setelah Pemohon dinyatakan Lulus <em>Desk Evaluation</em> dan Asesmen Portofolio, dengan data pemohon sebagai berikut:</p>
    
    <table class="table-info">
        <tr>
            <td>Nama</td>
            <td>{{ $pendaftaran->dataDiri->nama_lengkap ?? ($pendaftaran->user->nama ?? '-') }}</td>
        </tr>
        <tr>
            <td>Alamat</td>
            <td>{{ $pendaftaran->dataDiri->alamat ?? ($pendaftaran->user->alamat ?? '-') }}</td>
        </tr>
        <tr>
            <td>No. HP</td>
            <td>{{ $pendaftaran->dataDiri->no_hp ?? ($pendaftaran->user->phone ?? '-') }}</td>
        </tr>
        <tr>
            <td>Email</td>
            <td>{{ $pendaftaran->user->email ?? '-' }}</td>
        </tr>
        <tr>
            <td>Jenjang Pendidikan sebelumnya</td>
            <td>@php
                    $pendidikanTerakhir = $pendaftaran->riwayatPendidikan->sortByDesc('tahun_lulus')->first();
                @endphp
                {{ $pendidikanTerakhir ? $pendidikanTerakhir->jenjang . ' - ' . $pendidikanTerakhir->institusi : '-' }}</td>
        </tr>
    </table>

    @php
        // Cek data jadwal dari ujiLanjutan jika ada
        $ujiLanjutan = $pendaftaran->ujiLanjutan ?? null;
        $tanggalUjian = $ujiLanjutan && $ujiLanjutan->tanggal_ujian ? date('d F Y', strtotime($ujiLanjutan->tanggal_ujian)) : '.........................................................';
        $waktuUjian = $ujiLanjutan && $ujiLanjutan->waktu_ujian ? $ujiLanjutan->waktu_ujian : '.........................................................';
        $tempatUjian = $ujiLanjutan && $ujiLanjutan->tempat ? $ujiLanjutan->tempat : '.........................................................';
    @endphp

    <p>Maka kepada yang bersangkutan diwajibkan mengikuti asesmen lanjutan yang akan diselenggarakan pada:</p>

    <table class="table-info">
        <tr>
            <td>Hari/Tanggal</td>
            <td>{{ $tanggalUjian }}</td>
        </tr>
        <tr>
            <td>Waktu</td>
            <td>{{ $waktuUjian }}</td>
        </tr>
        <tr>
            <td>Tempat / Media</td>
            <td>{{ $tempatUjian }}</td>
        </tr>
        <tr>
            <td>Agenda</td>
            <td>Asesmen Tulis dan Lisan (Wawancara) atau Demonstrasi Praktik</td>
        </tr>
    </table>

    <p>Asesmen tersebut wajib diikuti oleh Pemohon RPL.</p>

    <table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid;">
        <tr>
            <td style="width: 50%; border: none; padding: 0;"></td>
            <td style="width: 50%; border: none; padding: 0; text-align: left;">
                Banjarmasin, {{ date('d F Y') }}
            </td>
        </tr>
        <tr>
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Pemohon RPL,
            </td>
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Program Studi {{ $pendaftaran->prodi->nama ?? '...................................' }}<br>
                Politeknik Negeri Banjarmasin<br>
                Pejabat Berwenang / Admin,
            </td>
        </tr>
        <tr>
            <td style="height: 70px; border: none; padding: 0;"></td>
            <td style="border: none; padding: 0;"></td>
        </tr>
        <tr>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $pendaftaran->user->nama ?? '.....................................................' }})</strong>
            </td>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">(..................................................................)</strong>
            </td>
        </tr>
    </table>
@endsection


