<?php

namespace App\Http\Controllers\Api\Asesor;

use App\Http\Controllers\Controller;
use App\Models\EvaluasiPortofolio;
use App\Models\PemetaanMk;
use App\Models\PenilaianCpmk;
use App\Models\PenugasanAsesor;
use App\Models\PraAsesmen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    // ═══ Pra-Asesmen (Form 02) ═══

    public function savePraAsesmen(Request $request, PenugasanAsesor $tugas): JsonResponse
    {
        $validated = $request->validate([
            'langkah_1' => 'boolean', 'langkah_2' => 'boolean', 'langkah_3' => 'boolean', 'langkah_4' => 'boolean',
            'langkah_5' => 'boolean', 'langkah_6' => 'boolean', 'langkah_7' => 'boolean', 'langkah_8' => 'boolean',
            'catatan_observasi' => 'nullable|string',
            'kebutuhan_khusus' => 'nullable|string',
            'rekomendasi' => 'nullable|in:lanjut_penuh,lanjut_catatan,tidak_memenuhi',
            'catatan_rekomendasi' => 'nullable|string',
            'is_submitted' => 'boolean',
        ]);

        $pra = PraAsesmen::updateOrCreate(
            ['penugasan_asesor_id' => $tugas->id],
            $validated
        );

        return response()->json(['message' => 'Pra-Asesmen berhasil disimpan', 'data' => $pra]);
    }

    // ═══ Evaluasi Portofolio (Form 04) ═══

    public function saveEvaluasiPortofolio(Request $request, PenugasanAsesor $tugas): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.kategori_no' => 'required|integer|min:1|max:10',
            'items.*.status_dokumen' => 'nullable|in:ada,tidak_ada',
            'items.*.kesesuaian' => 'nullable|in:sesuai,tidak_sesuai',
            'items.*.rekomendasi_at2' => 'nullable|string',
        ]);

        foreach ($validated['items'] as $item) {
            EvaluasiPortofolio::updateOrCreate(
                ['penugasan_asesor_id' => $tugas->id, 'kategori_no' => $item['kategori_no']],
                collect($item)->except('kategori_no')->toArray()
            );
        }

        return response()->json([
            'message' => 'Evaluasi portofolio berhasil disimpan',
            'data' => EvaluasiPortofolio::where('penugasan_asesor_id', $tugas->id)->get(),
        ]);
    }

    // ═══ Penilaian CPMK (Form 05) ═══

    public function savePenilaianCpmk(Request $request, PenugasanAsesor $tugas): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.cpmk_id' => 'required|exists:cpmk,id',
            'items.*.nilai' => 'nullable|in:K,CK,C,M',
            'items.*.catatan' => 'nullable|string',
        ]);

        foreach ($validated['items'] as $item) {
            PenilaianCpmk::updateOrCreate(
                ['penugasan_asesor_id' => $tugas->id, 'cpmk_id' => $item['cpmk_id']],
                ['nilai' => $item['nilai'] ?? null, 'catatan' => $item['catatan'] ?? null]
            );
        }

        return response()->json([
            'message' => 'Penilaian CPMK berhasil disimpan',
            'data' => PenilaianCpmk::where('penugasan_asesor_id', $tugas->id)->with('cpmk')->get(),
        ]);
    }

    // ═══ Pemetaan MK (Form 12) ═══

    public function savePemetaanMk(Request $request, PenugasanAsesor $tugas): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.mk_asal_kode' => 'required|string|max:20',
            'items.*.mk_asal_nama' => 'required|string|max:255',
            'items.*.mk_poliban_id' => 'required|exists:mata_kuliah,id',
            'items.*.kesenjangan' => 'nullable|in:sesuai,sebagian_sesuai,tidak_sesuai',
            'items.*.keputusan' => 'nullable|in:diakui_penuh,diakui_sebagian,tidak_diakui',
            'items.*.catatan' => 'nullable|string',
        ]);

        // Replace all mappings
        PemetaanMk::where('penugasan_asesor_id', $tugas->id)->delete();
        foreach ($validated['items'] as $item) {
            PemetaanMk::create(array_merge($item, ['penugasan_asesor_id' => $tugas->id]));
        }

        return response()->json([
            'message' => 'Pemetaan MK berhasil disimpan',
            'data' => PemetaanMk::where('penugasan_asesor_id', $tugas->id)->with('mkPoliban')->get(),
        ]);
    }

    // ═══ Submit Final ═══

    public function submitFinal(PenugasanAsesor $tugas): JsonResponse
    {
        $tugas->update(['status' => 'submit_final']);

        return response()->json(['message' => 'Penilaian telah disubmit final']);
    }
}
