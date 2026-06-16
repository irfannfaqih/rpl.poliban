<?php

namespace Tests\Unit;

use App\Models\Pendaftaran;
use App\Models\PlenoMk;
use App\Models\Prodi;
use App\Models\SkKeputusan;
use App\Models\MataKuliah;
use App\Models\User;
use App\Policies\PendaftaranPolicy;
use App\Services\PrivateDocumentStorage;
use App\Services\SkSnapshotService;
use DomainException;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Tests\TestCase;

class PhaseOneSecurityTest extends TestCase
{
    public function test_workflow_only_allows_declared_transitions(): void
    {
        $pendaftaran = new Pendaftaran(['status_alur' => 'pra_asesmen']);
        $pendaftaran->setRelation('skKeputusan', null);

        $this->assertTrue($pendaftaran->canTransitionTo('asesmen_tahap2'));
        $this->assertTrue($pendaftaran->canTransitionTo('pleno'));
        $this->assertFalse($pendaftaran->canTransitionTo('finished'));
        $this->assertFalse($pendaftaran->canTransitionTo('waiting_payment'));
    }

    public function test_published_sk_blocks_all_workflow_changes(): void
    {
        $pendaftaran = new Pendaftaran(['status_alur' => 'finished']);
        $pendaftaran->setRelation(
            'skKeputusan',
            new SkKeputusan(['status' => 'sk_terbit']),
        );

        $this->assertFalse($pendaftaran->canTransitionTo('pra_asesmen'));
        $this->assertFalse($pendaftaran->canTransitionTo('pleno'));
    }

    public function test_final_workflow_states_cannot_move_backward(): void
    {
        $pleno = new Pendaftaran(['status_alur' => 'pleno']);
        $pleno->setRelation('skKeputusan', null);
        $finished = new Pendaftaran(['status_alur' => 'finished']);
        $finished->setRelation('skKeputusan', null);

        $this->assertFalse($pleno->canTransitionTo('pra_asesmen'));
        $this->assertTrue($pleno->canTransitionTo('finished'));
        $this->assertFalse($finished->canTransitionTo('pleno'));
    }

    public function test_pendaftaran_policy_enforces_owner_and_prodi_scope(): void
    {
        $policy = new PendaftaranPolicy();
        $pendaftaran = new Pendaftaran([
            'user_id' => 10,
            'prodi_id' => 4,
            'status_alur' => 'pre_submit',
        ]);

        $owner = $this->user(10, 'pemohon');
        $otherApplicant = $this->user(11, 'pemohon');
        $sameProdiAdmin = $this->user(20, 'admin_prodi', 4);
        $otherProdiAdmin = $this->user(21, 'admin_prodi', 5);

        $this->assertTrue($policy->view($owner, $pendaftaran));
        $this->assertFalse($policy->view($otherApplicant, $pendaftaran));
        $this->assertTrue($policy->update($sameProdiAdmin, $pendaftaran));
        $this->assertFalse($policy->update($otherProdiAdmin, $pendaftaran));
    }

    public function test_published_sk_rejects_content_changes(): void
    {
        $sk = new SkKeputusan();
        $sk->setRawAttributes([
            'status' => 'sk_terbit',
            'nomor_sk' => 'SK-001',
        ], true);
        $sk->nomor_sk = 'SK-002';

        $this->expectException(DomainException::class);
        SkKeputusan::getEventDispatcher()->dispatch(
            'eloquent.updating: '.SkKeputusan::class,
            [$sk],
        );
    }

    public function test_published_sk_allows_qr_path_completion(): void
    {
        $sk = new SkKeputusan();
        $sk->setRawAttributes([
            'status' => 'sk_terbit',
            'qr_code_path' => null,
        ], true);
        $sk->qr_code_path = 'qr/sk-001.svg';

        SkKeputusan::getEventDispatcher()->dispatch(
            'eloquent.updating: '.SkKeputusan::class,
            [$sk],
        );

        $this->assertSame('qr/sk-001.svg', $sk->qr_code_path);
    }

    public function test_published_sk_rejects_replacing_materialized_pdf(): void
    {
        $sk = new SkKeputusan();
        $sk->setRawAttributes([
            'status' => 'sk_terbit',
            'pdf_path' => 'sk/1/original.pdf',
        ], true);
        $sk->pdf_path = 'sk/1/replacement.pdf';

        $this->expectException(DomainException::class);
        SkKeputusan::getEventDispatcher()->dispatch(
            'eloquent.updating: '.SkKeputusan::class,
            [$sk],
        );
    }

    public function test_sk_snapshot_hash_is_deterministic_and_self_contained(): void
    {
        $user = new User(['nama' => 'Pemohon']);
        $issuer = new User([
            'nama' => 'Direktur',
            'nip' => '123',
            'jabatan' => 'Direktur',
        ]);
        $prodi = new Prodi([
            'kode' => 'TI',
            'nama' => 'Teknik Informatika',
            'jenjang' => 'D4',
        ]);
        $course = new MataKuliah([
            'kode' => 'IF101',
            'nama' => 'Algoritma',
            'sks' => 3,
        ]);
        $pleno = new PlenoMk([
            'mata_kuliah_id' => 9,
            'keputusan_final' => 'A',
        ]);
        $pleno->setRelation('mataKuliah', $course);
        $pendaftaran = new Pendaftaran([
            'id' => 7,
            'nomor_pendaftaran' => 'RPL-007',
        ]);
        $pendaftaran->setRelation('user', $user);
        $pendaftaran->setRelation('prodi', $prodi);
        $pendaftaran->setRelation('plenoMk', collect([$pleno]));

        $service = new SkSnapshotService();
        $snapshot = $service->build(
            $pendaftaran,
            $issuer,
            'SK-007',
            '2026-06-15',
        );

        $this->assertSame('Pemohon', $snapshot['pemohon']['nama']);
        $this->assertSame('Algoritma', $snapshot['mata_kuliah'][0]['nama']);
        $this->assertSame(3, $snapshot['total_sks_diakui']);
        $this->assertSame($service->hash($snapshot), $service->hash($snapshot));
    }

    public function test_private_document_response_never_falls_back_to_public_disk(): void
    {
        Storage::fake('public');
        Storage::fake(PrivateDocumentStorage::DISK);
        Storage::disk('public')->put('dokumen/legacy.pdf', 'sensitive');

        $this->expectException(NotFoundHttpException::class);
        app(PrivateDocumentStorage::class)->response(
            'dokumen/legacy.pdf',
            'legacy.pdf',
        );
    }

    public function test_historical_migrations_do_not_truncate_or_delete_records(): void
    {
        $penilaian = file_get_contents(database_path(
            'migrations/2026_05_22_021612_update_penilaian_cpmk_enum_to_diakui.php',
        ));
        $evaluasi = file_get_contents(database_path(
            'migrations/2026_05_22_022005_update_evaluasi_diri_profisiensi_enum.php',
        ));

        $this->assertStringNotContainsString('->truncate()', $penilaian);
        $this->assertStringNotContainsString("->where('profisiensi', '2')->delete()", $evaluasi);
    }

    private function user(int $id, string $role, ?int $prodiId = null): User
    {
        $user = new User();
        $user->forceFill([
            'id' => $id,
            'role' => $role,
            'prodi_id' => $prodiId,
        ]);

        return $user;
    }
}
