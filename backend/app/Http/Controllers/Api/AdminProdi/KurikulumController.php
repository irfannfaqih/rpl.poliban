<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\Cpmk;
use App\Models\MataKuliah;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KurikulumController extends Controller
{
    // ═══ Mata Kuliah ═══

    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;
        $query = MataKuliah::where("prodi_id", $prodiId)
            ->with(["matriksAsesmen"])
            ->withCount("cpmk");

        if ($request->filled("search")) {
            $s = $request->search;
            $query->where(
                fn($q) => $q
                    ->where("nama", "like", "%{$s}%")
                    ->orWhere("kode", "like", "%{$s}%"),
            );
        }

        $data = $query->orderBy("kode")->paginate($request->get('per_page', 100));
        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;
        $validated = $request->validate([
            // Unique kode sekarang per prodi (bukan global)
            "kode" => "required|string|max:20|unique:mata_kuliah,kode,NULL,id,prodi_id,{$prodiId}",
            "nama" => "required|string|max:255",
            "sks" => "required|integer|min:1|max:6",
            "semester" => "nullable|integer|min:1|max:8",
            "level_kkni" => "nullable|integer|min:1|max:9",
            "deskripsi" => "nullable|string",
            "cp_sikap" => "nullable|string",
            "cp_pengetahuan" => "nullable|string",
            "cp_keterampilan" => "nullable|string",
            "indikator_kinerja" => "nullable|string",
            "profil_lulusan" => "nullable|string",
        ]);

        $validated["prodi_id"] = $prodiId;
        $mk = MataKuliah::create($validated);

        return response()->json(
            ["message" => "Mata kuliah berhasil ditambahkan", "data" => $mk],
            201,
        );
    }

    public function show(Request $request, MataKuliah $mataKuliah): JsonResponse
    {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        return response()->json(["data" => $mataKuliah->load("cpmk")]);
    }

    public function update(
        Request $request,
        MataKuliah $mataKuliah,
    ): JsonResponse {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if ($this->referencedByPublishedSk($mataKuliah)) {
            return response()->json([
                "message" => "Mata kuliah yang tercantum pada SK terbit tidak dapat diubah.",
            ], 409);
        }
        $validated = $request->validate([
            "kode" => "sometimes|string|max:20|unique:mata_kuliah,kode,{$mataKuliah->id}",
            "nama" => "sometimes|string|max:255",
            "sks" => "sometimes|integer|min:1|max:6",
            "deskripsi" => "nullable|string",
        ]);

        $mataKuliah->update($validated);

        return response()->json([
            "message" => "Mata kuliah berhasil diperbarui",
            "data" => $mataKuliah->fresh(),
        ]);
    }

    public function destroy(
        Request $request,
        MataKuliah $mataKuliah,
    ): JsonResponse {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if ($this->referencedByPublishedSk($mataKuliah)) {
            return response()->json([
                "message" => "Mata kuliah yang tercantum pada SK terbit tidak dapat dihapus.",
            ], 409);
        }
        $mataKuliah->delete();
        return response()->json(["message" => "Mata kuliah berhasil dihapus"]);
    }

    private function referencedByPublishedSk(MataKuliah $mataKuliah): bool
    {
        return \App\Models\PlenoMk::where(
            'mata_kuliah_id',
            $mataKuliah->id,
        )->whereHas(
            'pendaftaran.skKeputusan',
            fn ($query) => $query->where('status', 'sk_terbit'),
        )->exists();
    }

    // ═══ CPMK ═══

    public function cpmkIndex(
        Request $request,
        MataKuliah $mataKuliah,
    ): JsonResponse {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        $data = $mataKuliah->cpmk()->orderBy("kode")->paginate($request->get('per_page', 100));
        return response()->json($data);
    }

    public function cpmkStore(
        Request $request,
        MataKuliah $mataKuliah,
    ): JsonResponse {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        $validated = $request->validate([
            "kode" => "required|string|max:20",
            "deskripsi" => "required|string",
        ]);

        $cpmk = $mataKuliah->cpmk()->create($validated);

        return response()->json(
            ["message" => "CPMK berhasil ditambahkan", "data" => $cpmk],
            201,
        );
    }

    public function cpmkUpdate(
        Request $request,
        MataKuliah $mataKuliah,
        Cpmk $cpmk,
    ): JsonResponse {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if ($cpmk->mata_kuliah_id != $mataKuliah->id) {
            return response()->json(
                ["message" => "CPMK tidak sesuai dengan Mata Kuliah."],
                422,
            );
        }
        $validated = $request->validate([
            "kode" => "sometimes|string|max:20",
            "deskripsi" => "sometimes|string",
        ]);

        $cpmk->update($validated);

        return response()->json([
            "message" => "CPMK berhasil diperbarui",
            "data" => $cpmk->fresh(),
        ]);
    }

    public function cpmkDestroy(
        Request $request,
        MataKuliah $mataKuliah,
        Cpmk $cpmk,
    ): JsonResponse {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        if ($cpmk->mata_kuliah_id != $mataKuliah->id) {
            return response()->json(
                ["message" => "CPMK tidak sesuai dengan Mata Kuliah."],
                422,
            );
        }
        $cpmk->delete();
        return response()->json(["message" => "CPMK berhasil dihapus"]);
    }

    // ═══ Toggle Active ═══

    public function toggleActive(
        Request $request,
        MataKuliah $mataKuliah,
    ): JsonResponse {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        $mataKuliah->update(["is_active" => !$mataKuliah->is_active]);
        $status = $mataKuliah->is_active ? "diaktifkan" : "dinonaktifkan";
        return response()->json([
            "message" => "Mata kuliah berhasil {$status}",
            "data" => $mataKuliah->fresh(),
        ]);
    }

    // ═══ Matriks Asesmen ═══

    public function saveMatriks(
        Request $request,
        MataKuliah $mataKuliah,
    ): JsonResponse {
        if ($mataKuliah->prodi_id != $request->user()->prodi_id) {
            return response()->json(["message" => "Akses ditolak."], 403);
        }
        $validated = $request->validate([
            "c1" => "boolean",
            "c2" => "boolean",
            "c3" => "boolean",
            "c4" => "boolean",
            "c5" => "boolean",
            "c6" => "boolean",
            "c7" => "boolean",
            "c8" => "boolean",
            "c9" => "boolean",
            "c10" => "boolean",
            "c11" => "boolean",
        ]);

        $matriks = $mataKuliah
            ->matriksAsesmen()
            ->updateOrCreate(["mata_kuliah_id" => $mataKuliah->id], $validated);

        return response()->json([
            "message" => "Matriks Asesmen berhasil disimpan",
            "data" => $matriks,
        ]);
    }
}
