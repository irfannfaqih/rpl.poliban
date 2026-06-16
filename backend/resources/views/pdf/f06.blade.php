@extends('pdf.layout')

@section('title', 'F06 - Tanda Terima Portofolio')

@section('content')
    <style>
        .header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  }
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid black; }
        .table-info td { border: 1px solid black; padding: 6px; }
        .table-info td:first-child { font-weight: bold; width: 35%;  }
        
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 20px; font-size: 11px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 6px; text-align: left; vertical-align: middle; }
        .table-data th {  font-weight: bold; text-align: center; }
        
        .text-center { text-align: center !important; }
        
        .signature-table { width: 100%; margin-top: 50px; page-break-inside: avoid; }
        .signature-table td { width: 100%; text-align: right; padding-right: 20px; }
        .signature-box { height: 70px; }
        .doc-kode { position: absolute; top: 0; right: 0; border: 1px solid black; padding: 5px 10px; font-weight: bold; font-size: 14px; }
    </style>

    <div class="doc-kode">F06</div>
    
    <div class="header">FORMULIR 6: TANDA TERIMA PORTOFOLIO</div>
    
    <p>Sudah diterima portofolio dari Pemohon RPL Program Studi <strong>{{ $pendaftaran->prodi->nama ?? '..........................' }}</strong> Politeknik Negeri Banjarmasin untuk:</p>
    
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
            <td>Email</td>
            <td>{{ $pendaftaran->user->email ?? '-' }}</td>
        </tr>
        <tr>
            <td>No. Telp/HP</td>
            <td>{{ $pendaftaran->dataDiri->no_hp ?? ($pendaftaran->user->phone ?? '-') }}</td>
        </tr>
        <tr>
            <td>Jenjang Pendidikan Sebelumnya</td>
            <td>
                @php
                    $pendidikanTerakhir = $pendaftaran->riwayatPendidikan->sortByDesc('tahun_lulus')->first();
                @endphp
                {{ $pendidikanTerakhir ? $pendidikanTerakhir->jenjang . ' - ' . $pendidikanTerakhir->institusi : '-' }}
            </td>
        </tr>
    </table>

    <p>Dengan Rincian dokumen/berkas sebagai berikut:</p>

    <table class="table-data">
        <thead>
            <tr>
                <th width="5%">No.</th>
                <th width="45%">Nama Dokumen/Berkas</th>
                <th width="10%">Jumlah</th>
                <th width="15%">Satuan</th>
                <th width="25%">Mata Kuliah yang Dilamar/Diuji</th>
            </tr>
        </thead>
        <tbody>
            @php 
                $dokumenList = $dokumen ?? []; 
                if(count($dokumenList) == 0 && isset($pendaftaran->dokumen)) {
                    $dokumenList = $pendaftaran->dokumen;
                }
            @endphp
            
            @forelse($dokumenList as $index => $doc)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $doc->nama ?? $doc->deskripsi ?? 'Dokumen Pendukung' }}</td>
                <td class="text-center">1</td>
                <td class="text-center">Berkas</td>
                <td>Semua Mata Kuliah (Terkait)</td>
            </tr>
            @empty
            <tr>
                <td class="text-center">1</td>
                <td>Ijazah Terakhir</td>
                <td class="text-center">1</td>
                <td class="text-center">Berkas</td>
                <td>-</td>
            </tr>
            <tr>
                <td class="text-center">2</td>
                <td>Transkrip Akademik</td>
                <td class="text-center">1</td>
                <td class="text-center">Berkas</td>
                <td>-</td>
            </tr>
            <tr>
                <td class="text-center">3</td>
                <td>Curriculum Vitae</td>
                <td class="text-center">1</td>
                <td class="text-center">Berkas</td>
                <td>-</td>
            </tr>
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
                Program Studi {{ $pendaftaran->prodi->nama ?? '..........................' }}<br>
                Politeknik Negeri Banjarmasin<br>
                Pejabat Berwenang / Admin Program Studi,
            </td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="height: 70px; border: none; padding: 0;"></td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">(....................................................................)</strong>
            </td>
        </tr>
    </table>
@endsection


