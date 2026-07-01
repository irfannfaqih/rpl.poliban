<?php

namespace App\Console\Commands;

use App\Services\At2ExpiredAutoSubmitService;
use Illuminate\Console\Command;

class AutoSubmitExpiredAt2 extends Command
{
    protected $signature = 'at2:auto-submit-expired';

    protected $description = 'Finalize expired AT2 written sessions for correction';

    public function handle(At2ExpiredAutoSubmitService $service): int
    {
        $result = $service->finalizeExpired();

        if ($result['processed'] === 0) {
            $this->info("Tidak ada sesi AT2 expired yang perlu difinalisasi.");
        } else {
            $this->info("{$result['processed']} sesi AT2 expired berhasil difinalisasi.");
        }

        $this->line("Dilewati: {$result['skipped']}.");

        return self::SUCCESS;
    }
}
