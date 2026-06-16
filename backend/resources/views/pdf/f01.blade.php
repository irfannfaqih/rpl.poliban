@extends('pdf.layout')

@section('title', 'F01 - Formulir Aplikasi RPL')

@section('content')
<style>
    h4.doc-title { text-align: center; font-size: 13px; margin: 15px 0 10px 0; text-transform: uppercase;  font-weight: bold; }
    .doc-kode { float: right; border: 1px solid black; padding: 4px 10px; font-weight: bold; font-size: 13px; margin-top: -10px; }
    
    .section-title { font-weight: bold;  padding: 4px; border: 1px solid black; margin-top: 15px; margin-bottom: 0; }
    .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 10px; font-size: 10px; }
    .table-data th, .table-data td { border: 1px solid black; padding: 4px 6px; text-align: left; vertical-align: top; }
    .table-data th {  font-weight: bold; text-align: center; }
    .text-center { text-align: center; }
    
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
    .table-info td { padding: 3px 4px; vertical-align: top; }
    .table-info .label { width: 30%; font-weight: bold; }
    .table-info .colon { width: 2%; }

    .signature-table { width: 100%; margin-top: 30px; page-break-inside: avoid; }
    .signature-table td { width: 50%; text-align: left; vertical-align: bottom; }
    .sig-space { height: 65px; }
    
    .box-info { border: 1px solid black; padding: 10px; margin-bottom: 15px; font-size: 10px; text-align: justify; }
    .list-roman { list-style-type: lower-roman; padding-left: 20px; margin: 5px 0; }
</style>

<div class="doc-kode">F01</div>

<h4 class="doc-title">FORMULIR APLIKASI RPL</h4>

<div class="box-info">
    <p style="margin-top:0;"><strong>Bagian 1: Rincian Data Pemohon</strong></p>
    <p>Pada bagian ini, cantumkan data pribadi, data pendidikan formal serta data pekerjaan Saudara pada saat ini.</p>
</div>

<div class="section-title" style="margin-bottom: 0;">a. Data Pribadi</div>
<div style="border: 1px solid black; border-top: none; padding: 5px 10px; margin-bottom: 15px;">
    <table class="table-info" style="margin-bottom: 0;">
        <tr>
        <td class="label">Nama Lengkap</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->nama_lengkap ?? ($pendaftaran->user->nama ?? '-') }}</td>
    </tr>
    <tr>
        <td class="label">Tempat / Tgl. Lahir</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->tempat_lahir ?? '-' }} / {{ $dataDiri && $dataDiri->tanggal_lahir ? date('d F Y', strtotime($dataDiri->tanggal_lahir)) : '-' }}</td>
    </tr>
    <tr>
        <td class="label">Jenis Kelamin</td>
        <td class="colon">:</td>
        <td>{{ ($dataDiri->jenis_kelamin ?? '') === 'L' ? 'Laki-Laki' : (($dataDiri->jenis_kelamin ?? '') === 'P' ? 'Perempuan' : '-') }}</td>
    </tr>
    <tr>
        <td class="label">Kebangsaan</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->kebangsaan ?? 'Indonesia' }}</td>
    </tr>
    <tr>
        <td class="label">Alamat Rumah</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->alamat ?? ($pendaftaran->user->alamat ?? '-') }}</td>
    </tr>
    <tr>
        <td class="label">Kode Pos</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->kode_pos ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label">No. Telepon/HP</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->no_hp ?? ($pendaftaran->user->phone ?? '-') }}</td>
    </tr>
    <tr>
        <td class="label">No. Telepon Rumah</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->no_telp_rumah ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label">Email</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->email_pribadi ?? ($pendaftaran->user->email ?? '-') }}</td>
    </tr>
    </table>
</div>

