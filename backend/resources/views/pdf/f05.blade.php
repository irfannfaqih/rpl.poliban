@extends('pdf.layout')

@section('title', 'F05 - Asesmen Capaian Pembelajaran')

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
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .table-info td { padding: 4px; vertical-align: top; }
        .table-info .label { width: 30%; font-weight: bold; }
        .table-info .colon { width: 2%; }
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 20px; font-size: 9px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 5px 6px; text-align: left; vertical-align: middle; }
        .table-data th {  font-weight: bold; text-align: center; vertical-align: middle; }
        .text-center { text-align: center !important; }
        .badge-diakui {  font-weight: bold; }
        .badge-belum {  font-weight: bold; }
        .signature-table { width: 100%; margin-top: 30px; page-break-inside: avoid; }
        .signature-table td { width: 50%; text-align: center; vertical-align: top; }
        .signature-box { height: 70px; }
    </style>
@php
        // Ambil penilaian dari kedua asesor, key-by cpmk_id
        $tugasA1 = $pendaftaran->penugasanAsesor->where('urutan', 'asesor_1')->first();
        $tugasA2 = $pendaftaran->penugasanAsesor->where('urutan', 'asesor_2')->first();

        $penilaianA1 = $tugasA1 ? $tugasA1->penilaianCpmk->keyBy('cpmk_id') : collect();
        $penilaianA2 = $tugasA2 ? $tugasA2->penilaianCpmk->keyBy('cpmk_id') : collect();

        // Kumpulkan semua CPMK yang dinilai asesor ditambah yang diajukan pemohon
        $cpmkEvaluasi = collect($pendaftaran->evaluasiDiri ?? [])->pluck('cpmk_id');
        $semuaCpmkIds = $penilaianA1->keys()->merge($penilaianA2->keys())->merge($cpmkEvaluasi)->unique();

        $asesorA1Nama = $tugasA1?->asesor?->nama ?? 'Asesor 1';
        $asesorA2Nama = $tugasA2?->asesor?->nama ?? 'Asesor 2';
    @endphp

    <div class="doc-kode">F05</div>
    <h4 class="doc-title">FORMULIR 5: ASESMEN CAPAIAN PEMBELAJARAN</h4>

    <table class="table-info">
        <tr>
            <td class="label">Nama Pemohon</td><td class="colon">:</td>
            <td>{{ $pendaftaran->user->nama ?? '-' }}</td>
            <td width="5%"></td>
            <td class="label">Program Studi</td><td class="colon">:</td>
            <td>{{ $pendaftaran->prodi->nama ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Nama Asesor RPL 1</td><td class="colon">:</td>
            <td>{{ $asesorA1Nama }}</td>
            <td></td>
            <td class="label">Nama Asesor RPL 2</td><td class="colon">:</td>
            <td>{{ $asesorA2Nama }}</td>
        </tr>
        <tr>
            <td class="label">Nomor Pendaftaran</td><td class="colon">:</td>
            <td>{{ $pendaftaran->nomor_pendaftaran ?? 'RPL-'.$pendaftaran->id }}</td>
            <td></td>
            <td class="label">Tanggal</td><td class="colon">:</td>
            <td>{{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</td>
        </tr>
    </table>

    <table class="table-data">
        <thead>
            <tr>
                <th rowspan="2" width="5%">No.</th>
                <th rowspan="2" width="18%">Mata Kuliah</th>
                <th rowspan="2" width="32%">Capaian Pembelajaran (CPMK)</th>
                <th rowspan="2" width="15%">Dokumen Relevan</th>
                <th colspan="2" width="20%">Rekomendasi</th>
                <th rowspan="2" width="10%">Catatan Asesor</th>
            </tr>
            <tr>
                <th width="10%">Diakui</th>
                <th width="10%">Belum Diakui</th>
            </tr>
        </thead>
        <tbody>
            @if($semuaCpmkIds->isEmpty())
                <tr>
                    <td colspan="7" class="text-center" style="padding: 16px;  font-style: italic;">
                        Belum ada data penilaian CPMK dari asesor.
                    </td>
                </tr>
            @else
                @php $no = 1; @endphp
                @foreach($semuaCpmkIds as $cpmkId)
                @php
                    // Ambil dari asesor 1 sebagai representasi utama, fallback asesor 2
                    $p    = $penilaianA1->get($cpmkId) ?? $penilaianA2->get($cpmkId);
                    
                    // Dokumen relevan dari evaluasi diri pemohon untuk CPMK ini
                    $evalDiri    = collect($pendaftaran->evaluasiDiri ?? [])->firstWhere('cpmk_id', $cpmkId);
                    
                    $cpmk = $p?->cpmk ?? $evalDiri?->cpmk;
                    $mk   = $cpmk?->mataKuliah;
                    $nilai = $p?->nilai;

                    $dokIds      = is_array($evalDiri?->dokumen_pendukung)
                        ? $evalDiri->dokumen_pendukung
                        : json_decode($evalDiri?->dokumen_pendukung ?? '[]', true);
                    $dokumenMap  = $pendaftaran->dokumen->mapWithKeys(fn($d) => [$d->id => $d->nama ?? $d->tipe]);
                    $dokNama     = collect($dokIds)->map(fn($id) => $dokumenMap[$id] ?? "Dok-{$id}")->implode(', ');
                @endphp
                <tr>
                    <td class="text-center">{{ $no++ }}</td>
                    <td>{{ $mk->nama ?? '-' }}<br><small style="">{{ $mk->kode ?? '' }}</small></td>
                    <td>{{ $cpmk->deskripsi ?? $cpmk->kode ?? '-' }}</td>
                    <td style="font-size:8px;">{{ $dokNama ?: 'Portofolio' }}</td>
                    <td class="text-center">
                        @if($nilai === 'diakui') <span class="badge-diakui"><span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span></span> @endif
                    </td>
                    <td class="text-center">
                        @if($nilai === 'belum_diakui') <span class="badge-belum"><span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span></span> @endif
                    </td>
                    <td style="font-size:8px;">{{ $p?->catatan ?? '-' }}</td>
                </tr>
                @endforeach
            @endif
            <tr>
                <td colspan="7" style="padding: 20px 8px 8px 8px;">
                    <strong>Catatan Umum Asesor:</strong><br><br><br>
                </td>
            </tr>
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
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor RPL 1
            </td>
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor RPL 2
            </td>
        </tr>
        <tr>
            <td style="height: 70px; border: none; padding: 0;"></td>
            <td style="border: none; padding: 0;"></td>
        </tr>
        <tr>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $asesorA1Nama }})</strong>
            </td>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $asesorA2Nama }})</strong>
            </td>
        </tr>
    </table>
@endsection


