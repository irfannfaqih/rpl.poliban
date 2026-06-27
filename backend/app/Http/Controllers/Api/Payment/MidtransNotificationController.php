<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentGatewayEvent;
use App\Services\Payment\MidtransPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

class MidtransNotificationController extends Controller
{
    public function store(Request $request, MidtransPaymentService $midtrans): JsonResponse
    {
        $payload = $request->all();
        $orderId = $payload['order_id'] ?? null;
        $payment = $this->findPayment($orderId);

        if (! $this->hasRequiredPayload($payload)) {
            $this->logEvent($payload, $payment, false, 'Payload Midtrans tidak valid.');

            return response()->json([
                'message' => 'Payload Midtrans tidak valid.',
            ], 422);
        }

        if (! $midtrans->serverKey()) {
            $this->logEvent($payload, $payment, false, 'Konfigurasi Midtrans belum lengkap.');

            return response()->json([
                'message' => 'Konfigurasi Midtrans belum lengkap.',
            ], 422);
        }

        if (! $midtrans->isValidNotificationSignature($payload)) {
            $this->logEvent($payload, $payment, false, 'Signature tidak valid.');

            return response()->json([
                'message' => 'Signature Midtrans tidak valid.',
            ], 403);
        }

        if (! $payment) {
            $this->logEvent($payload, null, true, 'Payment tidak ditemukan.');

            return response()->json([
                'message' => 'Payment tidak ditemukan.',
            ], 404);
        }

        $event = $this->logEvent($payload, $payment, true, null, false);

        try {
            $result = DB::transaction(function () use ($payload, $payment, $midtrans, $event): array {
                $lockedPayment = Payment::query()
                    ->with('pendaftaran')
                    ->whereKey($payment->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                $incomingStatus = $midtrans->mapTransactionStatus(
                    $payload['transaction_status'] ?? null,
                    $payload['fraud_status'] ?? null,
                );
                $finalStatus = $this->resolveFinalStatus($lockedPayment, $incomingStatus);
                $paid = $this->isPaidStatus($finalStatus);
                $duplicate = $finalStatus === $lockedPayment->status
                    && ($paid === ($lockedPayment->paid_at !== null));

                $updates = [
                    'status' => $finalStatus,
                    'raw_response' => $payload,
                ];

                if (isset($payload['payment_type']) && $payload['payment_type'] !== '') {
                    $updates['payment_type'] = $payload['payment_type'];
                }

                if ($paid && $lockedPayment->paid_at === null) {
                    $updates['paid_at'] = now();
                }

                if ($finalStatus === 'expire' && $lockedPayment->expired_at === null) {
                    $updates['expired_at'] = $this->parseTimestamp($payload['expiry_time'] ?? null) ?? now();
                }

                $lockedPayment->forceFill($updates)->save();

                $pendaftaran = $lockedPayment->pendaftaran;
                if ($pendaftaran) {
                    $pendaftaranUpdates = [
                        'midtrans_order_id' => $lockedPayment->order_id,
                        'midtrans_status' => $finalStatus,
                    ];

                    if ($paid && $pendaftaran->status_alur === 'waiting_payment') {
                        $pendaftaranUpdates['status_alur'] = 'payment_verified';
                    }

                    $pendaftaran->forceFill($pendaftaranUpdates)->save();
                }

                $message = $duplicate
                    ? 'Notifikasi duplicate, status tidak berubah.'
                    : 'Status payment diperbarui ke '.$finalStatus.'.';

                $event->forceFill([
                    'processed_at' => now(),
                    'processing_result' => $message,
                ])->save();

                $lockedPayment->refresh();
                $lockedPayment->loadMissing('pendaftaran');

                return [
                    'payment' => $lockedPayment,
                    'status_alur' => $lockedPayment->pendaftaran?->status_alur,
                ];
            });
        } catch (Throwable $exception) {
            $event->forceFill([
                'processed_at' => now(),
                'processing_result' => 'Gagal memproses notifikasi Midtrans.',
            ])->save();

            $response = [
                'message' => 'Gagal memproses notifikasi Midtrans.',
            ];

            if (config('app.debug')) {
                $response['debug'] = [
                    'class' => $exception::class,
                    'message' => $exception->getMessage(),
                ];
            }

            return response()->json($response, 500);
        }

        return response()->json([
            'message' => 'Notifikasi Midtrans diproses.',
            'data' => [
                'order_id' => $result['payment']->order_id,
                'payment_status' => $result['payment']->status,
                'status_alur' => $result['status_alur'],
            ],
        ]);
    }

    private function hasRequiredPayload(array $payload): bool
    {
        foreach (['order_id', 'transaction_status', 'signature_key', 'status_code', 'gross_amount'] as $key) {
            if (! isset($payload[$key]) || $payload[$key] === '') {
                return false;
            }
        }

        return true;
    }

    private function findPayment(mixed $orderId): ?Payment
    {
        if (! is_string($orderId) || $orderId === '') {
            return null;
        }

        return Payment::where('order_id', $orderId)->first();
    }

    private function logEvent(
        array $payload,
        ?Payment $payment,
        bool $signatureValid,
        ?string $result,
        bool $processed = true,
    ): PaymentGatewayEvent {
        return PaymentGatewayEvent::create([
            'payment_id' => $payment?->id,
            'gateway' => 'midtrans',
            'event_type' => 'notification',
            'order_id' => $payload['order_id'] ?? null,
            'transaction_status' => $payload['transaction_status'] ?? null,
            'fraud_status' => $payload['fraud_status'] ?? null,
            'signature_valid' => $signatureValid,
            'payload' => $payload,
            'received_at' => now(),
            'processed_at' => $processed ? now() : null,
            'processing_result' => $result,
        ]);
    }

    private function resolveFinalStatus(Payment $payment, string $incomingStatus): string
    {
        if (in_array($incomingStatus, ['refund', 'partial_refund'], true)) {
            return $incomingStatus;
        }

        if ($payment->isPaid() && ! $this->isPaidStatus($incomingStatus)) {
            return $payment->status;
        }

        if ($payment->status === 'settlement' && $incomingStatus === 'capture') {
            return $payment->status;
        }

        return $incomingStatus;
    }

    private function isPaidStatus(string $status): bool
    {
        return in_array($status, ['settlement', 'capture'], true);
    }

    private function parseTimestamp(mixed $value): ?Carbon
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (Throwable) {
            return null;
        }
    }
}
