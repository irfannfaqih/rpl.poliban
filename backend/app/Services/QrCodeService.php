<?php

namespace App\Services;

use App\Models\SkKeputusan;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrCodeService
{
    /**
     * Generate QR code untuk verifikasi keaslian SK.
     *
     * QR code berisi URL ke halaman verifikasi publik yang menampilkan
     * data resmi SK sehingga pihak ketiga bisa memvalidasi dokumen.
     *
     * @return string Path file QR code yang disimpan (relatif terhadap disk 'public')
     */
    public function generateForSk(
        SkKeputusan $sk,
        ?string $generationId = null,
        ?string $targetPath = null,
    ): string
    {
        $frontendUrl = rtrim(
            config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')),
            '/',
        );
        $verifyUrl = $frontendUrl.'/verifikasi-sk/'.$sk->id.'?token='.$this->generateToken($sk);

        // SVG tidak membutuhkan ekstensi Imagick dan dapat dirender langsung oleh DomPDF.
        $qrImage = QrCode::format('svg')
            ->size(300)
            ->margin(2)
            ->errorCorrection('H')
            ->generate($verifyUrl);

        $suffix = $generationId ? '_'.str_replace('-', '', $generationId) : '';
        $filename = $targetPath
            ?? 'qrcode/sk/sk_'.$sk->id.'_'.$sk->content_hash.$suffix.'.svg';

        if (! Storage::disk('public')->put($filename, $qrImage)) {
            throw new \RuntimeException('File QR Code tidak dapat disimpan.');
        }

        if (
            ! Storage::disk('public')->exists($filename) ||
            Storage::disk('public')->size($filename) === 0
        ) {
            throw new \RuntimeException('File QR Code gagal diverifikasi setelah disimpan.');
        }

        if (
            $sk->qr_code_path &&
            $sk->qr_code_path !== $filename &&
            Storage::disk('public')->exists($sk->qr_code_path)
        ) {
            Storage::disk('public')->delete($sk->qr_code_path);
        }

        return $filename;
    }

    /**
     * Generate token sederhana untuk verifikasi.
     * Token ini adalah hash dari data SK sehingga tidak bisa dipalsukan.
     */
    private function generateToken(SkKeputusan $sk): string
    {
        $payload = implode('|', [
            $sk->id,
            $sk->pendaftaran_id,
            $sk->nomor_sk ?? '',
            $sk->total_sks_diakui,
            $sk->content_hash ?? '',
            config('app.key'),
        ]);

        return hash('sha256', $payload);
    }

    /**
     * Verifikasi token QR code SK.
     */
    public function verifyToken(SkKeputusan $sk, string $token): bool
    {
        return hash_equals($this->generateToken($sk), $token);
    }
}
