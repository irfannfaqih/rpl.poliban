@extends('pdf.layout')

@section('title', 'F14 - Rekap Asesmen Prodi')

@section('content')
<style>
        
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
        .doc-kode { float: right; border: 1px solid black; padding: 4px 10px; font-weight: bold; font-size: 13px; margin-top: -10px; }
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-info td { padding: 4px; vertical-align: top; }
        .table-info .label { width: 30%; font-weight: bold; }
        .table-info .colon { width: 2%; }
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 30px; font-size: 10px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 6px; text-align: center; vertical-align: middle; }
        .table-data th {  font-weight: bold; }
        .table-data td.text-left { text-align: left; }
        .signature-table { width: 100%; margin-top: 50px; page-break-inside: avoid; border: none; }
        .signature-table td { text-align: left; vertical-align: top; border: none; padding: 0; }
        .signature-box { height: 70px; }
        .badge-diakui {  font-size: 9px; font-weight: bold; }
        .badge-tidak {  font-size: 9px; font-weight: bold; }
    </style>
    <div class="doc-kode">F14</div>
    <h4 class="doc-title">FORMULIR 14: REKAP ASESMEN PRODI</h4>

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
            <td class="label">E-mail</td><td class="colon">:</td>
            <td>{{ $pendaftaran->user->email ?? '-' }}</td>
            <td></td>
            <td class="label">Level KKNI</td><td class="colon">:</td>
            <td>{{ str_contains(strtolower($pendaftaran->prodi->jenjang ?? ''), 'd3') ? 'Level 5' : 'Level 6' }}</td>
        </tr>
    </table>

    <table class="table-data">
        <thead>
            <tr>
                <th rowspan="2" width="5%">No.</th>
                <th rowspan="2" width="10%">Kode MK</th>
                <th rowspan="2" width="28%">Mata Kuliah</th>
                <th rowspan="2" width="7%">Skor Mandiri</th>
                <th colspan="2" width="20%">Hasil Asesmen</th>
                <th rowspan="2" width="15%">Rata-rata Asesmen<br><small>(Hasil Rapat Pleno)</small></th>
                <th rowspan="2" width="15%">Status</th>
            </tr>
            <tr>
                <th>Asesor RPL 1</th>
                <th>Asesor RPL 2</th>
            </tr>
        </thead>
        <tbody>
            @php
                $plenoList = $pendaftaran->plenoMk ?? collect();
                $no = 1;
            @endphp
            @forelse($plenoList as $pleno)
            @php
                $isDiakui = $pleno->keputusan_final !== 'T' && $pleno->keputusan_final !== null;
                $statusLabel = $isDiakui ? 'Diakui' : 'Tidak Diakui';

                // Skor mandiri = rata-rata profisiensi pemohon untuk semua CPMK MK ini
                // Profisiensi: 5=Sangat Mampu(A/4.0), 4=Mampu(B/3.0), 2=Kurang Mampu(C/2.0), 1=Tidak Mampu(T/0)
                $evalMk = $pendaftaran->evaluasiDiri
                    ->filter(fn($e) => $e->cpmk && $e->cpmk->mata_kuliah_id == $pleno->mata_kuliah_id);
                $totalCpmkMk = $evalMk->count();

                if ($totalCpmkMk === 0) {
                    $skorMandiri = '-';
                } else {
                    $bobotMap = ['5' => 4.0, '4' => 3.0, '2' => 2.0, '1' => 0.0];
                    $totalBobot = $evalMk->sum(fn($e) => $bobotMap[(string)$e->profisiensi] ?? 0);
                    $rataBobot = $totalBobot / $totalCpmkMk;
                    // Konversi ke huruf mutu
                    $skorMandiri = match(true) {
                        $rataBobot >= 3.5 => 'A',
                        $rataBobot >= 2.5 => 'B',
                        $rataBobot >= 1.5 => 'C',
                        $rataBobot > 0    => 'D',
                        default           => 'T',
                    };
                }
            @endphp
            <tr>
                <td>{{ $no++ }}</td>
                <td>{{ $pleno->mataKuliah->kode ?? '-' }}</td>
                <td class="text-left">{{ $pleno->mataKuliah->nama ?? '-' }}</td>
                <td>{{ $skorMandiri }}</td>
                <td>{{ $pleno->nilai_a1 ?? '-' }}</td>
                <td>{{ $pleno->nilai_a2 ?? '-' }}</td>
                <td style="font-weight:bold;">{{ $pleno->rata_rata !== null ? number_format($pleno->rata_rata, 1) : '-' }}<br>
                    @if($pleno->keputusan_final)<small>({{ $pleno->keputusan_final }})</small>@endif
                </td>
                <td>
                    @if($isDiakui)
                        <span class="badge-diakui">DIAKUI</span>
                    @else
                        <span class="badge-tidak">TIDAK DIAKUI</span>
                    @endif
                </td>
            </tr>
            @empty
            @for($i=1; $i<=5; $i++)
            <tr>
                <td>{{ $i }}</td>
                <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
            @endfor
            @endforelse
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


