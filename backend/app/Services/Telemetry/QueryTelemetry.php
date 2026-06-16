<?php

namespace App\Services\Telemetry;

use App\Support\RuntimeContext;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Log;

class QueryTelemetry
{
    private int $count = 0;

    private float $durationMs = 0;

    private int $slowCount = 0;

    public function reset(): void
    {
        $this->count = 0;
        $this->durationMs = 0;
        $this->slowCount = 0;
    }

    public function record(QueryExecuted $query): void
    {
        $this->count++;
        $this->durationMs += $query->time;

        if ($query->time < config('observability.slow_query_ms')) {
            return;
        }

        $this->slowCount++;
        Log::channel(config('observability.metrics_channel'))->warning('slow_query', [
            'duration_ms' => round($query->time, 2),
            'connection' => $query->connectionName,
            'endpoint' => RuntimeContext::routeUri(),
            'method' => RuntimeContext::method(),
            'sql' => $query->sql,
        ]);
    }

    public function snapshot(): array
    {
        return [
            'count' => $this->count,
            'duration_ms' => round($this->durationMs, 2),
            'slow_count' => $this->slowCount,
        ];
    }
}
