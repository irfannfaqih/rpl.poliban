@extends('emails.layout')
@section('title', 'Reset Password Akun SIRPL Poliban')

@section('content')
    <h1 style="font-size: 30px; color: #131b2e; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px 0; text-align: center;">
        Reset Password Akun SIRPL
    </h1>

    <p style="font-size: 16px; color: #434655; line-height: 1.6; margin: 0 auto 8px auto; text-align: center; max-width: 500px;">
        Halo <span style="font-weight: 600; color: #131b2e;">{{ $user->nama ?? 'Pengguna SIRPL' }}</span>,
    </p>

    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 24px auto; text-align: center; max-width: 500px;">
        Kami menerima permintaan untuk mengatur ulang password akun SIRPL Anda. Klik tombol di bawah ini untuk melanjutkan proses reset password.
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ $url }}" style="display: inline-block; background-color: #004ac6; color: #ffffff; font-size: 14px; font-weight: 600; padding: 16px 40px; border-radius: 9999px; text-decoration: none; text-align: center; letter-spacing: 0.01em; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Reset Password
        </a>
    </div>

    <div style="background-color: #f2f3ff; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: left;">
        <h3 style="font-size: 16px; color: #004ac6; margin: 0 0 12px 0; font-weight: 600;">Informasi Penting</h3>
        <ul style="padding-left: 20px; margin: 0; color: #434655; font-size: 14px; line-height: 1.6;">
            <li style="margin-bottom: 8px;">Tautan reset password ini berlaku selama <strong style="color: #131b2e;">{{ $expiresInMinutes }} menit</strong>.</li>
            <li style="margin-bottom: 8px;">Gunakan password baru yang kuat dan tidak digunakan di layanan lain.</li>
            <li>Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.</li>
        </ul>
    </div>

    <p style="font-size: 13px; color: #737686; line-height: 1.5; margin: 0 auto; text-align: center; max-width: 500px;">
        Demi keamanan, jangan bagikan tautan reset password ini kepada siapa pun.
    </p>
@endsection
