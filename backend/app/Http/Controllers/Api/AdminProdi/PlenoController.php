<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\EvaluasiDiri;
use App\Models\Pendaftaran;
use App\Models\PemetaanMk;
use App\Models\PlenoApproval;
use App\Models\PlenoMk;
use App\Models\SkKeputusan;
use App\Models\TranskripAsal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PlenoController extends Controller
{
    /**
     * List semua pleno MK per pendaftaran di prodi admin.
     *
     * FIX 4.2: Sebelumnya memanggil $query->get() DUA KALI.
     * Sekarang data dari query pertama di-reuse setelah compile.
     */
    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;

        $pendaftarans = Pendaftaran::with([
            "user:id,nama",
            "plenoMk.mataKuliah:id,kode,nama,sks",
            "plenoApproval",
        ])
            ->where("prodi_id", $prodiId)
            ->whereIn("status_alur", ["pleno", "finished"])
            ->paginate($request->get('per_page', 100));

        // Compile data pleno jika belum ada atau belum ter-compile (nilai masih null)
        foreach ($pendaftarans as $pendaftaran) {
            $perluCompile = $pendaftaran->plenoMk->isEmpty()
                || $pendaftaran->plenoMk->every(fn($mk) => is_null($mk->status));
            if ($perluCompile) {
                $this->compilePlenoMk($pendaftaran);
            }
        }

        // FIX: reload relasi pada collection yang sama, bukan query ulang
        $pendaftarans->load([
            "user:id,nama",
            "plenoMk.mataKuliah:id,kode,nama,sks",
            "plenoApproval",
        ]);

        return response()->json($pendaftarans);
    }

    /**
     * Detail pleno per pendaftaran
     */
    public function show(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('view', $pendaftaran);

        if ($pendaftaran->plenoMk()->count() === 0
            || $pendaftaran->plenoMk()->whereNull('status')->exists()) {
            $this->compilePlenoMk($pendaftaran);
        }

        $pendaftaran->load([
            "user:id,nama",
            "plenoMk.mataKuliah:id,kode,nama,sks",
            "penugasanAsesor.asesor:id,nama",
            "plenoApproval.submitter:id,nama",
            "plenoApproval.kaprodiApprover:id,nama",
            "plenoApproval.kaprodiRejecter:id,nama",
            "plenoApproval.pimpinanApprover:id,nama",
            "plenoApproval.pimpinanRejecter:id,nama",
        ]);
        $this->decoratePlenoSourceMetadata($pendaftaran);

        return response()->json(["data" => $pendaftaran]);
    }

    /**
     * Simpan/update keputusan final pleno per MK
     */
    public function updateKeputusan(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        if (
            $pendaftaran->status_alur !== 'pleno' ||
            $pendaftaran->skKeputusan?->status === 'sk_terbit' ||
            in_array($pendaftaran->plenoApproval?->status, [
                'menunggu_approval_kaprodi',
                'menunggu_approval_pimpinan',
                'approved_final',
            ], true)
        ) {
            return response()->json([
                'message' => 'Keputusan pleno sudah masuk proses approval atau sudah final.',
            ], 409);
        }

        $validated = $request->validate([
            "items" => "required|array|min:1",
            "items.*.mata_kuliah_id" => [
                "required",
                "distinct",
                Rule::exists("pleno_mk", "mata_kuliah_id")->where(
                    fn ($query) => $query->where(
                        "pendaftaran_id",
                        $pendaftaran->id,
                    ),
                ),
            ],
            "items.*.keputusan_final" =>
                "required|in:A,AB,B,BC,C,T",
            "items.*.catatan_pleno" => "nullable|string",
        ]);

        DB::transaction(function () use ($validated, $pendaftaran, $request) {
            $locked = Pendaftaran::whereKey($pendaftaran->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $locked->status_alur === 'pleno',
                409,
                'Pendaftaran tidak lagi berada pada tahap pleno.',
            );
            $sk = SkKeputusan::where('pendaftaran_id', $locked->id)
                ->lockForUpdate()
                ->first();
            abort_if(
                $sk?->status === 'sk_terbit',
                409,
                'SK sudah diterbitkan.',
            );
            foreach ($validated["items"] as $item) {
                PlenoMk::where("pendaftaran_id", $locked->id)
                    ->where("mata_kuliah_id", $item["mata_kuliah_id"])
                    ->lockForUpdate()
                    ->update([
                        "keputusan_final" => $item["keputusan_final"],
                        "catatan_pleno" => $item["catatan_pleno"] ?? null,
                        "disahkan_oleh" => $request->user()->id,
                        "disahkan_at" => now(),
                    ]);
            }
        });

        return response()->json([
            "message" => "Keputusan pleno berhasil disimpan",
            "data" => $pendaftaran
                ->fresh()
                ->load("plenoMk.mataKuliah:id,kode,nama"),
        ]);
    }

    /**
     * Finalisasi pleno → set status ke finished & generate SK draft
     */
    public function finalize(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        try {
            DB::transaction(function () use ($pendaftaran, $request) {
                $locked = Pendaftaran::whereKey($pendaftaran->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                abort_unless(
                    $locked->status_alur === 'pleno',
                    409,
                    'Pleno sudah difinalisasi atau tahap tidak sesuai.',
                );

                $existingSk = SkKeputusan::where(
                    "pendaftaran_id",
                    $locked->id,
                )->lockForUpdate()->first();
                abort_if(
                    $existingSk?->status === 'sk_terbit',
                    409,
                    'SK sudah diterbitkan dan tidak dapat difinalisasi ulang.',
                );
                $approval = PlenoApproval::where('pendaftaran_id', $locked->id)
                    ->lockForUpdate()
                    ->first();
                abort_if(
                    in_array($approval?->status, [
                        'menunggu_approval_kaprodi',
                        'menunggu_approval_pimpinan',
                        'approved_final',
                    ], true),
                    409,
                    'Pleno sudah berada dalam proses approval.',
                );

                $pleno = PlenoMk::where(
                    "pendaftaran_id",
                    $locked->id,
                )->lockForUpdate()->get();
                abort_if(
                    $pleno->isEmpty() ||
                    $pleno->contains(
                        fn ($item) => ! in_array(
                            $item->keputusan_final,
                            ['A', 'AB', 'B', 'BC', 'C', 'T'],
                            true,
                        ),
                    ),
                    422,
                    'Seluruh mata kuliah harus memiliki keputusan final yang valid.',
                );

                PlenoApproval::updateOrCreate(
                    ['pendaftaran_id' => $locked->id],
                    [
                        'status' => 'menunggu_approval_kaprodi',
                        'submitted_by' => $request->user()->id,
                        'submitted_at' => now(),
                        'kaprodi_approved_by' => null,
                        'kaprodi_approved_at' => null,
                        'kaprodi_rejected_by' => null,
                        'kaprodi_rejected_at' => null,
                        'kaprodi_catatan' => null,
                        'pimpinan_approved_by' => null,
                        'pimpinan_approved_at' => null,
                        'pimpinan_rejected_by' => null,
                        'pimpinan_rejected_at' => null,
                        'pimpinan_catatan' => null,
                    ],
                );
            });
        } catch (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e) {
            throw $e;
        }

        return response()->json([
            "message" => "Pleno dikirim ke approval Kaprodi.",
        ]);
    }

    /**
     * Export data pleno ke excel
     */
    public function exportExcel(Request $request)
    {
        $prodiId = $request->user()->prodi_id;
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\PlenoExport($prodiId),
            "Data_Pleno_Asesmen.xlsx",
        );
    }

    // ═══════════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Compile data PlenoMk dari penilaian kedua asesor.
     *
     * FIX 4.1: EvaluasiDiri tidak punya kolom mata_kuliah_id langsung —
     *           harus diambil via relasi cpmk → cpmk.mata_kuliah_id.
     *
     * FIX N+1: Semua data pemetaan & transkrip di-pre-load sebelum loop,
     *          bukan di-query per-iterasi. Dari ~40 query/pendaftaran → 5 query.
     */
    private function compilePlenoMk(Pendaftaran $pendaftaran): void
    {
        // FIX 4.1: Ambil mata_kuliah_id melalui relasi cpmk (bukan langsung dari evaluasi_diri)
        $claimedMkIds = EvaluasiDiri::where("pendaftaran_id", $pendaftaran->id)
            ->with("cpmk")
            ->get()
            ->pluck("cpmk.mata_kuliah_id")
            ->filter()
            ->unique();

        $tugasA1 = $pendaftaran
            ->penugasanAsesor()
            ->where("urutan", "asesor_1")
            ->first();
        $tugasA2 = $pendaftaran
            ->penugasanAsesor()
            ->where("urutan", "asesor_2")
            ->first();

        // PRE-LOAD: ambil seluruh pemetaan kedua asesor sebelum loop
        // key-by mk_poliban_id agar O(1) lookup di dalam loop
        $pemetaanA1 = $tugasA1
            ? PemetaanMk::where("penugasan_asesor_id", $tugasA1->id)
                ->get()
                ->keyBy("mk_poliban_id")
            : collect();
        $pemetaanA2 = $tugasA2
            ? PemetaanMk::where("penugasan_asesor_id", $tugasA2->id)
                ->get()
                ->keyBy("mk_poliban_id")
            : collect();

        // PRE-LOAD: seluruh transkrip pendaftaran ini (bukan query per-MK di dalam loop)
        $semuaTranskrip = TranskripAsal::where(
            "pendaftaran_id",
            $pendaftaran->id,
        )->get();
        $transkripMkIds = $semuaTranskrip
            ->pluck("mk_poliban_id")
            ->filter()
            ->unique();

        // Nilai AT2 harus dihitung per mata kuliah. nilai_at2_final pada
        // uji_lanjutan tetap boleh dipakai sebagai ringkasan, tetapi tidak
        // boleh menjadi sumber nilai pleno untuk seluruh MK.
        $at2Scores = $this->at2ScoresByAsesorAndMk($pendaftaran, collect([
            $tugasA1?->asesor_id,
            $tugasA2?->asesor_id,
        ])->filter()->values());
        $at2MkIds = $at2Scores
            ->flatMap(fn ($scoresByMk) => $scoresByMk->keys())
            ->unique();

        // Gabungkan semua MK yang punya basis data valid.
        $mkIds = collect()
            ->merge($pemetaanA1->keys())
            ->merge($pemetaanA2->keys())
            ->merge($claimedMkIds)
            ->merge($transkripMkIds)
            ->merge($at2MkIds)
            ->filter()
            ->unique();

        if ($mkIds->isEmpty()) {
            return;
        }

        foreach ($mkIds as $mkId) {
            [$keputusanA1, $nilaiA1, $bobotA1] = $this->resolveNilai(
                $pemetaanA1->get($mkId),
                $semuaTranskrip,
                $this->at2ScoreFor($at2Scores, $tugasA1?->asesor_id, (int) $mkId),
                (int) $mkId,
            );
            [$keputusanA2, $nilaiA2, $bobotA2] = $this->resolveNilai(
                $pemetaanA2->get($mkId),
                $semuaTranskrip,
                $this->at2ScoreFor($at2Scores, $tugasA2?->asesor_id, (int) $mkId),
                (int) $mkId,
            );

            [$status, $keputusanFinal] = $this->resolveStatus(
                $keputusanA1,
                $keputusanA2,
                $bobotA1,
                $bobotA2,
                $nilaiA1,
            );

            PlenoMk::updateOrCreate(
                [
                    "pendaftaran_id" => $pendaftaran->id,
                    "mata_kuliah_id" => $mkId,
                ],
                [
                    "nilai_a1" => $nilaiA1,
                    "bobot_a1" => $bobotA1,
                    "keputusan_a1" => $keputusanA1,
                    "nilai_a2" => $nilaiA2,
                    "bobot_a2" => $bobotA2,
                    "keputusan_a2" => $keputusanA2,
                    "rata_rata" => ($bobotA1 + $bobotA2) / 2,
                    "status" => $status,
                    "keputusan_final" => $keputusanFinal,
                ],
            );
        }
    }

    /**
     * Konversi skor AT2 (0–100) ke nilai huruf, bobot, dan keputusan standar Poliban.
     * Referensi: Tabel Nilai Akademik Poliban (Peraturan Akademik).
     *
     * @return array{string, string, float}  [keputusan, nilai_huruf, bobot]
     */
    private function skorKeNilaiPoliban(float $skor): array
    {
        if ($skor >= 79.50) return ['diakui', 'A',  4.00];
        if ($skor >= 71.50) return ['diakui', 'AB', 3.50];
        if ($skor >= 64.50) return ['diakui', 'B',  3.00];
        if ($skor >= 55.50) return ['diakui', 'BC', 2.50];
        if ($skor >= 47.50) return ['diakui', 'C',  2.00];
        // Di bawah C = tidak diakui (CD/D/E dilebur menjadi T dalam konteks RPL)
        return ['tidak_diakui', 'T', 0.00];
    }

    private function decoratePlenoSourceMetadata(Pendaftaran $pendaftaran): void
    {
        $tugasA1 = $pendaftaran->penugasanAsesor
            ->firstWhere("urutan", "asesor_1");
        $tugasA2 = $pendaftaran->penugasanAsesor
            ->firstWhere("urutan", "asesor_2");

        $pemetaanA1 = $tugasA1
            ? PemetaanMk::where("penugasan_asesor_id", $tugasA1->id)
                ->get()
                ->keyBy("mk_poliban_id")
            : collect();
        $pemetaanA2 = $tugasA2
            ? PemetaanMk::where("penugasan_asesor_id", $tugasA2->id)
                ->get()
                ->keyBy("mk_poliban_id")
            : collect();
        $semuaTranskrip = TranskripAsal::where(
            "pendaftaran_id",
            $pendaftaran->id,
        )->get();
        $at2Scores = $this->at2ScoresByAsesorAndMk($pendaftaran, collect([
            $tugasA1?->asesor_id,
            $tugasA2?->asesor_id,
        ])->filter()->values());

        $pendaftaran->plenoMk->each(function (PlenoMk $plenoMk) use (
            $pemetaanA1,
            $pemetaanA2,
            $semuaTranskrip,
            $at2Scores,
            $tugasA1,
            $tugasA2,
        ) {
            $mkId = (int) $plenoMk->mata_kuliah_id;
            [$sumberA1, $detailA1] = $this->resolveSumberNilai(
                $pemetaanA1->get($mkId),
                $semuaTranskrip,
                $this->at2ScoreFor($at2Scores, $tugasA1?->asesor_id, $mkId),
                $mkId,
                $plenoMk,
            );
            [$sumberA2, $detailA2] = $this->resolveSumberNilai(
                $pemetaanA2->get($mkId),
                $semuaTranskrip,
                $this->at2ScoreFor($at2Scores, $tugasA2?->asesor_id, $mkId),
                $mkId,
                $plenoMk,
            );

            $plenoMk->setAttribute("sumber_a1", $sumberA1);
            $plenoMk->setAttribute("sumber_a2", $sumberA2);
            $plenoMk->setAttribute("detail_sumber_a1", $detailA1);
            $plenoMk->setAttribute("detail_sumber_a2", $detailA2);
        });
    }

    /**
     * Ambil nilai AT2 per asesor per mata kuliah.
     *
     * Item AT2 tanpa mata_kuliah_id sengaja diabaikan agar nilainya tidak
     * menyebar ke semua MK pada pleno.
     *
     * @return \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, float>>
     */
    private function at2ScoresByAsesorAndMk(Pendaftaran $pendaftaran, $asesorIds)
    {
        if ($asesorIds->isEmpty()) {
            return collect();
        }

        return DB::table('uji_lanjutan_penilaian')
            ->join(
                'uji_lanjutan_item',
                'uji_lanjutan_penilaian.uji_lanjutan_item_id',
                '=',
                'uji_lanjutan_item.id',
            )
            ->join(
                'uji_lanjutan',
                'uji_lanjutan_item.uji_lanjutan_id',
                '=',
                'uji_lanjutan.id',
            )
            ->where('uji_lanjutan.pendaftaran_id', $pendaftaran->id)
            ->whereNotNull('uji_lanjutan_item.mata_kuliah_id')
            ->whereIn('uji_lanjutan_penilaian.asesor_id', $asesorIds)
            ->groupBy(
                'uji_lanjutan_penilaian.asesor_id',
                'uji_lanjutan_item.mata_kuliah_id',
            )
            ->selectRaw(
                'uji_lanjutan_penilaian.asesor_id, uji_lanjutan_item.mata_kuliah_id, AVG(uji_lanjutan_penilaian.skor) * 20 as nilai_at2',
            )
            ->get()
            ->groupBy('asesor_id')
            ->map(fn ($rows) => $rows->mapWithKeys(fn ($row) => [
                (int) $row->mata_kuliah_id => round((float) $row->nilai_at2, 2),
            ]));
    }

    private function at2ScoreFor($at2Scores, ?int $asesorId, int $mkId): ?float
    {
        if (! $asesorId) {
            return null;
        }

        $score = $at2Scores->get($asesorId)?->get($mkId);

        return $score === null ? null : (float) $score;
    }

    /**
     * Tentukan sumber nilai yang ditampilkan di UI pleno.
     *
     * Metadata ini hanya untuk auditability/transparansi, tidak mengubah
     * hasil kalkulasi pleno.
     *
     * @return array{string, string}
     */
    private function resolveSumberNilai(
        ?PemetaanMk $pemetaan,
        $semuaTranskrip,
        ?float $nilaiAt2,
        int $mkId,
        PlenoMk $plenoMk,
    ): array {
        $targetMkId = $pemetaan?->mk_poliban_id ?? $mkId;
        $transkrip = $semuaTranskrip->firstWhere('mk_poliban_id', $targetMkId);

        if ($transkrip) {
            $bobotTranskrip = (float) $transkrip->nilai_angka;
            if ($nilaiAt2 !== null) {
                [, $hurufAt2, $bobotAt2] = $this->skorKeNilaiPoliban($nilaiAt2);
                if ($bobotAt2 > $bobotTranskrip) {
                    return [
                        'AT2',
                        "Nilai AT2 per MK {$nilaiAt2} ({$hurufAt2}) lebih tinggi dari transkrip {$transkrip->nilai_huruf}.",
                    ];
                }
            }

            return [
                'Transkrip',
                "MK asal {$transkrip->nama_mk} dengan nilai {$transkrip->nilai_huruf} ({$bobotTranskrip}).",
            ];
        }

        if ($nilaiAt2 !== null) {
            [, $hurufAt2] = $this->skorKeNilaiPoliban($nilaiAt2);

            return [
                'AT2',
                "Nilai AT2 per MK {$nilaiAt2} ({$hurufAt2}).",
            ];
        }

        if ($pemetaan) {
            $keputusan = str_replace('_', ' ', (string) $pemetaan->keputusan);

            return [
                'Pemetaan',
                "Keputusan pemetaan asesor: {$keputusan}.",
            ];
        }

        if ($plenoMk->disahkan_oleh || $plenoMk->catatan_pleno) {
            return [
                'Manual',
                'Nilai/keputusan ditetapkan melalui diskusi pleno.',
            ];
        }

        return [
            'Tidak Ada Basis',
            'Tidak ditemukan transkrip terpetakan, pemetaan asesor, atau AT2 per MK.',
        ];
    }

    /**
     * Konversi bobot rata-rata (0–4) ke nilai huruf Poliban terdekat.
     * Digunakan untuk menentukan keputusan final pleno dari rata-rata bobot dua asesor.
     * CD/D/E (< 1.75) dilebur menjadi T karena RPL tidak mengakui MK di bawah C.
     */
    private function bobotKeHurufPoliban(float $bobot): string
    {
        if ($bobot >= 3.75) return 'A';
        if ($bobot >= 3.25) return 'AB';
        if ($bobot >= 2.75) return 'B';
        if ($bobot >= 2.25) return 'BC';
        if ($bobot >= 1.75) return 'C';
        return 'T'; // di bawah C → Tidak Diakui
    }

    /**
     * Resolve nilai huruf, bobot angka, dan keputusan dari satu pemetaan.
     * Lookup transkrip dilakukan IN-MEMORY dari koleksi yang sudah di-pre-load.
     * Jika pendaftaran melewati AT2, nilai AT2 final juga dipertimbangkan.
     * Semua nilai huruf mengacu pada standar nilai akademik Poliban.
     *
     * @return array{string, string, float}  [keputusan, nilai_huruf, bobot]
     */
    private function resolveNilai(
        ?PemetaanMk $pemetaan,
        $semuaTranskrip,
        ?float $nilaiAt2 = null,
        ?int $mkId = null,
    ): array
    {
        $targetMkId = $pemetaan?->mk_poliban_id ?? $mkId;
        $transkrip = $targetMkId
            ? $semuaTranskrip->firstWhere('mk_poliban_id', $targetMkId)
            : null;

        if (!$pemetaan) {
            if ($transkrip) {
                $bobot = floatval($transkrip->nilai_angka);
                $huruf = $transkrip->nilai_huruf;

                if ($nilaiAt2 !== null) {
                    [$kepAt2, $hurufAt2, $bobotAt2] = $this->skorKeNilaiPoliban($nilaiAt2);
                    if ($bobotAt2 > $bobot) {
                        return [$kepAt2, $hurufAt2, $bobotAt2];
                    }
                }

                return ['diakui', $huruf, $bobot];
            }

            // Tidak ada pemetaan/transkrip: gunakan AT2 per-MK jika ada,
            // atau tidak diakui. Tidak pernah memakai nilai AT2 global.
            if ($nilaiAt2 !== null) {
                return $this->skorKeNilaiPoliban($nilaiAt2);
            }
            return ['tidak_diakui', 'T', 0.0];
        }

        $keputusan = in_array($pemetaan->keputusan, ['diakui_penuh', 'diakui_sebagian'])
            ? 'diakui'
            : 'tidak_diakui';

        if ($transkrip) {
            $bobot = floatval($transkrip->nilai_angka);
            $huruf = $transkrip->nilai_huruf;

            // Jika ada AT2, pakai yang bobotnya lebih tinggi
            if ($nilaiAt2 !== null) {
                [$kepAt2, $hurufAt2, $bobotAt2] = $this->skorKeNilaiPoliban($nilaiAt2);
                if ($bobotAt2 > $bobot) {
                    return [$kepAt2, $hurufAt2, $bobotAt2];
                }
            }
            return [$keputusan, $huruf, $bobot];
        }

        // Pemetaan ada tapi tidak ada transkrip: gunakan AT2 jika ada
        if ($nilaiAt2 !== null) {
            return $this->skorKeNilaiPoliban($nilaiAt2);
        }

        return match ($pemetaan->keputusan) {
            'diakui_penuh'    => ['diakui', 'A',  4.0],
            'diakui_sebagian' => ['diakui', 'B',  3.0],
            default           => ['tidak_diakui', 'T', 0.0],
        };
    }

    /**
     * Tentukan status pleno dan keputusan final dari perbandingan dua asesor.
     * Nilai final dihitung dari rata-rata bobot kedua asesor, dikonversi ke
     * huruf Poliban terdekat menggunakan bobotKeHurufPoliban().
     *
     * @return array{string, string|null}  [status, keputusan_final]
     */
    private function resolveStatus(
        string $keputusanA1,
        string $keputusanA2,
        float $bobotA1,
        float $bobotA2,
        string $nilaiA1,
    ): array {
        // Keputusan berbeda (satu diakui, satu tidak) → konflik, Admin isi manual
        if ($keputusanA1 !== $keputusanA2) {
            return ['konflik', null];
        }

        // Keduanya tidak diakui
        if ($keputusanA1 === 'tidak_diakui') {
            return ['aman', 'T'];
        }

        // Keduanya diakui: hitung rata-rata bobot → konversi ke huruf Poliban
        $diff         = abs($bobotA1 - $bobotA2);
        $rataRata     = ($bobotA1 + $bobotA2) / 2;
        $hurufFinal   = $this->bobotKeHurufPoliban($rataRata);

        if ($diff > 1.0) {
            return ['selisih_mayor', null]; // selisih besar → Admin isi manual
        }
        if ($diff > 0.0) {
            return ['selisih_minor', $hurufFinal]; // selisih kecil → pakai rata-rata
        }

        return ['aman', $hurufFinal]; // sama persis → pakai rata-rata
    }
}
