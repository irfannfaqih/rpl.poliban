<?php

namespace Tests\Feature;

use App\Exports\PendaftarExport;
use App\Mail\QueuedMailable;
use App\Mail\WelcomeMail;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\FromQuery;
use Tests\TestCase;

class PhaseTwoDProductionReadinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_liveness_and_readiness_are_separate_and_operational(): void
    {
        $this->get('/health/live')
            ->assertOk()
            ->assertJsonPath('status', 'alive');

        config(['queue.default' => 'sync']);

        $this->get('/health/ready')
            ->assertOk()
            ->assertJsonPath('status', 'ready')
            ->assertJsonPath('checks.database.ready', true)
            ->assertJsonPath('checks.cache.ready', true)
            ->assertJsonPath('checks.queue.ready', true)
            ->assertJsonPath('checks.storage.ready', true)
            ->assertJsonPath('checks.queue_worker.ready', true);
    }

    public function test_readiness_fails_without_an_async_worker_heartbeat(): void
    {
        config(['queue.default' => 'database']);
        Cache::forget(config('observability.queue_heartbeat_key'));

        $this->get('/health/ready')
            ->assertStatus(503)
            ->assertJsonPath('status', 'not_ready')
            ->assertJsonPath('checks.queue_worker.ready', false);
    }

    public function test_all_application_mail_uses_the_reliable_queued_base(): void
    {
        $mailables = collect(glob(app_path('Mail/*Mail.php')))
            ->map(fn (string $path) => 'App\\Mail\\'.pathinfo($path, PATHINFO_FILENAME))
            ->reject(fn (string $class) => $class === QueuedMailable::class);

        $this->assertNotEmpty($mailables);
        $mailables->each(function (string $class): void {
            $reflection = new \ReflectionClass($class);
            $this->assertTrue($reflection->isSubclassOf(QueuedMailable::class));
            $this->assertTrue($reflection->implementsInterface(ShouldQueue::class));
        });
    }

    public function test_queued_mail_carries_retry_timeout_and_backoff_policy(): void
    {
        Mail::fake();
        $user = new User(['nama' => 'Queue Test', 'email' => 'queue@example.test']);

        Mail::to($user->email)->queue(new WelcomeMail($user));

        Mail::assertQueued(WelcomeMail::class, function (WelcomeMail $mail): bool {
            return $mail->tries === 3
                && $mail->timeout === 60
                && $mail->backoff() === [10, 60, 300];
        });
    }

    public function test_failed_job_monitor_returns_failure_for_operator_alerting(): void
    {
        DB::table('failed_jobs')->insert([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'connection' => 'database',
            'queue' => 'default',
            'payload' => '{}',
            'exception' => 'Simulated production failure',
            'failed_at' => now(),
        ]);

        $this->artisan('queue:health', ['--fail-on-unhealthy' => true])
            ->assertExitCode(1);
    }

    public function test_queue_probe_executes_a_lightweight_job_on_sync_queue(): void
    {
        config(['queue.default' => 'sync']);

        $this->artisan('queue:probe', ['--wait' => 1])
            ->assertSuccessful();
    }

    public function test_audit_search_remains_compatible_with_user_name_matches(): void
    {
        $admin = User::create([
            'nama' => 'Super Admin',
            'email' => 'admin@example.test',
            'password' => 'password',
            'role' => 'super_admin',
            'status' => 'aktif',
        ]);
        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'UPDATE',
            'module' => 'Pendaftaran',
            'detail' => 'Pemohon menyelesaikan asesmen tahap dua',
            'ip_address' => '127.0.0.1',
            'created_at' => now(),
        ]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/super-admin/audit-log?search=Super')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.module', 'Pendaftaran');
    }

    public function test_large_export_uses_query_chunking_instead_of_loading_a_collection(): void
    {
        $export = new PendaftarExport(1);

        $this->assertInstanceOf(FromQuery::class, $export);
        $this->assertNotInstanceOf(FromCollection::class, $export);
        $this->assertSame(500, $export->chunkSize());
        $this->assertNotNull($export->query());
    }
}
