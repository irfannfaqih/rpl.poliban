@extends('pdf.layout')

@section('title', 'Kartu Peserta Asesmen RPL')

@section('content')
<style>
    .doc-kode { float: right; border: 1px solid black; padding: 4px 10px; font-weight: bold; font-size: 13px; margin-top: -10px; }
    h4.doc-title { text-align: center; font-size: 13px; margin: 15px 0 10px 0; text-transform: uppercase; font-weight: bold; text-decoration: underline; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .table-info td { padding: 4px; vertical-align: top; }
    .table-info .label { width: 30%; font-weight: bold; }
    .table-info .colon { width: 2%; }
    .table-bordered { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .table-bordered th, .table-bordered td { border: 1px solid black; padding: 6px 8px; vertical-align: top; }
    .table-bordered th { font-weight: bold; text-align: center; }
    .section-header { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; margin: 14px 0 5px 0; border-bottom: 1px solid #333; padding-bottom: 3px; }
    .catatan-box { border: 1px solid black; padding: 8px 10px; margin-bottom: 15px; font-size: 10px; }
</style>

@php
    $dataDiri  = $pendaftaran->dataDiri;
    $prodi     = $pendaftaran->prodi;
    $jadwalRaw = $pendaftaran->jadwalAsesmen->first();

    // Normalisasi field jadwal - handle jadwal_asesmen (tanggal/waktu) vs uji_lanjutan (tanggal_ujian/waktu_ujian)
    $jadwal = null;
    if ($jadwalRaw) {
        $jadwal = (object)[
            'tanggal_ujian' => $jadwalRaw->tanggal_ujian ?? $jadwalRaw->tanggal ?? null,
            'waktu_ujian'   => $jadwalRaw->waktu_ujian ?? $jadwalRaw->waktu ?? null,
            'tempat'        => $jadwalRaw->tempat ?? null,
            'link_meeting'  => $jadwalRaw->link_meeting ?? null,
            'catatan'       => $jadwalRaw->catatan ?? null,
        ];
    }

    $asesorList = $pendaftaran->penugasanAsesor
        ->map(fn($t) => $t->asesor?->nama)
        ->filter()
        ->values();

    $riwayatTerakhir = $pendaftaran->riwayatPendidikan
        ->sortByDesc('tahun_lulus')
        ->first();
@endphp

<div class="doc-kode">KARTU</div>
<h4 class="doc-title">KARTU PESERTA ASESMEN RPL</h4>

{{-- Data Pemohon --}}
<table class="table-info">
    <tr>
        <td class="label">Nama Lengkap</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->nama_lengkap ?? $pendaftaran->user->nama ?? '-' }}</td>
        <td width="5%"></td>
        <td class="label">No. Pendaftaran</td>
        <td class="colon">:</td>
        <td><strong>{{ $pendaftaran->nomor_pendaftaran ?? 'RPL-'.$pendaftaran->id }}</strong></td>
    </tr>
    <tr>
        <td class="label">No. HP</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->no_hp ?? '-' }}</td>
        <td></td>
        <td class="label">Email</td>
        <td class="colon">:</td>
        <td>{{ $pendaftaran->user->email ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label">Program Studi</td>
        <td class="colon">:</td>
        <td>{{ $prodi->nama ?? '-' }} ({{ $prodi->jenjang ?? '-' }})</td>
        <td></td>
        <td class="label">Pendidikan Sebelumnya</td>
        <td class="colon">:</td>
        <td>{{ $riwayatTerakhir ? ($riwayatTerakhir->jenjang . ' - ' . $riwayatTerakhir->institusi) : '-' }}</td>
    </tr>
    <tr>
        <td class="label">Asesor RPL</td>
        <td class="colon">:</td>
        <td colspan="5">{{ $asesorList->implode(' dan ') ?: '-' }}</td>
    </tr>
</table>

{{-- Jadwal --}}
<p class="section-header">Jadwal Pelaksanaan Asesmen</p>

<table class="table-bordered">
    <thead>
        <tr>
            <th width="20%">Tanggal</th>
            <th width="15%">Waktu</th>
            <th width="25%">Tempat / Lokasi</th>
            <th width="40%">Keterangan / Catatan</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                {{ $jadwal?->tanggal
                    ? \Carbon\Carbon::parse($jadwal->tanggal)->translatedFormat('l, d F Y')
                    : 'Belum ditetapkan' }}
            </td>
            <td style="text-align:center;">
                {{ $jadwal?->waktu ? $jadwal->waktu . ' WITA' : '-' }}
            </td>
            <td>{{ $jadwal?->tempat ?? 'Belum ditetapkan' }}</td>
            <td>
                {{ $jadwal?->catatan ?? '-' }}
                @if($jadwal?->link_meeting)
                    <br><small>Link Online: {{ $jadwal->link_meeting }}</small>
                @endif
            </td>
        </tr>
    </tbody>
</table>

{{-- Instruksi --}}
<div class="catatan-box">
    <strong>Ketentuan Peserta:</strong>
    <ol style="margin: 4px 0 0 0; padding-left: 18px;">
        <li>Peserta wajib hadir paling lambat 15 menit sebelum waktu asesmen dimulai.</li>
        <li>Peserta wajib membawa dokumen asli (ijazah, transkrip, sertifikat, dan bukti pendukung lainnya) yang telah diunggah pada sistem.</li>
        <li>Peserta wajib menunjukkan kartu ini kepada asesor saat pelaksanaan asesmen.</li>
        <li>Jika berhalangan hadir, peserta wajib menghubungi Admin Program Studi sebelum waktu pelaksanaan.</li>
        <li>Pastikan koneksi internet stabil apabila asesmen dilaksanakan secara daring.</li>
    </ol>
</div>

@endsection
