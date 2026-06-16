<?php

namespace App\Jobs;

use App\Services\Telemetry\Metrics;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

class QueueProbeJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 15;

    public function __construct(
        private string $key,
    ) {}

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [5, 15, 30];
    }

    public function handle(Metrics $metrics): void
    {
        Cache::put($this->key, now()->toIso8601String(), 60);
        $metrics->increment('queue.probe.success');
    }
}
