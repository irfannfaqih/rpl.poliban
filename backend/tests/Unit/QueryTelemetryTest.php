<?php

namespace Tests\Unit;

use App\Services\Telemetry\QueryTelemetry;
use Illuminate\Database\Connection;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class QueryTelemetryTest extends TestCase
{
    public function test_slow_query_telemetry_is_safe_without_http_request_binding(): void
    {
        $this->app->offsetUnset('request');
        config(['observability.slow_query_ms' => 1]);

        $connection = \Mockery::mock(Connection::class);
        $connection->shouldReceive('getName')->andReturn('testing');

        Log::shouldReceive('channel')
            ->once()
            ->andReturnSelf();
        Log::shouldReceive('warning')
            ->once()
            ->with('slow_query', \Mockery::on(fn (array $context) => $context['endpoint'] === null
                && $context['method'] === null
                && $context['connection'] === 'testing'));

        (new QueryTelemetry())->record(new QueryExecuted('select 1', [], 10, $connection));

        $this->assertTrue(true);
    }
}
