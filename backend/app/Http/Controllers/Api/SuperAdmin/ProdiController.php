<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Prodi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProdiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Prodi::with('jurusanData')->withCount('pendaftaran');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('nama', 'like', "%{$s}%")->orWhere('kode', 'like', "%{$s}%"));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $data = $query->orderBy('kode')->paginate($request->get('per_page', 100));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode' => 'required|string|max:10|unique:prodi,kode',
            'nama' => 'required|string|max:255',
            'jenjang' => 'required|in:D3,D4',
            'jurusan' => 'sometimes|string|max:100',
            'jurusan_id' => 'required|exists:jurusan,id',
            'status' => 'sometimes|in:aktif,nonaktif',
        ]);

        $prodi = Prodi::create($validated);

        return response()->json([
            'message' => 'Prodi berhasil ditambahkan',
            'data' => $prodi,
        ], 201);
    }

    public function show(Prodi $prodi): JsonResponse
    {
        return response()->json(['data' => $prodi->load(['pendaftaran', 'jurusanData'])->loadCount('pendaftaran')]);
    }

    public function update(Request $request, Prodi $prodi): JsonResponse
    {
        $validated = $request->validate([
            'kode' => "sometimes|string|max:10|unique:prodi,kode,{$prodi->id}",
            'nama' => 'sometimes|string|max:255',
            'jenjang' => 'sometimes|in:D3,D4',
            'jurusan' => 'sometimes|string|max:100',
            'jurusan_id' => 'sometimes|exists:jurusan,id',
            'status' => 'sometimes|in:aktif,nonaktif',
        ]);

        $prodi->update($validated);

        return response()->json([
            'message' => 'Prodi berhasil diperbarui',
            'data' => $prodi->fresh(),
        ]);
    }

    public function destroy(Prodi $prodi): JsonResponse
    {
        if ($prodi->pendaftaran()->exists()) {
            return response()->json([
                'message' => 'Tidak dapat menghapus prodi yang memiliki pendaftaran.',
            ], 422);
        }

        $prodi->delete();

        return response()->json(['message' => 'Prodi berhasil dihapus']);
    }

    public function toggleStatus(Prodi $prodi): JsonResponse
    {
        $newStatus = $prodi->status === 'aktif' ? 'nonaktif' : 'aktif';
        $prodi->update(['status' => $newStatus]);

        return response()->json([
            'message' => "Status prodi diubah menjadi {$newStatus}",
            'data' => $prodi->fresh(),
        ]);
    }
}
