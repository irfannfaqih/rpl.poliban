<?php

namespace Tests\Unit;

use App\Contracts\ExternalErrorTracker;
use App\Services\Telemetry\ErrorReporter;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Tests\TestCase;

class ErrorReporterTest extends TestCase
{
    public function test_error_reporter_falls_back_when_external_tracker_is_not_bound(): void
    {
        $this->app->offsetUnset(ExternalErrorTracker::class);

        Log::shouldReceive('error')
            ->once()
            ->with('application_exception', \Mockery::on(fn (array $context) => $context['exception'] === RuntimeException::class));

        (new ErrorReporter())->report(new RuntimeException('boot failure'));

        $this->assertTrue(true);
    }
}
