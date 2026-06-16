<?php

namespace App\Console\Commands;

use App\Models\ArsipDokumen;
use App\Models\Dokumen;
use App\Models\Sanggah;
use App\Models\SkKeputusan;
use App\Services\PrivateDocumentStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class VerifyPhaseOne extends Command
{
    protected $signature = 'phase1:verify';

    protected $description = 'Verify Phase 1 security and data-integrity invariants';

    public function handle(): int
    {
        $checks = [
            'Unique pleno per pendaftaran/MK' => $this->hasUniqueIndex(
                'pleno_mk',
                'uq_pleno_pendaftaran_mk',
            ),
            'Unique penugasan asesor' => $this->hasUniqueIndex(
                'penugasan_asesor',
                'uq_penugasan_pendaftaran_asesor',
            ),
            'Unique nomor SK' => $this->hasUniqueIndex(
                'sk_keputusan',
                'uq_sk_nomor',
            ),
            'Unique sanggah per pendaftaran/MK' => $this->hasUniqueIndex(
                'sanggah',
                'uq_sanggah_pendaftaran_mk',
            ),
            'Unique payment order' => $this->hasUniqueIndex(
                'pendaftaran',
                'uq_pendaftaran_midtrans_order',
            ),
            'Snapshot SK terbit lengkap' => ! DB::table('sk_keputusan')
                ->where('status', 'sk_terbit')
                ->where(function ($query) {
                    $query->whereNull('penerbit_nama')
                        ->orWhereNull('published_at')
                        ->orWhereNull('content_hash')
                        ->orWhereNull('document_snapshot')
                        ->orWhereNull('pdf_path')
                        ->orWhereNull('pdf_hash');
                })
                ->exists(),
            'Hash PDF SK terbit sesuai artefak' =>
                $this->publishedPdfHashesAreValid(),
            'File sensitif tidak tersisa di public disk' =>
                $this->publicSensitiveFileCount() === 0,
            'File sensitif tersedia di private disk' =>
                $this->missingPrivateFileCount() === 0,
            'Tidak ada private document orphan' =>
                $this->privateOrphanCount() === 0,
            'Tidak ada QR SK orphan' => $this->qrOrphanCount() === 0,
            'Critical foreign keys menggunakan RESTRICT' =>
                $this->criticalForeignKeysAreRestricted(),
            'Utility dan controller legacy sudah dihapus' =>
                $this->legacyArtifactsAreAbsent(),
        ];

        foreach ($checks as $name => $passed) {
            $this->line(sprintf(
                '[%s] %s',
                $passed ? 'PASS' : 'FAIL',
                $name,
            ));
        }

        return in_array(false, $checks, true)
            ? self::FAILURE
            : self::SUCCESS;
    }

    private function hasUniqueIndex(string $table, string $name): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $index) =>
                $index['name'] === $name && $index['unique']
            );
    }

    private function publicSensitiveFileCount(): int
    {
        return collect($this->sensitivePaths())
            ->merge(
                collect(['dokumen', 'sanggah', 'arsip'])
                    ->flatMap(fn (string $directory) =>
                        Storage::disk('public')->allFiles($directory)
                    ),
            )
            ->unique()
            ->filter(fn (string $path) =>
                Storage::disk('public')->exists($path)
            )
            ->count();
    }

    private function missingPrivateFileCount(): int
    {
        return collect($this->sensitivePaths())
            ->reject(fn (string $path) =>
                Storage::disk('private-documents')->exists($path)
            )
            ->count();
    }

    private function sensitivePaths(): array
    {
        return array_values(array_filter([
            ...Dokumen::pluck('file_path')->all(),
            ...ArsipDokumen::pluck('file_path')->all(),
            ...Sanggah::whereNotNull('bukti_path')->pluck('bukti_path')->all(),
        ]));
    }

    private function publishedPdfHashesAreValid(): bool
    {
        return SkKeputusan::where('status', 'sk_terbit')
            ->get(['pdf_path', 'pdf_hash'])
            ->every(function (SkKeputusan $sk) {
                if (! $sk->pdf_path || ! $sk->pdf_hash) {
                    return false;
                }

                $disk = Storage::disk('private-documents');

                return $disk->exists($sk->pdf_path)
                    && hash('sha256', $disk->get($sk->pdf_path)) === $sk->pdf_hash;
            });
    }

    private function privateOrphanCount(): int
    {
        $references = collect($this->sensitivePaths())
            ->merge(
                SkKeputusan::whereNotNull('pdf_path')->pluck('pdf_path'),
            )
            ->filter()
            ->unique()
            ->flip();
        $disk = Storage::disk(PrivateDocumentStorage::DISK);

        return collect(['dokumen', 'sanggah', 'arsip', 'sk'])
            ->flatMap(fn (string $directory) => $disk->allFiles($directory))
            ->reject(fn (string $path) => $references->has($path))
            ->unique()
            ->count();
    }

    private function qrOrphanCount(): int
    {
        $references = SkKeputusan::whereNotNull('qr_code_path')
            ->pluck('qr_code_path')
            ->filter()
            ->flip();

        return collect(Storage::disk('public')->allFiles('qrcode/sk'))
            ->reject(fn (string $path) => $references->has($path))
            ->count();
    }

    private function criticalForeignKeysAreRestricted(): bool
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return true;
        }

        $expected = [
            'pendaftaran_user_id_foreign',
            'sk_keputusan_pendaftaran_id_foreign',
            'pleno_mk_mata_kuliah_id_foreign',
            'sanggah_mata_kuliah_id_foreign',
        ];
        $actual = collect(DB::select(
            'SELECT CONSTRAINT_NAME, DELETE_RULE '.
            'FROM information_schema.REFERENTIAL_CONSTRAINTS '.
            'WHERE CONSTRAINT_SCHEMA = DATABASE()',
        ))->keyBy('CONSTRAINT_NAME');

        return collect($expected)->every(
            fn (string $name) =>
                ($actual->get($name)?->DELETE_RULE ?? null) === 'RESTRICT',
        );
    }

    private function legacyArtifactsAreAbsent(): bool
    {
        return collect([
            'debug_at2.php',
            'reset_scores_at2.php',
            'dump_schema.php',
            'test_mail.php',
            'remove_underlines.php',
            'app/Http/Controllers/Api/Asesor/UjianController.php',
            '../fix_pdf.php',
        ])->every(fn (string $path) => ! file_exists(base_path($path)));
    }
}
