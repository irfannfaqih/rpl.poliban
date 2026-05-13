<?php

namespace App\Http\Controllers\Api\Asesor;

use App\Http\Controllers\Controller;
use App\Models\PenugasanAsesor;
use App\Models\UjianTulisSoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UjianController extends Controller
{
    public function index(PenugasanAsesor $tugas): JsonResponse
    {
        return response()->json([
            'data' => UjianTulisSoal::where('penugasan_asesor_id', $tugas->id)
                ->with('mataKuliah:id,kode,nama')
                ->orderBy('mata_kuliah_id')
                ->orderBy('nomor_soal')
                ->get(),
        ]);
    }

    public function store(Request $request, PenugasanAsesor $tugas): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.mata_kuliah_id' => 'required|exists:mata_kuliah,id',
            'items.*.nomor_soal' => 'required|integer|min:1',
            'items.*.pertanyaan' => 'required|string',
        ]);

        // Replace all soal for this tugas
        UjianTulisSoal::where('penugasan_asesor_id', $tugas->id)->delete();
        foreach ($validated['items'] as $item) {
            UjianTulisSoal::create(array_merge($item, ['penugasan_asesor_id' => $tugas->id]));
        }

        return response()->json([
            'message' => 'Soal ujian berhasil disimpan',
            'data' => UjianTulisSoal::where('penugasan_asesor_id', $tugas->id)->get(),
        ]);
    }
}
