<?php

namespace App\Console\Commands;

use App\Jobs\QueueProbeJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class QueueProbe extends Command
{
    protected $signature = 'queue:probe {--wait=5 : Seconds to wait for the probe job}';

    protected $description = 'Dispatch a lightweight queue probe and optionally wait until a worker processes it';

    public function handle(): int
    {
        $key = 'queue:probe:'.Str::uuid();
        QueueProbeJob::dispatch($key);

        $deadline = microtime(true) + (float) $this->option('wait');
        do {
            if (Cache::has($key)) {
                Cache::forget($key);
                $this->info('Queue probe processed successfully.');

                return self::SUCCESS;
            }

            usleep(100_000);
        } while (microtime(true) < $deadline);

        $this->error('Queue probe was not processed before the timeout.');

        return self::FAILURE;
    }
}
