<?php

namespace App\Http\Middleware;

use App\Services\Telemetry\Metrics;
use App\Services\Telemetry\QueryTelemetry;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequestTelemetry
{
    public function __construct(
        private QueryTelemetry $queries,
        private Metrics $metrics,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->queries->reset();
        $startedAt = hrtime(true);

        try {
            return $next($request);
        } finally {
            $durationMs = (hrtime(true) - $startedAt) / 1_000_000;
            $query = $this->queries->snapshot();
            $tags = [
                'method' => $request->method(),
                'endpoint' => $request->route()?->uri() ?? $request->path(),
            ];

            $this->metrics->timing('http.request.duration', $durationMs, $tags);
            $this->metrics->gauge('http.request.query_count', $query['count'], $tags);
            $this->metrics->timing('http.request.query_duration', $query['duration_ms'], $tags);

            if ($durationMs >= config('observability.slow_request_ms')) {
                $this->metrics->increment('http.request.slow', 1, $tags);
            }
        }
    }
}
