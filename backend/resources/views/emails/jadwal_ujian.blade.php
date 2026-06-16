@extends('emails.layout')
@section('title', 'Undangan Asesmen Tahap 2 RPL')

@section('content')
    <h1 style="font-size: 30px; color: #131b2e; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px 0; text-align: center;">
        Undangan Asesmen Tahap 2
    </h1>
    
    <p style="font-size: 16px; color: #434655; line-height: 1.6; margin: 0 auto 8px auto; text-align: center; max-width: 500px;">
        Yth. <span style="font-weight: 600; color: #131b2e;">{{ $pendaftaran->user->nama ?? '-' }}</span>,
    </p>
    
    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 24px auto; text-align: center; max-width: 500px;">
        Asesor telah merampungkan penilaian pra-asesmen dan menetapkan jadwal <strong style="color: #131b2e;">Asesmen Tahap 2</strong> untuk Anda.
    </p>

    <!-- Details Section -->
    <div style="background-color: #f2f3ff; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: left;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; width: 35%; border-bottom: 1px solid #dae2fd;">Tanggal</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600; border-bottom: 1px solid #dae2fd;">{{ \Carbon\Carbon::parse($jadwal->tanggal_ujian)->translatedFormat('l, d F Y') }}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; border-bottom: 1px solid #dae2fd;">Waktu</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600; border-bottom: 1px solid #dae2fd;">{{ $jadwal->waktu_ujian ?? '-' }}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; border-bottom: 1px solid #dae2fd;">Tempat</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600; border-bottom: 1px solid #dae2fd;">{{ $jadwal->tempat }}</td>
            </tr>
            @if($jadwal->link_meeting)
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; border-bottom: 1px solid #dae2fd;">Tautan Rapat</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #dae2fd;"><a href="{{ $jadwal->link_meeting }}" style="color: #004ac6; font-size: 14px; font-weight: 600; text-decoration: underline;">Klik untuk bergabung</a></td>
            </tr>
            @endif
            @if($jadwal->catatan)
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px;">Catatan</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px;">{{ $jadwal->catatan }}</td>
            </tr>
            @endif
        </table>
    </div>

    <!-- Alert Section -->
    <div style="background-color: #ffdad6; border-radius: 12px; padding: 16px 20px; margin-bottom: 32px; text-align: left;">
        <p style="color: #93000a; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong style="font-weight: 600;">Perhatian:</strong> Mohon hadir tepat waktu. Jika ada instruksi/soal tertulis yang perlu diselesaikan, silakan periksa di menu <strong style="font-weight: 600;">Asesmen Tahap 2</strong> pada sistem aplikasi.
        </p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')) }}/pemohon/asesmen-tahap-2" style="display: inline-block; background-color: #004ac6; color: #ffffff; font-size: 14px; font-weight: 600; padding: 16px 40px; border-radius: 9999px; text-decoration: none; text-align: center; letter-spacing: 0.01em; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Buka Asesmen Tahap 2 di SIRPL
        </a>
    </div>
@endsection
