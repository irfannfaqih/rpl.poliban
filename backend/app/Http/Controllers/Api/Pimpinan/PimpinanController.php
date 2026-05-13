<?php

namespace App\Http\Controllers\Api\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\SkKeputusan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PimpinanController extends Controller
{
    /**
     * Dashboard summary
     */
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_pendaftaran' => Pendaftaran::count(),
                'menunggu_pleno' => Pendaftaran::where('status_alur', 'pleno')->count(),
                'menunggu_sk' => SkKeputusan::where('status', 'menunggu_sk')->count(),
                'sk_terbit' => SkKeputusan::where('status', 'sk_terbit')->count(),
                'ditolak' => Pendaftaran::where('status_alur', 'ditolak')->count(),
            ],
        ]);
    }

    /**
     * List SK untuk ditandatangani
     */
    public function listSk(Request $request): JsonResponse
    {
        $query = SkKeputusan::with(['pendaftaran.user:id,nama', 'pendaftaran.prodi:id,kode,nama', 'penerbit:id,nama']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(['data' => $query->orderByDesc('created_at')->get()]);
    }

    /**
     * Terbitkan SK
     */
    public function terbitkanSk(Request $request, SkKeputusan $sk): JsonResponse
    {
        $validated = $request->validate([
            'nomor_sk' => 'required|string|max:50',
        ]);

        $sk->update([
            'status' => 'sk_terbit',
            'nomor_sk' => $validated['nomor_sk'],
            'tanggal_terbit' => now()->toDateString(),
            'diterbitkan_oleh' => $request->user()->id,
        ]);

        // Update pendaftaran status
        $sk->pendaftaran->update(['status_alur' => 'finished']);

        return response()->json(['message' => 'SK berhasil diterbitkan', 'data' => $sk->fresh()->load('pendaftaran.user:id,nama')]);
    }
}
