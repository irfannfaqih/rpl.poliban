<?php

namespace App\Services\Telemetry;

use App\Contracts\ExternalErrorTracker;
use Throwable;

class NullExternalErrorTracker implements ExternalErrorTracker
{
    public function report(Throwable $exception, array $context = []): void
    {
        //
    }
}
