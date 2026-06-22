<?php

namespace App\Http\Controllers\Api\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\Notification;
use App\Models\PlenoApproval;
use App\Models\PlenoMk;
use App\Models\SkKeputusan;
use App\Services\SkDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                'menunggu_approval_pimpinan' => PlenoApproval::where('status', 'menunggu_approval_pimpinan')->count(),
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

    public function listPlenoApprovals(Request $request): JsonResponse
    {
        $query = PlenoApproval::with([
            'pendaftaran.user:id,nama',
            'pendaftaran.prodi:id,kode,nama',
            'pendaftaran.plenoMk.mataKuliah:id,kode,nama,sks',
            'submitter:id,nama',
            'kaprodiApprover:id,nama',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->whereIn('status', ['menunggu_approval_pimpinan', 'approved_final', 'ditolak_pimpinan']);
        }

        $data = $query->orderByDesc('updated_at')->paginate($request->get('per_page', 100));

        return response()->json($data);
    }

    public function approvePleno(Request $request, PlenoApproval $approval): JsonResponse
    {
        $totalSksDiakui = DB::transaction(function () use ($approval, $request) {
            $lockedApproval = PlenoApproval::whereKey($approval->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $lockedApproval->status === 'menunggu_approval_pimpinan',
                409,
                'Pleno tidak berada pada tahap approval pimpinan.',
            );

            $pendaftaran = Pendaftaran::whereKey($lockedApproval->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($pendaftaran->status_alur === 'pleno', 409, 'Pendaftaran tidak berada pada tahap pleno.');

            $pleno = PlenoMk::where('pendaftaran_id', $pendaftaran->id)
                ->lockForUpdate()
                ->get();
            abort_if(
                $pleno->isEmpty() ||
                $pleno->contains(fn ($item) => ! in_array($item->keputusan_final, ['A', 'AB', 'B', 'BC', 'C', 'T'], true)),
                422,
                'Seluruh mata kuliah harus memiliki keputusan final yang valid.',
            );

            $totalSksDiakui = PlenoMk::where('pendaftaran_id', $pendaftaran->id)
                ->where('keputusan_final', '!=', 'T')
                ->join('mata_kuliah', 'pleno_mk.mata_kuliah_id', '=', 'mata_kuliah.id')
                ->sum('mata_kuliah.sks');

            SkKeputusan::updateOrCreate(
                ['pendaftaran_id' => $pendaftaran->id],
                [
                    'total_sks_diakui' => $totalSksDiakui,
                    'status' => 'menunggu_sk',
                ],
            );
            $pendaftaran->update(['status_alur' => 'finished']);
            $lockedApproval->update([
                'status' => 'approved_final',
                'pimpinan_approved_by' => $request->user()->id,
                'pimpinan_approved_at' => now(),
                'pimpinan_rejected_by' => null,
                'pimpinan_rejected_at' => null,
                'pimpinan_catatan' => null,
            ]);

            return $totalSksDiakui;
        });

        $approval->load('pendaftaran.user');
        if ($approval->pendaftaran?->user_id) {
            Notification::create([
                'user_id' => $approval->pendaftaran->user_id,
                'title' => 'Hasil Pleno Diterbitkan',
                'message' => "Hasil sidang pleno untuk asesmen Anda telah disetujui dengan total {$totalSksDiakui} SKS yang diakui.",
                'type' => 'success',
                'href' => '/pemohon/dashboard',
            ]);
        }

        return response()->json(['message' => 'Pleno disetujui Pimpinan dan siap penerbitan SK.']);
    }

    public function rejectPleno(Request $request, PlenoApproval $approval): JsonResponse
    {
        $validated = $request->validate([
            'catatan' => 'required|string|max:2000',
        ]);

        DB::transaction(function () use ($approval, $request, $validated) {
            $lockedApproval = PlenoApproval::whereKey($approval->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $lockedApproval->status === 'menunggu_approval_pimpinan',
                409,
                'Pleno tidak berada pada tahap approval pimpinan.',
            );

            Pendaftaran::whereKey($lockedApproval->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();

            $lockedApproval->update([
                'status' => 'ditolak_pimpinan',
                'pimpinan_rejected_by' => $request->user()->id,
                'pimpinan_rejected_at' => now(),
                'pimpinan_catatan' => $validated['catatan'],
            ]);
        });

        return response()->json(['message' => 'Pleno ditolak Pimpinan dan dapat direvisi Admin Prodi.']);
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
