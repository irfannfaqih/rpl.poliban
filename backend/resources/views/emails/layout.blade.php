<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>@yield('title', 'SIRPL Poliban')</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; margin: 0; padding: 0; background-color: #ffffff; color: #131b2e; }
    table { border-collapse: collapse; }
</style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; color: #131b2e; font-family: 'Plus Jakarta Sans', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    
    <!-- Top Pattern Bar -->
    <div style="width: 100%; height: 12px; overflow: hidden; background-color: #f2f3ff;">
        <img alt="Pattern" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvbCWRUKbhu1FkcwUW574rLSQ4XPIQbZJxuLN5nUvwQlRIkqoNNO0Qqkqww8JNCNOONOYiVgCn1sgFycMOJgVMHGYpOCun7NyCjokpzsE1_O8PS9hGcGdyH26O196vW5zqnOe-G2ewOw8LwPOAaFygcJvR9tb8VxCdvp3a3QTQhTYV85eOslgrjQdlflcmr-AOTP4rSxPehKSgROouyn_aYD9dG9f25ZUEoDEzlj6bPUxMGzxozIT4YhlQl-6WlgCwRD6lJ_TCJg" style="width: 100%; height: 100%; object-fit: cover; display: block;">
    </div>

    <!-- Main Content Shell -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 640px; margin: 0 auto; padding: 24px 16px;">
        <tr>
            <td align="center" style="padding-top: 24px; padding-bottom: 16px;">
                <!-- Logo Header -->
                <img alt="Poliban Logo" src="https://poliban.ac.id/wp-content/uploads/elementor/thumbs/logo-poliban-jurusan-elektro-qk7viq77pvg3pdria0wjpmdjnb0p1myetqdr356ck4.png" style="height: 64px; object-fit: contain; display: block;">
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

    <!-- Footer Area -->
    <div style="width: 100%; height: 16px; overflow: hidden; margin-top: 32px;">
        <img alt="Pattern" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvbCWRUKbhu1FkcwUW574rLSQ4XPIQbZJxuLN5nUvwQlRIkqoNNO0Qqkqww8JNCNOONOYiVgCn1sgFycMOJgVMHGYpOCun7NyCjokpzsE1_O8PS9hGcGdyH26O196vW5zqnOe-G2ewOw8LwPOAaFygcJvR9tb8VxCdvp3a3QTQhTYV85eOslgrjQdlflcmr-AOTP4rSxPehKSgROouyn_aYD9dG9f25ZUEoDEzlj6bPUxMGzxozIT4YhlQl-6WlgCwRD6lJ_TCJg" style="width: 100%; height: 100%; object-fit: cover; display: block;">
    </div>
    <div style="background-color: #ffffff; border-top: 1px solid #c3c6d7; width: 100%; padding: 24px 16px; text-align: center; box-sizing: border-box;">
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
