<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Pendaftaran;
use App\Services\Payment\MidtransPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class PaymentController extends Controller
{
    public function show(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $this->authorize('update', $pendaftaran);

        $pendaftaran->loadMissing(['gelombang', 'latestPayment']);

        return response()->json([
            'data' => $this->paymentPayload(
                $pendaftaran,
                $pendaftaran->latestPayment,
            ),
        ]);
    }

    public function create(
        Request $request,
        Pendaftaran $pendaftaran,
        MidtransPaymentService $midtrans,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $created = false;

        $payment = DB::transaction(function () use (
            $pendaftaran,
            $midtrans,
            &$created,
        ): Payment {
            $locked = Pendaftaran::query()
                ->with(['gelombang', 'latestPayment'])
                ->whereKey($pendaftaran->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless(
                $locked->status_alur === 'waiting_payment',
                409,
                'Pendaftaran tidak sedang menunggu pembayaran.',
            );

            $amount = $this->resolveAmount($locked);
            $pendingPayment = $locked->payments()
                ->where('status', 'pending')
                ->latest()
                ->first();

            if ($pendingPayment) {
                $locked->update([
                    'midtrans_order_id' => $pendingPayment->order_id,
                    'midtrans_status' => $pendingPayment->status,
                ]);

                return $pendingPayment;
            }

            $created = true;
            $payment = $locked->payments()->create([
                'gateway' => 'midtrans',
                'order_id' => $midtrans->generateOrderId($locked),
                'amount' => $amount,
                'currency' => 'IDR',
                'status' => 'pending',
                'snap_token' => null,
                'redirect_url' => null,
                'raw_response' => null,
            ]);

            $locked->update([
                'midtrans_order_id' => $payment->order_id,
                'midtrans_status' => $payment->status,
            ]);

            return $payment;
        });

        if (! $payment->snap_token) {
            if (! $midtrans->isConfigured()) {
                return response()->json([
                    'message' => 'Konfigurasi Midtrans belum lengkap.',
                ], 422);
            }

            try {
                $snap = $midtrans->createSnapToken($payment);

                $payment->forceFill([
                    'snap_token' => $snap['token'],
                    'redirect_url' => $snap['redirect_url'] ?? null,
                    'raw_response' => $snap['raw_response'] ?? null,
                ])->save();
            } catch (RuntimeException $exception) {
                return $this->midtransFailureResponse($exception);
            } catch (Throwable $exception) {
                return $this->midtransFailureResponse($exception);
            }
        }

        $pendaftaran->refresh();
        $pendaftaran->loadMissing('gelombang');
        $payment->refresh();

        return response()->json([
            'message' => $created
                ? 'Payment pending berhasil dibuat.'
                : 'Payment pending sudah tersedia.',
            'data' => $this->paymentPayload($pendaftaran, $payment, ! $created),
        ], $created ? 201 : 200);
    }

    public function status(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $this->authorize('update', $pendaftaran);

        $payment = $pendaftaran->latestPayment()->first();

        return response()->json([
            'data' => [
                'pendaftaran_id' => $pendaftaran->id,
                'status_alur' => $pendaftaran->status_alur,
                'payment_status' => $payment?->status,
                'is_paid' => $payment?->isPaid() ?? false,
                'payment' => $this->serializePayment($payment),
            ],
        ]);
    }

    private function paymentPayload(
        Pendaftaran $pendaftaran,
        ?Payment $payment,
        ?bool $reused = null,
    ): array {
        $payload = [
            'pendaftaran_id' => $pendaftaran->id,
            'status_alur' => $pendaftaran->status_alur,
            'amount' => $this->resolveAmount($pendaftaran),
            'currency' => 'IDR',
            'gateway' => 'midtrans',
            'payment' => $this->serializePayment($payment),
        ];

        if ($reused !== null) {
            $payload = ['reused' => $reused] + $payload;
        }

        return $payload;
    }

    private function serializePayment(?Payment $payment): ?array
    {
        if (! $payment) {
            return null;
        }

        return [
            'id' => $payment->id,
            'order_id' => $payment->order_id,
            'status' => $payment->status,
            'snap_token' => $payment->snap_token,
            'redirect_url' => $payment->redirect_url,
            'payment_type' => $payment->payment_type,
            'va_number' => $payment->va_number,
            'qr_string' => $payment->qr_string,
            'paid_at' => $payment->paid_at,
            'expired_at' => $payment->expired_at,
            'created_at' => $payment->created_at,
        ];
    }

    private function midtransFailureResponse(Throwable $exception): JsonResponse
    {
        $payload = [
            'message' => 'Gagal membuat transaksi pembayaran Midtrans.',
        ];

        if (config('app.debug')) {
            $payload['debug'] = [
                'class' => $exception::class,
                'message' => $exception->getMessage(),
            ];
        }

        return response()->json($payload, 502);
    }

    private function resolveAmount(Pendaftaran $pendaftaran): int
    {
        $amount = $pendaftaran->gelombang?->biaya;

        abort_if(
            ! is_numeric($amount) || (int) $amount <= 0,
            422,
            'Biaya pendaftaran belum dikonfigurasi.',
        );

        return (int) $amount;
    }
}
