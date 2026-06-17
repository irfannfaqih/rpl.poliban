<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>@yield('title', 'SIRPL Poliban')</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6fb; color: #131b2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

    <!-- Top gradient bar (inline SVG, no external request) -->
    <div style="width: 100%; height: 8px; background: linear-gradient(90deg, #004ac6 0%, #2563eb 50%, #004ac6 100%);"></div>

    <!-- Main Content Shell -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 640px; margin: 0 auto; padding: 24px 16px; background-color: #ffffff;">
        <tr>
            <td align="center" style="padding-top: 24px; padding-bottom: 16px;">
                <!-- Logo Header: public HTTPS Poliban logo -->
                <img alt="Logo Politeknik Negeri Banjarmasin" src="https://rplpoliban.my.id/storage/poliban-email.jpg" style="height: 64px; width: 64px; object-fit: contain; display: block; border-radius: 8px;">
                <div style="margin-top: 8px; font-size: 13px; color: #004ac6; font-weight: 700; letter-spacing: 0.05em;">
                    POLITEKNIK NEGERI BANJARMASIN
                </div>
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 16px 0;">
                @yield('content')
            </td>
        </tr>
        <tr>
            <td align="center" style="padding-top: 32px;">
                <!-- Help Support -->
                <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0;">
                    Butuh bantuan? Kunjungi halaman <a href="{{ config('app.frontend_url', 'http://localhost:3000') }}/bantuan" style="color: #004ac6; text-decoration: underline; font-weight: 500;">Bantuan</a> atau email kami di <a href="mailto:support@poliban.ac.id" style="color: #004ac6; text-decoration: underline; font-weight: 500;">support@poliban.ac.id</a>.
                </p>
            </td>
        </tr>
    </table>

    <!-- Bottom gradient bar (inline, matches top) -->
    <div style="width: 100%; height: 8px; background: linear-gradient(90deg, #004ac6 0%, #2563eb 50%, #004ac6 100%);"></div>

    <div style="background-color: #ffffff; border-top: 1px solid #e5e7eb; width: 100%; padding: 24px 16px; text-align: center; box-sizing: border-box;">
        <p style="font-size: 12px; color: #434655; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 500; margin: 0 0 8px 0;">
            Politeknik Negeri Banjarmasin
        </p>
        <p style="font-size: 14px; color: #434655; margin: 0 0 16px 0;">
            Jl. Brigjend H. Hasan Basri, Kayu Tangi, Banjarmasin 70123
        </p>
        <p style="font-size: 11px; color: #737686; line-height: 1.5; margin: 0;">
            &copy; {{ date('Y') }} SIRPL Poliban. Email ini dikirim secara otomatis.
        </p>
    </div>
</body>
</html>
