<?php

namespace App\Services\Telemetry;

use App\Contracts\ExternalErrorTracker;
use Illuminate\Support\Facades\Log;
use Throwable;

class ErrorReporter
{
    public function __construct(
        private ExternalErrorTracker $externalTracker,
    ) {}

    public function report(Throwable $exception, array $context = []): void
    {
        $context += [
            'exception' => $exception::class,
            'message' => $exception->getMessage(),
            'endpoint' => request()?->route()?->uri(),
            'method' => request()?->method(),
            'user_id' => auth()->id(),
        ];

        Log::error('application_exception', $context);
        $this->externalTracker->report($exception, $context);
    }
}
