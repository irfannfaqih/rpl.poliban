<?php

namespace App\Http\Controllers\Api\Asesor;

use App\Http\Controllers\Controller;
use App\Models\EvaluasiPortofolio;
use App\Models\PemetaanMk;
use App\Models\PenilaianCpmk;
use App\Models\PenugasanAsesor;
use App\Models\PraAsesmen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WorkspaceController extends Controller
{
    // ═══ Pra-Asesmen (Form 02) ═══

    public function savePraAsesmen(
        Request $request,
        PenugasanAsesor $tugas,
    ): JsonResponse {
        if ($tugas->asesor_id !== $request->user()->id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if (
            $tugas->status === 'submit_final' ||
            $tugas->pendaftaran?->status_alur !== 'pra_asesmen'
        ) {
            return response()->json([
                "message" => "Pra Asesmen tidak dapat diubah pada tahap ini.",
                "code" => "PRA_ASESMEN_LOCKED",
            ], 409);
        }

        // Pra-Asesmen bersifat final setelah disubmit, apa pun rekomendasinya.
        $existing = PraAsesmen::where("penugasan_asesor_id", $tugas->id)->first();
        if ($existing && $existing->is_submitted) {
            return response()->json([
                "message" => "Pra Asesmen sudah disubmit dan tidak dapat diubah.",
                "code" => "PRA_ASESMEN_LOCKED",
            ], 422);
        }

        $isSubmitting = $request->boolean("is_submitted");

        // Validasi dasar (simpan draf)
        $rules = [
            "langkah_1" => "boolean",
            "langkah_2" => "boolean",
            "langkah_3" => "boolean",
            "langkah_4" => "boolean",
            "langkah_5" => "boolean",
            "langkah_6" => "boolean",
            "langkah_7" => "boolean",
            "langkah_8" => "boolean",
            "catatan_observasi" => "nullable|string",
            "kebutuhan_khusus" => "nullable|string",
            "rekomendasi" =>
                "nullable|in:lanjut_penuh,lanjut_catatan,tidak_memenuhi",
            "catatan_rekomendasi" => "nullable|string",
            "is_submitted" => "boolean",
        ];

        // Jika submit final → semua langkah WAJIB dicentang, rekomendasi & catatan wajib diisi
        if ($isSubmitting) {
            $rules = array_merge($rules, [
                "langkah_1" => "required|accepted",
                "langkah_2" => "required|accepted",
                "langkah_3" => "required|accepted",
                "langkah_4" => "required|accepted",
                "langkah_5" => "required|accepted",
                "langkah_6" => "required|accepted",
                "langkah_7" => "required|accepted",
                "langkah_8" => "required|accepted",
                "rekomendasi" =>
                    "required|in:lanjut_penuh,lanjut_catatan,tidak_memenuhi",
                "catatan_rekomendasi" => "required|string|min:10",
            ]);
        }

        $validated = $request->validate($rules, [
            "langkah_1.accepted" =>
                "Langkah 1 (Pembukaan & Penjelasan Tujuan) wajib dicentang.",
            "langkah_2.accepted" =>
                "Langkah 2 (Evaluasi Bukti & Asesmen Mandiri) wajib dicentang.",
            "langkah_3.accepted" =>
                "Langkah 3 (Penjelasan Proses) wajib dicentang.",
            "langkah_4.accepted" =>
                "Langkah 4 (Konfirmasi Tujuan) wajib dicentang.",
            "langkah_5.accepted" =>
                "Langkah 5 (Perencanaan & Pengorganisasian) wajib dicentang.",
            "langkah_6.accepted" =>
                "Langkah 6 (Tata Tertib & Aturan) wajib dicentang.",
            "langkah_7.accepted" =>
                "Langkah 7 (Konfirmasi Jadwal) wajib dicentang.",
            "langkah_8.accepted" =>
                "Langkah 8 (Persetujuan Bersama) wajib dicentang.",
            "rekomendasi.required" =>
                "Rekomendasi tindak lanjut wajib dipilih.",
            "catatan_rekomendasi.required" =>
                "Catatan rekomendasi wajib diisi.",
            "catatan_rekomendasi.min" =>
                "Catatan rekomendasi minimal 10 karakter.",
        ]);

        $pra = DB::transaction(function () use (
            $tugas,
            $validated,
            $isSubmitting,
        ) {
            $lockedTask = $this->lockMutableTask($tugas);
            $existing = PraAsesmen::where(
                "penugasan_asesor_id",
                $lockedTask->id,
            )->lockForUpdate()->first();
            abort_if(
                $existing?->is_submitted,
                409,
                'Pra Asesmen sudah disubmit dan tidak dapat diubah.',
            );

            if ($isSubmitting && ! $existing?->submitted_at) {
                $validated["submitted_at"] = now();
            }

            $pra = PraAsesmen::updateOrCreate(
                ["penugasan_asesor_id" => $lockedTask->id],
                $validated,
            );

            if ($isSubmitting) {
                if (($validated["rekomendasi"] ?? null) === "tidak_memenuhi") {
                    $pendaftaran = $lockedTask->pendaftaran;
                    abort_unless(
                        $pendaftaran->canTransitionTo('ditolak'),
                        409,
                        'Pendaftaran tidak dapat ditolak pada tahap ini.',
                    );
                    $pendaftaran->update(["status_alur" => "ditolak"]);
                } else {
                    $lockedTask->update(["status" => "sedang_dinilai"]);
                }
            }

            return $pra;
        });

        // Jika submit dengan rekomendasi "tidak_memenuhi" → tolak pemohon
        if ($isSubmitting && ($validated["rekomendasi"] ?? null) === "tidak_memenuhi") {
            $tugas->load(["asesor:id,nama", "pendaftaran.user:id,nama", "pendaftaran.prodi:id,nama"]);

            // Notifikasi ke Admin Prodi
            $adminProdiIds = \App\Models\User::where("role", "admin_prodi")
                ->where("prodi_id", $tugas->pendaftaran?->prodi_id)
                ->pluck("id");

            foreach ($adminProdiIds as $adminId) {
                \App\Models\Notification::create([
                    "user_id" => $adminId,
                    "title"   => "Pemohon Tidak Memenuhi Syarat",
                    "message" => "Asesor {$tugas->asesor?->nama} merekomendasikan bahwa {$tugas->pendaftaran?->user?->nama} tidak memenuhi syarat RPL pada tahap Pra Asesmen.",
                    "type"    => "warning",
                    "href"    => "/admin-prodi/verifikasi?id={$tugas->pendaftaran_id}",
                ]);
            }

            // Notifikasi ke pemohon
            \App\Models\Notification::create([
                "user_id" => $tugas->pendaftaran?->user_id,
                "title"   => "Status Pendaftaran RPL",
                "message" => "Berdasarkan hasil konsultasi Pra Asesmen, Anda dinyatakan tidak memenuhi syarat untuk melanjutkan proses RPL. Silakan hubungi Admin Prodi untuk informasi lebih lanjut.",
                "type"    => "warning",
                "href"    => "/pemohon/dashboard",
            ]);
        }

        return response()->json([
            "message"     => "Pra-Asesmen berhasil disimpan",
            "data"        => $pra,
            "rekomendasi" => $validated["rekomendasi"] ?? null,
        ]);
    }

    // ═══ Guard: Form 02 wajib submit sebelum akses workspace ═══

    /**
     * Pastikan asesor sudah submit Form 02 (Pra-Asesmen) sebelum
     * boleh mengakses workspace penilaian apapun.
     *
     * PRD Bab 3.2: "Asesor DILARANG akses Workspace Blind Review
     * sebelum Form 02 di-submit. Endpoint wajib HTTP 403."
     */
    private function requirePraAsesmenSubmitted(
        PenugasanAsesor $tugas,
    ): ?JsonResponse {
        if (
            $tugas->status === 'submit_final' ||
            $tugas->pendaftaran?->status_alur !== 'pra_asesmen'
        ) {
            return response()->json([
                'message' => 'Penilaian sudah final atau tahap asesmen tidak aktif.',
                'code' => 'ASSESSMENT_LOCKED',
            ], 409);
        }

        $submitted = $tugas->praAsesmen?->is_submitted ?? false;
        if (!$submitted) {
            return response()->json(
                [
                    "message" =>
                        "Akses ditolak. Form Pra-Asesmen (Form 02) wajib diselesaikan dan di-submit terlebih dahulu sebelum mengakses penilaian.",
                    "code" => "PRA_ASESMEN_REQUIRED",
                ],
                403,
            );
        }

        // Guard: jika rekomendasi tidak_memenuhi, asesor tidak boleh akses workspace
        if (($tugas->praAsesmen?->rekomendasi ?? null) === "tidak_memenuhi") {
            return response()->json(
                [
                    "message" =>
                        "Akses ditolak. Pemohon telah direkomendasikan tidak memenuhi syarat pada tahap Pra Asesmen.",
                    "code" => "TIDAK_MEMENUHI_SYARAT",
                ],
                403,
            );
        }

        return null;
    }

    // ═══ Evaluasi Portofolio (Form 04) ═══

    public function saveEvaluasiPortofolio(
        Request $request,
        PenugasanAsesor $tugas,
    ): JsonResponse {
        if ($tugas->asesor_id !== $request->user()->id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if ($guard = $this->requirePraAsesmenSubmitted($tugas)) {
            return $guard;
        }

        // Validasi sesuai F04 Asesmen Portofolio
        $validated = $request->validate([
            "items" => "required|array|min:1",
            "items.*.kategori_no" => "required|integer|min:1|max:10",
            "items.*.status_dokumen" => "nullable|in:ada,tidak_ada",
            "items.*.kesesuaian" => "nullable|in:sesuai,tidak_sesuai",
            "items.*.rekomendasi_at2" => "nullable|string",
        ]);

        DB::transaction(function () use ($validated, $tugas) {
            $lockedTask = $this->lockMutableTask($tugas);
            foreach ($validated["items"] as $item) {
                EvaluasiPortofolio::updateOrCreate(
                    [
                        "penugasan_asesor_id" => $lockedTask->id,
                        "kategori_no" => $item["kategori_no"],
                    ],
                    collect($item)->except("kategori_no")->toArray(),
                );
            }
        });

        return response()->json([
            "message" => "Evaluasi portofolio berhasil disimpan",
            "data" => EvaluasiPortofolio::where(
                "penugasan_asesor_id",
                $tugas->id,
            )->get(),
        ]);
    }

    // ═══ Penilaian CPMK (Form 05) ═══

    public function savePenilaianCpmk(
        Request $request,
        PenugasanAsesor $tugas,
    ): JsonResponse {
        if ($tugas->asesor_id !== $request->user()->id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if ($guard = $this->requirePraAsesmenSubmitted($tugas)) {
            return $guard;
        }

        $validated = $request->validate([
            "items" => "required|array",
            "items.*.cpmk_id" => [
                "required",
                Rule::exists("cpmk", "id")->where(
                    fn ($query) => $query->whereIn(
                        'mata_kuliah_id',
                        \App\Models\MataKuliah::where(
                            'prodi_id',
                            $tugas->pendaftaran->prodi_id,
                        )->select('id'),
                    ),
                ),
            ],
            "items.*.nilai" => "nullable|in:diakui,belum_diakui",
            "items.*.catatan" => "nullable|string",
            // VATC: evaluasi kualitas bukti dokumen yang dilampirkan pemohon (F03)
            "items.*.valid"    => "nullable|boolean",
            "items.*.autentik" => "nullable|boolean",
            "items.*.terkini"  => "nullable|boolean",
            "items.*.cukup"    => "nullable|boolean",
        ]);

        DB::transaction(function () use ($validated, $tugas) {
            $lockedTask = $this->lockMutableTask($tugas);
            foreach ($validated["items"] as $item) {
                PenilaianCpmk::updateOrCreate(
                    [
                        "penugasan_asesor_id" => $lockedTask->id,
                        "cpmk_id" => $item["cpmk_id"],
                    ],
                    [
                        "nilai"    => $item["nilai"] ?? null,
                        "catatan"  => $item["catatan"] ?? null,
                        "valid"    => $item["valid"] ?? null,
                        "autentik" => $item["autentik"] ?? null,
                        "terkini"  => $item["terkini"] ?? null,
                        "cukup"    => $item["cukup"] ?? null,
                    ],
                );
            }
        });

        return response()->json([
            "message" => "Penilaian CPMK berhasil disimpan",
            "data" => PenilaianCpmk::where("penugasan_asesor_id", $tugas->id)
                ->with("cpmk")
                ->get(),
        ]);
    }

    // ═══ Pemetaan MK (Form 12) ═══

    public function savePemetaanMk(
        Request $request,
        PenugasanAsesor $tugas,
    ): JsonResponse {
        if ($tugas->asesor_id !== $request->user()->id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if ($guard = $this->requirePraAsesmenSubmitted($tugas)) {
            return $guard;
        }

        $validated = $request->validate([
            "items" => "required|array|min:1",
            "items.*.mk_asal_kode" => "required|string|max:20",
            "items.*.mk_asal_nama" => "required|string|max:255",
            "items.*.mk_poliban_id" => [
                "required",
                Rule::exists("mata_kuliah", "id")->where(
                    fn ($query) => $query->where(
                        "prodi_id",
                        $tugas->pendaftaran->prodi_id,
                    ),
                ),
            ],
            "items.*.kesenjangan" =>
                "nullable|in:sesuai,sebagian_sesuai,tidak_sesuai",
            "items.*.keputusan" =>
                "nullable|in:diakui_penuh,diakui_sebagian,tidak_diakui",
            "items.*.catatan" => "nullable|string",
        ]);

        DB::transaction(function () use ($validated, $tugas) {
            $lockedTask = $this->lockMutableTask($tugas);
            PemetaanMk::where("penugasan_asesor_id", $lockedTask->id)->delete();
            $transkrips = \App\Models\TranskripAsal::where(
                'pendaftaran_id',
                $tugas->pendaftaran_id,
            )->get();

            foreach ($validated['items'] as $item) {
                PemetaanMk::create(
                    array_merge($item, [
                        "penugasan_asesor_id" => $lockedTask->id,
                    ]),
                );

                foreach ($transkrips as $t) {
                $namaCocok = str_contains(
                    strtolower($t->nama_mk),
                    strtolower($item['mk_asal_nama']),
                );
                $kodeCocok =
                    $item['mk_asal_kode'] &&
                    (str_contains(
                        strtolower($t->nama_mk),
                        strtolower($item['mk_asal_kode']),
                    ) ||
                        ($t->kode_mk &&
                            strtolower($t->kode_mk) ===
                                strtolower($item['mk_asal_kode'])));

                if ($namaCocok || $kodeCocok) {
                    $t->update(['mk_poliban_id' => $item['mk_poliban_id']]);
                }
            }
            }
        });

        return response()->json([
            "message" => "Pemetaan MK berhasil disimpan",
            "data" => PemetaanMk::where("penugasan_asesor_id", $tugas->id)
                ->with("mkPoliban")
                ->get(),
        ]);
    }

    // ═══ Submit Final ═══

    public function submitFinal(
        Request $request,
        PenugasanAsesor $tugas,
    ): JsonResponse {
        if ($tugas->asesor_id !== $request->user()->id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if ($guard = $this->requirePraAsesmenSubmitted($tugas)) {
            return $guard;
        }

        $validated = $request->validate([
            "butuh_at2" => "nullable|boolean"
        ]);

        [$totalAsesor, $totalSubmit, $butuhAT2] = DB::transaction(
            function () use ($tugas, $validated) {
                $pendaftaran = $tugas->pendaftaran()
                    ->lockForUpdate()
                    ->firstOrFail();
                abort_unless(
                    $pendaftaran->status_alur === 'pra_asesmen',
                    409,
                    'Tahap pendaftaran tidak lagi menerima penilaian.',
                );

                $lockedTasks = PenugasanAsesor::where(
                    "pendaftaran_id",
                    $tugas->pendaftaran_id,
                )->lockForUpdate()->get();
                $lockedTask = $lockedTasks->firstWhere('id', $tugas->id);
                abort_if(
                    ! $lockedTask || $lockedTask->status === "submit_final",
                    409,
                    "Penilaian sudah pernah disubmit final.",
                );

                $totalCpmk = \App\Models\Cpmk::whereHas(
                    'mataKuliah',
                    fn ($query) => $query->where('prodi_id', $pendaftaran->prodi_id),
                )->count();
                $completeCpmk = PenilaianCpmk::where(
                    'penugasan_asesor_id',
                    $lockedTask->id,
                )
                    ->whereHas(
                        'cpmk.mataKuliah',
                        fn ($query) => $query->where('prodi_id', $pendaftaran->prodi_id),
                    )
                    ->whereNotNull('nilai')
                    ->whereNotNull('valid')
                    ->whereNotNull('autentik')
                    ->whereNotNull('terkini')
                    ->whereNotNull('cukup')
                    ->distinct('cpmk_id')
                    ->count('cpmk_id');

                abort_if(
                    $totalCpmk > 0 && $completeCpmk < $totalCpmk,
                    422,
                    'Penilaian CPMK belum lengkap. Setiap CPMK wajib memiliki nilai dan seluruh indikator VATC: Valid, Autentik, Terkini, dan Cukup.',
                );

                $lockedTask->update([
                    "status" => "submit_final",
                    "butuh_at2" => $validated["butuh_at2"] ?? false,
                ]);
                $lockedTasks = PenugasanAsesor::where(
                    "pendaftaran_id",
                    $tugas->pendaftaran_id,
                )->lockForUpdate()->get();
                $totalAsesor = $lockedTasks->count();
                $totalSubmit = $lockedTasks
                    ->where("status", "submit_final")
                    ->count();
                $butuhAT2 = $lockedTasks
                    ->where("butuh_at2", true)
                    ->isNotEmpty();

                if ($totalAsesor > 0 && $totalAsesor === $totalSubmit) {
                    $nextStatus = $butuhAT2 ? "asesmen_tahap2" : "pleno";
                    abort_unless(
                        $pendaftaran->canTransitionTo($nextStatus),
                        409,
                        "Tahap pendaftaran tidak dapat dipindahkan.",
                    );
                    $pendaftaran->update(["status_alur" => $nextStatus]);
                }

                return [$totalAsesor, $totalSubmit, $butuhAT2];
            },
        );

        if ($totalAsesor > 0 && $totalAsesor === $totalSubmit) {
            if (! $butuhAT2) {
                // Notifikasi ke Admin Prodi bahwa pemohon siap di-pleno
                $pendaftaran = $tugas->pendaftaran()->with("user")->first();
                $adminProdiIds = \App\Models\User::where("role", "admin_prodi")
                    ->where("prodi_id", $pendaftaran?->prodi_id)
                    ->pluck("id");
                foreach ($adminProdiIds as $adminId) {
                    \App\Models\Notification::create([
                        "user_id" => $adminId,
                        "title"   => "Pemohon Siap Sidang Pleno",
                        "message" => "Semua asesor telah menyelesaikan penilaian untuk {$pendaftaran?->user?->nama}. Silakan lakukan sidang pleno.",
                        "type"    => "info",
                        "href"    => "/admin-prodi/pleno",
                    ]);
                }
            }

            return response()->json([
                "message" => "Penilaian berhasil disubmit final. Semua asesor telah selesai.",
                "semua_selesai" => true,
                "status_alur" => $butuhAT2 ? "asesmen_tahap2" : "pleno",
            ]);
        }

        $sisaAsesor = $totalAsesor - $totalSubmit;

        return response()->json([
            "message" => "Penilaian berhasil disubmit final. Menunggu {$sisaAsesor} asesor lain menyelesaikan penilaian.",
            "semua_selesai" => false,
            "total_asesor" => $totalAsesor,
            "sudah_submit" => $totalSubmit,
            "sisa" => $sisaAsesor,
        ]);
    }

    private function lockMutableTask(
        PenugasanAsesor $tugas,
    ): PenugasanAsesor {
        $pendaftaran = $tugas->pendaftaran()
            ->lockForUpdate()
            ->firstOrFail();
        abort_unless(
            $pendaftaran->status_alur === 'pra_asesmen',
            409,
            'Tahap asesmen tidak aktif.',
        );

        $lockedTask = PenugasanAsesor::whereKey($tugas->id)
            ->lockForUpdate()
            ->firstOrFail();
        abort_if(
            $lockedTask->status === 'submit_final',
            409,
            'Penilaian sudah disubmit final dan tidak dapat diubah.',
        );

        return $lockedTask;
    }
}
