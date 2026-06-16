<?php

namespace App\Http\Controllers\Api\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\SkKeputusan;
use App\Services\SkDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PimpinanController extends Controller
{
    public function __construct(
        private SkDocumentService $skDocumentService,
    ) {}

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

        $data = $query->orderByDesc('created_at')->paginate($request->get('per_page', 100));

        return response()->json($data);
    }

    /**
     * Terbitkan SK + generate QR Code verifikasi
     */
    public function terbitkanSk(Request $request, SkKeputusan $sk): JsonResponse
    {
        $validated = $request->validate([
            'nomor_sk' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sk_keputusan', 'nomor_sk')->ignore($sk->id),
            ],
        ]);

        try {
            $this->skDocumentService->publish(
                $sk,
                $request->user(),
                $validated['nomor_sk'],
            );
        } catch (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e) {
            throw $e;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Gagal menerbitkan SK dan QR Code: '.$e->getMessage());

            return response()->json([
                'message' => 'SK gagal diterbitkan karena QR Code tidak dapat dibuat.',
            ], 500);
        }

        $sk->pendaftaran->load('user');
        if ($sk->pendaftaran->user && $sk->pendaftaran->user->email) {
            try {
                \Illuminate\Support\Facades\Mail::to($sk->pendaftaran->user->email)
                    ->queue(new \App\Mail\SKDiterbitkanMail($sk->pendaftaran, $sk->fresh()));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Gagal kirim SKDiterbitkanMail: '.$e->getMessage());
            }
        }

        return response()->json(['message' => 'SK berhasil diterbitkan', 'data' => $sk->fresh()->load('pendaftaran.user:id,nama')]);
    }
}
