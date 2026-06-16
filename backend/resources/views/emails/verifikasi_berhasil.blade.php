@extends('emails.layout')
@section('title', 'Berkas Terverifikasi - SIRPL')

@section('content')
    <h1 style="font-size: 30px; color: #131b2e; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px 0; text-align: center;">
        Berkas Berhasil Diverifikasi
    </h1>
    
    <p style="font-size: 16px; color: #434655; line-height: 1.6; margin: 0 auto 8px auto; text-align: center; max-width: 500px;">
        Yth. <span style="font-weight: 600; color: #131b2e;">{{ $pendaftaran->user->nama ?? '-' }}</span>,
    </p>
    
    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 24px auto; text-align: center; max-width: 500px;">
        Seluruh dokumen pendaftaran dan portofolio Anda telah <strong style="color: #131b2e;">diverifikasi dan dinyatakan valid</strong> oleh Admin Program Studi.
    </p>

    <!-- Details Section -->
    <div style="background-color: #f2f3ff; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: left;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; width: 40%; border-bottom: 1px solid #dae2fd;">Nomor Pendaftaran</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600; border-bottom: 1px solid #dae2fd;">{{ $pendaftaran->nomor_pendaftaran ?? 'RPL-'.$pendaftaran->id }}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px;">Status Saat Ini</td>
                <td style="padding: 12px 0;"><span style="display: inline-block; background-color: #dbe1ff; color: #004ac6; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">Menunggu Pra-Asesmen</span></td>
            </tr>
        </table>
    </div>

    <!-- Alert Section -->
    <div style="background-color: #eaedff; border-radius: 12px; padding: 20px; margin-bottom: 32px; text-align: left;">
        <h3 style="font-size: 16px; color: #004ac6; margin: 0 0 8px 0; font-weight: 600;">Langkah Selanjutnya</h3>
        <p style="color: #434655; font-size: 14px; line-height: 1.6; margin: 0;">
            Silakan pantau email dan menu <strong style="font-weight: 600;">Jadwal</strong> di akun SIRPL Anda untuk mengetahui jadwal Pra-Asesmen (Wawancara / Observasi) yang akan ditetapkan oleh Asesor.
        </p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')) }}/pemohon/dashboard" style="display: inline-block; background-color: #004ac6; color: #ffffff; font-size: 14px; font-weight: 600; padding: 16px 40px; border-radius: 9999px; text-decoration: none; text-align: center; letter-spacing: 0.01em; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Cek Status Pendaftaran
        </a>
    </div>
@endsection
