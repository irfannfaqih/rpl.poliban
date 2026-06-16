<?php

namespace App\Services\Telemetry;

use Illuminate\Support\Facades\Log;

class Metrics
{
    public function increment(string $name, int|float $value = 1, array $tags = []): void
    {
        $this->write('counter', $name, $value, $tags);
    }

    public function timing(string $name, int|float $milliseconds, array $tags = []): void
    {
        $this->write('timing', $name, round((float) $milliseconds, 2), $tags);
    }

    public function gauge(string $name, int|float $value, array $tags = []): void
    {
        $this->write('gauge', $name, $value, $tags);
    }

    private function write(string $type, string $name, int|float $value, array $tags): void
    {
        if (! config('observability.enabled')) {
            return;
        }

        Log::channel(config('observability.metrics_channel'))->info('metric', [
            'metric_type' => $type,
            'metric_name' => $name,
            'value' => $value,
            'tags' => $tags,
            'recorded_at' => now()->toIso8601String(),
        ]);
    }
}
