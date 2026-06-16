<?php

namespace App\Console\Commands;

use App\Services\Telemetry\Metrics;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

class MonitorQueueHealth extends Command
{
    protected $signature = 'queue:health {--fail-on-unhealthy}';

    protected $description = 'Report queue depth, failures, and worker heartbeat health';

    public function handle(Metrics $metrics): int
    {
        $connection = config('queue.default');
        $pending = Queue::connection($connection)->size();
        $failed = DB::table(config('queue.failed.table', 'failed_jobs'))->count();
        $heartbeat = Cache::get(config('observability.queue_heartbeat_key'));
        $heartbeatAge = $heartbeat
            ? abs(now()->diffInSeconds($heartbeat))
            : null;
        $healthy = $connection === 'sync' || (
            $heartbeatAge !== null &&
            $heartbeatAge <= config('observability.queue_heartbeat_ttl')
        );

        $metrics->gauge('queue.depth', $pending, ['connection' => $connection]);
        $metrics->gauge('queue.failed.total', $failed, ['connection' => $connection]);
        $metrics->gauge('queue.worker.heartbeat_age', $heartbeatAge ?? -1, [
            'connection' => $connection,
        ]);

        $this->table(
            ['Connection', 'Pending', 'Failed', 'Heartbeat age', 'Healthy'],
            [[$connection, $pending, $failed, $heartbeatAge ?? 'missing', $healthy ? 'yes' : 'no']],
        );

        if (
            ! $healthy ||
            $failed >= config('observability.queue_failed_threshold')
        ) {
            $this->warn('Queue requires operator attention.');

            return $this->option('fail-on-unhealthy') ? self::FAILURE : self::SUCCESS;
        }

        return self::SUCCESS;
    }
}
