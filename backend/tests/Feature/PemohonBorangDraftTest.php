<?php

namespace Tests\Feature;

use App\Models\BorangDraft;
use App\Models\Cpmk;
use App\Models\Dokumen;
use App\Models\Gelombang;
use App\Models\MataKuliah;
use App\Models\Pendaftaran;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PemohonBorangDraftTest extends TestCase
{
    use RefreshDatabase;

    public function test_pemohon_can_save_incomplete_draft_for_own_pendaftaran(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        Sanctum::actingAs($user);

        $payload = [
            'sectionA' => [
                'namaLengkap' => 'Pemohon Draft',
                'jenisKelamin' => 'L',
            ],
            'sectionB' => [
                'items' => [],
            ],
        ];

        $this->patchJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/borang-draft", [
            'payload' => $payload,
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Draft borang tersimpan')
            ->assertJsonPath('data.payload.sectionA.namaLengkap', 'Pemohon Draft')
            ->assertJsonPath('data.payload.sectionB.items', []);

        $this->assertDatabaseHas('borang_drafts', [
            'pendaftaran_id' => $pendaftaran->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_pemohon_can_load_saved_draft(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        BorangDraft::create([
            'pendaftaran_id' => $pendaftaran->id,
            'user_id' => $user->id,
            'payload' => ['sectionC' => ['instansi' => 'PT Draft']],
            'last_saved_at' => now(),
        ]);
        Sanctum::actingAs($user);

        $this->getJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/borang-draft")
            ->assertOk()
            ->assertJsonPath('data.payload.sectionC.instansi', 'PT Draft');
    }

    public function test_pemohon_can_delete_own_draft(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        BorangDraft::create([
            'pendaftaran_id' => $pendaftaran->id,
            'user_id' => $user->id,
            'payload' => ['sectionA' => ['namaLengkap' => 'Draft']],
            'last_saved_at' => now(),
        ]);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/borang-draft")
            ->assertOk()
            ->assertJsonPath('message', 'Draft borang dihapus');

        $this->assertDatabaseMissing('borang_drafts', [
            'pendaftaran_id' => $pendaftaran->id,
        ]);
    }

    public function test_pemohon_cannot_access_another_users_pendaftaran_draft(): void
    {
        [, $pendaftaran] = $this->makePendaftaran();
        $otherUser = $this->makeUser('other-draft@example.test');
        Sanctum::actingAs($otherUser);

        $this->getJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/borang-draft")
            ->assertForbidden();
    }

    public function test_saving_draft_does_not_change_pendaftaran_status_alur(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran(['status_alur' => 'payment_verified']);
        Sanctum::actingAs($user);

        $this->patchJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/borang-draft", [
            'payload' => ['sectionA' => ['namaLengkap' => 'Pemohon Draft']],
        ])->assertOk();

        $this->assertSame('payment_verified', $pendaftaran->refresh()->status_alur);
    }

    public function test_invalid_document_id_from_another_pendaftaran_is_rejected(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        [, $otherPendaftaran] = $this->makePendaftaran([
            'nomor_pendaftaran' => 'RPL-DRAFT-OTHER',
        ]);
        $otherDocument = Dokumen::create([
            'pendaftaran_id' => $otherPendaftaran->id,
            'tipe' => 'ijazah',
            'deskripsi' => 'Ijazah',
            'file_path' => 'dokumen/other/ijazah.pdf',
            'file_name' => 'ijazah.pdf',
            'file_size' => 1234,
        ]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/borang-draft", [
            'payload' => [
                'sectionE' => [
                    'dokumenWajib' => [
                        'IjazahId' => (string) $otherDocument->id,
                    ],
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_invalid_cpmk_id_outside_pendaftaran_prodi_is_rejected(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        $otherProdi = Prodi::create([
            'kode' => 'EL',
            'nama' => 'Teknik Elektro',
            'jenjang' => 'D4',
            'jurusan' => 'Teknik',
            'status' => 'aktif',
        ]);
        $mataKuliah = MataKuliah::create([
            'prodi_id' => $otherProdi->id,
            'kode' => 'EL101',
            'nama' => 'Dasar Elektro',
            'sks' => 3,
            'semester' => 1,
            'is_active' => true,
        ]);
        $cpmk = Cpmk::create([
            'mata_kuliah_id' => $mataKuliah->id,
            'kode' => 'CPMK-EL',
            'deskripsi' => 'CPMK prodi lain',
        ]);
        Sanctum::actingAs($user);

        $this->patchJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/borang-draft", [
            'payload' => [
                'sectionD' => [
                    'evaluasi' => [
                        (string) $cpmk->id => [
                            'profisiensi' => 4,
                            'dokumenPendukung' => [],
                        ],
                    ],
                ],
            ],
        ])->assertUnprocessable();
    }

    public function test_draft_is_not_allowed_after_non_editable_status(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran(['status_alur' => 'waiting_verification']);
        Sanctum::actingAs($user);

        $this->patchJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/borang-draft", [
            'payload' => ['sectionA' => ['namaLengkap' => 'Tidak boleh']],
        ])->assertForbidden();
    }

    private function makePendaftaran(array $overrides = []): array
    {
        $user = $this->makeUser('pemohon-'.uniqid().'@example.test');
        $prodi = Prodi::create([
            'kode' => 'TI'.substr(uniqid(), -4),
            'nama' => 'Teknik Informatika',
            'jenjang' => 'D4',
            'jurusan' => 'Teknik',
            'status' => 'aktif',
        ]);
        $gelombang = Gelombang::create([
            'nama' => 'Gelombang Draft',
            'tgl_buka' => now()->subDay()->toDateString(),
            'tgl_tutup' => now()->addMonth()->toDateString(),
            'tgl_sanggah' => now()->addMonths(2)->toDateString(),
            'biaya' => 100000,
            'status' => 'aktif',
        ]);

        $pendaftaran = Pendaftaran::create(array_merge([
            'user_id' => $user->id,
            'gelombang_id' => $gelombang->id,
            'prodi_id' => $prodi->id,
            'nomor_pendaftaran' => 'RPL-DRAFT-'.uniqid(),
            'status_alur' => 'pre_submit',
        ], $overrides));

        return [$user, $pendaftaran];
    }

    private function makeUser(string $email): User
    {
        return User::create([
            'nama' => 'Pemohon Draft',
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => 'pemohon',
            'status' => 'aktif',
        ]);
    }
}