<div class="section-title">b. Data Pendidikan</div>
<table class="table-data" style="border-top:none;">
    <thead>
        <tr>
            <th width="30%">Nama Sekolah/Perguruan Tinggi</th>
            <th width="25%">Jurusan/Program Studi</th>
            <th width="15%">Tahun Lulus</th>
            <th width="30%">Kualifikasi/Gelar</th>
        </tr>
    </thead>
    <tbody>
        @forelse($riwayatPendidikan ?? [] as $pend)
        <tr>
            <td>{{ $pend->institusi ?? '-' }}</td>
            <td>{{ $pend->program_studi ?? '-' }}</td>
            <td class="text-center">{{ $pend->tahun_lulus ?? '-' }}</td>
            <td>{{ $pend->jenjang ?? '-' }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="4" class="text-center">Tidak ada data pendidikan.</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div class="section-title" style="margin-bottom: 0;">c. Data Pekerjaan Sekarang</div>
<div style="border: 1px solid black; border-top: none; padding: 5px 10px; margin-bottom: 15px;">
    <table class="table-info" style="margin-bottom: 0;">
    <tr>
        <td class="label">Nama Instansi / Perusahaan</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->nama_instansi ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label">Posisi/Jabatan</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->pekerjaan ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label">Alamat Instansi / Perusahaan</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->alamat_instansi ?? '-' }}</td>
    </tr>
    <tr>
        <td class="label">No. Telp/Fax</td>
        <td class="colon">:</td>
        <td>{{ $dataDiri->telp_instansi ?? '-' }}</td>
    </tr>
    </table>
</div>

<div style="page-break-after: always;"></div>

<div class="box-info">
    <p style="margin-top:0;"><strong>Bagian 2: Daftar Bukti Pendukung</strong></p>
    <p>Pada bagian ini, cantumkan semua bukti pendukung yang dimiliki. Beri nomor pada setiap dokumen.</p>
</div>

