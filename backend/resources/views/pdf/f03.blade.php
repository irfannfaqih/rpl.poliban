@extends('pdf.layout')

@section('title', 'F03 - Asesmen Mandiri')

@section('content')
    <style>
        .doc-kode { float: right; border: 1px solid black; padding: 4px 10px; font-weight: bold; font-size: 13px; margin-top: -10px; }
        h4.doc-title { text-align: center; font-size: 13px; margin: 15px 0 10px 0; text-transform: uppercase;  font-weight: bold; }
        .identitas-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .identitas-table td { border: 1px solid black; padding: 6px 8px; vertical-align: top; font-size: 10px; }
        .identitas-table .section-header { font-weight: bold;  font-size: 11px; }
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 15px; font-size: 9px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 4px 5px; vertical-align: middle; }
        .table-data th {  font-weight: bold; text-align: center; }
        .table-data td.text-center { text-align: center; }
        .table-data td.text-left { text-align: left; }
        .profisiensi-cell { text-align: center; font-weight: bold; font-size: 11px; }
        .vatc-ya {  font-weight: bold; }
        .vatc-tidak {  font-weight: bold; }
        .vatc-na {  font-style: italic; }
        .signature-table { width: 100%; margin-top: 30px; page-break-inside: avoid; }
        .signature-table td { width: 50%; text-align: center; vertical-align: top; }
        .signature-box { height: 60px; }
        .keterangan-box { font-size: 9px; border: 1px solid #d1d5db; padding: 6px 8px; margin-bottom: 12px; background: #f9fafb; }
    </style>

    @php
        $dataDiri = $pendaftaran->dataDiri;
        $prodi    = $pendaftaran->prodi;

        // Ambil penilaian VATC asesor dari asesor_1 (keyBy cpmk_id)
        $tugasA1     = $pendaftaran->penugasanAsesor->where('urutan', 'asesor_1')->first();
        $vatcByCpmk  = $tugasA1
            ? $tugasA1->penilaianCpmk->keyBy('cpmk_id')
            : collect();

        // Dokumen yang diunggah pemohon (id → nama)
        $dokumenMap = collect();
        foreach (($pendaftaran->dokumen ?? collect())->values() as $index => $d) {
            $label = $d->file_name ?: ($d->deskripsi ?: ucfirst(str_replace('_', ' ', $d->tipe ?? 'Dokumen')));
            if ($d->id) {
                $dokumenMap->put((string) $d->id, $label);
            }
            if ($d->tipe) {
                $dokumenMap->put(strtolower($d->tipe), $label);
            }
            $dokumenMap->put('DOK-'.($index + 1), $label);
        }
        $dokumenMap->put('Ijazah', $dokumenMap->get('ijazah', 'Ijazah Terakhir'));
        $dokumenMap->put('Transkrip', $dokumenMap->get('transkrip', 'Transkrip Nilai'));

        function vatcCell($val) {
            if ($val === true  || $val == 1) return '<span class="vatc-ya">Ya</span>';
            if ($val === false || $val == 0) return '<span class="vatc-tidak">Tidak</span>';
            return '<span class="vatc-na">-</span>';
        }
    @endphp

    <div class="doc-kode">F03</div>
    <h4 class="doc-title">FORMULIR 3: ASESMEN MANDIRI</h4>

    {{-- Identitas --}}
    <table class="identitas-table">
        <tr>
            <td width="50%" class="section-header" colspan="2">IDENTITAS PEMOHON</td>
            <td width="50%" class="section-header" colspan="2">DATA PERGURUAN TINGGI</td>
        </tr>
        <tr>
            <td width="25%" style="font-weight:bold;">Nama</td>
            <td width="25%">{{ $dataDiri->nama_lengkap ?? $pendaftaran->user->nama ?? '-' }}</td>
            <td width="25%" style="font-weight:bold;">Nama PT</td>
            <td width="25%">Politeknik Negeri Banjarmasin</td>
        </tr>
        <tr>
            <td style="font-weight:bold;">Alamat</td>
            <td>{{ $dataDiri->alamat ?? '-' }}</td>
            <td style="font-weight:bold;">Program Studi</td>
            <td>{{ $prodi->nama ?? '-' }}</td>
        </tr>
        <tr>
            <td style="font-weight:bold;">No HP</td>
            <td>{{ $dataDiri->no_hp ?? $pendaftaran->user->phone ?? '-' }}</td>
            <td style="font-weight:bold;">Jenjang Pendidikan</td>
            <td>{{ $prodi->jenjang ?? '-' }}</td>
        </tr>
        <tr>
            <td style="font-weight:bold;">Alamat Email</td>
            <td>{{ $pendaftaran->user->email ?? '-' }}</td>
            <td style="font-weight:bold;">Level KKNI</td>
            <td>{{ str_contains(strtolower($prodi->jenjang ?? ''), 'd3') ? 'Level 5' : 'Level 6' }}</td>
        </tr>
    </table>

    <div style="margin-bottom: 8px; font-size: 10px;">
        Pemohon dipersilahkan menyatakan dalam skala <strong>1</strong> (tidak mampu), <strong>2</strong> (kurang mampu),
        <strong>4</strong> (mampu), dan <strong>5</strong> (sangat mampu) atas setiap Capaian Pembelajaran (CPMK) pada
        program studi yang dilamar, disertai bukti dokumen pendukung.
    </div>

    {{-- Tabel Asesmen Mandiri --}}
    <table class="table-data">
        <thead>
            <tr>
                <th rowspan="2" width="4%">No.</th>
                <th rowspan="2" width="18%">Mata Kuliah</th>
                <th rowspan="2" width="28%">Capaian Pembelajaran (CPMK)</th>
                <th colspan="4" width="16%">Level Profisiensi<br><small>(Diisi Pemohon)</small></th>
                <th rowspan="2" width="16%">Kode & Nomor Bukti<br><small>(Diisi Pemohon)</small></th>
                <th colspan="4" width="18%">Hasil Evaluasi Bukti<br><small>(Diisi Asesor RPL)</small></th>
            </tr>
            <tr>
                <th width="4%">1</th>
                <th width="4%">2</th>
                <th width="4%">4</th>
                <th width="4%">5</th>
                <th width="4.5%">V</th>
                <th width="4.5%">A</th>
                <th width="4.5%">T</th>
                <th width="4.5%">C</th>
            </tr>
        </thead>
        <tbody>
            @forelse($pendaftaran->evaluasiDiri as $idx => $eval)
            @php
                $cpmk    = $eval->cpmk;
                $mk      = $cpmk?->mataKuliah;
                $prof    = (string) $eval->profisiensi;

                // Dokumen bukti yang dilampirkan pemohon
                $dokIds  = is_array($eval->dokumen_pendukung)
                    ? $eval->dokumen_pendukung
                    : json_decode($eval->dokumen_pendukung ?? '[]', true);
                $dokNama = collect($dokIds)
                    ->map(fn($id) => $dokumenMap->get((string) $id)
                        ?? $dokumenMap->get(strtolower((string) $id))
                        ?? (string) $id)
                    ->implode(', ');

                // VATC dari asesor
                $vatc = $vatcByCpmk->get($eval->cpmk_id);
            @endphp
            <tr>
                <td class="text-center">{{ $idx + 1 }}</td>
                <td class="text-left">{{ $mk->nama ?? '-' }}<br><small style="">{{ $mk->kode ?? '' }}</small></td>
                <td class="text-left">{{ $cpmk->deskripsi ?? $cpmk->kode ?? '-' }}</td>
                {{-- Level profisiensi: centang pada kolom yang sesuai --}}
                <td class="profisiensi-cell">@if($prof === '1') <span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span> @endif</td>
                <td class="profisiensi-cell">@if($prof === '2') <span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span> @endif</td>
                <td class="profisiensi-cell">@if($prof === '4') <span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span> @endif</td>
                <td class="profisiensi-cell">@if($prof === '5') <span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span> @endif</td>
                {{-- Dokumen bukti --}}
                <td class="text-left" style="font-size:8px;">{{ $dokNama ?: '-' }}</td>
                {{-- VATC asesor --}}
                <td class="text-center">{!! vatcCell($vatc?->valid) !!}</td>
                <td class="text-center">{!! vatcCell($vatc?->autentik) !!}</td>
                <td class="text-center">{!! vatcCell($vatc?->terkini) !!}</td>
                <td class="text-center">{!! vatcCell($vatc?->cukup) !!}</td>
            </tr>
            @empty
            <tr>
                <td colspan="12" class="text-center" style="padding: 16px;  font-style: italic;">
                    Belum ada data evaluasi mandiri
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="keterangan-box">
        <strong>Keterangan Level Profisiensi:</strong>
        &nbsp; <strong>1</strong> = Tidak mampu &nbsp;|&nbsp;
        <strong>2</strong> = Kurang mampu &nbsp;|&nbsp;
        <strong>4</strong> = Mampu &nbsp;|&nbsp;
        <strong>5</strong> = Sangat mampu<br>
        <strong>Keterangan Evaluasi Bukti (VATC):</strong>
        &nbsp; <strong>V</strong> = Valid (hubungan jelas antara bukti dan indikator CP) &nbsp;|&nbsp;
        <strong>A</strong> = Autentik (dapat diverifikasi) &nbsp;|&nbsp;
        <strong>T</strong> = Terkini (pengetahuan terkini) &nbsp;|&nbsp;
        <strong>C</strong> = Cukup (cukup untuk dinilai)
    </div>

    <div style="margin-bottom: 10px; font-size: 10px; text-align: justify;">
        Saya menyatakan bahwa seluruh informasi kompetensi dan pengalaman yang saya isikan pada formulir ini adalah <strong>benar</strong>.
        Apabila di kemudian hari terbukti ada ketidakbenaran, saya bersedia menerima sanksi yang ditetapkan oleh Politeknik Negeri Banjarmasin.
    </div>

@php
    $asesors = isset($pendaftaran) ? $pendaftaran->penugasanAsesor->pluck('asesor.nama')->filter()->values() : collect();
@endphp

<table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid;">
    <tr>
        <td style="width: 33.33%; border: none; padding: 0;"></td>
        <td style="width: 33.33%; border: none; padding: 0;"></td>
        <td style="width: 33.33%; border: none; padding: 0; text-align: left;">
            Banjarmasin, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}
        </td>
    </tr>
    <tr>
        <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
            Pemohon
        </td>
        @if($asesors->count() > 0)
            @foreach($asesors as $index => $asesorName)
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor RPL {{ $asesors->count() > 1 ? ($index + 1) : '' }}
            </td>
            @endforeach
            @if($asesors->count() === 1)
            <td style="border: none; padding: 0;"></td>
            @endif
        @else
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor RPL
            </td>
            <td style="border: none; padding: 0;"></td>
        @endif
    </tr>
    <tr>
        <td style="height: 70px; border: none; padding: 0;"></td>
        @if($asesors->count() > 0)
            @foreach($asesors as $asesorName)
            <td style="border: none; padding: 0;"></td>
            @endforeach
            @if($asesors->count() === 1)
            <td style="border: none; padding: 0;"></td>
            @endif
        @else
            <td style="border: none; padding: 0;"></td>
            <td style="border: none; padding: 0;"></td>
        @endif
    </tr>
    <tr>
        <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
            <strong style="white-space: nowrap;">({{ trim($dataDiri->nama_lengkap ?? $pendaftaran->user->nama ?? '.......................................') }})</strong>
        </td>
        @if($asesors->count() > 0)
            @foreach($asesors as $asesorName)
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $asesorName }})</strong>
            </td>
            @endforeach
            @if($asesors->count() === 1)
            <td style="border: none; padding: 0;"></td>
            @endif
        @else
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ trim($tugasA1?->asesor?->nama ?? '.......................................') }})</strong>
            </td>
            <td style="border: none; padding: 0;"></td>
        @endif
    </tr>
</table>
@endsection


