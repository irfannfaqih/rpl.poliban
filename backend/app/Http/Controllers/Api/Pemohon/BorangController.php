<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use App\Models\BorangDataDiri;
use App\Models\Dokumen;
use App\Models\EvaluasiDiri;
use App\Models\Gelombang;
use App\Models\Pendaftaran;
use App\Models\PengalamanKerja;
use App\Models\RiwayatPendidikan;
use App\Models\TranskripAsal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BorangController extends Controller
{
    /**
     * Get atau create pendaftaran aktif
     */
    public function getPendaftaran(Request $request): JsonResponse
    {
        $pendaftaran = Pendaftaran::with([
            'gelombang:id,nama', 'prodi:id,kode,nama',
            'dataDiri', 'riwayatPendidikan', 'transkripAsal',
            'pengalamanKerja', 'evaluasiDiri.cpmk', 'dokumen',
            'penugasanAsesor.asesor:id,nama',
            'jadwalAsesmen', 'skKeputusan',
        ])
        ->where('user_id', $request->user()->id)
        ->latest()
        ->first();

        return response()->json(['data' => $pendaftaran]);
    }

    /**
     * Mulai pendaftaran baru
     */
    public function startPendaftaran(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gelombang_id' => 'required|exists:gelombang,id',
            'prodi_id' => 'required|exists:prodi,id',
        ]);

        // Check gelombang masih aktif
        $gelombang = Gelombang::find($validated['gelombang_id']);
        if ($gelombang->status !== 'aktif') {
            return response()->json(['message' => 'Gelombang pendaftaran tidak aktif.'], 422);
        }

        // Check belum ada pendaftaran aktif
        $existing = Pendaftaran::where('user_id', $request->user()->id)
            ->whereNotIn('status_alur', ['finished', 'ditolak'])
            ->exists();
        if ($existing) {
            return response()->json(['message' => 'Anda masih memiliki pendaftaran aktif.'], 422);
        }

        $nomor = 'RPL-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);

        $pendaftaran = Pendaftaran::create([
            'user_id' => $request->user()->id,
            'gelombang_id' => $validated['gelombang_id'],
            'prodi_id' => $validated['prodi_id'],
            'nomor_pendaftaran' => $nomor,
            'status_alur' => 'pre_submit',
        ]);

        return response()->json(['message' => 'Pendaftaran dimulai', 'data' => $pendaftaran], 201);
    }

    // ═══ Section A: Data Diri ═══

    public function saveDataDiri(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'nik' => 'required|string|size:16',
            'tempat_lahir' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:L,P',
            'no_hp' => 'required|string|max:20',
            'alamat' => 'required|string',
            'email_pribadi' => 'required|email',
        ]);

        $dataDiri = BorangDataDiri::updateOrCreate(
            ['pendaftaran_id' => $pendaftaran->id],
            $validated
        );

        return response()->json(['message' => 'Data diri berhasil disimpan', 'data' => $dataDiri]);
    }

    // ═══ Section B: Riwayat Pendidikan ═══

    public function saveRiwayatPendidikan(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.jenjang' => 'required|string|max:50',
            'items.*.institusi' => 'required|string|max:255',
            'items.*.program_studi' => 'nullable|string|max:255',
            'items.*.tahun_masuk' => 'required|integer',
            'items.*.tahun_lulus' => 'required|integer',
        ]);

        RiwayatPendidikan::where('pendaftaran_id', $pendaftaran->id)->delete();
        foreach ($validated['items'] as $item) {
            RiwayatPendidikan::create(array_merge($item, ['pendaftaran_id' => $pendaftaran->id]));
        }

        return response()->json(['message' => 'Riwayat pendidikan berhasil disimpan']);
    }

    public function saveTranskrip(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.semester' => 'required|integer|min:1',
            'items.*.nama_mk' => 'required|string',
            'items.*.sks' => 'required|integer|min:1',
            'items.*.nilai_huruf' => 'required|string|max:2',
            'items.*.nilai_angka' => 'required|numeric|min:0|max:4',
        ]);

        TranskripAsal::where('pendaftaran_id', $pendaftaran->id)->delete();
        foreach ($validated['items'] as $item) {
            TranskripAsal::create(array_merge($item, ['pendaftaran_id' => $pendaftaran->id]));
        }

        return response()->json(['message' => 'Transkrip berhasil disimpan']);
    }

    // ═══ Section C: Pengalaman ═══

    public function savePengalaman(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.tipe' => 'required|in:kerja,pelatihan,organisasi,penghargaan',
            'items.*.nama' => 'required|string|max:255',
            'items.*.jabatan_peran' => 'nullable|string|max:255',
            'items.*.bidang' => 'nullable|string|max:100',
            'items.*.tahun_mulai' => 'required|integer',
            'items.*.tahun_selesai' => 'nullable|integer',
            'items.*.deskripsi' => 'nullable|string',
        ]);

        PengalamanKerja::where('pendaftaran_id', $pendaftaran->id)->delete();
        foreach ($validated['items'] as $item) {
            PengalamanKerja::create(array_merge($item, ['pendaftaran_id' => $pendaftaran->id]));
        }

        return response()->json(['message' => 'Pengalaman berhasil disimpan']);
    }

    // ═══ Section D: Evaluasi Diri ═══

    public function saveEvaluasiDiri(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.cpmk_id' => 'required|exists:cpmk,id',
            'items.*.profisiensi' => 'required|in:1,2,4,5',
        ]);

        foreach ($validated['items'] as $item) {
            EvaluasiDiri::updateOrCreate(
                ['pendaftaran_id' => $pendaftaran->id, 'cpmk_id' => $item['cpmk_id']],
                ['profisiensi' => $item['profisiensi']]
            );
        }

        return response()->json(['message' => 'Evaluasi diri berhasil disimpan']);
    }

    // ═══ Section E: Upload Dokumen ═══

    public function uploadDokumen(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB
            'tipe' => 'required|in:ijazah,transkrip,sertifikat,portofolio,tambahan',
            'deskripsi' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $path = $file->store("dokumen/{$pendaftaran->id}", 'public');

        $dokumen = Dokumen::create([
            'pendaftaran_id' => $pendaftaran->id,
            'tipe' => $request->tipe,
            'deskripsi' => $request->deskripsi,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json(['message' => 'Dokumen berhasil diupload', 'data' => $dokumen], 201);
    }

    public function deleteDokumen(Pendaftaran $pendaftaran, Dokumen $dokumen): JsonResponse
    {
        Storage::disk('public')->delete($dokumen->file_path);
        $dokumen->delete();

        return response()->json(['message' => 'Dokumen berhasil dihapus']);
    }

    // ═══ Submit Borang ═══

    public function submitBorang(Pendaftaran $pendaftaran): JsonResponse
    {
        $pendaftaran->update(['status_alur' => 'waiting_payment']);

        return response()->json(['message' => 'Borang berhasil disubmit. Silakan lakukan pembayaran.']);
    }
}
