<?php $__env->startSection('title', 'SK Keputusan RPL Diterbitkan'); ?>

<?php $__env->startSection('content'); ?>
    <h1 style="font-size: 30px; color: #131b2e; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px 0; text-align: center;">
        SK Keputusan Diterbitkan
    </h1>
    
    <p style="font-size: 16px; color: #434655; line-height: 1.6; margin: 0 auto 8px auto; text-align: center; max-width: 500px;">
        Yth. <span style="font-weight: 600; color: #131b2e;"><?php echo e($pendaftaran->user->nama ?? '-'); ?></span>,
    </p>
    
    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 24px auto; text-align: center; max-width: 500px;">
        Surat Keputusan (SK) Pimpinan mengenai hasil asesmen Rekognisi Pembelajaran Lampau (RPL) Anda telah resmi <strong style="color: #131b2e;">diterbitkan</strong>.
    </p>

    <!-- Details Section -->
    <div style="background-color: #f2f3ff; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: left;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; width: 40%; border-bottom: 1px solid #dae2fd;">Total SKS Diakui</td>
                <td style="padding: 12px 0; color: #004ac6; font-size: 18px; font-weight: 700; border-bottom: 1px solid #dae2fd;"><?php echo e($sk->total_sks_diakui); ?> SKS</td>
            </tr>
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px; border-bottom: 1px solid #dae2fd;">Nomor SK</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600; border-bottom: 1px solid #dae2fd;"><?php echo e($sk->nomor_sk ?? '-'); ?></td>
            </tr>
            <tr>
                <td style="padding: 12px 0; color: #54647a; font-size: 14px;">Tanggal SK</td>
                <td style="padding: 12px 0; color: #131b2e; font-size: 14px; font-weight: 600;"><?php echo e($sk->tanggal_terbit ? \Carbon\Carbon::parse($sk->tanggal_terbit)->translatedFormat('d F Y') : '-'); ?></td>
            </tr>
        </table>
    </div>

    <p style="font-size: 14px; color: #434655; line-height: 1.5; margin: 0 auto 32px auto; text-align: center; max-width: 500px;">
        Anda sudah dapat mengunduh dokumen SK Keputusan serta melihat rincian mata kuliah yang diakui melalui dashboard aplikasi.
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
        <a href="<?php echo e(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000'))); ?>/pemohon/dashboard" style="display: inline-block; background-color: #004ac6; color: #ffffff; font-size: 14px; font-weight: 600; padding: 16px 40px; border-radius: 9999px; text-decoration: none; text-align: center; letter-spacing: 0.01em; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Lihat Hasil dan Unduh SK
        </a>
    </div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('emails.layout', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH C:\SIRPL - Backup 3 june 2026\backend\resources\views/emails/sk_diterbitkan.blade.php ENDPATH**/ ?>