@extends('pdf.layout')

@section('title', 'Dokumen RPL')

@section('content')
    <h4 class="doc-title">DOKUMEN: {{ $documentId }}</h4>

    <p>Ini adalah template generic / auto-generate untuk dokumen RPL kode {{ $documentId }}.</p>
    
    <p>Fitur ini masih dalam tahap pengembangan (WIP) untuk menampilkan detail spesifik sesuai format kementerian.</p>

    <div class="section-title">Data Referensi Pendaftar</div>
    <table class="data-table">
        <tr>
            <th width="30%">ID Pendaftaran</th>
            <td>{{ $pendaftaran->id }}</td>
        </tr>
        <tr>
            <th>Nama Pemohon</th>
            <td>{{ $dataDiri->nama_lengkap ?? 'N/A' }}</td>
        </tr>
        <tr>
            <th>Program Studi Tujuan</th>
            <td>{{ $pendaftaran->prodi->nama_prodi ?? 'N/A' }}</td>
        </tr>
        <tr>
            <th>Tahun Akademik / Semester</th>
            <td>{{ $pendaftaran->tahun_akademik ?? '-' }} / {{ $pendaftaran->semester ?? '-' }}</td>
        </tr>
    </table>

    <div class="signature-box">
        <p>Banjarmasin, {{ date('d F Y') }}</p>
        <p>Dicetak Oleh Sistem,</p>
        <br><br><br>
        <strong>Admin RPL Poliban</strong>
    </div>
    <div class="clear"></div>
@endsection


