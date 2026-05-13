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
        $query = MataKuliah::where('prodi_id', $prodiId)->withCount('cpmk');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('nama', 'like', "%{$s}%")->orWhere('kode', 'like', "%{$s}%"));
        }

        return response()->json(['data' => $query->orderBy('kode')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:20|unique:mata_kuliah,kode',
            'nama' => 'required|string|max:255',
            'sks' => 'required|integer|min:1|max:6',
            'deskripsi' => 'nullable|string',
        ]);

        $validated['prodi_id'] = $request->user()->prodi_id;
        $mk = MataKuliah::create($validated);

        return response()->json(['message' => 'Mata kuliah berhasil ditambahkan', 'data' => $mk], 201);
    }

    public function show(MataKuliah $mataKuliah): JsonResponse
    {
        return response()->json(['data' => $mataKuliah->load('cpmk')]);
    }

    public function update(Request $request, MataKuliah $mataKuliah): JsonResponse
    {
        $validated = $request->validate([
            'kode' => "sometimes|string|max:20|unique:mata_kuliah,kode,{$mataKuliah->id}",
            'nama' => 'sometimes|string|max:255',
            'sks' => 'sometimes|integer|min:1|max:6',
            'deskripsi' => 'nullable|string',
        ]);

        $mataKuliah->update($validated);

        return response()->json(['message' => 'Mata kuliah berhasil diperbarui', 'data' => $mataKuliah->fresh()]);
    }

    public function destroy(MataKuliah $mataKuliah): JsonResponse
    {
        $mataKuliah->delete();
        return response()->json(['message' => 'Mata kuliah berhasil dihapus']);
    }

    // ═══ CPMK ═══

    public function cpmkIndex(MataKuliah $mataKuliah): JsonResponse
    {
        return response()->json(['data' => $mataKuliah->cpmk()->orderBy('kode')->get()]);
    }

    public function cpmkStore(Request $request, MataKuliah $mataKuliah): JsonResponse
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:20',
            'deskripsi' => 'required|string',
        ]);

        $cpmk = $mataKuliah->cpmk()->create($validated);

        return response()->json(['message' => 'CPMK berhasil ditambahkan', 'data' => $cpmk], 201);
    }

    public function cpmkUpdate(Request $request, MataKuliah $mataKuliah, Cpmk $cpmk): JsonResponse
    {
        $validated = $request->validate([
            'kode' => 'sometimes|string|max:20',
            'deskripsi' => 'sometimes|string',
        ]);

        $cpmk->update($validated);

        return response()->json(['message' => 'CPMK berhasil diperbarui', 'data' => $cpmk->fresh()]);
    }

    public function cpmkDestroy(MataKuliah $mataKuliah, Cpmk $cpmk): JsonResponse
    {
        $cpmk->delete();
        return response()->json(['message' => 'CPMK berhasil dihapus']);
    }
}
