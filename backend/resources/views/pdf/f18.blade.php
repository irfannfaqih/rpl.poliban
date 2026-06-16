@extends('pdf.layout')

@section('title', 'F18 - Rekap Mahasiswa RPL')

@section('content')
<style>
        
        .header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  }
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-info td { padding: 4px; vertical-align: top; }
        .table-info .label { width: 25%; font-weight: bold; }
        .table-info .colon { width: 2%; }
        
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 20px; font-size: 10px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 6px; text-align: left; vertical-align: top; }
        .table-data th {  font-weight: bold; text-align: center; }
        .table-data td.text-center { text-align: center; }
        
        .signature-table { width: 100%; margin-top: 40px; page-break-inside: avoid; border: none; }
        .signature-table td { text-align: left; vertical-align: top; border: none; padding: 0; }
        .signature-box { height: 70px; }
        .doc-kode { position: absolute; top: 0; right: 0; border: 1px solid black; padding: 5px 10px; font-weight: bold; font-size: 14px; }
        ol { margin-top: 0; margin-bottom: 0; padding-left: 20px; }
    </style>
<div class="doc-kode">F18</div>
    
    <div class="header">FORMULIR 18: REKAPITULASI MAHASISWA RPL<br>TAHUN AKADEMIK {{ date('Y') }} / {{ date('Y', strtotime('+1 year')) }}</div>
    
    <table class="table-info">
        <tr>
            <td class="label">Program Studi</td>
            <td class="colon">:</td>
            <td>{{ $pendaftaran->prodi->nama ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Jenjang Pendidikan</td>
            <td class="colon">:</td>
            <td>{{ $pendaftaran->prodi->jenjang ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Level KKNI</td>
            <td class="colon">:</td>
            <td>{{ str_contains(strtolower($pendaftaran->prodi->jenjang ?? ''), 'd3') ? 'Level 5' : 'Level 6' }}</td>
        </tr>
    </table>

    <table class="table-data">
        <thead>
            <tr>
                <th width="5%">No.</th>
                <th width="25%">Nama Mahasiswa</th>
                <th width="45%">Mata Kuliah Lulus Asesmen</th>
                <th width="10%">Beban SKS</th>
                <th width="15%">Semester</th>
            </tr>
        </thead>
        <tbody>
            @php 
            // Gunakan pleno_mk sebagai sumber data yang benar (hasil sidang pleno)
            $plenoList = $pendaftaran->plenoMk ?? collect();
            $lulusList = $plenoList->filter(fn($p) => $p->keputusan_final !== 'T' && $p->keputusan_final !== null);
            $totalSks = 0;
        @endphp
            <tr>
                <td class="text-center">1.</td>
                <td>{{ $pendaftaran->user->nama ?? '-' }}<br><br><span style=" font-size: 9px;">NIM: ........................</span></td>
                <td>
                    @if($lulusList->count() > 0)
                    <ol>
                        @foreach($lulusList as $pleno)
                            @php 
                                $sks = $pleno->mataKuliah->sks ?? 0;
                                $totalSks += $sks;
                            @endphp
                            <li>{{ $pleno->mataKuliah->nama ?? '-' }} ({{ $sks }} SKS) - {{ $pleno->keputusan_final }}</li>
                        @endforeach
                    </ol>
                    @else
                        <em>Belum ada mata kuliah yang diakui</em>
                    @endif
                </td>
                <td class="text-center" style="vertical-align: middle; font-weight: bold; font-size: 14px;">{{ $totalSks }}</td>
                <td class="text-center" style="vertical-align: middle;">
                    @if($lulusList->count() > 0)
                        Gasal / Genap
                    @else
                        -
                    @endif
                </td>
            </tr>
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
                Pejabat yang berwenang (Kaprodi / Dekan),<br>
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
                <strong style="white-space: nowrap;">(....................................................................)</strong>
            </td>
        </tr>
    </table>
@endsection


