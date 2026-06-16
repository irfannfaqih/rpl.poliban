<?php

namespace App\Services;

use App\Models\Pendaftaran;
use App\Models\SkKeputusan;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SkDocumentService
{
    private const CLAIM_TIMEOUT_MINUTES = 15;

    public function __construct(
        private QrCodeService $qrCodeService,
        private PdfService $pdfService,
        private SkSnapshotService $snapshotService,
    ) {}

    public function publish(
        SkKeputusan $sk,
        User $issuer,
        string $nomorSk,
    ): SkKeputusan {
        $token = (string) Str::uuid();
        $this->claimPublication($sk->id, $sk->pendaftaran_id, $token);

        $qrPath = null;
        $pdfPath = null;

        try {
            $pendaftaran = Pendaftaran::findOrFail($sk->pendaftaran_id);
            $tanggalTerbit = now()->toDateString();
            $snapshot = $this->snapshotService->build(
                $pendaftaran,
                $issuer,
                $nomorSk,
                $tanggalTerbit,
            );
            $contentHash = $this->snapshotService->hash($snapshot);

            $documentSk = $sk->fresh();
            $documentSk->forceFill([
                'nomor_sk' => $nomorSk,
                'tanggal_terbit' => $tanggalTerbit,
                'published_at' => now(),
                'diterbitkan_oleh' => $issuer->id,
                'penerbit_nama' => $issuer->nama,
                'penerbit_nip' => $issuer->nip,
                'penerbit_jabatan' => $issuer->jabatan,
                'total_sks_diakui' => $snapshot['total_sks_diakui'],
                'document_snapshot' => $snapshot,
                'content_hash' => $contentHash,
            ]);

            $qrPath = $this->qrCodeService->generateForSk(
                $documentSk,
                $token,
            );
            $documentSk->qr_code_path = $qrPath;
            $pendaftaran->setRelation('skKeputusan', $documentSk);

            $pdfBinary = $this->pdfService
                ->generateDocumentPdf($pendaftaran, 'SK')
                ->output();
            $pdfPath = "sk/{$sk->id}/{$contentHash}_{$token}.pdf";
            $this->storePdf($pdfPath, $pdfBinary);

            return DB::transaction(function () use (
                $sk,
                $issuer,
                $nomorSk,
                $tanggalTerbit,
                $snapshot,
                $contentHash,
                $qrPath,
                $pdfPath,
                $pdfBinary,
                $token,
            ) {
                $pendaftaran = Pendaftaran::whereKey($sk->pendaftaran_id)
                    ->lockForUpdate()
                    ->firstOrFail();
                abort_unless(
                    $pendaftaran->status_alur === 'finished',
                    409,
                    'Pendaftaran tidak berada pada tahap final penerbitan SK.',
                );

                $locked = SkKeputusan::whereKey($sk->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                abort_unless(
                    $locked->status === 'menunggu_sk' &&
                    hash_equals((string) $locked->generation_token, $token),
                    409,
                    'Proses penerbitan SK sudah berubah.',
                );

                $locked->update([
                    'nomor_sk' => $nomorSk,
                    'tanggal_terbit' => $tanggalTerbit,
                    'published_at' => now(),
                    'diterbitkan_oleh' => $issuer->id,
                    'penerbit_nama' => $issuer->nama,
                    'penerbit_nip' => $issuer->nip,
                    'penerbit_jabatan' => $issuer->jabatan,
                    'total_sks_diakui' => $snapshot['total_sks_diakui'],
                    'document_snapshot' => $snapshot,
                    'content_hash' => $contentHash,
                    'qr_code_path' => $qrPath,
                    'pdf_path' => $pdfPath,
                    'pdf_hash' => hash('sha256', $pdfBinary),
                    'status' => 'sk_terbit',
                    'generation_token' => null,
                    'generation_started_at' => null,
                ]);

                return $locked->fresh();
            });
        } catch (\Throwable $e) {
            $this->deleteArtifacts($qrPath, $pdfPath);
            $this->releaseClaim($sk->id, $token);
            throw $e;
        }
    }

    public function materializePublished(SkKeputusan $sk): SkKeputusan
    {
        $sk = $sk->fresh();
        abort_unless($sk?->status === 'sk_terbit', 409, 'SK belum diterbitkan.');
        abort_unless(
            $sk->document_snapshot && $sk->content_hash,
            409,
            'Snapshot Surat Keputusan tidak lengkap.',
        );

        $qrExists = $sk->qr_code_path &&
            Storage::disk('public')->exists($sk->qr_code_path);
        $pdfExists = $sk->pdf_path &&
            Storage::disk('private-documents')->exists($sk->pdf_path);
        if ($qrExists && $pdfExists) {
            return $sk;
        }

        $token = (string) Str::uuid();
        $this->claimMaterialization($sk->id, $token);
        $generatedQr = false;
        $generatedPdf = false;
        $qrPath = $sk->qr_code_path;
        $pdfPath = $sk->pdf_path;

        try {
            if (! $qrExists) {
                $qrPath = $this->qrCodeService->generateForSk(
                    $sk,
                    $token,
                    $qrPath,
                );
                $generatedQr = true;
            }

            $sk->qr_code_path = $qrPath;
            if (! $pdfExists) {
                $pendaftaran = $sk->pendaftaran()->firstOrFail();
                $pendaftaran->setRelation('skKeputusan', $sk);
                $pdfBinary = $this->pdfService
                    ->generateDocumentPdf($pendaftaran, 'SK')
                    ->output();
                $pdfPath ??= "sk/{$sk->id}/{$sk->content_hash}_{$token}.pdf";
                $this->storePdf($pdfPath, $pdfBinary);
                $generatedPdf = true;
            } else {
                $pdfBinary = Storage::disk('private-documents')->get($pdfPath);
            }

            return DB::transaction(function () use (
                $sk,
                $token,
                $qrPath,
                $pdfPath,
                $pdfBinary,
            ) {
                $locked = SkKeputusan::whereKey($sk->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                abort_unless(
                    $locked->status === 'sk_terbit' &&
                    hash_equals((string) $locked->generation_token, $token),
                    409,
                    'Proses materialisasi SK sudah berubah.',
                );

                SkKeputusan::maintainArtifacts(fn () => $locked->update([
                    'qr_code_path' => $qrPath,
                    'pdf_path' => $pdfPath,
                    'pdf_hash' => hash('sha256', $pdfBinary),
                    'generation_token' => null,
                    'generation_started_at' => null,
                ]));

                return $locked->fresh();
            });
        } catch (\Throwable $e) {
            $this->deleteArtifacts(
                $generatedQr ? $qrPath : null,
                $generatedPdf ? $pdfPath : null,
            );
            $this->releaseClaim($sk->id, $token);
            throw $e;
        }
    }

    private function claimPublication(
        int $skId,
        int $pendaftaranId,
        string $token,
    ): void
    {
        DB::transaction(function () use ($skId, $pendaftaranId, $token) {
            $pendaftaran = Pendaftaran::whereKey($pendaftaranId)
                ->lockForUpdate()
                ->firstOrFail();
            $locked = SkKeputusan::whereKey($skId)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $pendaftaran->status_alur === 'finished',
                409,
                'Pendaftaran tidak berada pada tahap final penerbitan SK.',
            );
            abort_unless(
                $locked->status === 'menunggu_sk',
                409,
                'SK sudah diterbitkan atau tidak berada pada tahap penerbitan.',
            );
            $this->assertClaimAvailable($locked);

            $pleno = $pendaftaran->plenoMk()
                ->lockForUpdate()
                ->get(['keputusan_final']);
            abort_if(
                $pleno->isEmpty() ||
                $pleno->contains(
                    fn ($item) => ! in_array(
                        $item->keputusan_final,
                        ['A', 'AB', 'B', 'BC', 'C', 'T'],
                        true,
                    ),
                ),
                409,
                'Keputusan pleno tidak lengkap atau telah berubah.',
            );

            $locked->update([
                'generation_token' => $token,
                'generation_started_at' => now(),
            ]);
        });
    }

    private function claimMaterialization(int $skId, string $token): void
    {
        DB::transaction(function () use ($skId, $token) {
            $locked = SkKeputusan::whereKey($skId)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $locked->status === 'sk_terbit',
                409,
                'SK belum diterbitkan.',
            );
            $this->assertClaimAvailable($locked);
            $locked->update([
                'generation_token' => $token,
                'generation_started_at' => now(),
            ]);
        });
    }

    private function assertClaimAvailable(SkKeputusan $sk): void
    {
        if (
            $sk->generation_token &&
            $sk->generation_started_at?->gt(
                now()->subMinutes(self::CLAIM_TIMEOUT_MINUTES),
            )
        ) {
            throw new HttpException(
                409,
                'Dokumen SK sedang diproses. Silakan coba kembali.',
            );
        }
    }

    private function releaseClaim(int $skId, string $token): void
    {
        DB::transaction(function () use ($skId, $token) {
            $locked = SkKeputusan::whereKey($skId)->lockForUpdate()->first();
            if (
                $locked &&
                hash_equals((string) $locked->generation_token, $token)
            ) {
                $locked->update([
                    'generation_token' => null,
                    'generation_started_at' => null,
                ]);
            }
        });
    }

    private function storePdf(string $path, string $binary): void
    {
        $disk = Storage::disk('private-documents');
        if (! $disk->put($path, $binary) || ! $disk->exists($path)) {
            throw new \RuntimeException('File PDF SK tidak dapat disimpan.');
        }
        if ($disk->size($path) !== strlen($binary)) {
            $disk->delete($path);
            throw new \RuntimeException('File PDF SK gagal diverifikasi.');
        }
    }

    private function deleteArtifacts(?string $qrPath, ?string $pdfPath): void
    {
        if ($qrPath) {
            Storage::disk('public')->delete($qrPath);
        }
        if ($pdfPath) {
            Storage::disk('private-documents')->delete($pdfPath);
        }
    }
}