<div class="section-title">1. Sertifikat Pelatihan</div>
<table class="table-data" style="border-top:none;">
    <thead>
        <tr>
            <th width="25%">Nama Pelatihan</th>
            <th width="20%">Penyelenggara</th>
            <th width="15%">Peran Serta</th>
            <th width="15%">Durasi (hari)</th>
            <th width="25%">Tahun / Dokumen</th>
        </tr>
    </thead>
    <tbody>
        @php $pelatihans = isset($pelatihan) ? $pelatihan->where('tipe', 'pelatihan') : collect(); @endphp
        @forelse($pelatihans as $pel)
        <tr>
            <td>{{ $pel->nama_kegiatan ?? '-' }}</td>
            <td>{{ $pel->penyelenggara ?? '-' }}</td>
            <td>Peserta</td>
            <td class="text-center">{{ $pel->durasi ?? '-' }}</td>
            <td class="text-center">{{ $pel->tahun ?? '-' }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="5" class="text-center">Tidak ada data sertifikat pelatihan.</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div class="section-title">2. Pengalaman Kerja</div>
<table class="table-data" style="border-top:none;">
    <thead>
        <tr>
            <th width="25%">Posisi/Peran</th>
            <th width="25%">Perusahaan/Lembaga</th>
            <th width="20%">Masa Kerja</th>
            <th width="30%">Deskripsi/Prestasi</th>
        </tr>
    </thead>
    <tbody>
        @php $pekerjaans = isset($riwayatPekerjaan) ? $riwayatPekerjaan : collect(); @endphp
        @forelse($pekerjaans as $pek)
        <tr>
            <td>{{ $pek->jabatan ?? '-' }}</td>
            <td>{{ $pek->nama_perusahaan ?? '-' }}</td>
            <td class="text-center">{{ $pek->tahun_mulai ?? '-' }} - {{ $pek->tahun_selesai ?? 'Sekarang' }}</td>
            <td>{{ $pek->deskripsi ?? '-' }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="4" class="text-center">Tidak ada data pengalaman kerja.</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div class="section-title">3. Pengalaman Lain yang Relevan / Dokumen Tambahan</div>
<table class="table-data" style="border-top:none;">
    <thead>
        <tr>
            <th width="5%">No</th>
            <th width="65%">Deskripsi Dokumen / Uraian Pengalaman</th>
            <th width="30%">Tipe Bukti</th>
        </tr>
    </thead>
    <tbody>
        @forelse($pendaftaran->dokumen ?? [] as $index => $dok)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ !empty($dok->nama) && $dok->nama !== '-' ? $dok->nama . '<br>' : '' }}<small>{{ $dok->deskripsi ?? '-' }}</small></td>
            <td class="text-center">{{ strtoupper(str_replace('_', ' ', $dok->tipe ?? '-')) }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="3" class="text-center">Tidak ada dokumen tambahan.</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div style="page-break-after: always;"></div>

<div class="box-info">
    <p style="margin-top:0;"><strong>Bagian 3: Daftar Mata Kuliah RPL</strong></p>
    <p>Mata kuliah yang diajukan untuk mendapat pengakuan (RPL):</p>
</div>

<table class="table-data">
    <thead>
        <tr>
            <th width="5%" rowspan="2">No</th>
            <th width="15%" rowspan="2">Kode MK</th>
            <th width="50%" rowspan="2">Judul Mata Kuliah</th>
            <th width="30%" colspan="2">Mengajukan RPL</th>
        </tr>
        <tr>
            <th width="15%">Ya</th>
            <th width="15%">Tidak</th>
        </tr>
    </thead>
    <tbody>
        @php
            $evaluasiMkIds = $pendaftaran->evaluasiDiri->pluck('cpmk.mata_kuliah_id')->unique()->filter();
            // In a real scenario we'd list all MKs in prodi and check "Ya" for evaluated ones.
            // For now, we list the evaluated ones with "Ya".
            $prodiMks = $pendaftaran->prodi->mataKuliah ?? collect();
            if ($prodiMks->isEmpty() && $evaluasiMkIds->isNotEmpty()) {
                // fallback to mapping from evaluasiDiri
                $prodiMks = $pendaftaran->evaluasiDiri->map(function($ev) { return $ev->cpmk->mataKuliah ?? null; })->filter()->unique('id');
            }
        @endphp
        
        @forelse($prodiMks as $index => $mk)
        @php $diajukan = $evaluasiMkIds->contains($mk->id); @endphp
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td class="text-center">{{ $mk->kode ?? '-' }}</td>
            <td>{{ $mk->nama ?? '-' }}</td>
            <td class="text-center">{!! $diajukan ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '' !!}</td>
            <td class="text-center">{!! !$diajukan ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '' !!}</td>
        </tr>
        @empty
        <tr>
            <td colspan="5" class="text-center">Belum ada daftar mata kuliah.</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div class="box-info" style="margin-top: 30px;">
    <p style="margin-top:0; font-weight:bold;">Pernyataan Peserta</p>
    <p>SAYA TELAH MEMBACA DAN MENGISI FORMULIR PENDAFTARAN UNTUK MENGIKUTI PERKULIAHAN MELALUI STRATEGI RPL DI POLITEKNIK NEGERI BANJARMASIN DENGAN BAIK, DAN SAYA MENYATAKAN:</p>
    <ol style="margin: 5px 0; padding-left: 20px; font-size: 10px; text-align: justify;">
        <li>Semua informasi yang saya tuliskan adalah sepenuhnya benar dan saya bertanggungjawab atas seluruh data dalam formulir ini.</li>
        <li>Saya memberikan ijin kepada pihak pengelola program RPL, untuk melakukan pemeriksaan kebenaran informasi yang saya berikan dalam formulir aplikasi ini kepada seluruh pihak yang terkait dengan jenjang akademik sebelumnya dan kepada perusahaan tempat saya bekerja sebelumnya dan atau saat ini saya bekerja.</li>
        <li>Saya bersedia melengkapi berkas yang dibutuhkan untuk pelaksanaan proses credit transfer dan atau asesmen pengalaman kerja.</li>
        <li>Saya akan mengikuti proses asesmen sesuai dengan kesepakatan waktu yang ditetapkan dan saya akan melunasi biaya pendaftaran setelah pengisian aplikasi ini selesai.</li>
        <li>Saya akan mentaati seluruh hal yang tercantum dalam peraturan akademik dan hal-hal terkait administrasi selama saya mengikuti perkuliahan di Politeknik Negeri Banjarmasin.</li>
    </ol>
</div>

<table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid;">
    <tr>
        <td style="width: 50%; border: none; padding: 0;"></td>
        <td style="width: 50%; border: none; padding: 0; text-align: left;">
            Tanggal: {{ date('d F Y') }}
        </td>
    </tr>
    <tr>
        <td style="border: none; padding: 0;"></td>
        <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
            Tanda tangan Pemohon,
        </td>
    </tr>
    <tr>
        <td style="border: none; padding: 0;"></td>
        <td style="height: 70px; border: none; padding: 0;"></td>
    </tr>
    <tr>
        <td style="border: none; padding: 0;"></td>
        <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
            <strong style="white-space: nowrap;">({{ $dataDiri->nama_lengkap ?? ($pendaftaran->user->nama ?? '.......................................') }})</strong>
        </td>
    </tr>
</table>

@endsection


