<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class HealthController extends Controller
{
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'alive',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function ready(): JsonResponse
    {
        $checks = [
            'database' => fn () => DB::select('select 1'),
            'cache' => fn () => $this->checkCache(),
            'queue' => fn () => Queue::connection()->size(),
            'storage' => fn () => $this->checkStorage(),
            'queue_worker' => fn () => $this->checkQueueWorker(),
        ];
        $result = [];

        foreach ($checks as $name => $check) {
            try {
                $check();
                $result[$name] = ['ready' => true];
            } catch (Throwable $exception) {
                report($exception);
                $result[$name] = [
                    'ready' => false,
                    'reason' => $exception->getMessage(),
                ];
            }
        }

        $ready = collect($result)->every(fn (array $check) => $check['ready']);

        return response()->json([
            'status' => $ready ? 'ready' : 'not_ready',
            'checks' => $result,
            'timestamp' => now()->toIso8601String(),
        ], $ready ? 200 : 503);
    }

    private function checkCache(): void
    {
        $key = 'readiness:'.Str::uuid();
        Cache::put($key, 'ok', 10);
        throw_unless(Cache::get($key) === 'ok', new \RuntimeException('Cache read/write failed.'));
        Cache::forget($key);
    }

    private function checkStorage(): void
    {
        $path = 'health/'.Str::uuid().'.txt';
        $disk = Storage::disk('private-documents');
        $disk->put($path, 'ok');
        throw_unless($disk->get($path) === 'ok', new \RuntimeException('Storage read/write failed.'));
        $disk->delete($path);
    }

    private function checkQueueWorker(): void
    {
        if (config('queue.default') === 'sync') {
            return;
        }

        $heartbeat = Cache::get(config('observability.queue_heartbeat_key'));
        throw_if(! $heartbeat, new \RuntimeException('Queue worker heartbeat is missing.'));
        throw_if(
            abs(now()->diffInSeconds($heartbeat)) > config('observability.queue_heartbeat_ttl'),
            new \RuntimeException('Queue worker heartbeat is stale.'),
        );
    }
}
