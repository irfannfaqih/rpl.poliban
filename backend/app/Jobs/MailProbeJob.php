<?php

namespace App\Jobs;

use App\Services\Telemetry\Metrics;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class MailProbeJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 30;

    public function __construct(
        private string $cacheKey,
        private string $recipient,
    ) {}

    /**
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60];
    }

    public function handle(Metrics $metrics): void
    {
        Mail::raw(
            'Email probe SIRPL berhasil dikirim pada '.now()->toIso8601String().'.',
            function ($message): void {
                $message
                    ->to($this->recipient)
                    ->subject('SIRPL Email Probe');
            },
        );

        try {
            Cache::put($this->cacheKey, [
                'status' => 'sent',
                'sent_at' => now()->toIso8601String(),
            ], 300);
        } catch (Throwable $exception) {
            Log::warning('mail.probe.result_cache_failed', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }

        $metrics->increment('mail.probe.success');
    }

    public function failed(Throwable $exception): void
    {
        try {
            Cache::put($this->cacheKey, [
                'status' => 'failed',
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
                'failed_at' => now()->toIso8601String(),
            ], 300);
        } catch (Throwable $cacheException) {
            Log::warning('mail.probe.failure_cache_failed', [
                'exception' => $cacheException::class,
                'message' => $cacheException->getMessage(),
            ]);
        }

        Log::warning('mail.probe.failed', [
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
        ]);
    }
}
