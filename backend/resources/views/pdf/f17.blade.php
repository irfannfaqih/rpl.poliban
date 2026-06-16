@extends('pdf.layout')

@section('title', 'F17 - Surat Sanggah')

@section('content')
<style>
        
        .header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  }
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid black; }
        .table-info td { border: 1px solid black; padding: 6px; }
        .table-info td:first-child { font-weight: bold; width: 35%;  }
        
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 20px; font-size: 11px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 8px; text-align: left; vertical-align: top; }
        .table-data th {  font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        
        .doc-kode { position: absolute; top: 0; right: 0; border: 1px solid black; padding: 5px 10px; font-weight: bold; font-size: 14px; }
        .checkbox-box { display: inline-block; width: 12px; height: 12px; border: 1px solid black; margin-right: 5px; vertical-align: middle; }
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
        $tglUjian = $uji && $uji->tanggal_ujian ? date('d-m-Y', strtotime($uji->tanggal_ujian)) : '-';
        
        // Otomatis centang jika pemohon telah menyetujui prosedur banding saat mengajukan sanggah
        $sanggahAda = isset($pendaftaran->sanggah) && $pendaftaran->sanggah->count() > 0;
        $checkYa = $sanggahAda ? '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>' : '';
        $checkTidak = $sanggahAda ? '' : '<span style="font-family: DejaVu Sans, sans-serif;">&#10004;</span>';
    @endphp

    <div class="doc-kode">F17</div>
    
    <div class="header">FORMULIR 17: SURAT SANGGAH / BANDING HASIL ASESMEN</div>
    
    <table class="table-info">
        <tr>
            <td>Nama Pemohon</td>
            <td>{{ $pendaftaran->user->nama ?? '-' }}</td>
        </tr>
        <tr>
            <td>Nama Asesor RPL</td>
            <td>{{ $namaAsesor }}</td>
        </tr>
        <tr>
            <td>Tanggal Asesmen</td>
            <td>{{ $tglUjian }}</td>
        </tr>
    </table>

    <table class="table-data">
        <thead>
            <tr>
                <th width="80%">Jawablah dengan Ya atau Tidak Pertanyaan-pertanyaan berikut ini:</th>
                <th width="10%">YA</th>
                <th width="10%">TIDAK</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Apakah Proses Banding telah dijelaskan kepada Anda?</td>
                <td class="text-center">{!! $checkYa !!}</td>
                <td class="text-center">{!! $checkTidak !!}</td>
            </tr>
            <tr>
                <td>Apakah Anda telah mendiskusikan banding dengan Asesor RPL?</td>
                <td class="text-center">{!! $checkYa !!}</td>
                <td class="text-center">{!! $checkTidak !!}</td>
            </tr>
            <tr>
                <td>Apakah Anda akan melibatkan pihak lain untuk membantu Anda dalam proses banding?</td>
                <td></td>
                <td></td>
            </tr>
            <tr>
                <td colspan="3">
                    Sanggah atau banding ini diajukan kepada:<br>
                    <div style="margin-left: 20px; margin-top: 10px;">
                        <div><span class="checkbox-box"></span> Pimpinan Perguruan Tinggi</div>
                        <div style="margin-top: 5px;"><span class="checkbox-box"></span> Kementerian Riset, Teknologi, dan Pendidikan Tinggi</div>
                        <div style="font-size: 9px; font-style: italic; margin-bottom: 10px;">(*Centang salah satu)</div>
                    </div>
                    Atas Keputusan Asesmen yang dibuat terhadap mata kuliah berikut:<br>
                    No. Kode mata kuliah : ................................................................<br>
                    Nama mata kuliah : ................................................................
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    Banding ini digunakan atas alasan sebagai berikut:<br>
                    <br><br><br><br><br>
                </td>
            </tr>
            <tr>
                <td colspan="3" style="font-style: italic;">
                    *Anda mempunyai hak mengajukan banding jika Anda mendapatkan hasil yang Tidak Sah dan/atau Proses Tidak Sah atau Tidak Adil.
                </td>
            </tr>
        </tbody>
    </table>

    <table style="width: 80%; margin-left: auto; margin-right: 0; margin-top: 30px; border-collapse: collapse; page-break-inside: avoid;">
        <tr>
            <td style="width: 50%; border: none; padding: 0;"></td>
            <td style="width: 50%; border: none; padding: 0; text-align: left;">
                Tanggal Pengajuan : ..........................................
            </td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="border: none; padding: 0; padding-top: 5px; text-align: left; vertical-align: top;">
                Tanda Tangan Pemohon
            </td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="height: 70px; border: none; padding: 0;"></td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $pendaftaran->user->nama ?? '.......................................' }})</strong>
            </td>
        </tr>
    </table>
@endsection


