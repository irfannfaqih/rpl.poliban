<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\Sanggah;
use App\Models\UjianTulisJawaban;
use App\Models\UjianTulisSoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PemohonExtraController extends Controller
{
    /**
     * Jadwal asesmen pemohon
     */
    public function jadwal(Request $request): JsonResponse
    {
        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)->latest()->first();
        if (!$pendaftaran) return response()->json(['data' => null]);

        return response()->json(['data' => $pendaftaran->jadwalAsesmen()->with('creator:id,nama')->get()]);
    }

    /**
     * Soal ujian tulis untuk pemohon
     */
    public function getSoalUjian(Request $request): JsonResponse
    {
        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)->latest()->first();
        if (!$pendaftaran) return response()->json(['data' => []]);

        $soal = UjianTulisSoal::whereHas('penugasanAsesor', fn($q) => $q->where('pendaftaran_id', $pendaftaran->id))
            ->with('mataKuliah:id,kode,nama')
            ->orderBy('mata_kuliah_id')
            ->orderBy('nomor_soal')
            ->get();

        return response()->json(['data' => $soal]);
    }

    /**
     * Submit jawaban ujian
     */
    public function submitJawaban(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.ujian_tulis_soal_id' => 'required|exists:ujian_tulis_soal,id',
            'items.*.jawaban' => 'required|string',
        ]);

        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)->latest()->first();

        foreach ($validated['items'] as $item) {
            UjianTulisJawaban::updateOrCreate(
                ['ujian_tulis_soal_id' => $item['ujian_tulis_soal_id'], 'pendaftaran_id' => $pendaftaran->id],
                ['jawaban' => $item['jawaban'], 'submitted_at' => now()]
            );
        }

        return response()->json(['message' => 'Jawaban berhasil disimpan']);
    }

    /**
     * Hasil & SK
     */
    public function getHasil(Request $request): JsonResponse
    {
        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)
            ->latest()
            ->first();

        if (!$pendaftaran) return response()->json(['data' => null]);

        $pendaftaran->load([
            'plenoMk.mataKuliah:id,kode,nama,sks',
            'skKeputusan',
            'sanggah.mataKuliah:id,kode,nama',
        ]);

        return response()->json(['data' => $pendaftaran]);
    }

    /**
     * Submit sanggah
     */
    public function submitSanggah(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pendaftaran_id' => 'required|exists:pendaftaran,id',
            'mata_kuliah_id' => 'required|exists:mata_kuliah,id',
            'alasan' => 'required|string',
        ]);

        $sanggah = Sanggah::create($validated);

        return response()->json(['message' => 'Sanggah berhasil diajukan', 'data' => $sanggah], 201);
    }
}
