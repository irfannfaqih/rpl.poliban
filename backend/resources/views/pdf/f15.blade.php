@extends('pdf.layout')

@section('title', 'F15 - Rekap Asesmen Pemohon')

@section('content')
<style>
        
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-info td { padding: 4px; vertical-align: top; }
        .table-info .label { width: 30%; font-weight: bold; }
        .table-info .colon { width: 2%; }
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 20px; font-size: 10px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 6px; text-align: center; vertical-align: middle; }
        .table-data th {  font-weight: bold; }
        .table-data td.text-left { text-align: left; }
        .signature-table { width: 100%; margin-top: 40px; page-break-inside: avoid; border: none; }
        .signature-table td { text-align: left; vertical-align: top; border: none; padding: 0; }
        .signature-box { height: 70px; }
        .doc-kode { float: right; border: 1px solid black; padding: 4px 10px; font-weight: bold; font-size: 13px; margin-top: -10px; }
        .catatan { font-size: 10px; border: 1px solid black; padding: 10px; margin-bottom: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
        .header table { width: 100%; border: none; }
        .header td { border: none; padding: 0; }
        .logo { width: 80px; height: auto; }
        .kop-teks { text-align: center; }
        .kop-teks h2, .kop-teks h3, .kop-teks p { margin: 0; padding: 2px 0; }
        .kop-teks h2 { font-size: 16px; text-transform: uppercase; }
        .kop-teks h3 { font-size: 14px; }
        .kop-teks p { font-size: 10px; }
        h4.doc-title { text-align: center; font-size: 13px; margin: 15px 0 10px 0; text-transform: uppercase;  font-weight: bold; }
    </style>
    <div class="doc-kode">F15</div>
    <h4 class="doc-title">FORMULIR 15: REKAP ASESMEN PEMOHON</h4>

    <table class="table-info">
        <tr>
            <td class="label">Nama</td><td class="colon">:</td>
            <td>{{ $pendaftaran->user->nama ?? '-' }}</td>
            <td width="5%"></td>
            <td class="label">Program Studi</td><td class="colon">:</td>
            <td>{{ $pendaftaran->prodi->nama ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">No. Pendaftaran</td><td class="colon">:</td>
            <td>{{ $pendaftaran->nomor_pendaftaran ?? 'RPL-'.$pendaftaran->id }}</td>
            <td></td>
            <td class="label">Tanggal</td><td class="colon">:</td>
            <td>{{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</td>
        </tr>
        <tr>
            <td class="label">No HP / Email</td><td class="colon">:</td>
            <td>{{ $pendaftaran->dataDiri->no_hp ?? $pendaftaran->user->phone ?? '-' }} / {{ $pendaftaran->user->email ?? '-' }}</td>
            <td></td>
            <td class="label">Pendidikan Sebelumnya</td><td class="colon">:</td>
            <td>
                @php
                    $riwayatTerakhir = $pendaftaran->riwayatPendidikan->sortByDesc('tahun_lulus')->first();
                @endphp
                {{ $riwayatTerakhir ? ($riwayatTerakhir->jenjang . ' - ' . $riwayatTerakhir->program_studi . ' (' . $riwayatTerakhir->institusi . ')') : '-' }}
            </td>
        </tr>
    </table>

    <table class="table-data">
        <thead>
            <tr>
                <th width="5%">No.</th>
                <th width="10%">Kode MK</th>
                <th width="20%">Mata Kuliah</th>
                <th width="8%">SKS</th>
                <th width="10%">Nilai A1</th>
                <th width="10%">Nilai A2</th>
                <th width="12%">Keputusan Final</th>
                <th width="25%">Catatan Pleno</th>
            </tr>
        </thead>
        <tbody>
            @php
                $plenoList = $pendaftaran->plenoMk ?? collect();
                $totalSks = 0;
                $totalSksDiakui = 0;
            @endphp
            @forelse($plenoList as $idx => $pleno)
            @php
                $isDiakui = $pleno->keputusan_final !== 'T' && $pleno->keputusan_final !== null;
                $sks = $pleno->mataKuliah->sks ?? 0;
                $totalSks += $sks;
                if($isDiakui) $totalSksDiakui += $sks;
            @endphp
            <tr>
                <td>{{ $idx + 1 }}</td>
                <td>{{ $pleno->mataKuliah->kode ?? '-' }}</td>
                <td class="text-left">{{ $pleno->mataKuliah->nama ?? '-' }}</td>
                <td>{{ $sks }}</td>
                <td>{{ $pleno->nilai_a1 ?? '-' }}</td>
                <td>{{ $pleno->nilai_a2 ?? '-' }}</td>
                <td style="font-weight:bold;">
                    {{ $pleno->keputusan_final ?? '-' }}
                    @if($isDiakui) <br><small style="">DIAKUI</small>
                    @else <br><small style="">TIDAK DIAKUI</small>
                    @endif
                </td>
                <td class="text-left">{{ $pleno->catatan_pleno ?? '-' }}</td>
            </tr>
            @empty
            @for($i=1; $i<=5; $i++)
            <tr><td>{{ $i }}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
            @endfor
            @endforelse
            <tr style=" font-weight:bold;">
                <td colspan="3" style="text-align:right; padding-right:10px;">TOTAL</td>
                <td>{{ $totalSks }} SKS</td>
                <td colspan="2"></td>
                <td>{{ $totalSksDiakui }} SKS Diakui</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <div class="catatan">
        <strong>Catatan:</strong>
        <ol style="margin-top:5px; margin-bottom:0; padding-left:20px; font-size:10px;">
            <li>Lakukan identifikasi mata kuliah sesuai dengan semester berjalan program reguler.</li>
            <li>Isi Kartu Rencana Studi (KRS) di bagian akademik fakultas/prodi.</li>
        </ol>
    </div>

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
                Pejabat yang berwenang (Minimal Dekan atau setara),<br>
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


