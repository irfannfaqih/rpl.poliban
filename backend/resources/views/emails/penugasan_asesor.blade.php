@extends('emails.layout')
@section('title', 'Penugasan Asesmen RPL')

@section('content')
    <h1 style="font-size: 30px; color: #131b2e; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px 0; text-align: center;">
        Penugasan Asesmen RPL
    </h1>
    
    <p style="font-size: 16px; color: #434655; line-height: 1.6; margin: 0 auto 8px auto; text-align: center; max-width: 500px;">
        Yth. <span style="font-weight: 600; color: #131b2e;">{{ $asesor->nama }}</span>,
    </p>
    
    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 24px auto; text-align: center; max-width: 500px;">
        Anda telah ditugaskan oleh Admin Program Studi untuk menjadi Asesor dalam proses evaluasi Rekognisi Pembelajaran Lampau (RPL) untuk pemohon berikut:
    </p>

    <!-- Details Section -->
    <div style="background-color: #f2f3ff; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: left;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; width: 40%; border-bottom: 1px solid #dae2fd;">Nama Pemohon</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600; border-bottom: 1px solid #dae2fd;">{{ $pendaftaran->user->nama ?? '-' }}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; border-bottom: 1px solid #dae2fd;">Program Studi</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600; border-bottom: 1px solid #dae2fd;">{{ $pendaftaran->prodi->nama ?? '-' }}</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px;">No. Pendaftaran</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600;">{{ $pendaftaran->nomor_pendaftaran ?? 'RPL-'.$pendaftaran->id }}</td>
            </tr>
        </table>
    </div>

    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 32px auto; text-align: center; max-width: 500px;">
        Silakan masuk ke sistem SIRPL Poliban untuk memulai proses Pra-Asesmen dan meninjau portofolio pemohon.
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')) }}/auth/login" style="display: inline-block; background-color: #004ac6; color: #ffffff; font-size: 14px; font-weight: 600; padding: 16px 40px; border-radius: 9999px; text-decoration: none; text-align: center; letter-spacing: 0.01em; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Masuk ke SIRPL
        </a>
    </div>
@endsection
