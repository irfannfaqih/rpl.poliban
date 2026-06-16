@extends('pdf.layout')

@section('title', 'F16 - Daftar Riwayat Hidup Pemohon')

@section('content')
    <h4 class="doc-title">FORMULIR F16: DAFTAR RIWAYAT HIDUP PEMOHON</h4>

    <div class="section-title">A. IDENTITAS DIRI</div>
    <table class="data-table">
        <tr>
            <th width="30%">Nama Lengkap</th>
            <td width="70%">{{ $dataDiri->nama_lengkap ?? '-' }}</td>
        </tr>
        <tr>
            <th>Tempat, Tanggal Lahir</th>
            <td>{{ $dataDiri->tempat_lahir ?? '-' }}, {{ $dataDiri->tanggal_lahir ?? '-' }}</td>
        </tr>
        <tr>
            <th>Jenis Kelamin</th>
            <td>{{ $dataDiri->jenis_kelamin === 'L' ? 'Laki-Laki' : ($dataDiri->jenis_kelamin === 'P' ? 'Perempuan' : '-') }}</td>
        </tr>
        <tr>
            <th>Alamat Domisili</th>
            <td>{{ $dataDiri->alamat ?? '-' }}</td>
        </tr>
        <tr>
            <th>No. Telepon / HP</th>
            <td>{{ $dataDiri->no_hp ?? '-' }}</td>
        </tr>
        <tr>
            <th>Email Pribadi</th>
            <td>{{ $dataDiri->email_pribadi ?? '-' }}</td>
        </tr>
    </table>

    <div class="section-title">B. RIWAYAT PENDIDIKAN FORMAL</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="20%">Jenjang</th>
                <th width="35%">Nama Institusi</th>
                <th width="25%">Jurusan/Program Studi</th>
                <th width="15%">Tahun Lulus</th>
            </tr>
        </thead>
        <tbody>
            @forelse($riwayatPendidikan as $index => $pend)
            <tr>
                <td style="text-align:center;">{{ $index + 1 }}</td>
                <td>{{ $pend->jenjang }}</td>
                <td>{{ $pend->institusi }}</td>
                <td>{{ $pend->program_studi ?? '-' }}</td>
                <td style="text-align:center;">{{ $pend->tahun_lulus }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="text-align:center;">Tidak ada data riwayat pendidikan.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">C. RIWAYAT PEKERJAAN</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="30%">Nama Instansi / Perusahaan</th>
                <th width="25%">Jabatan / Peran</th>
                <th width="20%">Periode</th>
                <th width="20%">Deskripsi / Uraian Tugas</th>
            </tr>
        </thead>
        <tbody>
            @forelse($riwayatPekerjaan as $index => $pek)
            <tr>
                <td style="text-align:center;">{{ $index + 1 }}</td>
                <td>{{ $pek->nama }}</td>
                <td>{{ $pek->jabatan_peran ?? '-' }}</td>
                <td style="text-align:center;">{{ $pek->tahun_mulai }} - {{ $pek->tahun_selesai ?? 'Sekarang' }}</td>
                <td>{{ $pek->deskripsi ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="text-align:center;">Tidak ada data riwayat pekerjaan.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">D. PELATIHAN / SERTIFIKASI / ORGANISASI</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="15%">Tipe</th>
                <th width="35%">Nama Kegiatan / Organisasi</th>
                <th width="30%">Bidang / Penyelenggara</th>
                <th width="15%">Tahun</th>
            </tr>
        </thead>
        <tbody>
            @forelse($pelatihan as $index => $pel)
            <tr>
                <td style="text-align:center;">{{ $index + 1 }}</td>
                <td style="text-transform: capitalize;">{{ $pel->tipe }}</td>
                <td>{{ $pel->nama }}</td>
                <td>{{ $pel->bidang ?? '-' }}</td>
                <td style="text-align:center;">{{ $pel->tahun_mulai }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="text-align:center;">Tidak ada data pelatihan/organisasi.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

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
                Pemohon,
            </td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="height: 70px; border: none; padding: 0;"></td>
        </tr>
        <tr>
            <td style="border: none; padding: 0;"></td>
            <td style="border: none; padding: 0; text-align: left; vertical-align: top;">
                <strong style="white-space: nowrap;">({{ $dataDiri->nama_lengkap ?? '....................................' }})</strong>
            </td>
        </tr>
    </table>

@endsection


