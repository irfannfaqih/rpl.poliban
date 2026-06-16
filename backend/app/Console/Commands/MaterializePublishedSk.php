<?php

namespace App\Console\Commands;

use App\Models\SkKeputusan;
use App\Services\SkDocumentService;
use Illuminate\Console\Command;

class MaterializePublishedSk extends Command
{
    protected $signature = 'sk:materialize-published';

    protected $description = 'Materialize immutable QR and PDF artifacts for published SK records';

    public function handle(SkDocumentService $skDocumentService): int
    {
        $count = 0;

        SkKeputusan::where('status', 'sk_terbit')
            ->orderBy('id')
            ->chunkById(50, function ($records) use ($skDocumentService, &$count) {
                foreach ($records as $sk) {
                    if (! $sk->document_snapshot || ! $sk->content_hash) {
                        $this->error("SK {$sk->id} tidak memiliki snapshot.");
                        continue;
                    }

                    try {
                        $skDocumentService->materializePublished($sk);
                        $count++;
                    } catch (\Throwable $e) {
                        $this->warn("SK {$sk->id} dilewati: {$e->getMessage()}");
                    }
                }
            });

        $this->info("{$count} SK terbit telah dimaterialisasi.");

        return self::SUCCESS;
    }
}
