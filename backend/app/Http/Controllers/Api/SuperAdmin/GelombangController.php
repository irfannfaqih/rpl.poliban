<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Gelombang;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GelombangController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Gelombang::query();

        if ($request->filled('search')) {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $data = $query->orderByDesc('created_at')->paginate($request->get('per_page', 100));

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tgl_buka' => 'required|date',
            'tgl_tutup' => 'required|date|after:tgl_buka',
            'tgl_sanggah' => 'required|date|after:tgl_tutup',
            'biaya' => 'required|numeric|min:0',
            'status' => 'required|in:aktif,draft,selesai',
        ]);

        $gelombang = Gelombang::create($validated);

        return response()->json([
            'message' => 'Gelombang berhasil ditambahkan',
            'data' => $gelombang,
        ], 201);
    }

    public function show(Gelombang $gelombang): JsonResponse
    {
        return response()->json(['data' => $gelombang]);
    }

    public function update(Request $request, Gelombang $gelombang): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'sometimes|string|max:255',
            'tgl_buka' => 'sometimes|date',
            'tgl_tutup' => 'sometimes|date',
            'tgl_sanggah' => 'sometimes|date',
            'biaya' => 'sometimes|numeric|min:0',
            'status' => 'sometimes|in:aktif,draft,selesai',
        ]);

        $gelombang->update($validated);

        return response()->json([
            'message' => 'Gelombang berhasil diperbarui',
            'data' => $gelombang->fresh(),
        ]);
    }

    public function destroy(Gelombang $gelombang): JsonResponse
    {
        if ($gelombang->pendaftaran()->exists()) {
            return response()->json([
                'message' => 'Tidak dapat menghapus gelombang yang memiliki pendaftaran.',
            ], 422);
        }

        $gelombang->delete();

        return response()->json(['message' => 'Gelombang berhasil dihapus']);
    }

    public function toggleStatus(Gelombang $gelombang): JsonResponse
    {
        $newStatus = $gelombang->status === 'aktif' ? 'draft' : 'aktif';
        $gelombang->update(['status' => $newStatus]);

        return response()->json([
            'message' => "Status gelombang diubah menjadi {$newStatus}",
            'data' => $gelombang->fresh(),
        ]);
    }
}
