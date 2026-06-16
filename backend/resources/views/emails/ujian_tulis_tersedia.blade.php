@extends('emails.layout')
@section('title', 'Asesmen Tahap 2 RPL Tersedia')

@section('content')
    <h1 style="font-size: 30px; color: #131b2e; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px 0; text-align: center;">
        Asesmen Tahap 2 Tersedia
    </h1>
    
    <p style="font-size: 16px; color: #434655; line-height: 1.6; margin: 0 auto 8px auto; text-align: center; max-width: 500px;">
        Yth. <span style="font-weight: 600; color: #131b2e;">{{ $pendaftaran->user->nama ?? '-' }}</span>,
    </p>
    
    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 24px auto; text-align: center; max-width: 500px;">
        Asesor RPL telah menerbitkan instruksi/soal <strong style="color: #131b2e;">Asesmen Tahap 2</strong> untuk Anda.
    </p>

    <!-- Alert Section -->
    <div style="background-color: #ffdad6; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: left;">
        <h3 style="color: #93000a; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Hal Penting:</h3>
        <ul style="padding-left: 20px; margin: 0; color: #93000a; font-size: 14px; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Jadwal dan detail dapat diakses melalui menu <strong style="font-weight: 600;">Asesmen Tahap 2</strong> di akun SIRPL Anda.</li>
            <li style="margin-bottom: 8px;">Pastikan Anda mengikuti instruksi (dan mengirimkan jawaban tertulis jika ada) <strong style="font-weight: 600;">sebelum batas waktu</strong> yang ditentukan oleh Asesor.</li>
            <li>Jawaban yang sudah dikirim <strong style="font-weight: 600;">tidak dapat diubah</strong>.</li>
        </ul>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')) }}/pemohon/asesmen-tahap-2" style="display: inline-block; background-color: #004ac6; color: #ffffff; font-size: 14px; font-weight: 600; padding: 16px 40px; border-radius: 9999px; text-decoration: none; text-align: center; letter-spacing: 0.01em; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Buka Asesmen Tahap 2
        </a>
    </div>
@endsection
