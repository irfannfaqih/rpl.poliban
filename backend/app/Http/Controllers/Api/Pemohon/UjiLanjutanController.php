<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Pendaftaran;
use App\Models\PenugasanAsesor;
use App\Models\UjiLanjutan;
use App\Models\UjiLanjutanItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UjiLanjutanController extends Controller
{
    // ─── Get AT2 pemohon ──────────────────────────────────────────────────────

    public function getUjiLanjutan(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $pendaftaran = Pendaftaran::where("user_id", $userId)
            ->where("status_alur", "asesmen_tahap2")
            ->first();

        if (!$pendaftaran) {
            return response()->json(["message" => "Tidak ada ujian lanjutan aktif"], 404);
        }

        $ujiLanjutan = UjiLanjutan::select([
            'id',
            'pendaftaran_id',
            'status',
            'fase_tulis',
            'tanggal_ujian',
            'waktu_ujian',
            'durasi_menit',
            'tempat',
            'link_meeting',
            'nilai_at2_final',
            'konfirmasi_kehadiran',
            'konfirmasi_at',
            'ujian_dimulai_at',
            'reschedule_status',
            'reschedule_alasan',
            'reschedule_catatan',
            'reschedule_count',
        ])->with([
            "items" => function ($q) {
                // Hanya C3 yang dijawab online
                $q->select([
                    'id',
                    'uji_lanjutan_id',
                    'mata_kuliah_id',
                    'tipe',
                    'pertanyaan_instruksi',
                    'kunci_jawaban',
                    'jawaban_pemohon',
                    'submitted_at',
                ])->where("tipe", "c3")->with("mataKuliah:id,kode,nama");
            },
        ])
            ->where("pendaftaran_id", $pendaftaran->id)
            ->whereIn("fase_tulis", ["menunggu_jawaban", "koreksi", "selesai", "tidak_hadir"])
            ->first();

        if (!$ujiLanjutan) {
            return response()->json(["message" => "Instrumen belum diterbitkan."], 404);
        }

        $windowInfo = $this->hitungWindowPengerjaan($ujiLanjutan);

        // Guard keamanan: soal hanya tampil saat dalam window (ujian sudah dimulai asesor)
        if ($ujiLanjutan->fase_tulis === "menunggu_jawaban" && $windowInfo["dalam_window"] !== true) {
            $ujiLanjutan->items->each(function ($item) {
                $item->makeHidden(["pertanyaan_instruksi", "kunci_jawaban", "jawaban_pemohon"]);
            });
        } elseif ($ujiLanjutan->fase_tulis !== "selesai") {
            $ujiLanjutan->items->makeHidden(["kunci_jawaban"]);
        }

        return response()->json([
            "data" => array_merge($ujiLanjutan->toArray(), $windowInfo),
        ]);
    }

    // ─── Hitung window — sekarang berbasis ujian_dimulai_at ──────────────────

    private function hitungWindowPengerjaan(UjiLanjutan $uji): array
    {
        // Window dihitung dari saat asesor klik "Mulai Ujian", bukan dari jadwal
        if (!$uji->ujian_dimulai_at || !$uji->durasi_menit) {
            return [
                "window_mulai"   => null,
                "window_selesai" => null,
                "dalam_window"   => null,
            ];
        }

        $mulai   = $uji->ujian_dimulai_at;
        $selesai = $mulai->copy()->addMinutes($uji->durasi_menit);

        return [
            "window_mulai"   => $mulai->toIso8601String(),
            "window_selesai" => $selesai->toIso8601String(),
            "dalam_window"   => now()->gte($mulai) && now()->lte($selesai),
        ];
    }

    // ─── Submit Jawaban ───────────────────────────────────────────────────────

    public function submitJawaban(Request $request, $id): JsonResponse
    {
        $userId = $request->user()->id;

        // Guard ownership
        $ujiLanjutan = UjiLanjutan::where("id", $id)
            ->where("fase_tulis", "menunggu_jawaban")
            ->whereHas("pendaftaran", fn($q) => $q->where("user_id", $userId))
            ->firstOrFail();

        $validated = $request->validate([
            "jawaban" => "required|array",
            "jawaban.*.id" => [
                "required",
                "distinct",
                Rule::exists("uji_lanjutan_item", "id")->where(
                    fn ($query) => $query
                        ->where("uji_lanjutan_id", $ujiLanjutan->id)
                        ->where("tipe", "c3"),
                ),
            ],
            "jawaban.*.jawaban_pemohon" => "required|string",
        ]);

        DB::transaction(function () use ($ujiLanjutan, $validated, $userId) {
            [$pendaftaran, $locked] = $this->lockActiveUjian(
                $ujiLanjutan->id,
                $userId,
            );
            abort_unless(
                $locked->fase_tulis === "menunggu_jawaban",
                409,
                "Jawaban sudah dikirim atau sesi tidak lagi aktif.",
            );
            abort_unless(
                $this->hitungWindowPengerjaan($locked)["dalam_window"] === true,
                409,
                "Waktu pengerjaan belum dimulai atau sudah berakhir.",
            );

            $lockedItems = $locked->items()
                ->where("tipe", "c3")
                ->lockForUpdate()
                ->get([
                    'id',
                    'uji_lanjutan_id',
                    'tipe',
                    'pertanyaan_instruksi',
                    'created_at',
                ]);
            $expectedIds = $lockedItems
                ->pluck("id")
                ->sort()
                ->values();
            $submittedIds = collect($validated["jawaban"])
                ->pluck("id")
                ->sort()
                ->values();
            abort_if(
                $expectedIds->isEmpty()
                    || $expectedIds->all() !== $submittedIds->all(),
                422,
                "Semua soal tertulis harus dijawab sebelum dikirim.",
            );

            $submittedAt = now();
            $itemsById = $lockedItems->keyBy('id');
            DB::table('uji_lanjutan_item')->upsert(
                collect($validated['jawaban'])->map(function ($jawaban) use (
                    $itemsById,
                    $submittedAt,
                ) {
                    $item = $itemsById->get($jawaban['id']);

                    return [
                        'id' => $item->id,
                        'uji_lanjutan_id' => $item->uji_lanjutan_id,
                        'tipe' => $item->tipe,
                        'pertanyaan_instruksi' => $item->pertanyaan_instruksi,
                        'jawaban_pemohon' => $jawaban['jawaban_pemohon'],
                        'submitted_at' => $submittedAt,
                        'created_at' => $item->created_at,
                        'updated_at' => $submittedAt,
                    ];
                })->all(),
                ['id'],
                ['jawaban_pemohon', 'submitted_at', 'updated_at'],
            );
            $locked->update(["fase_tulis" => "koreksi"]);
        });

        return response()->json(["message" => "Jawaban berhasil dikirim"]);
    }

    // ─── Save Draft Jawaban (auto-save, tidak final) ──────────────────────────
    // Menyimpan jawaban sementara ke database tanpa mengubah fase_tulis.
    // Digunakan oleh auto-save setiap 30 detik sebagai backup recovery.

    public function saveDraftJawaban(Request $request, $id): JsonResponse
    {
        $userId = $request->user()->id;

        $ujiLanjutan = UjiLanjutan::where("id", $id)
            ->where("fase_tulis", "menunggu_jawaban")
            ->whereHas("pendaftaran", fn($q) => $q->where("user_id", $userId))
            ->firstOrFail();

        $validated = $request->validate([
            "jawaban" => "required|array",
            "jawaban.*.id" => [
                "required",
                "distinct",
                Rule::exists("uji_lanjutan_item", "id")->where(
                    fn ($query) => $query
                        ->where("uji_lanjutan_id", $ujiLanjutan->id)
                        ->where("tipe", "c3"),
                ),
            ],
            "jawaban.*.jawaban_pemohon" => "nullable|string",
        ]);

        DB::transaction(function () use ($ujiLanjutan, $validated, $userId) {
            [, $locked] = $this->lockActiveUjian(
                $ujiLanjutan->id,
                $userId,
            );
            abort_unless(
                $locked->fase_tulis === 'menunggu_jawaban',
                409,
                'Draft tidak dapat disimpan karena sesi sudah berubah.',
            );
            abort_unless(
                $this->hitungWindowPengerjaan($locked)["dalam_window"] === true,
                409,
                "Di luar waktu pengerjaan.",
            );

            $lockedItems = $locked->items()
                ->where('tipe', 'c3')
                ->lockForUpdate()
                ->get([
                    'id',
                    'uji_lanjutan_id',
                    'tipe',
                    'pertanyaan_instruksi',
                    'created_at',
                ]);
            $allowedIds = $lockedItems->pluck('id');
            abort_if(
                collect($validated['jawaban'])
                    ->pluck('id')
                    ->diff($allowedIds)
                    ->isNotEmpty(),
                422,
                'Jawaban memuat instrumen yang tidak valid.',
            );

            $savedAt = now();
            $itemsById = $lockedItems->keyBy('id');
            DB::table('uji_lanjutan_item')->upsert(
                collect($validated['jawaban'])->map(function ($jawaban) use (
                    $itemsById,
                    $savedAt,
                ) {
                    $item = $itemsById->get($jawaban['id']);

                    return [
                        'id' => $item->id,
                        'uji_lanjutan_id' => $item->uji_lanjutan_id,
                        'tipe' => $item->tipe,
                        'pertanyaan_instruksi' => $item->pertanyaan_instruksi,
                        'jawaban_pemohon' => $jawaban['jawaban_pemohon'] ?? '',
                        'created_at' => $item->created_at,
                        'updated_at' => $savedAt,
                    ];
                })->all(),
                ['id'],
                ['jawaban_pemohon', 'updated_at'],
            );
        });

        return response()->json(["message" => "Draft jawaban tersimpan", "saved_at" => now()->toIso8601String()]);
    }

    // ─── Konfirmasi Kehadiran ─────────────────────────────────────────────────

    public function konfirmasiKehadiran(Request $request, $id): JsonResponse
    {
        $userId = $request->user()->id;

        $ujiLanjutan = UjiLanjutan::where("id", $id)
            ->whereHas("pendaftaran", fn($q) => $q->where("user_id", $userId))
            ->firstOrFail();

        $ujiLanjutan = DB::transaction(function () use (
            $ujiLanjutan,
            $userId,
        ) {
            [, $locked] = $this->lockActiveUjian(
                $ujiLanjutan->id,
                $userId,
            );
            abort_unless($locked->tanggal_ujian, 422, 'Jadwal belum ditetapkan.');
            abort_if(
                in_array($locked->fase_tulis, ["selesai", "tidak_hadir"], true),
                409,
                'AT2 sudah selesai atau pemohon dinyatakan tidak hadir.',
            );
            abort_if(
                $locked->konfirmasi_kehadiran,
                409,
                'Kehadiran sudah dikonfirmasi sebelumnya.',
            );
            $locked->update([
                "konfirmasi_kehadiran" => true,
                "konfirmasi_at" => now(),
            ]);

            return $locked->fresh();
        });

        $asesorIds = PenugasanAsesor::where("pendaftaran_id", $ujiLanjutan->pendaftaran_id)
            ->pluck("asesor_id");

        foreach ($asesorIds as $asesorId) {
            Notification::create([
                "user_id" => $asesorId,
                "title"   => "Pemohon Konfirmasi Kehadiran AT2",
                "message" => "Pemohon telah mengkonfirmasi kehadiran untuk Asesmen Tahap 2.",
                "type"    => "info",
                "href"    => "/asesor/asesmen-tahap-2",
            ]);
        }

        return response()->json([
            "message" => "Kehadiran berhasil dikonfirmasi.",
            "data"    => $ujiLanjutan->fresh(),
        ]);
    }

    // ─── Ajukan Reschedule ────────────────────────────────────────────────────

    public function ajukanReschedule(Request $request, $id): JsonResponse
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            "alasan" => "required|string|min:20|max:1000",
        ]);

        $ujiLanjutan = UjiLanjutan::where("id", $id)
            ->whereHas("pendaftaran", fn($q) => $q->where("user_id", $userId))
            ->firstOrFail();

        $ujiLanjutan = DB::transaction(function () use (
            $ujiLanjutan,
            $validated,
            $userId,
        ) {
            [, $locked] = $this->lockActiveUjian(
                $ujiLanjutan->id,
                $userId,
            );
            abort_unless(
                $locked->fase_tulis === "menunggu_jawaban",
                409,
                "Reschedule hanya bisa diajukan sebelum ujian dimulai.",
            );
            abort_if(
                $locked->reschedule_count >= 1,
                409,
                "Anda hanya dapat mengajukan reschedule satu kali.",
            );
            abort_if(
                $locked->reschedule_status === "diajukan",
                409,
                "Permohonan reschedule sedang dalam review.",
            );
            abort_if(
                $locked->ujian_dimulai_at,
                409,
                "Ujian sudah dimulai, tidak bisa mengajukan reschedule.",
            );

            if ($locked->tanggal_ujian) {
                $hariIni = now('Asia/Makassar')->startOfDay();
                $tglUjian = $locked->tanggal_ujian->copy()->startOfDay();
                abort_if(
                    $hariIni->diffInDays($tglUjian, false) < 1,
                    422,
                    "Reschedule hanya bisa diajukan minimal 1 hari sebelum tanggal ujian.",
                );
            }

            $locked->update([
                "reschedule_status" => "diajukan",
                "reschedule_alasan" => $validated["alasan"],
                "reschedule_catatan" => null,
            ]);

            return $locked->fresh();
        });

        // Notifikasi ke Admin Prodi (semua admin prodi di prodi ini)
        $pendaftaran = $ujiLanjutan->pendaftaran()->with("user", "prodi")->first();

        // Cari admin prodi yang terkait dengan prodi pendaftaran ini
        $adminProdiIds = \App\Models\User::where("role", "admin_prodi")
            ->where("prodi_id", $pendaftaran->prodi_id)
            ->pluck("id");

        foreach ($adminProdiIds as $adminId) {
            Notification::create([
                "user_id" => $adminId,
                "title"   => "Permohonan Reschedule AT2",
                "message" => "{$pendaftaran->user->nama} mengajukan perubahan jadwal Asesmen Tahap 2. Tinjau di halaman pendaftaran.",
                "type"    => "warning",
                "href"    => "/admin-prodi/pendaftaran/{$pendaftaran->id}",
            ]);
        }

        return response()->json([
            "message" => "Permohonan reschedule berhasil diajukan. Menunggu persetujuan Admin Prodi.",
        ]);
    }

    private function lockActiveUjian(int $ujiId, int $userId): array
    {
        $uji = UjiLanjutan::whereKey($ujiId)->firstOrFail();
        $pendaftaran = Pendaftaran::whereKey($uji->pendaftaran_id)
            ->where('user_id', $userId)
            ->lockForUpdate()
            ->firstOrFail();
        abort_unless(
            $pendaftaran->status_alur === 'asesmen_tahap2',
            409,
            'Pendaftaran tidak lagi berada pada tahap AT2.',
        );

        $locked = UjiLanjutan::whereKey($ujiId)
            ->where('pendaftaran_id', $pendaftaran->id)
            ->lockForUpdate()
            ->firstOrFail();

        return [$pendaftaran, $locked];
    }
}
