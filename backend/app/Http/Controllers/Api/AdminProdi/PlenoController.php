<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\PlenoMk;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlenoController extends Controller
{
    /**
     * List semua pleno MK per pendaftaran di prodi admin
     */
    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;

        $query = Pendaftaran::with([
            'user:id,nama',
            'plenoMk.mataKuliah:id,kode,nama,sks',
        ])
        ->where('prodi_id', $prodiId)
        ->where('status_alur', 'pleno');

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Detail pleno per pendaftaran
     */
    public function show(Pendaftaran $pendaftaran): JsonResponse
    {
        $pendaftaran->load([
            'user:id,nama',
            'plenoMk.mataKuliah:id,kode,nama,sks',
            'penugasanAsesor.asesor:id,nama',
        ]);

        return response()->json(['data' => $pendaftaran]);
    }

    /**
     * Simpan/update keputusan final pleno per MK
     */
    public function updateKeputusan(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.mata_kuliah_id' => 'required|exists:mata_kuliah,id',
            'items.*.keputusan_final' => 'required|string|max:2',
            'items.*.catatan_pleno' => 'nullable|string',
        ]);

        foreach ($validated['items'] as $item) {
            PlenoMk::where('pendaftaran_id', $pendaftaran->id)
                ->where('mata_kuliah_id', $item['mata_kuliah_id'])
                ->update([
                    'keputusan_final' => $item['keputusan_final'],
                    'catatan_pleno' => $item['catatan_pleno'] ?? null,
                    'disahkan_oleh' => $request->user()->id,
                    'disahkan_at' => now(),
                ]);
        }

        return response()->json([
            'message' => 'Keputusan pleno berhasil disimpan',
            'data' => $pendaftaran->fresh()->load('plenoMk.mataKuliah:id,kode,nama'),
        ]);
    }

    /**
     * Finalisasi pleno → set status ke finished
     */
    public function finalize(Pendaftaran $pendaftaran): JsonResponse
    {
        $pendaftaran->update(['status_alur' => 'finished']);

        return response()->json(['message' => 'Pleno telah difinalisasi, pendaftaran selesai.']);
    }
}
