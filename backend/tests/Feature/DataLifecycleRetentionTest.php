<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DataLifecycleRetentionTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_archive_writes_verified_archive_without_deleting_by_default(): void
    {
        Storage::fake('local');
        $user = $this->user();
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'UPDATE',
            'module' => 'Pendaftaran',
            'detail' => 'Old audit entry',
            'ip_address' => '127.0.0.1',
            'created_at' => now()->subDays(800),
        ]);

        $this->artisan('audit-log:archive', [
            '--days' => 730,
            '--disk' => 'local',
            '--path' => 'test-archives',
        ])->assertSuccessful();

        $files = collect(Storage::disk('local')->allFiles('test-archives'));
        $this->assertTrue($files->contains(fn (string $path) => str_ends_with($path, '.jsonl')));
        $this->assertTrue($files->contains(fn (string $path) => str_ends_with($path, '.manifest.json')));
        $this->assertDatabaseCount('audit_log', 1);
    }

    public function test_notification_prune_deletes_only_old_read_notifications_when_executed(): void
    {
        $user = $this->user();
        $oldRead = $this->notification($user, true, now()->subDays(400));
        $newRead = $this->notification($user, true, now()->subDays(10));
        $oldUnread = $this->notification($user, false, now()->subDays(400));

        $this->artisan('notifications:prune-read', ['--days' => 365])
            ->assertSuccessful();
        $this->assertDatabaseHas('notifications', ['id' => $oldRead->id]);

        $this->artisan('notifications:prune-read', ['--days' => 365, '--execute' => true])
            ->assertSuccessful();

        $this->assertDatabaseMissing('notifications', ['id' => $oldRead->id]);
        $this->assertDatabaseHas('notifications', ['id' => $newRead->id]);
        $this->assertDatabaseHas('notifications', ['id' => $oldUnread->id]);
    }

    public function test_cache_prune_deletes_only_expired_database_cache_rows_when_executed(): void
    {
        DB::table('cache')->insert([
            [
                'key' => 'expired-key',
                'value' => serialize('expired'),
                'expiration' => now()->subMinute()->getTimestamp(),
            ],
            [
                'key' => 'fresh-key',
                'value' => serialize('fresh'),
                'expiration' => now()->addHour()->getTimestamp(),
            ],
        ]);

        $this->artisan('cache:prune-expired')->assertSuccessful();
        $this->assertDatabaseHas('cache', ['key' => 'expired-key']);

        $this->artisan('cache:prune-expired', ['--execute' => true])->assertSuccessful();

        $this->assertDatabaseMissing('cache', ['key' => 'expired-key']);
        $this->assertDatabaseHas('cache', ['key' => 'fresh-key']);
    }

    public function test_lifecycle_report_runs_without_mutating_data(): void
    {
        Storage::fake('private-documents');
        Storage::fake('public');
        $this->user();
        Cache::put('lifecycle-test', 'ok', 60);

        $this->artisan('lifecycle:report')->assertSuccessful();

        $this->assertDatabaseCount('users', 1);
    }

    private function user(): User
    {
        return User::firstOrCreate(
            ['email' => 'lifecycle@example.test'],
            [
                'nama' => 'Lifecycle User',
                'password' => 'password',
                'role' => 'super_admin',
                'status' => 'aktif',
            ],
        );
    }

    private function notification(User $user, bool $read, $createdAt): Notification
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'title' => 'Lifecycle',
            'message' => 'Retention test',
            'type' => 'info',
            'href' => '/dashboard',
            'is_read' => $read,
        ]);

        DB::table('notifications')
            ->where('id', $notification->id)
            ->update([
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

        return $notification->fresh();
    }
}
