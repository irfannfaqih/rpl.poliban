<?php

namespace App\Http\Controllers\Api\Asesor;

use App\Http\Controllers\Controller;
use App\Models\Sanggah;
use App\Models\PlenoMk;
use App\Models\Pendaftaran;
use App\Models\SkKeputusan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SanggahController extends Controller
{
    private function isAssignedToPendaftaran(int $pendaftaranId, int $asesorId): bool
    {
        return Pendaftaran::whereKey($pendaftaranId)
            ->whereHas(
                'penugasanAsesor',
                fn ($query) => $query->where('asesor_id', $asesorId),
            )
            ->exists();
    }

    /**
     * List sanggah untuk pendaftaran yang ditangani asesor login.
     */
    public function index(Request $request): JsonResponse
    {
        $asesorId = $request->user()->id;

        $data = Sanggah::with([
            "pendaftaran.user:id,nama",
            "mataKuliah:id,kode,nama,sks",
        ])
            ->whereHas(
                "pendaftaran.penugasanAsesor",
                fn ($query) => $query->where("asesor_id", $asesorId),
            )
            ->orderByDesc("created_at")
            ->paginate($request->get('per_page', 100));

        return response()->json($data);
    }

    /**
     * Putuskan sanggah
     */
    public function update(Request $request, Sanggah $sanggah): JsonResponse
    {
        $asesorId = $request->user()->id;
        if (! $this->isAssignedToPendaftaran($sanggah->pendaftaran_id, $asesorId)) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }

        $sanggah->loadMissing('pendaftaran.skKeputusan');
        if (
            $sanggah->pendaftaran->status_alur !== 'finished' ||
            $sanggah->pendaftaran->skKeputusan?->status !== 'menunggu_sk'
        ) {
            return response()->json([
                "message" => "Sanggahan tidak dapat diproses pada tahap ini.",
            ], 409);
        }

        $validated = $request->validate([
            "status" => "required|in:diterima,ditolak",
            "respon_asesor" => "required|string",
            "nilai_mutu_baru" =>
                "required_if:status,diterima|nullable|in:A,AB,B,BC,C,T",
        ]);

        // First decision wins: keputusan pertama mengunci sanggah untuk semua asesor.
        if ($sanggah->status !== 'diajukan' || $sanggah->diputus_at !== null) {
            return response()->json(
                [
                    "message" =>
                        "Sanggahan ini sudah diputus dan tidak bisa diubah.",
                ],
                409,
            );
        }

        DB::transaction(function () use ($sanggah, $validated, $asesorId) {
            $pendaftaran = Pendaftaran::whereKey($sanggah->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $pendaftaran->penugasanAsesor()
                    ->where('asesor_id', $asesorId)
                    ->exists(),
                403,
                'Akses ditolak.',
            );
            abort_unless(
                $pendaftaran->status_alur === 'finished',
                409,
                'Tahap sanggah sudah berakhir.',
            );
            $sk = SkKeputusan::where(
                "pendaftaran_id",
                $pendaftaran->id,
            )->lockForUpdate()->first();
            abort_unless(
                $sk?->status === 'menunggu_sk',
                409,
                "SK sudah diterbitkan atau tidak tersedia.",
            );
            $locked = Sanggah::whereKey($sanggah->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $locked->status === 'diajukan' && $locked->diputus_at === null,
                409,
                "Sanggahan ini sudah diputus dan tidak bisa diubah.",
            );
            $locked->update([
                "status" => $validated["status"],
                "respon_asesor" => $validated["respon_asesor"],
                "diputus_at" => now(),
            ]);

            if ($validated["status"] === "diterima") {
                $plenoMk = PlenoMk::where(
                    "pendaftaran_id",
                    $locked->pendaftaran_id,
                )->where(
                    "mata_kuliah_id",
                    $locked->mata_kuliah_id,
                )->lockForUpdate()->firstOrFail();
                $plenoMk->update([
                    "keputusan_final" => $validated["nilai_mutu_baru"],
                    "catatan_pleno" =>
                        "Diterima melalui Sanggahan: ".
                        $validated["respon_asesor"],
                ]);

                if ($sk) {
                    $totalSksDiakui = PlenoMk::where(
                    "pendaftaran_id",
                    $locked->pendaftaran_id,
                )
                    ->where("keputusan_final", "!=", "T")
                    ->whereNotNull("keputusan_final")
                    ->join(
                        "mata_kuliah",
                        "pleno_mk.mata_kuliah_id",
                        "=",
                        "mata_kuliah.id",
                    )
                    ->sum("mata_kuliah.sks");

                    $sk->update(["total_sks_diakui" => $totalSksDiakui]);
                }
            }
        });

        return response()->json([
            "message" => "Sanggahan berhasil diproses.",
            "data" => $sanggah->load("mataKuliah"),
        ]);
    }
}
