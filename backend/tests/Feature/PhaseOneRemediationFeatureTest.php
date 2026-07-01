<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\AdminProdi\PendaftaranController;
use App\Http\Controllers\Api\AdminProdi\PlenoController;
use App\Http\Controllers\Api\Asesor\SanggahController;
use App\Http\Controllers\Api\Pemohon\BorangController;
use App\Http\Controllers\Api\Pemohon\UjiLanjutanController as PemohonUjiLanjutanController;
use App\Http\Controllers\Api\Pimpinan\PimpinanController;
use App\Http\Controllers\Api\PrivateFileController;
use App\Http\Controllers\Api\SuperAdmin\PenggunaController;
use App\Models\Dokumen;
use App\Models\Pendaftaran;
use App\Models\Sanggah;
use App\Models\SkKeputusan;
use App\Models\User;
use App\Models\UjiLanjutan;
use App\Models\UjiLanjutanItem;
use App\Services\PdfService;
use App\Services\PendaftaranService;
use App\Services\PrivateDocumentStorage;
use App\Services\QrCodeService;
use App\Services\RegistrationEligibilityService;
use App\Services\At2ExpiredAutoSubmitService;
use App\Services\SkDocumentService;
use App\Services\SkSnapshotService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Mockery;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PhaseOneRemediationFeatureTest extends TestCase
{
    private string $temporaryDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useTemporaryMysqlDatabase();
        $this->createSchema();
        Storage::fake('public');
        Storage::fake(PrivateDocumentStorage::DISK);
    }

    protected function tearDown(): void
    {
        if (isset($this->temporaryDatabase)) {
            \Illuminate\Support\Facades\DB::purge('phase16_test');
            $env = $this->readEnvironmentFile();
            $pdo = $this->mysqlPdo($env);
            $pdo->exec(
                'DROP DATABASE IF EXISTS `'.$this->temporaryDatabase.'`',
            );
        }
        parent::tearDown();
    }

    public function test_competing_unlock_requests_only_allow_first_transition(): void
    {
        [$admin, , $pendaftaran] = $this->baseWorkflow('waiting_verification');
        $controller = app(PendaftaranController::class);

        $first = $controller->unlock(
            $this->requestAs($admin),
            $pendaftaran,
        );
        $this->assertSame(200, $first->status());
        $this->assertSame('pre_submit', $pendaftaran->fresh()->status_alur);

        try {
            $controller->unlock($this->requestAs($admin), $pendaftaran);
            $this->fail('Unlock kedua seharusnya ditolak.');
        } catch (HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
        }
    }

    public function test_autosave_cannot_overwrite_answers_after_submit(): void
    {
        [, , $pendaftaran, , $pemohon] = $this->baseWorkflow('asesmen_tahap2');
        $uji = UjiLanjutan::create([
            'pendaftaran_id' => $pendaftaran->id,
            'status' => 'menunggu_ujian',
            'fase_tulis' => 'menunggu_jawaban',
            'durasi_menit' => 60,
            'ujian_dimulai_at' => now(),
        ]);
        $item = UjiLanjutanItem::create([
            'uji_lanjutan_id' => $uji->id,
            'tipe' => 'c3',
            'pertanyaan_instruksi' => 'Pertanyaan',
        ]);
        $controller = app(PemohonUjiLanjutanController::class);
        $controller->saveDraftJawaban(
            $this->requestAs($pemohon, [
                'jawaban' => [[
                    'id' => $item->id,
                    'jawaban_pemohon' => 'draft',
                ]],
            ]),
            $uji->id,
        );
        $controller->submitJawaban(
            $this->requestAs($pemohon, [
                'jawaban' => [[
                    'id' => $item->id,
                    'jawaban_pemohon' => 'final',
                ]],
            ]),
            $uji->id,
        );

        $this->assertSame('koreksi', $uji->fresh()->fase_tulis);
        $this->assertSame('final', $item->fresh()->jawaban_pemohon);

        $this->expectException(
            \Illuminate\Database\Eloquent\ModelNotFoundException::class,
        );
        $controller->saveDraftJawaban(
            $this->requestAs($pemohon, [
                'jawaban' => [[
                    'id' => $item->id,
                    'jawaban_pemohon' => 'stale autosave',
                ]],
            ]),
            $uji->id,
        );
    }

    public function test_expired_at2_with_partial_answers_is_auto_submitted_for_correction(): void
    {
        [, , $pendaftaran] = $this->baseWorkflow('asesmen_tahap2');
        [$uji, $answered, $empty] = $this->expiredWrittenAt2($pendaftaran);
        $answered->update(['jawaban_pemohon' => 'Jawaban tersimpan']);

        $result = app(At2ExpiredAutoSubmitService::class)->finalizeExpired();

        $this->assertSame(1, $result['processed']);
        $this->assertSame('koreksi', $uji->fresh()->fase_tulis);
        $this->assertSame('Jawaban tersimpan', $answered->fresh()->jawaban_pemohon);
        $this->assertNull($empty->fresh()->jawaban_pemohon);
        $this->assertNotNull($answered->fresh()->submitted_at);
        $this->assertNotNull($empty->fresh()->submitted_at);
    }

    public function test_expired_at2_with_no_answers_is_auto_submitted_without_fabricating_answers(): void
    {
        [, , $pendaftaran] = $this->baseWorkflow('asesmen_tahap2');
        [$uji, $first, $second] = $this->expiredWrittenAt2($pendaftaran);

        $result = app(At2ExpiredAutoSubmitService::class)->finalizeExpired();

        $this->assertSame(1, $result['processed']);
        $this->assertSame('koreksi', $uji->fresh()->fase_tulis);
        $this->assertNull($first->fresh()->jawaban_pemohon);
        $this->assertNull($second->fresh()->jawaban_pemohon);
    }

    public function test_auto_submit_skips_already_finalized_at2_sessions(): void
    {
        [, , $pendaftaran] = $this->baseWorkflow('asesmen_tahap2');
        [$uji] = $this->expiredWrittenAt2($pendaftaran, ['fase_tulis' => 'koreksi']);

        $result = app(At2ExpiredAutoSubmitService::class)->finalizeExpired();

        $this->assertSame(0, $result['processed']);
        $this->assertSame('koreksi', $uji->fresh()->fase_tulis);
    }

    public function test_manual_submit_before_timeout_still_requires_all_written_questions(): void
    {
        [, , $pendaftaran, , $pemohon] = $this->baseWorkflow('asesmen_tahap2');
        [$uji, $answered] = $this->activeWrittenAt2($pendaftaran);
        $controller = app(PemohonUjiLanjutanController::class);

        try {
            $controller->submitJawaban(
                $this->requestAs($pemohon, [
                    'jawaban' => [[
                        'id' => $answered->id,
                        'jawaban_pemohon' => 'Hanya satu jawaban',
                    ]],
                ]),
                $uji->id,
            );
            $this->fail('Submit manual belum lengkap seharusnya ditolak.');
        } catch (HttpException $e) {
            $this->assertSame(422, $e->getStatusCode());
        }

        $this->assertSame('menunggu_jawaban', $uji->fresh()->fase_tulis);
    }

    public function test_manual_submit_after_timeout_is_rejected_and_timeout_endpoint_finalizes(): void
    {
        [, , $pendaftaran, , $pemohon] = $this->baseWorkflow('asesmen_tahap2');
        [$uji, $answered] = $this->expiredWrittenAt2($pendaftaran);
        $controller = app(PemohonUjiLanjutanController::class);

        try {
            $controller->submitJawaban(
                $this->requestAs($pemohon, [
                    'jawaban' => [[
                        'id' => $answered->id,
                        'jawaban_pemohon' => 'Jawaban terlambat',
                    ]],
                ]),
                $uji->id,
            );
            $this->fail('Submit manual setelah timeout seharusnya ditolak.');
        } catch (HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
        }

        $response = $controller->timeoutSubmit(
            $this->requestAs($pemohon),
            $uji->id,
            app(At2ExpiredAutoSubmitService::class),
        );

        $this->assertSame(200, $response->status());
        $this->assertSame('koreksi', $uji->fresh()->fase_tulis);
    }

    public function test_duplicate_reschedule_requests_are_rejected(): void
    {
        [, , $pendaftaran, , $pemohon] = $this->baseWorkflow('asesmen_tahap2');
        $uji = UjiLanjutan::create([
            'pendaftaran_id' => $pendaftaran->id,
            'status' => 'menunggu_ujian',
            'fase_tulis' => 'menunggu_jawaban',
            'tanggal_ujian' => now()->addDays(2)->toDateString(),
            'durasi_menit' => 60,
        ]);
        $controller = app(PemohonUjiLanjutanController::class);

        $controller->ajukanReschedule(
            $this->requestAs($pemohon, [
                'alasan' => 'Saya memiliki benturan jadwal pekerjaan resmi.',
            ]),
            $uji->id,
        );
        try {
            $controller->ajukanReschedule(
                $this->requestAs($pemohon, [
                    'alasan' => 'Permohonan paralel yang seharusnya ditolak.',
                ]),
                $uji->id,
            );
            $this->fail('Reschedule kedua seharusnya ditolak.');
        } catch (HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
        }
    }

    public function test_competing_finalize_requests_create_only_one_draft_sk(): void
    {
        [$admin, , $pendaftaran, $mataKuliah] = $this->baseWorkflow('pleno');
        $this->createPleno($pendaftaran, $mataKuliah);
        $controller = app(PlenoController::class);

        $first = $controller->finalize(
            $this->requestAs($admin),
            $pendaftaran,
        );
        $this->assertSame(200, $first->status());
        $this->assertSame(1, SkKeputusan::count());

        try {
            $controller->finalize($this->requestAs($admin), $pendaftaran);
            $this->fail('Finalisasi kedua seharusnya ditolak.');
        } catch (HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
        }
        $this->assertSame(1, SkKeputusan::count());
    }

    public function test_pleno_update_loses_race_against_finalization(): void
    {
        [$admin, , $pendaftaran, $mataKuliah] = $this->baseWorkflow('pleno');
        $this->createPleno($pendaftaran, $mataKuliah);
        $controller = app(PlenoController::class);
        $controller->finalize($this->requestAs($admin), $pendaftaran);

        $request = $this->requestAs($admin, [
            'items' => [[
                'mata_kuliah_id' => $mataKuliah->id,
                'keputusan_final' => 'B',
                'catatan_pleno' => 'stale request',
            ]],
        ]);
        try {
            $controller->updateKeputusan($request, $pendaftaran);
            $this->fail('Update pleno setelah finalisasi seharusnya ditolak.');
        } catch (HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
        }
        $this->assertSame(
            'A',
            $pendaftaran->plenoMk()->first()->keputusan_final,
        );
    }

    public function test_competing_sk_publication_only_materializes_once(): void
    {
        [, $pimpinan, $pendaftaran, $mataKuliah] = $this->baseWorkflow('finished');
        $this->createPleno($pendaftaran, $mataKuliah);
        $sk = SkKeputusan::create([
            'pendaftaran_id' => $pendaftaran->id,
            'total_sks_diakui' => 3,
            'status' => 'menunggu_sk',
        ]);
        $qr = Mockery::mock(QrCodeService::class);
        $qr->shouldReceive('generateForSk')
            ->once()
            ->andReturnUsing(function () {
                $this->assertSame(0, DB::transactionLevel());
                Storage::disk('public')->put('qrcode/sk/test.svg', '<svg/>');

                return 'qrcode/sk/test.svg';
            });
        $pdf = Mockery::mock(PdfService::class);
        $pdf->shouldReceive('generateDocumentPdf')
            ->once()
            ->andReturnUsing(function () {
                $this->assertSame(0, DB::transactionLevel());

                return new class {
                public function output(): string
                {
                    return 'immutable-pdf';
                }
                };
            });
        $documentService = new SkDocumentService(
            $qr,
            $pdf,
            new SkSnapshotService(),
        );
        $controller = new PimpinanController($documentService);

        $first = $controller->terbitkanSk(
            $this->requestAs($pimpinan, ['nomor_sk' => 'SK-TEST-001']),
            $sk,
        );
        $this->assertSame(200, $first->status());
        $this->assertSame('sk_terbit', $sk->fresh()->status);
        $this->assertNull($sk->fresh()->generation_token);

        try {
            $controller->terbitkanSk(
                $this->requestAs($pimpinan, ['nomor_sk' => 'SK-TEST-002']),
                $sk,
            );
            $this->fail('Penerbitan kedua seharusnya ditolak.');
        } catch (HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
        }
        $this->assertSame('SK-TEST-001', $sk->fresh()->nomor_sk);
    }

    public function test_active_sk_generation_claim_rejects_duplicate_work(): void
    {
        [, $pimpinan, $pendaftaran, $mataKuliah] = $this->baseWorkflow('finished');
        $this->createPleno($pendaftaran, $mataKuliah);
        $sk = SkKeputusan::create([
            'pendaftaran_id' => $pendaftaran->id,
            'total_sks_diakui' => 3,
            'status' => 'menunggu_sk',
            'generation_token' => (string) \Illuminate\Support\Str::uuid(),
            'generation_started_at' => now(),
        ]);
        $qr = Mockery::mock(QrCodeService::class);
        $qr->shouldNotReceive('generateForSk');
        $pdf = Mockery::mock(PdfService::class);
        $pdf->shouldNotReceive('generateDocumentPdf');
        $controller = new PimpinanController(
            new SkDocumentService($qr, $pdf, new SkSnapshotService()),
        );

        try {
            $controller->terbitkanSk(
                $this->requestAs($pimpinan, ['nomor_sk' => 'SK-CLAIM-001']),
                $sk,
            );
            $this->fail('Claim aktif seharusnya menolak generator kedua.');
        } catch (HttpException $e) {
            $this->assertSame(409, $e->getStatusCode());
        }

        $this->assertSame('menunggu_sk', $sk->fresh()->status);
    }

    public function test_missing_published_artifacts_are_rebuilt_outside_transaction(): void
    {
        [, , $pendaftaran] = $this->baseWorkflow('finished');
        $sk = SkKeputusan::create([
            'pendaftaran_id' => $pendaftaran->id,
            'total_sks_diakui' => 3,
            'status' => 'sk_terbit',
            'nomor_sk' => 'SK-OLD-001',
            'tanggal_terbit' => now()->toDateString(),
            'published_at' => now(),
            'content_hash' => str_repeat('a', 64),
            'document_snapshot' => [
                'pemohon' => ['nama' => 'Pemohon'],
                'mata_kuliah' => [],
                'total_sks_diakui' => 3,
            ],
            'qr_code_path' => 'qrcode/sk/missing.svg',
            'pdf_path' => 'sk/missing.pdf',
            'pdf_hash' => str_repeat('b', 64),
        ]);
        $qr = Mockery::mock(QrCodeService::class);
        $qr->shouldReceive('generateForSk')
            ->once()
            ->andReturnUsing(function () {
                $this->assertSame(0, DB::transactionLevel());
                Storage::disk('public')->put(
                    'qrcode/sk/missing.svg',
                    '<svg/>',
                );

                return 'qrcode/sk/missing.svg';
            });
        $pdf = Mockery::mock(PdfService::class);
        $pdf->shouldReceive('generateDocumentPdf')
            ->once()
            ->andReturnUsing(function () {
                $this->assertSame(0, DB::transactionLevel());

                return new class {
                    public function output(): string
                    {
                        return 'rebuilt-pdf';
                    }
                };
            });

        $result = (new SkDocumentService(
            $qr,
            $pdf,
            new SkSnapshotService(),
        ))->materializePublished($sk);

        $this->assertSame('sk_terbit', $result->status);
        $this->assertSame(
            hash('sha256', 'rebuilt-pdf'),
            $result->pdf_hash,
        );
        $this->assertNull($result->generation_token);
    }

    public function test_sanggah_metadata_and_decision_use_responsible_assessor(): void
    {
        [, , $pendaftaran, $mataKuliah, $pemohon] = $this->baseWorkflow('finished');
        $asesor = $this->user('asesor', $pendaftaran->prodi_id);
        $other = $this->user('asesor', $pendaftaran->prodi_id);
        $sanggah = Sanggah::create([
            'pendaftaran_id' => $pendaftaran->id,
            'mata_kuliah_id' => $mataKuliah->id,
            'asesor_id' => $asesor->id,
            'alasan' => 'Bukti perlu ditinjau.',
            'paham_prosedur' => true,
            'status' => 'diajukan',
        ]);
        $controller = app(SanggahController::class);

        $list = $controller->index($this->requestAs($other));
        $this->assertSame(0, $list->getData(true)['total']);
        $denied = $controller->update(
            $this->requestAs($other, [
                'status' => 'ditolak',
                'respon_asesor' => 'Tidak sesuai.',
            ]),
            $sanggah,
        );
        $this->assertSame(403, $denied->status());
        $this->assertSame('diajukan', $sanggah->fresh()->status);
    }

    public function test_private_file_requires_pendaftaran_authorization(): void
    {
        [, , $pendaftaran, , $pemohon] = $this->baseWorkflow('pre_submit');
        $other = $this->user('pemohon');
        $document = Dokumen::create([
            'pendaftaran_id' => $pendaftaran->id,
            'tipe' => 'ijazah',
            'file_path' => "dokumen/{$pendaftaran->id}/ijazah.pdf",
            'file_name' => 'ijazah.pdf',
            'file_size' => 3,
        ]);
        Storage::disk(PrivateDocumentStorage::DISK)
            ->put($document->file_path, 'pdf');
        $controller = app(PrivateFileController::class);

        $allowed = $controller->dokumen(
            $this->requestAs($pemohon),
            $document,
        );
        $this->assertSame(200, $allowed->getStatusCode());

        $this->expectException(\Illuminate\Auth\Access\AuthorizationException::class);
        $controller->dokumen($this->requestAs($other), $document);
    }

    public function test_cross_prodi_cpmk_is_rejected(): void
    {
        [, , $pendaftaran, , $pemohon] = $this->baseWorkflow('pre_submit');
        $otherProdi = $this->prodi('OTHER');
        $otherMk = $this->mataKuliah($otherProdi->id, 'OTH101');
        $foreignCpmkId = \Illuminate\Support\Facades\DB::table('cpmk')
            ->insertGetId([
                'mata_kuliah_id' => $otherMk->id,
                'kode' => 'CPMK-X',
                'deskripsi' => 'Lintas prodi',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        $controller = new BorangController(
            app(PendaftaranService::class),
            app(PrivateDocumentStorage::class),
            app(RegistrationEligibilityService::class),
        );

        $response = $controller->saveEvaluasiDiri(
            $this->requestAs($pemohon, [
                'items' => [[
                    'cpmk_id' => $foreignCpmkId,
                    'profisiensi' => '4',
                    'dokumen_pendukung' => ['Ijazah'],
                ]],
            ]),
            $pendaftaran,
        );

        $this->assertSame(422, $response->status());
        $this->assertDatabaseCount('evaluasi_diri', 0);
    }

    public function test_registration_rejects_closed_wave_and_inactive_prodi(): void
    {
        $service = app(RegistrationEligibilityService::class);
        $inactive = $this->prodi('OFF', 'nonaktif');
        $wave = \Illuminate\Support\Facades\DB::table('gelombang')->insertGetId([
            'nama' => 'Closed',
            'tgl_buka' => now()->subDays(10)->toDateString(),
            'tgl_tutup' => now()->subDay()->toDateString(),
            'status' => 'aktif',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $service->validate($wave, $inactive->id);
            $this->fail('Registrasi seharusnya ditolak.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('gelombang_id', $e->errors());
        }
    }

    public function test_user_with_registration_cannot_be_deleted(): void
    {
        [$admin, , , , $pemohon] = $this->baseWorkflow('pre_submit');
        $superAdmin = $this->user('super_admin');
        $controller = app(PenggunaController::class);

        $response = $controller->destroy(
            tap($pemohon, fn () => $this->actingAs($superAdmin)),
        );

        $this->assertSame(422, $response->status());
        $this->assertDatabaseHas('users', ['id' => $pemohon->id]);
    }

    private function baseWorkflow(string $status): array
    {
        $prodi = $this->prodi('TI');
        $admin = $this->user('admin_prodi', $prodi->id);
        $pimpinan = $this->user('pimpinan');
        $pemohon = $this->user('pemohon');
        $gelombangId = \Illuminate\Support\Facades\DB::table('gelombang')
            ->insertGetId([
                'nama' => 'Aktif',
                'tgl_buka' => now()->subDay()->toDateString(),
                'tgl_tutup' => now()->addDay()->toDateString(),
                'status' => 'aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        $pendaftaran = Pendaftaran::create([
            'user_id' => $pemohon->id,
            'gelombang_id' => $gelombangId,
            'prodi_id' => $prodi->id,
            'nomor_pendaftaran' => 'RPL-'.uniqid(),
            'status_alur' => $status,
        ]);
        $mataKuliah = $this->mataKuliah($prodi->id, 'IF101');

        return [$admin, $pimpinan, $pendaftaran, $mataKuliah, $pemohon];
    }

    private function createPleno(Pendaftaran $pendaftaran, $mataKuliah): void
    {
        $pendaftaran->plenoMk()->create([
            'mata_kuliah_id' => $mataKuliah->id,
            'keputusan_final' => 'A',
            'status' => 'aman',
        ]);
    }

    private function expiredWrittenAt2(Pendaftaran $pendaftaran, array $overrides = []): array
    {
        return $this->writtenAt2($pendaftaran, array_merge([
            'fase_tulis' => 'menunggu_jawaban',
            'durasi_menit' => 30,
            'ujian_dimulai_at' => now()->subMinutes(31),
        ], $overrides));
    }

    private function activeWrittenAt2(Pendaftaran $pendaftaran, array $overrides = []): array
    {
        return $this->writtenAt2($pendaftaran, array_merge([
            'fase_tulis' => 'menunggu_jawaban',
            'durasi_menit' => 30,
            'ujian_dimulai_at' => now()->subMinutes(5),
        ], $overrides));
    }

    private function writtenAt2(Pendaftaran $pendaftaran, array $overrides = []): array
    {
        $uji = UjiLanjutan::create(array_merge([
            'pendaftaran_id' => $pendaftaran->id,
            'status' => 'menunggu_ujian',
            'fase_tulis' => 'menunggu_jawaban',
            'durasi_menit' => 30,
            'ujian_dimulai_at' => now(),
        ], $overrides));
        $first = UjiLanjutanItem::create([
            'uji_lanjutan_id' => $uji->id,
            'tipe' => 'c3',
            'pertanyaan_instruksi' => 'Pertanyaan pertama',
        ]);
        $second = UjiLanjutanItem::create([
            'uji_lanjutan_id' => $uji->id,
            'tipe' => 'c3',
            'pertanyaan_instruksi' => 'Pertanyaan kedua',
        ]);

        return [$uji, $first, $second];
    }

    private function user(string $role, ?int $prodiId = null): User
    {
        return User::create([
            'nama' => ucfirst($role),
            'email' => uniqid($role).'@test.local',
            'password' => 'password',
            'role' => $role,
            'status' => 'aktif',
            'prodi_id' => $prodiId,
        ]);
    }

    private function prodi(string $kode, string $status = 'aktif')
    {
        return \App\Models\Prodi::create([
            'kode' => $kode,
            'nama' => "Prodi {$kode}",
            'jenjang' => 'D4',
            'status' => $status,
        ]);
    }

    private function mataKuliah(int $prodiId, string $kode)
    {
        return \App\Models\MataKuliah::create([
            'prodi_id' => $prodiId,
            'kode' => $kode,
            'nama' => "MK {$kode}",
            'sks' => 3,
            'is_active' => true,
        ]);
    }

    private function requestAs(User $user, array $data = []): Request
    {
        $this->actingAs($user);
        $request = Request::create('/', 'POST', $data);
        $request->setUserResolver(fn () => $user);

        return $request;
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role');
            $table->string('status')->default('aktif');
            $table->unsignedBigInteger('prodi_id')->nullable();
            $table->string('nip')->nullable();
            $table->string('jabatan')->nullable();
            $table->timestamps();
        });
        Schema::create('prodi', function (Blueprint $table) {
            $table->id();
            $table->string('kode');
            $table->string('nama');
            $table->string('jenjang');
            $table->string('status')->default('aktif');
            $table->timestamps();
        });
        Schema::create('gelombang', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->date('tgl_buka');
            $table->date('tgl_tutup');
            $table->date('tgl_sanggah')->nullable();
            $table->string('status');
            $table->timestamps();
        });
        Schema::create('pendaftaran', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('gelombang_id');
            $table->unsignedBigInteger('prodi_id');
            $table->string('nomor_pendaftaran')->unique();
            $table->string('status_alur');
            $table->text('catatan_admin')->nullable();
            $table->json('pra_pemetaan_payload')->nullable();
            $table->timestamps();
        });
        Schema::create('penugasan_asesor', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pendaftaran_id');
            $table->unsignedBigInteger('asesor_id');
            $table->string('urutan')->nullable();
            $table->string('status')->default('belum_dinilai');
            $table->boolean('butuh_at2')->default(false);
            $table->timestamps();
        });
        Schema::create('mata_kuliah', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('prodi_id');
            $table->string('kode');
            $table->string('nama');
            $table->unsignedInteger('sks');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('cpmk', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mata_kuliah_id');
            $table->string('kode');
            $table->text('deskripsi');
            $table->timestamps();
        });
        Schema::create('evaluasi_diri', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pendaftaran_id');
            $table->unsignedBigInteger('cpmk_id');
            $table->string('profisiensi');
            $table->json('dokumen_pendukung')->nullable();
            $table->timestamps();
        });
        Schema::create('pleno_mk', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pendaftaran_id');
            $table->unsignedBigInteger('mata_kuliah_id');
            $table->string('status')->nullable();
            $table->string('keputusan_final')->nullable();
            $table->text('catatan_pleno')->nullable();
            $table->unsignedBigInteger('disahkan_oleh')->nullable();
            $table->timestamp('disahkan_at')->nullable();
            $table->timestamps();
        });
        Schema::create('sk_keputusan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pendaftaran_id')->unique();
            $table->unsignedInteger('total_sks_diakui')->default(0);
            $table->string('status');
            $table->string('nomor_sk')->nullable()->unique();
            $table->date('tanggal_terbit')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->char('content_hash', 64)->nullable();
            $table->json('document_snapshot')->nullable();
            $table->unsignedBigInteger('diterbitkan_oleh')->nullable();
            $table->string('penerbit_nama')->nullable();
            $table->string('penerbit_nip')->nullable();
            $table->string('penerbit_jabatan')->nullable();
            $table->string('qr_code_path')->nullable();
            $table->string('pdf_path')->nullable();
            $table->char('pdf_hash', 64)->nullable();
            $table->uuid('generation_token')->nullable();
            $table->timestamp('generation_started_at')->nullable();
            $table->timestamps();
        });
        Schema::create('uji_lanjutan', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pendaftaran_id')->unique();
            $table->string('status');
            $table->string('fase_tulis');
            $table->date('tanggal_ujian')->nullable();
            $table->string('waktu_ujian')->nullable();
            $table->unsignedInteger('durasi_menit')->nullable();
            $table->timestamp('ujian_dimulai_at')->nullable();
            $table->string('reschedule_status')->nullable();
            $table->text('reschedule_alasan')->nullable();
            $table->text('reschedule_catatan')->nullable();
            $table->unsignedTinyInteger('reschedule_count')->default(0);
            $table->timestamps();
        });
        Schema::create('uji_lanjutan_item', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('uji_lanjutan_id');
            $table->string('tipe');
            $table->unsignedBigInteger('mata_kuliah_id')->nullable();
            $table->text('pertanyaan_instruksi')->nullable();
            $table->text('kunci_jawaban')->nullable();
            $table->text('jawaban_pemohon')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
        Schema::create('sanggah', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pendaftaran_id');
            $table->unsignedBigInteger('mata_kuliah_id');
            $table->unsignedBigInteger('asesor_id')->nullable();
            $table->text('alasan');
            $table->string('bukti_path')->nullable();
            $table->boolean('paham_prosedur')->default(false);
            $table->string('status');
            $table->text('respon_asesor')->nullable();
            $table->timestamp('diputus_at')->nullable();
            $table->timestamps();
        });
        Schema::create('dokumen', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pendaftaran_id');
            $table->string('tipe');
            $table->string('deskripsi')->nullable();
            $table->string('file_path');
            $table->string('file_name')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('title');
            $table->text('message');
            $table->string('type');
            $table->string('href')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    private function useTemporaryMysqlDatabase(): void
    {
        $env = $this->readEnvironmentFile();
        $this->temporaryDatabase = 'sirpl_phase16_'.bin2hex(random_bytes(5));
        $pdo = $this->mysqlPdo($env);
        $pdo->exec(
            'CREATE DATABASE `'.$this->temporaryDatabase.
            '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
        );

        config([
            'database.default' => 'phase16_test',
            'database.connections.phase16_test' => [
                'driver' => 'mysql',
                'host' => $env['DB_HOST'] ?? '127.0.0.1',
                'port' => $env['DB_PORT'] ?? '3306',
                'database' => $this->temporaryDatabase,
                'username' => $env['DB_USERNAME'] ?? 'root',
                'password' => $env['DB_PASSWORD'] ?? '',
                'unix_socket' => '',
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'prefix_indexes' => true,
                'strict' => true,
                'engine' => null,
            ],
        ]);
        \Illuminate\Support\Facades\DB::purge();
        \Illuminate\Support\Facades\DB::setDefaultConnection('phase16_test');
    }

    private function mysqlPdo(array $env): \PDO
    {
        return new \PDO(
            sprintf(
                'mysql:host=%s;port=%s;charset=utf8mb4',
                $env['DB_HOST'] ?? '127.0.0.1',
                $env['DB_PORT'] ?? '3306',
            ),
            $env['DB_USERNAME'] ?? 'root',
            $env['DB_PASSWORD'] ?? '',
            [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION],
        );
    }

    private function readEnvironmentFile(): array
    {
        $values = [];
        foreach (file(base_path('.env'), FILE_IGNORE_NEW_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $values[trim($key)] = trim(trim($value), "\"'");
        }

        return $values;
    }
}
