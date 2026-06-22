<?php

namespace App\Http\Controllers\Api\Asesor;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Pendaftaran;
use App\Models\PenugasanAsesor;
use App\Models\UjiLanjutan;
use App\Models\UjiLanjutanCatatanAsesor;
use App\Models\UjiLanjutanItem;
use App\Models\UjiLanjutanPenilaian;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UjiLanjutanController extends Controller
{
    // ─── Helper ───────────────────────────────────────────────────────────────

    private function getAsesorTugas(int $pendaftaranId, int $asesorId): ?PenugasanAsesor
    {
        return PenugasanAsesor::where('pendaftaran_id', $pendaftaranId)
            ->where('asesor_id', $asesorId)
            ->first();
    }

    private function isReadableAt2(Pendaftaran $pendaftaran): bool
    {
        if ($pendaftaran->status_alur === 'asesmen_tahap2') {
            return true;
        }

        return in_array(
            $pendaftaran->ujiLanjutan?->fase_tulis,
            ['selesai', 'tidak_hadir'],
            true,
        );
    }

    // ─── Index ────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $asesorId = $request->user()->id;

        $pendaftarans = Pendaftaran::with([
            "user:id,nama",
            "prodi:id,nama",
            "ujiLanjutan" => fn($q) => $q->with([
                "catatanAsesor" => fn($q2) => $q2->where("asesor_id", $asesorId)
            ]),
        ])
            ->where(function ($query) {
                $query->where("status_alur", "asesmen_tahap2")
                    ->orWhereHas("ujiLanjutan", fn($uji) => $uji->whereIn(
                        "fase_tulis",
                        ["selesai", "tidak_hadir"],
                    ));
            })
            ->whereHas("penugasanAsesor", fn($q) => $q->where("asesor_id", $asesorId))
            ->paginate($request->get('per_page', 100));

        return response()->json($pendaftarans);
    }

    // ─── Show ─────────────────────────────────────────────────────────────────

    public function show(Request $request, $id): JsonResponse
    {
        $asesorId = $request->user()->id;

        if (!$this->getAsesorTugas((int) $id, $asesorId)) {
            return response()->json(["message" => "Anda tidak ditugaskan untuk pendaftaran ini."], 403);
        }

        $pendaftaran = Pendaftaran::with("ujiLanjutan")->findOrFail($id);
        abort_unless(
            $this->isReadableAt2($pendaftaran),
            409,
            'Pendaftaran tidak berada pada tahap AT2.',
        );

        $ujiLanjutan = $pendaftaran->ujiLanjutan;
        if (!$ujiLanjutan && $pendaftaran->status_alur === 'asesmen_tahap2') {
            $ujiLanjutan = UjiLanjutan::firstOrCreate(
                ["pendaftaran_id" => $id],
                [
                    "status"     => "menjadwalkan",
                    "fase_tulis" => "buat_soal",
                    "dibuat_oleh" => $asesorId,
                    "updated_by"  => $asesorId,
                ]
            );
        }
        abort_unless($ujiLanjutan, 404, 'Data AT2 belum tersedia.');

        $ujiLanjutan->load([
            "pendaftaran.user:id,nama",
            "pendaftaran.prodi:id,nama",
            "pendaftaran.prodi.mataKuliah:id,prodi_id,kode,nama",
            "dijadwalkanOleh:id,nama",
            "items.mataKuliah:id,kode,nama",
            "items.penilaian" => fn($q) => $q->where("asesor_id", $asesorId),
        ]);

        $catatanAsesor = UjiLanjutanCatatanAsesor::where("uji_lanjutan_id", $ujiLanjutan->id)
            ->where("asesor_id", $asesorId)
            ->first();

        return response()->json([
            "data" => array_merge($ujiLanjutan->toArray(), [
                "catatan_asesor_saya" => $catatanAsesor,
            ]),
        ]);
    }

    // ─── Save Items (instrumen) ───────────────────────────────────────────────
    // Catatan: durasi_menit sekarang diset oleh Admin Prodi, bukan asesor

    public function copySources(Request $request, $id): JsonResponse
    {
        $asesorId = $request->user()->id;

        if (!$this->getAsesorTugas((int) $id, $asesorId)) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }

        $target = Pendaftaran::findOrFail($id);

        $sources = UjiLanjutan::with([
            'pendaftaran.user:id,nama',
            'items.mataKuliah:id,kode,nama',
        ])
            ->where('pendaftaran_id', '!=', $target->id)
            ->whereHas('pendaftaran', function ($query) use ($target, $asesorId) {
                $query->where('prodi_id', $target->prodi_id)
                    ->whereHas('penugasanAsesor', fn ($q) => $q->where('asesor_id', $asesorId));
            })
            ->whereHas('items', fn ($query) => $query->whereNotNull('mata_kuliah_id'))
            ->latest('instrumen_updated_at')
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(function (UjiLanjutan $uji) {
                $mkGroups = $uji->items
                    ->filter(fn (UjiLanjutanItem $item) => $item->mata_kuliah_id !== null)
                    ->groupBy('mata_kuliah_id')
                    ->map(function ($items) {
                        $first = $items->first();

                        return [
                            'mata_kuliah_id' => $first->mata_kuliah_id,
                            'kode' => $first->mataKuliah?->kode,
                            'nama' => $first->mataKuliah?->nama,
                            'jumlah_instrumen' => $items->count(),
                        ];
                    })
                    ->values();

                return [
                    'id' => $uji->id,
                    'pendaftaran_id' => $uji->pendaftaran_id,
                    'pemohon_nama' => $uji->pendaftaran?->user?->nama,
                    'fase_tulis' => $uji->fase_tulis,
                    'instrumen_updated_at' => $uji->instrumen_updated_at,
                    'updated_at' => $uji->updated_at,
                    'jumlah_instrumen' => $uji->items->count(),
                    'mata_kuliah' => $mkGroups,
                ];
            })
            ->filter(fn (array $source) => $source['mata_kuliah']->isNotEmpty())
            ->values();

        return response()->json(['data' => $sources]);
    }

    public function copyItems(Request $request, $id): JsonResponse
    {
        $asesorId = $request->user()->id;

        if (!$this->getAsesorTugas((int) $id, $asesorId)) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }

        $target = Pendaftaran::findOrFail($id);

        $validated = $request->validate([
            'source_uji_lanjutan_id' => [
                'required',
                'integer',
                Rule::exists('uji_lanjutan', 'id'),
            ],
            'mata_kuliah_ids' => 'nullable|array',
            'mata_kuliah_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('mata_kuliah', 'id')->where(
                    fn ($query) => $query->where('prodi_id', $target->prodi_id),
                ),
            ],
        ]);

        $result = DB::transaction(function () use ($validated, $target, $asesorId) {
            $lockedPendaftaran = Pendaftaran::whereKey($target->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $lockedPendaftaran->status_alur === 'asesmen_tahap2',
                409,
                'Instrumen hanya dapat disalin pada tahap AT2.',
            );

            $targetUji = UjiLanjutan::firstOrCreate(
                ['pendaftaran_id' => $lockedPendaftaran->id],
                [
                    'status' => 'menjadwalkan',
                    'fase_tulis' => 'buat_soal',
                    'dibuat_oleh' => $asesorId,
                    'updated_by' => $asesorId,
                ],
            );
            $lockedTargetUji = UjiLanjutan::whereKey($targetUji->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_if(
                $lockedTargetUji->ujian_dimulai_at,
                409,
                'Instrumen tidak dapat disalin setelah ujian dimulai.',
            );
            abort_unless(
                $lockedTargetUji->fase_tulis === 'buat_soal',
                409,
                'Instrumen hanya dapat disalin sebelum diterbitkan.',
            );
            abort_if(
                (int) $lockedTargetUji->id === (int) $validated['source_uji_lanjutan_id'],
                422,
                'Sumber salinan tidak boleh sama dengan AT2 saat ini.',
            );

            $source = UjiLanjutan::with('pendaftaran')
                ->whereKey($validated['source_uji_lanjutan_id'])
                ->whereHas('pendaftaran', function ($query) use ($lockedPendaftaran, $asesorId) {
                    $query->where('prodi_id', $lockedPendaftaran->prodi_id)
                        ->whereHas('penugasanAsesor', fn ($q) => $q->where('asesor_id', $asesorId));
                })
                ->firstOrFail();

            $sourceItems = UjiLanjutanItem::where('uji_lanjutan_id', $source->id)
                ->whereNotNull('mata_kuliah_id')
                ->whereHas('mataKuliah', fn ($query) => $query->where('prodi_id', $lockedPendaftaran->prodi_id));

            if (! empty($validated['mata_kuliah_ids'])) {
                $sourceItems->whereIn('mata_kuliah_id', $validated['mata_kuliah_ids']);
            }

            $items = $sourceItems->get();
            abort_if($items->isEmpty(), 422, 'Tidak ada instrumen yang dapat disalin dari sumber tersebut.');

            foreach ($items as $item) {
                UjiLanjutanItem::create([
                    'uji_lanjutan_id' => $lockedTargetUji->id,
                    'tipe' => $item->tipe,
                    'mata_kuliah_id' => $item->mata_kuliah_id,
                    'pertanyaan_instruksi' => $item->pertanyaan_instruksi,
                    'kunci_jawaban' => $item->kunci_jawaban,
                ]);
            }

            $lockedTargetUji->update([
                'updated_by' => $asesorId,
                'instrumen_updated_at' => now(),
            ]);

            return [
                'copied_count' => $items->count(),
                'items' => $lockedTargetUji->items()
                    ->with('mataKuliah:id,kode,nama')
                    ->get(),
            ];
        });

        return response()->json([
            'message' => "{$result['copied_count']} instrumen berhasil disalin.",
            'data' => $result,
        ]);
    }

    public function saveItems(Request $request, $id): JsonResponse
    {
        $asesorId = $request->user()->id;

        if (!$this->getAsesorTugas((int) $id, $asesorId)) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }

        $validated = $request->validate([
            "items"                        => "required|array",
            "items.*.id"                   => [
                "nullable",
                "distinct",
                Rule::exists("uji_lanjutan_item", "id")->where(
                    fn ($query) => $query->where(
                        "uji_lanjutan_id",
                        UjiLanjutan::where("pendaftaran_id", $id)->value("id"),
                    ),
                ),
            ],
            "items.*.tipe"                 => "required|string|max:50",
            "items.*.mata_kuliah_id"       => [
                "nullable",
                Rule::exists("mata_kuliah", "id")->where(
                    fn ($query) => $query->where(
                        "prodi_id",
                        Pendaftaran::whereKey($id)->value("prodi_id"),
                    ),
                ),
            ],
            "items.*.pertanyaan_instruksi"  => "required|string",
            "items.*.kunci_jawaban"        => "nullable|string",
            "deleted_item_ids"              => "nullable|array",
            "deleted_item_ids.*"            => [
                "integer",
                "distinct",
                Rule::exists("uji_lanjutan_item", "id")->where(
                    fn ($query) => $query->where(
                        "uji_lanjutan_id",
                        UjiLanjutan::where("pendaftaran_id", $id)->value("id"),
                    ),
                ),
            ],
        ]);

        $ujiLanjutan = UjiLanjutan::where("pendaftaran_id", $id)->firstOrFail();

        DB::transaction(function () use ($validated, $ujiLanjutan, $asesorId) {
            $pendaftaran = Pendaftaran::whereKey($ujiLanjutan->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $pendaftaran->status_alur === 'asesmen_tahap2',
                409,
                'Pendaftaran tidak berada pada tahap AT2.',
            );
            $locked = UjiLanjutan::whereKey($ujiLanjutan->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                ! $locked->ujian_dimulai_at,
                409,
                'Instrumen tidak dapat diubah setelah ujian dimulai.',
            );
            foreach ($validated["items"] as $item) {
                if (isset($item["id"])) {
                    $ujiItem = UjiLanjutanItem::where(
                        "uji_lanjutan_id",
                        $locked->id,
                    )->where("id", $item["id"])->firstOrFail();
                    $ujiItem->update($item);
                } else {
                    $item["uji_lanjutan_id"] = $locked->id;
                    UjiLanjutanItem::create($item);
                }
            }

            if (! empty($validated["deleted_item_ids"])) {
                UjiLanjutanItem::where("uji_lanjutan_id", $locked->id)
                    ->whereIn("id", $validated["deleted_item_ids"])
                    ->delete();
            }
            $locked->update([
                "updated_by" => $asesorId,
                "instrumen_updated_at" => now(),
            ]);
        });

        return response()->json([
            "message" => "Instrumen berhasil disimpan",
            "data"    => $ujiLanjutan->items()->with("mataKuliah:id,kode,nama")->get(),
        ]);
    }

    // ─── Publish Soal ─────────────────────────────────────────────────────────

    public function publishSoal(Request $request, $id): JsonResponse
    {
        $asesorId = $request->user()->id;

        if (!$this->getAsesorTugas((int) $id, $asesorId)) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }

        $ujiLanjutan = UjiLanjutan::where("pendaftaran_id", $id)->firstOrFail();

        // Validasi: harus ada minimal 1 instrumen
        if ($ujiLanjutan->items()->count() === 0) {
            return response()->json(["message" => "Minimal satu instrumen harus ditambahkan sebelum diterbitkan."], 422);
        }

        // Validasi: jadwal harus sudah diset oleh Admin Prodi
        if (!$ujiLanjutan->tanggal_ujian || !$ujiLanjutan->waktu_ujian) {
            return response()->json(["message" => "Jadwal AT2 belum ditetapkan oleh Admin Prodi. Instrumen belum bisa diterbitkan."], 422);
        }

        // Validasi: jika ada C3, durasi wajib ada (diset admin)
        $hasC3 = $ujiLanjutan->items()->where("tipe", "c3")->exists();
        if ($hasC3 && !$ujiLanjutan->durasi_menit) {
            return response()->json(["message" => "Durasi pengerjaan belum ditetapkan oleh Admin Prodi. Instrumen C3 belum bisa diterbitkan."], 422);
        }

        // C3 → menunggu_jawaban (pemohon jawab online setelah asesor klik mulai)
        // C1/C4/Cn → koreksi (langsung bisa dinilai setelah asesor klik mulai)
        DB::transaction(function () use ($ujiLanjutan) {
            $pendaftaran = Pendaftaran::whereKey($ujiLanjutan->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($pendaftaran->status_alur === 'asesmen_tahap2', 409);
            $locked = UjiLanjutan::whereKey($ujiLanjutan->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($locked->fase_tulis === 'buat_soal', 409);
            abort_if($locked->items()->count() === 0, 422);
            abort_unless($locked->tanggal_ujian && $locked->waktu_ujian, 422);
            $hasC3 = $locked->items()->where('tipe', 'c3')->exists();
            abort_if($hasC3 && ! $locked->durasi_menit, 422);
            $locked->update([
                "fase_tulis" => $hasC3 ? "menunggu_jawaban" : "koreksi",
                "status" => "menunggu_ujian",
            ]);
        });

        $pendaftaran = Pendaftaran::with("user")->find($id);

        Notification::create([
            "user_id" => $pendaftaran->user_id,
            "title"   => "Instrumen Asesmen Tahap 2 Tersedia",
            "message" => "Instrumen AT2 telah disiapkan oleh Asesor. Hadir sesuai jadwal yang telah ditetapkan.",
            "type"    => "info",
            "href"    => "/pemohon/asesmen-tahap-2",
        ]);

        return response()->json([
            "message" => "Instrumen berhasil diterbitkan",
            "data"    => $ujiLanjutan->fresh(),
        ]);
    }

    // ─── Mulai Ujian (hanya untuk C3) ─────────────────────────────────────────

    public function mulaiUjian(Request $request, $id): JsonResponse
    {
        $asesorId = $request->user()->id;

        if (!$this->getAsesorTugas((int) $id, $asesorId)) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }

        $ujiLanjutan = UjiLanjutan::where("pendaftaran_id", $id)->firstOrFail();

        // Guard: hanya bisa mulai jika fase menunggu_jawaban
        if ($ujiLanjutan->fase_tulis !== "menunggu_jawaban") {
            return response()->json(["message" => "Ujian hanya bisa dimulai pada fase menunggu jawaban (C3)."], 422);
        }

        // Guard: tidak bisa mulai dua kali
        if ($ujiLanjutan->ujian_dimulai_at) {
            return response()->json(["message" => "Ujian sudah dimulai sebelumnya."], 422);
        }

        // Guard: harus ada instrumen C3
        if (!$ujiLanjutan->items()->where("tipe", "c3")->exists()) {
            return response()->json(["message" => "Tidak ada soal tertulis (C3) untuk dimulai."], 422);
        }

        DB::transaction(function () use ($ujiLanjutan, $asesorId) {
            $pendaftaran = Pendaftaran::whereKey($ujiLanjutan->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($pendaftaran->status_alur === 'asesmen_tahap2', 409);
            $locked = UjiLanjutan::whereKey($ujiLanjutan->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $locked->fase_tulis === 'menunggu_jawaban' &&
                ! $locked->ujian_dimulai_at &&
                $locked->items()->where('tipe', 'c3')->exists(),
                409,
            );
            $locked->update([
                "ujian_dimulai_at" => now(),
                "updated_by" => $asesorId,
            ]);
        });

        // Notifikasi real-time ke pemohon
        $pendaftaran = Pendaftaran::with("user")->find($id);
        Notification::create([
            "user_id" => $pendaftaran->user_id,
            "title"   => "Ujian Tertulis Dimulai",
            "message" => "Asesor telah memulai ujian tertulis AT2 Anda. Buka halaman AT2 sekarang untuk mulai mengerjakan soal.",
            "type"    => "info",
            "href"    => "/pemohon/asesmen-tahap-2",
        ]);

        return response()->json([
            "message"          => "Ujian berhasil dimulai. Pemohon dapat mengerjakan soal sekarang.",
            "ujian_dimulai_at" => $ujiLanjutan->fresh()->ujian_dimulai_at,
        ]);
    }

    // ─── Tandai Tidak Hadir ───────────────────────────────────────────────────

    public function tidakHadir(Request $request, $id): JsonResponse
    {
        $asesorId = $request->user()->id;

        if (!$this->getAsesorTugas((int) $id, $asesorId)) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }

        $ujiLanjutan = UjiLanjutan::where("pendaftaran_id", $id)->firstOrFail();

        // Guard: hanya bisa tandai tidak hadir jika ujian belum dimulai
        if ($ujiLanjutan->ujian_dimulai_at) {
            return response()->json(["message" => "Tidak bisa menandai tidak hadir setelah ujian dimulai."], 422);
        }

        // Guard: fase harus menunggu_jawaban atau koreksi
        if (!in_array($ujiLanjutan->fase_tulis, ["menunggu_jawaban", "koreksi"])) {
            return response()->json(["message" => "Status ujian tidak memungkinkan penandaan tidak hadir."], 422);
        }

        DB::transaction(function () use ($ujiLanjutan, $asesorId) {
            $pendaftaran = Pendaftaran::whereKey($ujiLanjutan->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($pendaftaran->status_alur === 'asesmen_tahap2', 409);
            $locked = UjiLanjutan::whereKey($ujiLanjutan->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                in_array($locked->fase_tulis, ['menunggu_jawaban', 'koreksi'], true) &&
                ! $locked->ujian_dimulai_at,
                409,
            );
            $locked->update([
                "fase_tulis" => "tidak_hadir",
                "status" => "selesai",
                "nilai_at2_final" => 0,
                "updated_by" => $asesorId,
            ]);
            abort_unless($pendaftaran->canTransitionTo('pleno'), 409);
            $pendaftaran->update(['status_alur' => 'pleno']);
        });

        $pendaftaran = Pendaftaran::with("user")->find($id);
        Notification::create([
            "user_id" => $pendaftaran->user_id,
            "title"   => "AT2: Anda Tercatat Tidak Hadir",
            "message" => "Anda tercatat tidak hadir pada jadwal Asesmen Tahap 2. Jika ada kendala, segera hubungi Admin Prodi.",
            "type"    => "warning",
            "href"    => "/pemohon/asesmen-tahap-2",
        ]);

        return response()->json(["message" => "Pemohon berhasil ditandai tidak hadir. Nilai AT2 = 0."]);
    }

    // ─── Submit Nilai (per asesor, blind review) ──────────────────────────────

    public function submitNilai(Request $request, $id): JsonResponse
    {
        $asesorId = $request->user()->id;

        if (!$this->getAsesorTugas((int) $id, $asesorId)) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }

        $ujiLanjutan = UjiLanjutan::where("pendaftaran_id", $id)->firstOrFail();

        $validated = $request->validate([
            "items"         => "required|array",
            "items.*.id"    => [
                "required",
                "distinct",
                Rule::exists("uji_lanjutan_item", "id")->where(
                    fn ($query) => $query->where(
                        "uji_lanjutan_id",
                        $ujiLanjutan->id,
                    ),
                ),
            ],
            "items.*.skor"  => "required|integer|min:1|max:5",
            "catatan_akhir" => "nullable|string",
        ]);

        $expectedIds = $ujiLanjutan->items()->pluck('id')->sort()->values();
        $submittedIds = collect($validated["items"])
            ->pluck('id')
            ->sort()
            ->values();
        if ($expectedIds->isEmpty() || $expectedIds->all() !== $submittedIds->all()) {
            return response()->json([
                "message" => "Semua instrumen AT2 harus dinilai tepat satu kali.",
            ], 422);
        }

        [$nilaiAkhir, $semuaSelesai, $nilaiGabungan] = DB::transaction(
            function () use ($ujiLanjutan, $validated, $asesorId) {
                $pendaftaran = Pendaftaran::whereKey(
                    $ujiLanjutan->pendaftaran_id,
                )->lockForUpdate()->firstOrFail();
                abort_unless(
                    $pendaftaran->status_alur === 'asesmen_tahap2',
                    409,
                    'Pendaftaran tidak berada pada tahap AT2.',
                );
                $locked = UjiLanjutan::whereKey($ujiLanjutan->id)
                    ->lockForUpdate()
                    ->firstOrFail();
                abort_unless(
                    $locked->fase_tulis === "koreksi",
                    409,
                    "Penilaian AT2 hanya dapat dilakukan pada fase koreksi.",
                );

                foreach ($validated["items"] as $item) {
                    UjiLanjutanPenilaian::updateOrCreate(
                        [
                            "uji_lanjutan_item_id" => $item["id"],
                            "asesor_id" => $asesorId,
                        ],
                        ["skor" => $item["skor"]],
                    );
                }

                $skorList = UjiLanjutanPenilaian::where(
                    "asesor_id",
                    $asesorId,
                )
                    ->whereHas(
                        "item",
                        fn ($query) => $query->where(
                            "uji_lanjutan_id",
                            $locked->id,
                        ),
                    )
                    ->pluck("skor");
                $nilaiAkhir = round(
                    ($skorList->sum() / $skorList->count()) * 20,
                    2,
                );

                UjiLanjutanCatatanAsesor::updateOrCreate(
                    [
                        "uji_lanjutan_id" => $locked->id,
                        "asesor_id" => $asesorId,
                    ],
                    [
                        "catatan_akhir" =>
                            $validated["catatan_akhir"] ?? null,
                        "nilai_akhir" => $nilaiAkhir,
                        "is_submitted" => true,
                    ],
                );

                $semuaAsesorIds = PenugasanAsesor::where(
                    "pendaftaran_id",
                    $locked->pendaftaran_id,
                )->pluck("asesor_id");
                $sudahSubmitIds = UjiLanjutanCatatanAsesor::where(
                    "uji_lanjutan_id",
                    $locked->id,
                )->where("is_submitted", true)->pluck("asesor_id");
                $semuaSelesai = $semuaAsesorIds->isNotEmpty() &&
                    $semuaAsesorIds->diff($sudahSubmitIds)->isEmpty();
                $nilaiGabungan = null;

                if ($semuaSelesai) {
                    $nilaiGabungan = round(
                        UjiLanjutanCatatanAsesor::where(
                            "uji_lanjutan_id",
                            $locked->id,
                        )->where("is_submitted", true)->avg("nilai_akhir"),
                        2,
                    );
                    $locked->update([
                        "status" => "selesai",
                        "fase_tulis" => "selesai",
                        "nilai_at2_final" => $nilaiGabungan,
                    ]);
                    abort_unless($pendaftaran->canTransitionTo('pleno'), 409);
                    $pendaftaran->update(["status_alur" => "pleno"]);
                }

                return [$nilaiAkhir, $semuaSelesai, $nilaiGabungan];
            },
        );

        if ($semuaSelesai) {
            $pendaftaran = Pendaftaran::with("user")->find(
                $ujiLanjutan->pendaftaran_id,
            );

            // Notifikasi ke Admin Prodi
            $adminProdiIds = \App\Models\User::where("role", "admin_prodi")
                ->where("prodi_id", $pendaftaran->prodi_id)
                ->pluck("id");
            foreach ($adminProdiIds as $adminId) {
                Notification::create([
                    "user_id" => $adminId,
                    "title"   => "AT2 Selesai - Siap Sidang Pleno",
                    "message" => "Asesmen Tahap 2 untuk {$pendaftaran->user->nama} telah selesai dinilai. Silakan lakukan sidang pleno.",
                    "type"    => "info",
                    "href"    => "/admin-prodi/pleno",
                ]);
            }

            // Notifikasi ke pemohon
            Notification::create([
                "user_id" => $pendaftaran->user_id,
                "title"   => "Asesmen Tahap 2 Selesai",
                "message" => "Penilaian Asesmen Tahap 2 Anda telah selesai. Proses selanjutnya adalah Sidang Pleno oleh Admin Prodi.",
                "type"    => "info",
                "href"    => "/pemohon/dashboard",
            ]);

            return response()->json([
                "message"         => "Penilaian Anda tersimpan. Semua asesor telah selesai.",
                "semua_selesai"   => true,
                "nilai_akhir"     => $nilaiAkhir,
                "nilai_at2_final" => $nilaiGabungan,
            ]);
        }

        return response()->json([
            "message"       => "Penilaian Anda tersimpan. Menunggu asesor lain menyelesaikan penilaian.",
            "semua_selesai" => false,
            "nilai_akhir"   => $nilaiAkhir,
        ]);
    }
}
