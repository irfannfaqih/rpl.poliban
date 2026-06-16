<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\ArsipDokumen;
use App\Services\PrivateDocumentStorage;
use Illuminate\Http\Request;

class ArsipController extends Controller
{
    public function __construct(
        private PrivateDocumentStorage $privateStorage,
    ) {}

    /**
     * Dapatkan daftar pendaftaran yang sudah mencapai tahap pleno/finished.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $prodiId = $user->prodi_id;

        $pendaftarans = Pendaftaran::with(['user', 'prodi', 'arsip_dokumen'])
            ->whereIn('status_alur', ['pleno', 'finished'])
            ->where('prodi_id', $prodiId)
            ->paginate($request->get('per_page', 100));

        $pendaftarans->getCollection()->transform(function ($p) {
            // Menghitung jumlah dokumen yang diunggah
            $uploadedForms = $p->arsip_dokumen->pluck('kode_formulir');
            return [
                'id' => $p->id,
                'nama' => $p->user->nama,
                'nim' => 'RPL-' . date('Y') . '-' . str_pad($p->id, 3, '0', STR_PAD_LEFT), // mock NIM for now
                'status' => $p->status_alur,
                'prodi' => $p->prodi->nama,
                'uploaded_forms' => $uploadedForms,
            ];
        });

        return response()->json($pendaftarans);
    }

    /**
     * Tampilkan detail dokumen pendaftaran
     */
    public function show(Request $request, Pendaftaran $pendaftaran)
    {
        $this->authorize('view', $pendaftaran);

        $pendaftaran->load('arsip_dokumen');
        $uploadedForms = $pendaftaran->arsip_dokumen->mapWithKeys(function ($item) {
            return [$item->kode_formulir => [
                'id' => $item->id,
                'file_path' => $item->file_path,
            ]];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'pendaftaran_id' => $pendaftaran->id,
                'uploaded_forms' => $uploadedForms,
            ]
        ]);
    }

    /**
     * Upload scan dokumen (misal form yang butuh ttd basah)
     */
    public function upload(Request $request, Pendaftaran $pendaftaran)
    {
        $this->authorize('update', $pendaftaran);

        $request->validate([
            'kode_formulir' => 'required|string|max:10',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        $path = $this->privateStorage->store(
            $file,
            "arsip/{$pendaftaran->id}",
        );

        $existing = ArsipDokumen::where('pendaftaran_id', $pendaftaran->id)
            ->where('kode_formulir', $request->kode_formulir)
            ->first();

        try {
            $arsip = ArsipDokumen::updateOrCreate(
                [
                    'pendaftaran_id' => $pendaftaran->id,
                    'kode_formulir' => $request->kode_formulir,
                ],
                [
                    'file_path' => $path,
                    'uploaded_by' => $request->user()->id,
                ]
            );
        } catch (\Throwable $e) {
            $this->privateStorage->delete($path);
            throw $e;
        }

        if ($existing && $existing->file_path !== $path) {
            $this->privateStorage->delete($existing->file_path);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Dokumen berhasil diunggah.',
            'data' => $arsip
        ]);
    }

    /**
     * Download PDF untuk formulir otomatis (F01-F16)
     */
    public function downloadPdf(Request $request, Pendaftaran $pendaftaran, $kode, \App\Services\PdfService $pdfService)
    {
        $this->authorize('view', $pendaftaran);

        try {
            // Generate PDF menggunakan service
            $pdf = $pdfService->generateDocumentPdf($pendaftaran, $kode);
            
            // Format nama file
            $filename = "{$kode}_" . str_replace(' ', '_', $pendaftaran->user->nama ?? 'Pemohon') . "_{$pendaftaran->id}.pdf";
            
            // Stream file langsung ke browser
            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $filename . '"'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal generate PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
