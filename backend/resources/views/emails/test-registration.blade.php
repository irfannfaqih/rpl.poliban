@extends('emails.layout')
@section('title', 'Pendaftaran SIRPL Berhasil')

@section('content')
    <h1 style="font-size: 30px; color: #131b2e; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px 0; text-align: center;">
        Pendaftaran SIRPL Berhasil
    </h1>

    <p style="font-size: 16px; color: #434655; line-height: 1.6; margin: 0 auto 8px auto; text-align: center; max-width: 500px;">
        Yth. Calon Mahasiswa RPL,
    </p>

    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 24px auto; text-align: center; max-width: 500px;">
        Terima kasih telah melakukan pendaftaran pada Sistem Informasi Rekognisi Pembelajaran Lampau (SIRPL) Politeknik Negeri Banjarmasin.
    </p>

    <div style="background-color: #f2f3ff; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: left;">
        <h3 style="font-size: 16px; color: #004ac6; margin: 0 0 16px 0; font-weight: 600;">Langkah Selanjutnya</h3>
        <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
            @php
                $steps = [
                    'Masuk ke aplikasi SIRPL menggunakan email dan password yang telah dibuat.',
                    'Selesaikan pembayaran biaya pendaftaran sesuai petunjuk pada menu tagihan.',
                    'Unggah bukti pembayaran melalui sistem untuk diverifikasi oleh tim kami.',
                    'Setelah diverifikasi, lanjutkan pengisian borang pendaftaran dan evaluasi diri.'
                ];
            @endphp
            @foreach($steps as $i => $step)
                <tr>
                    <td style="vertical-align: top; padding: 8px 12px 8px 0; width: 28px;">
                        <span style="display: inline-block; width: 24px; height: 24px; background-color: #dbe1ff; color: #004ac6; border-radius: 6px; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">{{ $i + 1 }}</span>
                    </td>
                    <td style="padding: 8px 0; color: #434655; font-size: 14px; line-height: 1.5;">{{ $step }}</td>
                </tr>
            @endforeach
        </table>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="{{ config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')) }}/auth/login" style="display: inline-block; background-color: #004ac6; color: #ffffff; font-size: 14px; font-weight: 600; padding: 16px 40px; border-radius: 9999px; text-decoration: none; text-align: center; letter-spacing: 0.01em; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Masuk ke SIRPL
        </a>
    </div>
@endsection
