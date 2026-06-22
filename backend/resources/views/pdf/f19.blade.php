@extends('pdf.layout')

@section('title', 'F19 - Berita Acara Asesmen')

@section('content')
<style>
    @page { margin: 1cm; size: A4 landscape; }
    .kop-teks { text-align: center; }
    .kop-teks h2, .kop-teks h3, .kop-teks p { margin: 0; padding: 2px 0; }
    .kop-teks h2 { font-size: 16px; text-transform: uppercase; }
    .kop-teks h3 { font-size: 14px; }
    .kop-teks p { font-size: 10px; }
    h4.doc-title { text-align: center; font-size: 13px; margin: 15px 0 10px 0; text-transform: uppercase;  font-weight: bold; }
    .doc-kode { float: right; border: 1px solid black; padding: 4px 10px; font-weight: bold; font-size: 13px; margin-top: -10px; }
    .table-info { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    .table-info td { border: 1px solid black; padding: 5px 6px; vertical-align: top; }
    .table-info td:nth-child(odd) { font-weight: bold; width: 20%; }
    .table-data { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5px; table-layout: fixed; word-wrap: break-word; }
    .table-data th, .table-data td { border: 1px solid black; padding: 3px 5px; text-align: left; vertical-align: middle; }
    .table-data th { font-weight: bold; text-align: center; }
    .table-data td.text-center { text-align: center; }
    ul { margin: 3px 0; padding-left: 14px; }
</style>

@php
    $asesorList = [];
    if(isset($pendaftaran->penugasanAsesor)) {
        foreach($pendaftaran->penugasanAsesor as $tugas) {
            if($tugas->asesor) $asesorList[] = $tugas->asesor->nama;
        }
    }
    $namaAsesor = count($asesorList) > 0 ? implode(', ', $asesorList) : '-';
    $uji = $pendaftaran->ujiLanjutan ?? null;
    $tglUjian = $uji && $uji->tanggal_ujian ? \Carbon\Carbon::parse($uji->tanggal_ujian)->translatedFormat('d F Y') : '-';
    $waktuUjian = $uji ? ($uji->waktu_ujian ?? '-') : '-';
    $tempatUjian = $uji ? ($uji->tempat ?? '-') : '-';
    $sudahDinilai = $pendaftaran->ujiLanjutan && $pendaftaran->ujiLanjutan->items->count() > 0;
    $baCheck = $sudahDinilai ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '';
    $jumlahAsesor = count($asesorList);
    $jumlahKolom = $jumlahAsesor + 1; // +1 untuk kolom Pemohon
    $lebarKolom = round(100 / $jumlahKolom, 2);
    $approval = $pendaftaran->plenoApproval ?? null;
    $namaKaprodi = $approval?->kaprodiApprover?->nama ?? '-';
    $tanggalKaprodi = $approval?->kaprodi_approved_at ? \Carbon\Carbon::parse($approval->kaprodi_approved_at)->translatedFormat('d F Y H:i') : '-';
    $namaPimpinan = $approval?->pimpinanApprover?->nama ?? '-';
    $tanggalPimpinan = $approval?->pimpinan_approved_at ? \Carbon\Carbon::parse($approval->pimpinan_approved_at)->translatedFormat('d F Y H:i') : '-';
@endphp

<div class="doc-kode">F19</div>
<h4 class="doc-title">FORMULIR 19: BERITA ACARA PELAKSANAAN ASESMEN</h4>

<table class="table-info">
    <tr>
        <td>Nama Pemohon</td>
        <td>{{ $pendaftaran->user->nama ?? '-' }}</td>
        <td>Tanggal</td>
        <td>{{ $tglUjian }}</td>
    </tr>
    <tr>
        <td>Nama Asesor RPL</td>
        <td>{{ $namaAsesor }}</td>
        <td>Waktu</td>
        <td>{{ $waktuUjian }}</td>
    </tr>
    <tr>
        <td>Kode / Mata Kuliah</td>
        <td>Semua Mata Kuliah yang Diajukan</td>
        <td>Tempat</td>
        <td>{{ $tempatUjian }}</td>
    </tr>
</table>

<table class="table-info" style="font-size: 9.5px; margin-bottom: 10px;">
    <tr>
        <td>Approval Kaprodi</td>
        <td>{{ $namaKaprodi }}</td>
        <td>Tanggal Approval Kaprodi</td>
        <td>{{ $tanggalKaprodi }}</td>
    </tr>
    <tr>
        <td>Approval Pimpinan</td>
        <td>{{ $namaPimpinan }}</td>
        <td>Tanggal Approval Pimpinan</td>
        <td>{{ $tanggalPimpinan }}</td>
    </tr>
</table>

<table class="table-data">
    <thead>
        <tr>
            <th rowspan="2" width="4%">No</th>
            <th rowspan="2" width="13%">Langkah</th>
            <th rowspan="2" width="48%">Kegiatan</th>
            <th colspan="2" width="12%">Pelaksanaan</th>
            <th rowspan="2" width="23%">Catatan</th>
        </tr>
        <tr>
            <th width="6%">Ya</th>
            <th width="6%">Tidak</th>
        </tr>
    </thead>
    <tbody style="page-break-inside: avoid;">
        <tr>
            <td class="text-center" style="border-bottom: none;">1</td>
            <td style="border-bottom: none;">Pembukaan</td>
            <td>Memberikan salam dan memperkenalkan diri</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-bottom: none;"></td>
        </tr>
        <tr>
            <td class="text-center" style="border-top: none; border-bottom: none;"></td>
            <td style="border-top: none; border-bottom: none;"></td>
            <td>Menempatkan pemohon dalam kondisi nyaman</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-top: none; border-bottom: none;"></td>
        </tr>
        <tr>
            <td class="text-center" style="border-top: none;"></td>
            <td style="border-top: none;"></td>
            <td>Mengkonfirmasikan kesiapan pemohon</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-top: none;"></td>
        </tr>
    </tbody>
    <tbody style="page-break-inside: avoid;">
        <tr>
            <td class="text-center" style="border-bottom: none;">2</td>
            <td style="border-bottom: none;">Mengkonfirmasikan rencana asesmen</td>
            <td>Pendekatan: Tujuan dan konteks asesmen, pendekatan asesmen, skema sertifikasi dan acuan pembanding asesmen dan tim penyelenggara kompetensi</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-bottom: none;"></td>
        </tr>
        <tr>
            <td class="text-center" style="border-top: none; border-bottom: none;"></td>
            <td style="border-top: none; border-bottom: none;"></td>
            <td>
                <ul>
                    <li>Rencana Asesmen</li>
                    <li>Metode asesmen yang digunakan</li>
                    <li>Perangkat asesmen (tool assessment)</li>
                    <li>Sumber daya fisik dan material</li>
                    <li>Personil yang terkait dengan asesmen</li>
                </ul>
            </td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-top: none; border-bottom: none;"></td>
        </tr>
        <tr>
            <td class="text-center" style="border-top: none; border-bottom: none;"></td>
            <td style="border-top: none; border-bottom: none;"></td>
            <td>Kontekstualisasi rencana asesmen (Karakteristik Pemohon, Kebutuhan spesifik, Pemenuhan prinsip asesmen VRFF &amp; VACS)</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-top: none; border-bottom: none;"></td>
        </tr>
        <tr>
            <td class="text-center" style="border-top: none; border-bottom: none;"></td>
            <td style="border-top: none; border-bottom: none;"></td>
            <td>Pengorganisasian asesmen (Pengaturan sumber daya, personil, rekaman)</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-top: none; border-bottom: none;"></td>
        </tr>
        <tr>
            <td class="text-center" style="border-top: none; border-bottom: none;"></td>
            <td style="border-top: none; border-bottom: none;"></td>
            <td>Konfirmasi kebijakan dan prosedur sistem asesmen, tatatertib/K3 di TUK</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-top: none; border-bottom: none;"></td>
        </tr>
        <tr>
            <td class="text-center" style="border-top: none;"></td>
            <td style="border-top: none;"></td>
            <td>Jadwal asesmen (hari, tanggal, dan lama asesmen) dan tempat asesmen</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-top: none;"></td>
        </tr>
    </tbody>
    <tbody style="page-break-inside: avoid;">
        <tr>
            <td class="text-center" style="border-bottom: none;">3</td>
            <td style="border-bottom: none;">Mengumpulkan bukti</td>
            <td>Mengorganisasikan sumber daya asesmen (fasilitas, alat, bahan) yang diperlukan</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-bottom: none;"></td>
        </tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Menginformasikan personil terkait asesmen</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Metode yang digunakan</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Penerapan prinsip asesmen</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Penerapan aturan pengumpulan bukti</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Pengumpulan bukti pada aktivitas kerja sebenarnya/disimulasikan</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Pemenuhan integrasi asesmen (bila ada)</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Modifikasi perangkat asesmen (bila ada)</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none;"></td><td style="border-top: none;"></td><td>Pemenuhan penerapan penyesuaian (bila ada)</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none;"></td></tr>
    </tbody>
    <tbody style="page-break-inside: avoid;">
        <tr>
            <td class="text-center" style="border-bottom: none;">4</td>
            <td style="border-bottom: none;">Keputusan asesmen</td>
            <td>Membuat keputusan sesuai dengan kriteria bukti (valid, current, authentic, sufficient)</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-bottom: none;"></td>
        </tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Membuat keputusan sesuai dengan dimensi kompetensi</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Memberikan umpan balik yang jelas dan konstruktif kepada Pemohon</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none;"></td><td style="border-top: none;"></td><td>Menandatangani keputusan asesmen</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none;"></td></tr>
    </tbody>
    <tbody style="page-break-inside: avoid;">
        <tr>
            <td class="text-center" style="border-bottom: none;">5</td>
            <td style="border-bottom: none;">Mencatat dan melaporkan keputusan asesmen</td>
            <td>Mencatat hasil asesmen dan membuat laporan asesmen</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-bottom: none;"></td>
        </tr>
        <tr><td class="text-center" style="border-top: none; border-bottom: none;"></td><td style="border-top: none; border-bottom: none;"></td><td>Membuat rekomendasi tindak lanjut</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none; border-bottom: none;"></td></tr>
        <tr><td class="text-center" style="border-top: none;"></td><td style="border-top: none;"></td><td>Menginformasikan kepada pihak terkait mengenai keputusan asesmen</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none;"></td></tr>
    </tbody>
    <tbody style="page-break-inside: avoid;">
        <tr>
            <td class="text-center">6</td>
            <td>Meninjau proses asesmen</td>
            <td>Meninjau proses asesmen terhadap kriteria asesmen, dicatat, dan dilaporkan</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td><td></td>
        </tr>
    </tbody>
    <tbody style="page-break-inside: avoid;">
        <tr>
            <td class="text-center" style="border-bottom: none;">7</td>
            <td style="border-bottom: none;">Penutupan</td>
            <td>Menutup pertemuan</td>
            <td class="text-center">{!! $baCheck !!}</td><td></td>
            <td style="border-bottom: none;"></td>
        </tr>
        <tr><td class="text-center" style="border-top: none;"></td><td style="border-top: none;"></td><td>Memberikan salam</td><td class="text-center">{!! $baCheck !!}</td><td></td><td style="border-top: none;"></td></tr>
    </tbody>
</table>

{{-- Catatan: margin dikurangi agar tidak terlalu makan ruang --}}
<div style="margin-top: 8px; margin-bottom: 12px; font-size: 10px; page-break-inside: avoid;">
    <strong>Catatan asesor RPL:</strong><br><br>
    ....................................................................................................................................................................<br><br>
    ....................................................................................................................................................................
</div>

{{-- TTD: width 80% margin auto seragam dengan form lain --}}
<table style="width: 80%; margin-left: auto; margin-right: 0; border-collapse: collapse; page-break-inside: avoid;">

    {{-- Baris 1: tanggal di kolom terakhir --}}
    <tr>
        @for($i = 0; $i < $jumlahKolom - 1; $i++)
        <td style="width: {{ $lebarKolom }}%; border: none; padding: 0;"></td>
        @endfor
        <td style="width: {{ $lebarKolom }}%; border: none; padding: 0; text-align: left;">
            Banjarmasin, {{ $uji && $uji->tanggal_ujian ? \Carbon\Carbon::parse($uji->tanggal_ujian)->translatedFormat('d F Y') : date('d F Y') }}
        </td>
    </tr>

    {{-- Baris 2: label jabatan --}}
    <tr>
        <td style="width: {{ $lebarKolom }}%; border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
            Pemohon
        </td>
        @if(count($asesorList) > 0)
            @foreach($asesorList as $index => $asesorName)
            <td style="width: {{ $lebarKolom }}%; border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Asesor RPL {{ count($asesorList) > 1 ? ($index + 1) : '' }}
            </td>
            @endforeach
        @else
            <td style="width: {{ $lebarKolom }}%; border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">Asesor RPL</td>
            @if($jumlahKolom === 3)
            <td style="width: {{ $lebarKolom }}%; border: none; padding: 0;"></td>
            @endif
        @endif
    </tr>

    {{-- Baris 3: ruang tanda tangan --}}
    <tr>
        @for($i = 0; $i < $jumlahKolom; $i++)
        <td style="height: 60px; border: none; padding: 0;"></td>
        @endfor
    </tr>

    {{-- Baris 4: nama --}}
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
        @else
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">(.......................................)</strong>
            </td>
            @if($jumlahKolom === 3)
            <td style="border: none; padding: 0;"></td>
            @endif
        @endif
    </tr>

</table>
@endsection
