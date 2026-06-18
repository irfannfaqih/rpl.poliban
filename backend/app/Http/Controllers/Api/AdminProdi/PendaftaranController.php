<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\PenugasanAsesor;
use App\Models\User;
use App\Models\VerifikasiBerkas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PendaftaranController extends Controller
{
    /**
     * List pendaftaran di prodi admin yang login
     */
    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;

        $query = Pendaftaran::with([
            "user:id,nama,email,instansi",
            "gelombang:id,nama",
            "penugasanAsesor.asesor:id,nama",
            "riwayatPendidikan:id,pendaftaran_id,institusi,jenjang,program_studi",
            "pengalamanKerja:id,pendaftaran_id,nama,tipe",
        ])->where("prodi_id", $prodiId);

        if ($request->filled("status")) {
            $query->where("status_alur", $request->status);
        }
        if ($request->filled("search")) {
            $s = $request->search;
            $query->where(
                fn($q) => $q
                    ->where("nomor_pendaftaran", "like", "%{$s}%")
                    ->orWhereHas(
                        "user",
                        fn($u) => $u->where("nama", "like", "%{$s}%"),
                    ),
            );
        }

        $data = $query->orderByDesc("created_at")->paginate($request->get('per_page', 100));

        return response()->json($data);
    }

    /**
     * Detail pendaftaran lengkap
     */
    public function show(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('view', $pendaftaran);
        $pendaftaran->load([
            "user:id,nama,email,phone",
            "gelombang:id,nama",
            "dataDiri",
            "riwayatPendidikan",
            "transkripAsal",
            "pengalamanKerja",
            "evaluasiDiri.cpmk.mataKuliah",
            "dokumen",
            "penugasanAsesor.asesor:id,nama",
            "penugasanAsesor.pemetaanMk.mkPoliban",
            "verifikasiBerkas",
            "jadwalAsesmen",
        ]);

        return response()->json(["data" => $pendaftaran]);
    }

    /**
     * Verifikasi berkas pendaftaran
     */
    public function verifikasi(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $validated = $request->validate([
            "items" => "required|array|min:1",
            "items.*.kode_dokumen" => "required|string|max:30",
            "items.*.status" => "required|in:valid,invalid",
            "items.*.catatan" => "nullable|string",
            // Pra-pemetaan opsional dari Admin Prodi sebagai saran ke Asesor (PRD Bab 4.3 Halaman 2.3)
            "pra_pemetaan_payload" => "nullable|array",
        ]);

        $isSubmitting = $request->boolean("submit");
        $submittedItems = collect($validated["items"]);
        $requiredDocumentCodes = collect([
            "form01",
            "form02",
            "form16",
            "ijazah",
            "transkrip",
        ]);
        $submittedCodes = $submittedItems
            ->pluck("kode_dokumen")
            ->unique();
        $allRequiredSubmitted = $requiredDocumentCodes
            ->diff($submittedCodes)
            ->isEmpty();
        $allValid = $submittedItems
            ->every(fn (array $item) => $item["status"] === "valid");

        if ($isSubmitting && (! $allRequiredSubmitted || ! $allValid)) {
            return response()->json([
                "message" => "Seluruh dokumen wajib harus dikirim dan berstatus valid sebelum verifikasi disubmit.",
            ], 422);
        }

        DB::transaction(function () use (
            $request,
            $pendaftaran,
            $validated,
            $isSubmitting,
        ) {
            $locked = Pendaftaran::whereKey($pendaftaran->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $locked->status_alur === "waiting_verification",
                409,
                "Pendaftaran tidak berada pada tahap verifikasi berkas.",
            );

            foreach ($validated["items"] as $item) {
                VerifikasiBerkas::updateOrCreate(
                    [
                        "pendaftaran_id" => $locked->id,
                        "kode_dokumen" => $item["kode_dokumen"],
                    ],
                    [
                        "status" => $item["status"],
                        "catatan" => $item["catatan"] ?? null,
                        "verified_by" => $request->user()->id,
                    ],
                );
            }

            if (array_key_exists("pra_pemetaan_payload", $validated)) {
                $locked->pra_pemetaan_payload =
                    $validated["pra_pemetaan_payload"];
            }

            if ($isSubmitting) {
                $locked->status_alur = "pra_asesmen";
            }
            $locked->save();
        });

        if ($isSubmitting) {

            \App\Models\Notification::create([
                "user_id" => $pendaftaran->user_id,
                "title" => "Berkas Berhasil Diverifikasi",
                "message" =>
                    "Semua dokumen Anda telah diverifikasi oleh Admin Prodi. Pendaftaran Anda kini berada di tahap Pra-Asesmen.",
                "type" => "status",
                "href" => "/pemohon/dashboard",
            ]);

            // Kirim email pemberitahuan berkas valid
            $pendaftaran->load("user", "prodi");
            if ($pendaftaran->user && $pendaftaran->user->email) {
                try {
                    \Illuminate\Support\Facades\Mail::to(
                        $pendaftaran->user->email,
                    )->queue(new \App\Mail\VerifikasiBerhasilMail($pendaftaran));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning(
                        "Gagal kirim VerifikasiBerhasilMail: " .
                            $e->getMessage(),
                    );
                }
            }
        }

        return response()->json([
            "message" => "Verifikasi berkas berhasil disimpan",
            "data" => VerifikasiBerkas::where(
                "pendaftaran_id",
                $pendaftaran->id,
            )->get(),
        ]);
    }

    /**
     * Assign asesor ke pendaftaran
     */
    public function assignAsesor(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $validated = $request->validate([
            "asesor_1_id" => [
                "required",
                Rule::exists("users", "id")->where(
                    fn ($query) => $query
                        ->where("role", "asesor")
                        ->where("status", "aktif")
                        ->where("prodi_id", $pendaftaran->prodi_id),
                ),
            ],
            "asesor_2_id" => [
                "required",
                "different:asesor_1_id",
                Rule::exists("users", "id")->where(
                    fn ($query) => $query
                        ->where("role", "asesor")
                        ->where("status", "aktif")
                        ->where("prodi_id", $pendaftaran->prodi_id),
                ),
            ],
        ]);

        // Validasi bahwa user adalah asesor
        foreach (["asesor_1_id", "asesor_2_id"] as $field) {
            $user = User::find($validated[$field]);
            if (!$user || $user->role !== "asesor") {
                return response()->json(
                    ["message" => "User {$validated[$field]} bukan asesor."],
                    422,
                );
            }
        }

        DB::transaction(function () use ($pendaftaran, $validated) {
            $locked = Pendaftaran::whereKey($pendaftaran->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $locked->status_alur === 'pra_asesmen',
                409,
                'Asesor hanya dapat ditugaskan pada tahap pra asesmen.',
            );
            abort_if(
                $locked->skKeputusan()->exists() ||
                $locked->penugasanAsesor()
                    ->where('status', 'submit_final')
                    ->exists(),
                409,
                'Penugasan asesor tidak dapat diubah setelah asesmen difinalisasi.',
            );

            PenugasanAsesor::updateOrCreate(
                ["pendaftaran_id" => $pendaftaran->id, "urutan" => "asesor_1"],
                ["asesor_id" => $validated["asesor_1_id"]],
            );
            PenugasanAsesor::updateOrCreate(
                ["pendaftaran_id" => $pendaftaran->id, "urutan" => "asesor_2"],
                ["asesor_id" => $validated["asesor_2_id"]],
            );
        });

        // Kirim email ke kedua asesor
        $pendaftaran->load("user", "prodi");
        foreach (
            [$validated["asesor_1_id"], $validated["asesor_2_id"]]
            as $asesorId
        ) {
            $asesorUser = User::find($asesorId);
            if ($asesorUser && $asesorUser->email) {
                try {
                    \Illuminate\Support\Facades\Mail::to(
                        $asesorUser->email,
                    )->queue(
                        new \App\Mail\PenugasanAsesorMail(
                            $asesorUser,
                            $pendaftaran,
                        ),
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning(
                        "Gagal kirim PenugasanAsesorMail: " . $e->getMessage(),
                    );
                }
            }
        }

        return response()->json([
            "message" => "Asesor berhasil ditugaskan",
            "data" => $pendaftaran
                ->fresh()
                ->load("penugasanAsesor.asesor:id,nama"),
        ]);
    }

    /**
     * Update status alur pendaftaran
     */
    public function updateStatus(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $validated = $request->validate([
            "status_alur" =>
                "required|in:pre_submit,ditolak",
            "catatan_admin" => "nullable|string",
        ]);

        DB::transaction(function () use ($pendaftaran, $validated) {
            $locked = Pendaftaran::whereKey($pendaftaran->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $locked->canTransitionTo($validated["status_alur"]),
                409,
                "Perubahan status tidak diizinkan dari tahap saat ini.",
            );
            $locked->update($validated);
        });

        // Jika di-reset ke pra_asesmen → reset record pra_asesmen lama agar asesor bisa submit ulang
        if ($validated["status_alur"] === "pre_submit") {
            $pendaftaran->load("user");

            // Kirim notifikasi in-app ke pemohon
            \App\Models\Notification::create([
                "user_id" => $pendaftaran->user_id,
                "title" => "Berkas Dikembalikan untuk Diperbaiki",
                "message" => $validated["catatan_admin"]
                    ?? "Terdapat berkas yang perlu diperbaiki. Silakan periksa catatan admin dan lengkapi ulang dokumen Anda.",
                "type" => "warning",
                "href" => "/pemohon/borang",
            ]);

            if ($pendaftaran->user && $pendaftaran->user->email) {
                \Illuminate\Support\Facades\Mail::to(
                    $pendaftaran->user->email,
                )->queue(
                    new \App\Mail\VerifikasiBerkasMail(
                        $pendaftaran,
                        $validated["catatan_admin"] ??
                            "Silakan lengkapi dokumen Anda kembali.",
                    ),
                );
            }
        }

        return response()->json([
            "message" => "Status pendaftaran diperbarui",
            "data" => $pendaftaran->fresh(),
        ]);
    }

    /**
     * Buka gembok form pendaftaran (kembalikan ke pre_submit)
     */
    public function unlock(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        DB::transaction(function () use ($pendaftaran) {
            $locked = Pendaftaran::whereKey($pendaftaran->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $locked->status_alur !== 'pre_submit'
                    && $locked->canTransitionTo('pre_submit'),
                409,
                'Pendaftaran tidak dapat dibuka kembali pada tahap saat ini.',
            );
            abort_if(
                $locked->skKeputusan()->exists() ||
                $locked->penugasanAsesor()
                    ->where('status', 'submit_final')
                    ->exists(),
                409,
                'Pendaftaran final tidak dapat dibuka kembali.',
            );
            $locked->update(['status_alur' => 'pre_submit']);
        });

        return response()->json([
            "message" => "Gembok form berhasil dibuka",
            "data" => $pendaftaran->fresh(),
        ]);
    }

    /**
     * List active asesors for the admin's program study
     */
    public function listAsesor(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;
        $asesors = User::where("role", "asesor")
            ->where("status", "aktif")
            ->where("prodi_id", $prodiId)
            ->select("id", "nama", "email", "nip")
            ->paginate($request->get('per_page', 100));

        return response()->json($asesors);
    }
    /**
     * Export data pendaftaran ke excel
     */
    public function exportExcel(Request $request)
    {
        $prodiId = $request->user()->prodi_id;
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\PendaftarExport($prodiId),
            "Data_Pendaftar_RPL.xlsx",
        );
    }
}
