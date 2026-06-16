@extends('pdf.layout')

@section('title', 'F07 - Biodata Asesor')

@section('content')
<style>
        
        .header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  }
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 30px; font-size: 12px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 8px; text-align: left; vertical-align: top; }
        .table-data td:first-child { width: 5%; text-align: center; font-weight: bold; }
        .table-data td:nth-child(2) { width: 35%; font-weight: bold; }
        
        .signature-table { width: 100%; margin-top: 20px; page-break-inside: avoid; }
        .signature-table td { width: 100%; text-align: right; padding-right: 50px; }
        .signature-box { height: 70px; }
        .doc-kode { position: absolute; top: 0; right: 0; border: 1px solid black; padding: 5px 10px; font-weight: bold; font-size: 14px; }
        .asesor-wrapper { page-break-after: always; }
        .asesor-wrapper:last-child { page-break-after: avoid; }
    </style>
@php
        $penugasans = $pendaftaran->penugasanAsesor ?? [];
    @endphp

    @forelse($penugasans as $tugas)
    @php $asesor = $tugas->asesor; @endphp
    <div class="asesor-wrapper">
        <div class="doc-kode">F07</div>
        <div class="header" style="margin-top: 30px;">FORMULIR 7: BIODATA ASESOR</div>
        
        <table class="table-data">
            <tr>
                <td>1.</td>
                <td>Nama Lengkap</td>
                <td>{{ $asesor->nama ?? '-' }}</td>
            </tr>
            <tr>
                <td>2.</td>
                <td>Jenis Kelamin</td>
                <td>{{ ($asesor->jenis_kelamin ?? '') == 'L' ? 'Laki-laki' : (($asesor->jenis_kelamin ?? '') == 'P' ? 'Perempuan' : '-') }}</td>
            </tr>
            <tr>
                <td>3.</td>
                <td>Jabatan Fungsional</td>
                <td>{{ $asesor->jabatan ?? '-' }}</td>
            </tr>
            <tr>
                <td>4.</td>
                <td>NIP/NIK/Identitas lain</td>
                <td>{{ $asesor->nip ?? '-' }}</td>
            </tr>
            <tr>
                <td>5.</td>
                <td>Tempat dan Tanggal Lahir</td>
                <td>{{ $asesor->tempat_lahir ?? '-' }}, {{ $asesor->tanggal_lahir ? date('d F Y', strtotime($asesor->tanggal_lahir)) : '-' }}</td>
            </tr>
            <tr>
                <td>6.</td>
                <td>E-Mail</td>
                <td>{{ $asesor->email ?? '-' }}</td>
            </tr>
            <tr>
                <td>7.</td>
                <td>Nomor Telepon/HP</td>
                <td>{{ $asesor->phone ?? '-' }}</td>
            </tr>
            <tr>
                <td>8.</td>
                <td>Alamat Kantor</td>
                <td>Politeknik Negeri Banjarmasin</td>
            </tr>
            <tr>
                <td>9.</td>
                <td>Nomor Telepon/Fax</td>
                <td>-</td>
            </tr>
            <tr>
                <td>10.</td>
                <td>
                    Pendidikan<br><br>
                    Bidang Keilmuan<br><br>
                    Pendidikan Terakhir
                </td>
                <td>
                    <br><br>
                    {{ $asesor->bidang_keilmuan ?? '-' }}<br><br>
                    {{ $asesor->pendidikan_terakhir ?? '-' }}
                </td>
            </tr>
            <tr>
                <td>11.</td>
                <td>
                    Pekerjaan<br><br>
                    Nama Instansi<br><br>
                    Jabatan
                </td>
                <td>
                    <br><br>
                    {{ $asesor->instansi ?? 'Politeknik Negeri Banjarmasin' }}<br><br>
                    {{ $asesor->jabatan_instansi ?? 'Dosen' }}
                </td>
            </tr>
            <tr>
                <td>12.</td>
                <td>
                    Keanggotaan pada Asosiasi Profesi<br><br>
                    Keanggotaan Asosiasi
                </td>
                <td>
                    <br><br>
                    {{ $asesor->asosiasi_profesi ?? '-' }}
                </td>
            </tr>
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
                    Asesor RPL,
                </td>
            </tr>
            <tr>
                <td style="border: none; padding: 0;"></td>
                <td style="height: 70px; border: none; padding: 0;"></td>
            </tr>
            <tr>
                <td style="border: none; padding: 0;"></td>
                <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                    <strong style="white-space: nowrap;">({{ $asesor->nama ?? '.............................................................' }})</strong>
                </td>
            </tr>
        </table>
    </div>
    @empty
    <div class="doc-kode">F07</div>
    <div class="header">FORMULIR 7: BIODATA ASESOR</div>
    <p style="text-align: center; margin-top: 50px;">Belum ada asesor yang ditugaskan untuk pendaftaran ini.</p>
    @endforelse
@endsection


