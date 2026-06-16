<?php

namespace App\Console\Commands;

use App\Models\ArsipDokumen;
use App\Models\Dokumen;
use App\Models\Sanggah;
use App\Services\PrivateDocumentStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigratePrivateDocuments extends Command
{
    protected $signature = 'documents:migrate-private {--dry-run}';

    protected $description = 'Move legacy sensitive documents from public storage to private storage';

    public function handle(): int
    {
        $referencedPaths = Dokumen::whereNotNull('file_path')->pluck('file_path')
            ->merge(ArsipDokumen::whereNotNull('file_path')->pluck('file_path'))
            ->merge(Sanggah::whereNotNull('bukti_path')->pluck('bukti_path'))
            ->filter()
            ->unique();

        $public = Storage::disk('public');
        $private = Storage::disk(PrivateDocumentStorage::DISK);
        $orphanPaths = collect(['dokumen', 'sanggah', 'arsip'])
            ->flatMap(fn (string $directory) => $public->allFiles($directory));
        $paths = $referencedPaths->merge($orphanPaths)->unique();
        $moved = 0;

        foreach ($paths as $path) {
            if (! $public->exists($path)) {
                continue;
            }

            $this->line(($this->option('dry-run') ? '[dry-run] ' : '').$path);
            if ($this->option('dry-run')) {
                continue;
            }

            if (! $private->exists($path) && ! $private->put($path, $public->get($path))) {
                $this->error("Gagal menyalin {$path} ke private storage.");

                return self::FAILURE;
            }

            if (! $private->exists($path) || $private->size($path) !== $public->size($path)) {
                $this->error("Verifikasi salinan gagal untuk {$path}.");

                return self::FAILURE;
            }

            $public->delete($path);
            $moved++;
        }

        $this->info("Selesai. {$moved} file dipindahkan.");

        return self::SUCCESS;
    }
}
