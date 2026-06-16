<?php

return [
    'enabled' => (bool) env('OBSERVABILITY_ENABLED', true),
    'metrics_channel' => env('METRICS_LOG_CHANNEL', 'daily'),
    'slow_query_ms' => (float) env('SLOW_QUERY_THRESHOLD_MS', 250),
    'slow_request_ms' => (float) env('SLOW_REQUEST_THRESHOLD_MS', 1000),
    'queue_heartbeat_key' => env('QUEUE_HEARTBEAT_KEY', 'sirpl:queue-worker-heartbeat'),
    'queue_heartbeat_ttl' => (int) env('QUEUE_HEARTBEAT_TTL_SECONDS', 120),
    'queue_failed_threshold' => (int) env('QUEUE_FAILED_THRESHOLD', 1),
    'external_error_tracker' => env('EXTERNAL_ERROR_TRACKER'),
];
