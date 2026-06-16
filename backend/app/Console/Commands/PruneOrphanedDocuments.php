<?php

namespace App\Console\Commands;

use App\Models\ArsipDokumen;
use App\Models\Dokumen;
use App\Models\Sanggah;
use App\Models\SkKeputusan;
use App\Services\PrivateDocumentStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class PruneOrphanedDocuments extends Command
{
    protected $signature = 'documents:prune-orphans {--execute}';

    protected $description = 'List or delete unreferenced private documents and SK QR files';

    public function handle(): int
    {
        $private = Storage::disk(PrivateDocumentStorage::DISK);
        $public = Storage::disk('public');
        $privateReferenced = $this->privateReferences();
        $qrReferenced = SkKeputusan::whereNotNull('qr_code_path')
            ->pluck('qr_code_path')
            ->filter()
            ->flip();

        $privateOrphans = collect(['dokumen', 'sanggah', 'arsip', 'sk'])
            ->flatMap(fn (string $directory) => $private->allFiles($directory))
            ->reject(fn (string $path) => $privateReferenced->has($path))
            ->unique();
        $qrOrphans = collect($public->allFiles('qrcode/sk'))
            ->reject(fn (string $path) => $qrReferenced->has($path))
            ->unique();

        foreach ($privateOrphans as $path) {
            $this->line("[private] {$path}");
        }
        foreach ($qrOrphans as $path) {
            $this->line("[public-qr] {$path}");
        }

        if (! $this->option('execute')) {
            $this->info(
                "Dry run: {$privateOrphans->count()} private orphan dan ".
                "{$qrOrphans->count()} QR orphan ditemukan.",
            );

            return self::SUCCESS;
        }

        $privateOrphans->each(fn (string $path) => $private->delete($path));
        $qrOrphans->each(fn (string $path) => $public->delete($path));
        $this->info(
            "{$privateOrphans->count()} private orphan dan ".
            "{$qrOrphans->count()} QR orphan dihapus.",
        );

        return self::SUCCESS;
    }

    private function privateReferences(): Collection
    {
        return Dokumen::whereNotNull('file_path')->pluck('file_path')
            ->merge(ArsipDokumen::whereNotNull('file_path')->pluck('file_path'))
            ->merge(Sanggah::whereNotNull('bukti_path')->pluck('bukti_path'))
            ->merge(SkKeputusan::whereNotNull('pdf_path')->pluck('pdf_path'))
            ->filter()
            ->unique()
            ->flip();
    }
}
