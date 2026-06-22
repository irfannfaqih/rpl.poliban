<?php

namespace App\Http\Controllers\Api\Kaprodi;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\PlenoApproval;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlenoApprovalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PlenoApproval::with([
            'pendaftaran.user:id,nama',
            'pendaftaran.prodi:id,kode,nama',
            'pendaftaran.plenoMk.mataKuliah:id,kode,nama,sks',
            'submitter:id,nama',
            'kaprodiApprover:id,nama',
            'kaprodiRejecter:id,nama',
            'pimpinanApprover:id,nama',
            'pimpinanRejecter:id,nama',
        ])->whereHas('pendaftaran', function ($query) use ($request) {
            $query->where('prodi_id', $request->user()->prodi_id);
        });

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->whereIn('status', [
                'menunggu_approval_kaprodi',
                'ditolak_kaprodi',
                'menunggu_approval_pimpinan',
                'approved_final',
            ]);
        }

        return response()->json($query->orderByDesc('updated_at')->paginate($request->get('per_page', 100)));
    }

    public function show(Request $request, PlenoApproval $approval): JsonResponse
    {
        $this->authorizeKaprodiScope($request, $approval);

        $approval->load([
            'pendaftaran.user:id,nama',
            'pendaftaran.prodi:id,kode,nama',
            'pendaftaran.plenoMk.mataKuliah:id,kode,nama,sks',
            'submitter:id,nama',
            'kaprodiApprover:id,nama',
            'kaprodiRejecter:id,nama',
            'pimpinanApprover:id,nama',
            'pimpinanRejecter:id,nama',
        ]);

        return response()->json(['data' => $approval]);
    }

    public function approve(Request $request, PlenoApproval $approval): JsonResponse
    {
        DB::transaction(function () use ($request, $approval) {
            $lockedApproval = PlenoApproval::whereKey($approval->id)
                ->lockForUpdate()
                ->firstOrFail();
            $this->authorizeKaprodiScope($request, $lockedApproval);

            abort_unless(
                $lockedApproval->status === 'menunggu_approval_kaprodi',
                409,
                'Pleno tidak berada pada tahap approval Kaprodi.',
            );

            $pendaftaran = Pendaftaran::whereKey($lockedApproval->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($pendaftaran->status_alur === 'pleno', 409, 'Pendaftaran tidak berada pada tahap pleno.');

            $lockedApproval->update([
                'status' => 'menunggu_approval_pimpinan',
                'kaprodi_approved_by' => $request->user()->id,
                'kaprodi_approved_at' => now(),
                'kaprodi_rejected_by' => null,
                'kaprodi_rejected_at' => null,
                'kaprodi_catatan' => null,
            ]);
        });

        return response()->json(['message' => 'Pleno disetujui Kaprodi dan dikirim ke Pimpinan.']);
    }

    public function reject(Request $request, PlenoApproval $approval): JsonResponse
    {
        $validated = $request->validate([
            'catatan' => 'required|string|max:2000',
        ]);

        DB::transaction(function () use ($request, $approval, $validated) {
            $lockedApproval = PlenoApproval::whereKey($approval->id)
                ->lockForUpdate()
                ->firstOrFail();
            $this->authorizeKaprodiScope($request, $lockedApproval);

            abort_unless(
                $lockedApproval->status === 'menunggu_approval_kaprodi',
                409,
                'Pleno tidak berada pada tahap approval Kaprodi.',
            );

            Pendaftaran::whereKey($lockedApproval->pendaftaran_id)
                ->lockForUpdate()
                ->firstOrFail();

            $lockedApproval->update([
                'status' => 'ditolak_kaprodi',
                'kaprodi_rejected_by' => $request->user()->id,
                'kaprodi_rejected_at' => now(),
                'kaprodi_catatan' => $validated['catatan'],
            ]);
        });

        return response()->json(['message' => 'Pleno ditolak Kaprodi dan dapat direvisi Admin Prodi.']);
    }

    private function authorizeKaprodiScope(Request $request, PlenoApproval $approval): void
    {
        $approval->loadMissing('pendaftaran:id,prodi_id');

        abort_unless(
            $request->user()->prodi_id !== null &&
            $approval->pendaftaran?->prodi_id === $request->user()->prodi_id,
            403,
            'Anda tidak berwenang mengakses approval pleno prodi ini.',
        );
    }
}
