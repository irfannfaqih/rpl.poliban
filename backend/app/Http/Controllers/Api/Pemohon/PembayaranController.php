<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PembayaranController extends Controller
{
    public function submitBayar(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $this->authorize('update', $pendaftaran);

        DB::transaction(function () use ($pendaftaran) {
            $locked = Pendaftaran::whereKey($pendaftaran->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $locked->status_alur === 'waiting_payment'
                    && $locked->canTransitionTo('payment_verified'),
                409,
                'Pendaftaran tidak sedang menunggu pembayaran.',
            );
            $locked->update(['status_alur' => 'payment_verified']);
        });

        \App\Models\Notification::create([
            'user_id' => $pendaftaran->user_id,
            'title' => 'Pembayaran Berhasil',
            'message' => 'Pembayaran biaya pendaftaran RPL Anda telah diverifikasi. Langkah selanjutnya adalah menunggu verifikasi berkas oleh Admin.',
            'type' => 'payment',
            'href' => '/pemohon/dashboard'
        ]);

        return response()->json(['message' => 'Pembayaran berhasil disimulasikan dan diverifikasi']);
    }
}
