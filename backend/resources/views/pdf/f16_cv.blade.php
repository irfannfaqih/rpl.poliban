@extends('pdf.layout')

@section('title', 'F16 - Daftar Riwayat Hidup')

@section('content')
    <style>
        .header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;  }
        .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-info td { padding: 4px; vertical-align: top; }
        .table-info .label { width: 25%; font-weight: bold; }
        .table-info .colon { width: 2%; }
        
        .section-title { font-weight: bold;  padding: 4px; border: 1px solid black; margin-bottom: 0; }
        .table-data { width: 100%; border-collapse: collapse; margin-top: -1px; margin-bottom: 20px; font-size: 10px; }
        .table-data th, .table-data td { border: 1px solid black; padding: 6px; text-align: left; vertical-align: middle; }
        .table-data th {  font-weight: bold; text-align: center; }
        .table-data td.text-center { text-align: center; }
        
        .signature-table { width: 100%; margin-top: 30px; page-break-inside: avoid; }
        .signature-table td { width: 100%; text-align: right; padding-right: 50px; }
        .signature-box { height: 70px; }
        .doc-kode { position: absolute; top: 0; right: 0; border: 1px solid black; padding: 5px 10px; font-weight: bold; font-size: 14px; }
    </style>

    <div class="doc-kode">F16</div>
    
    <div class="header">FORMULIR 16: DAFTAR RIWAYAT HIDUP</div>
    
    <table class="table-info">
        <tr>
            <td class="label">Nama</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->nama_lengkap ?? ($pendaftaran->user->nama ?? '-') }}</td>
        </tr>
        <tr>
            <td class="label">Nomor Pemohon</td>
            <td class="colon">:</td>
            <td>{{ $pendaftaran->nomor_pendaftaran ?? 'RPL-'.$pendaftaran->id }}</td>
        </tr>
        <tr>
            <td class="label">NIP / NIK</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->nik ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Tempat dan Tanggal Lahir</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->tempat_lahir ?? '-' }}, {{ $dataDiri->tanggal_lahir ? date('d F Y', strtotime($dataDiri->tanggal_lahir)) : '-' }}</td>
        </tr>
        <tr>
            <td class="label">Jenis Kelamin</td>
            <td class="colon">:</td>
            <td>{{ ($dataDiri->jenis_kelamin ?? '') == 'L' ? 'Laki-laki' : (($dataDiri->jenis_kelamin ?? '') == 'P' ? 'Perempuan' : '-') }}</td>
        </tr>
        <tr>
            <td class="label">Agama</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->agama ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Golongan / Pangkat</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->golongan ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Instansi</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->nama_instansi ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Pekerjaan</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->pekerjaan ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Alamat Instansi</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->alamat_instansi ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Telp./Faks</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->telp_instansi ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Alamat Rumah</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->alamat ?? ($pendaftaran->user->alamat ?? '-') }}</td>
        </tr>
        <tr>
            <td class="label">Telp./HP</td>
            <td class="colon">:</td>
            <td>{{ $dataDiri->no_hp ?? ($pendaftaran->user->phone ?? '-') }}</td>
        </tr>
    </table>

    <div class="section-title">RIWAYAT PENDIDIKAN</div>
    <table class="table-data" style="border-top: none;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="45%">Nama Sekolah/PT</th>
                <th width="15%">Tahun Lulus</th>
                <th width="35%">Jurusan / Program Studi</th>
            </tr>
        </thead>
        <tbody>
            @forelse($riwayatPendidikan ?? [] as $index => $pend)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $pend->institusi ?? '-' }}</td>
                <td class="text-center">{{ $pend->tahun_lulus ?? '-' }}</td>
                <td>{{ $pend->program_studi ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" class="text-center">Tidak ada data riwayat pendidikan.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">PELATIHAN PROFESIONAL</div>
    <table class="table-data" style="border-top: none;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="15%">Tahun</th>
                <th width="40%">Jenis Pelatihan (Dalam/Luar Negeri)</th>
                <th width="25%">Penyelenggara</th>
                <th width="15%">Jangka Waktu</th>
            </tr>
        </thead>
        <tbody>
            @php $pelatihans = isset($pelatihan) ? $pelatihan->where('tipe', 'pelatihan') : []; @endphp
            @forelse($pelatihans as $index => $pel)
            <tr>
                <td class="text-center">{{ $loop->iteration }}</td>
                <td class="text-center">{{ $pel->tahun ?? '-' }}</td>
                <td>{{ $pel->nama_kegiatan ?? '-' }}</td>
                <td>{{ $pel->penyelenggara ?? '-' }}</td>
                <td class="text-center">{{ $pel->durasi ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center">Tidak ada data pelatihan profesional.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
    
    <div class="section-title">KONFERENSI/SEMINAR/LOKAKARYA/SIMPOSIUM</div>
    <table class="table-data" style="border-top: none;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="15%">Tahun</th>
                <th width="40%">Judul Kegiatan</th>
                <th width="25%">Penyelenggara</th>
                <th width="15%">Panitia / Peserta / Pembicara</th>
            </tr>
        </thead>
        <tbody>
            @php $seminars = isset($pelatihan) ? $pelatihan->where('tipe', 'seminar') : []; @endphp
            @forelse($seminars as $index => $sem)
            <tr>
                <td class="text-center">{{ $loop->iteration }}</td>
                <td class="text-center">{{ $sem->tahun ?? '-' }}</td>
                <td>{{ $sem->nama_kegiatan ?? '-' }}</td>
                <td>{{ $sem->penyelenggara ?? '-' }}</td>
                <td class="text-center">{{ $sem->peran ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center">Tidak ada data seminar.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">PENGHARGAAN/PIAGAM</div>
    <table class="table-data" style="border-top: none;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="15%">Tahun</th>
                <th width="50%">Bentuk Penghargaan</th>
                <th width="30%">Pemberi</th>
            </tr>
        </thead>
        <tbody>
            @php $penghargaans = isset($pelatihan) ? $pelatihan->where('tipe', 'penghargaan') : []; @endphp
            @forelse($penghargaans as $index => $ph)
            <tr>
                <td class="text-center">{{ $loop->iteration }}</td>
                <td class="text-center">{{ $ph->tahun ?? '-' }}</td>
                <td>{{ $ph->nama_kegiatan ?? '-' }}</td>
                <td>{{ $ph->penyelenggara ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" class="text-center">Tidak ada data penghargaan.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">ORGANISASI PROFESI/ILMIAH</div>
    <table class="table-data" style="border-top: none;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="15%">Tahun</th>
                <th width="50%">Jenis / Nama Organisasi</th>
                <th width="30%">Jabatan / Jenjang Keanggotaan</th>
            </tr>
        </thead>
        <tbody>
            @php $organisasis = isset($pelatihan) ? $pelatihan->where('tipe', 'organisasi') : []; @endphp
            @forelse($organisasis as $index => $org)
            <tr>
                <td class="text-center">{{ $loop->iteration }}</td>
                <td class="text-center">{{ $org->tahun ?? '-' }}</td>
                <td>{{ $org->nama_kegiatan ?? '-' }}</td>
                <td>{{ $org->peran ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" class="text-center">Tidak ada data organisasi.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <p style="text-align: justify; margin-top: 30px;">Saya menyatakan bahwa semua keterangan dalam lembar ini adalah benar dan apabila terdapat kesalahan, saya bersedia mempertanggung-jawabkannya.</p>

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
                Yang Menyatakan,
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


