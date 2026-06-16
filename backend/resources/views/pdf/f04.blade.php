@extends('pdf.layout')

@section('title', 'F04 - Asesmen Portofolio')

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
        .table-info td { border: 1px solid black; padding: 5px 8px; vertical-align: top; }
        .table-info td:nth-child(odd) { font-weight: bold; width: 25%;  }
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 15px; font-size: 10px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 5px 6px; vertical-align: middle; }
        .table-data th {  font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        .catatan-note { font-size: 10px; border: 1px solid #d1d5db; padding: 8px; margin-bottom: 15px; background: #f9fafb; }
        .signature-table { width: 100%; margin-top: 30px; }
        .signature-table td { width: 50%; text-align: center; vertical-align: top; }
        .signature-box { height: 70px; }
    </style>
@php
        $asesorList = [];
        if(isset($pendaftaran->penugasanAsesor)) {
            foreach($pendaftaran->penugasanAsesor as $tugas) {
                if($tugas->asesor) $asesorList[] = $tugas->asesor->nama;
            }
        }
        $namaAsesor = count($asesorList) > 0 ? implode(', ', $asesorList) : '-';

        // Ambil evaluasi portofolio gabungan kedua asesor
        // Gunakan asesor_1 sebagai representasi utama
        $tugasA1 = $pendaftaran->penugasanAsesor->where('urutan','asesor_1')->first();
        $evalList = $tugasA1 ? $tugasA1->evaluasiPortofolio->keyBy('kategori_no') : collect();

        $kategoriList = [
            1 => 'Informasi Posisi di Tempat Kerja dengan Kompetensi Prodi',
            2 => 'Bukti pendidikan jenjang sebelumnya',
            3 => 'Pelatihan yang relevan',
            4 => 'Uraian tugas (Job Description)',
            5 => 'Standar Operasi Prosedur (SOP)',
            6 => 'Hasil pekerjaan',
            7 => 'Pengalaman kerja',
            8 => 'Laporan pekerjaan',
            9 => 'Hasil penilaian atasan',
            10 => 'Lainnya',
        ];

        function kesesuaianDisplay($val) {
            if ($val === 'sesuai')       return '<span style=" font-weight:bold;">Sesuai</span>';
            if ($val === 'tidak_sesuai') return '<span style=" font-weight:bold;">Tidak Sesuai</span>';
            return '<span style=" font-style:italic;">-</span>';
        }
    @endphp

    <div class="doc-kode">F04</div>
    <h4 class="doc-title">FORMULIR 4: EVALUASI KESESUAIAN DOKUMEN PORTOFOLIO</h4>

    <table class="table-info">
        <tr>
            <td>Nama Pemohon</td>
            <td>{{ $pendaftaran->user->nama ?? '-' }}</td>
            <td>Tanggal Asesmen</td>
            <td>{{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</td>
        </tr>
        <tr>
            <td>Nama Asesor RPL</td>
            <td>{{ $namaAsesor }}</td>
            <td>Program Studi</td>
            <td>{{ $pendaftaran->prodi->nama ?? '-' }}</td>
        </tr>
    </table>

    <table class="table-data">
        <thead>
            <tr>
                <th width="4%">No.</th>
                <th width="37%">Nama Dokumen</th>
                <th width="12%">Status Dokumen</th>
                <th width="15%">Kesesuaian</th>
                <th width="32%">Rekomendasi AT2</th>
            </tr>
        </thead>
        <tbody>
            @foreach($kategoriList as $no => $nama)
            @php $ev = $evalList->get($no); @endphp
            <tr>
                <td class="text-center">{{ $no }}</td>
                <td>{{ $nama }}</td>
                <td class="text-center">
                    @if(!$ev || $ev->status_dokumen === null)
                        <span style=" font-style:italic;">-</span>
                    @elseif($ev->status_dokumen === 'ada')
                        <span style=" font-weight:bold;">Ada</span>
                    @else
                        <span style=" font-weight:bold;">Tidak Ada</span>
                    @endif
                </td>
                <td class="text-center">
                    {!! kesesuaianDisplay($ev->kesesuaian ?? null) !!}
                </td>
                <td style="font-size:10px;">{{ $ev->rekomendasi_at2 ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="catatan-note">
        <strong>Keterangan:</strong>
        AT2 = Asesmen Tahap ke-2 (pemohon wajib hadir, dilakukan oleh asesor RPL)<br>
        <span style="font-size:9px;">*) Jika hasil asesmen menyatakan bahwa berkas tidak valid maka pemohon tidak direkomendasikan untuk melanjutkan proses RPL.</span>
    </div>

    {{-- TABEL TTD: tanggal masuk di baris pertama kolom ke-3 agar sejajar dengan Asesor RPL 2 --}}
    <table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid;">

        {{-- Baris 1: tanggal di kolom ke-3 --}}
        <tr>
            <td style="width: 33.33%; border: none; padding: 0;"></td>
            <td style="width: 33.33%; border: none; padding: 0;"></td>
            <td style="width: 33.33%; border: none; padding: 0; text-align: left;">
                Banjarmasin, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}
            </td>
        </tr>

        {{-- Baris 2: label jabatan --}}
        <tr>
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Pemohon
            </td>
            @if(count($asesorList) > 0)
                @foreach($asesorList as $index => $asesorName)
                <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                    Asesor RPL {{ count($asesorList) > 1 ? ($index + 1) : '' }}
                </td>
                @endforeach
                {{-- Jika hanya 1 asesor, tambah kolom kosong agar tetap 3 kolom --}}
                @if(count($asesorList) === 1)
                <td style="border: none; padding: 0;"></td>
                @endif
            @else
                <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                    Asesor RPL
                </td>
                <td style="border: none; padding: 0;"></td>
            @endif
        </tr>

        {{-- Baris 3: ruang kosong untuk tanda tangan --}}
        <tr>
            <td style="height: 70px; border: none; padding: 0;"></td>
            @if(count($asesorList) > 0)
                @foreach($asesorList as $asesorName)
                <td style="border: none; padding: 0;"></td>
                @endforeach
                @if(count($asesorList) === 1)
                <td style="border: none; padding: 0;"></td>
                @endif
            @else
                <td style="border: none; padding: 0;"></td>
                <td style="border: none; padding: 0;"></td>
            @endif
        </tr>

        {{-- Baris 4: nama dalam kurung --}}
        <tr>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $pendaftaran->user->nama ?? '.......................................' }})</strong>
            </td>
            @if(count($asesorList) > 0)
                @foreach($asesorList as $asesorName)
                <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                    <strong style="white-space: nowrap;">({{ $asesorName }})</strong>
                </td>
                @endforeach
                @if(count($asesorList) === 1)
                <td style="border: none; padding: 0;"></td>
                @endif
            @else
                <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                    <strong style="white-space: nowrap;">(.......................................)</strong>
                </td>
                <td style="border: none; padding: 0;"></td>
            @endif
        </tr>

    </table>
@endsection


