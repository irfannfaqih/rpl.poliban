<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Gelombang;
use App\Models\JadwalAsesmen;
use App\Models\Pendaftaran;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkflowClarityReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_pemohon_jadwal_does_not_show_historical_schedule_after_workflow_is_done(): void
    {
        [$pemohon, $admin, $pendaftaran] = $this->createRegistration('finished');

        JadwalAsesmen::create([
            'pendaftaran_id' => $pendaftaran->id,
            'tanggal' => now()->subDays(10)->toDateString(),
            'waktu' => '09:00',
            'tempat' => 'Ruang RPL',
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($pemohon);

        $this->getJson('/api/pemohon/jadwal')
            ->assertOk()
            ->assertJsonPath('data', []);
    }

    public function test_pemohon_jadwal_still_shows_active_pra_asesmen_schedule(): void
    {
        [$pemohon, $admin, $pendaftaran] = $this->createRegistration('pra_asesmen');

        JadwalAsesmen::create([
            'pendaftaran_id' => $pendaftaran->id,
            'tanggal' => now()->addDays(2)->toDateString(),
            'waktu' => '10:00',
            'tempat' => 'Ruang RPL',
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($pemohon);

        $this->getJson('/api/pemohon/jadwal')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.waktu', '10:00');
    }

    public function test_audit_observer_persists_database_audit_entries_for_super_admin_ui(): void
    {
        [$pemohon, $admin, $pendaftaran] = $this->createRegistration('waiting_verification');
        Sanctum::actingAs($admin);

        $pendaftaran->update(['status_alur' => 'pra_asesmen']);

        $this->assertDatabaseHas('audit_log', [
            'user_id' => $admin->id,
            'action' => 'UPDATE',
            'module' => 'Pendaftaran',
        ]);
        $this->assertStringContainsString(
            'status_alur',
            AuditLog::where('module', 'Pendaftaran')->latest('id')->value('detail'),
        );

        $superAdmin = User::create([
            'nama' => 'Super Admin',
            'email' => 'super.workflow@example.test',
            'password' => 'password',
            'role' => 'super_admin',
            'status' => 'aktif',
        ]);
        Sanctum::actingAs($superAdmin);

        $this->getJson('/api/super-admin/audit-log?search=Pendaftaran')
            ->assertOk()
            ->assertJsonFragment([
                'module' => 'Pendaftaran',
                'action' => 'UPDATE',
            ]);
    }

    public function test_completed_pra_asesmen_schedule_cannot_be_updated_or_deleted(): void
    {
        [$pemohon, $admin, $pendaftaran] = $this->createRegistration('finished');
        $jadwal = JadwalAsesmen::create([
            'pendaftaran_id' => $pendaftaran->id,
            'tanggal' => now()->subDays(5)->toDateString(),
            'waktu' => '09:00',
            'tempat' => 'Ruang RPL',
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin);

        $this->putJson('/api/admin-prodi/jadwal/'.$jadwal->id, [
            'tanggal' => now()->addDay()->toDateString(),
            'waktu' => '13:00',
            'tempat' => 'Ruang Baru',
        ])->assertStatus(409);

        $this->deleteJson('/api/admin-prodi/jadwal/'.$jadwal->id)
            ->assertStatus(409);

        $this->assertDatabaseHas('jadwal_asesmen', [
            'id' => $jadwal->id,
            'waktu' => '09:00',
            'tempat' => 'Ruang RPL',
        ]);
    }

    private function createRegistration(string $status): array
    {
        $prodi = Prodi::create([
            'kode' => 'TI',
            'nama' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'jurusan' => 'Teknik',
            'status' => 'aktif',
        ]);
        $gelombang = Gelombang::create([
            'nama' => 'Gelombang Test',
            'tgl_buka' => now()->subDay()->toDateString(),
            'tgl_tutup' => now()->addMonth()->toDateString(),
            'tgl_sanggah' => now()->addMonths(2)->toDateString(),
            'biaya' => 100000,
            'status' => 'aktif',
        ]);
        $pemohon = User::create([
            'nama' => 'Pemohon Workflow',
            'email' => 'pemohon.workflow@example.test',
            'password' => 'password',
            'role' => 'pemohon',
            'status' => 'aktif',
        ]);
        $admin = User::create([
            'nama' => 'Admin Prodi Workflow',
            'email' => 'admin.workflow@example.test',
            'password' => 'password',
            'role' => 'admin_prodi',
            'prodi_id' => $prodi->id,
            'status' => 'aktif',
        ]);
        $pendaftaran = Pendaftaran::create([
            'user_id' => $pemohon->id,
            'gelombang_id' => $gelombang->id,
            'prodi_id' => $prodi->id,
            'nomor_pendaftaran' => 'RPL-WF-'.substr(md5($status), 0, 8),
            'status_alur' => $status,
        ]);

        return [$pemohon, $admin, $pendaftaran];
    }
}
