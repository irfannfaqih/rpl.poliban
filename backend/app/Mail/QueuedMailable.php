<?php

namespace App\Mail;

use App\Services\Telemetry\Metrics;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Throwable;

abstract class QueuedMailable extends Mailable implements ShouldQueue
{
    public int $tries = 3;

    public int $timeout = 60;

    public int $maxExceptions = 3;

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60, 300];
    }

    public function failed(Throwable $exception): void
    {
        app(Metrics::class)->increment('mail.failure', 1, [
            'mailable' => static::class,
            'exception' => $exception::class,
        ]);
    }
}
