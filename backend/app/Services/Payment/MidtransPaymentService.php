<?php

namespace App\Services\Payment;

use App\Models\Payment;
use App\Models\Pendaftaran;
use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;
use RuntimeException;
use Throwable;

class MidtransPaymentService
{
    public function config(): array
    {
        return config('payment.midtrans', []);
    }

    public function isProduction(): bool
    {
        return (bool) ($this->config()['is_production'] ?? false);
    }

    public function serverKey(): ?string
    {
        return $this->configValue('server_key');
    }

    public function clientKey(): ?string
    {
        return $this->configValue('client_key');
    }

    public function merchantId(): ?string
    {
        return $this->configValue('merchant_id');
    }

    public function isConfigured(): bool
    {
        return $this->serverKey() !== null
            && $this->clientKey() !== null;
    }

    public function sanitizeEnabled(): bool
    {
        return (bool) ($this->config()['sanitize'] ?? true);
    }

    public function threeDsEnabled(): bool
    {
        return (bool) ($this->config()['three_ds'] ?? true);
    }

    public function configureSdk(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Konfigurasi Midtrans belum lengkap.');
        }

        Config::$serverKey = $this->serverKey();
        Config::$isProduction = $this->isProduction();
        Config::$isSanitized = $this->sanitizeEnabled();
        Config::$is3ds = $this->threeDsEnabled();
    }

    public function createSnapToken(Payment $payment): array
    {
        $this->configureSdk();

        $payment->loadMissing('pendaftaran.user');
        $payload = $this->snapPayload($payment);
        $transaction = Snap::createTransaction($payload);
        $rawResponse = $this->normalizeResponse($transaction);
        $token = $rawResponse['token'] ?? null;

        if (! is_string($token) || $token === '') {
            throw new RuntimeException('Token Snap Midtrans tidak tersedia.');
        }

        return [
            'token' => $token,
            'redirect_url' => $rawResponse['redirect_url'] ?? null,
            'raw_response' => $rawResponse,
        ];
    }

    public function fetchTransactionStatus(Payment $payment): array
    {
        if (! is_string($payment->order_id) || $payment->order_id === '') {
            throw new RuntimeException('Order ID payment tidak tersedia.');
        }

        $this->configureSdk();

        try {
            return $this->normalizeResponse(Transaction::status($payment->order_id));
        } catch (Throwable $exception) {
            throw new RuntimeException('Gagal mengambil status transaksi Midtrans.', 0, $exception);
        }
    }

    public function generateOrderId(Pendaftaran $pendaftaran): string
    {
        $prefix = 'SIRPL-'.$pendaftaran->getKey();
        $suffix = now()->format('YmdHis').'-'.Str::upper(Str::random(6));

        return Str::limit($prefix.'-'.$suffix, 50, '');
    }

    public function calculateSignatureKey(array $payload): ?string
    {
        $serverKey = $this->serverKey();
        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;

        if (! $serverKey || ! $orderId || ! $statusCode || ! $grossAmount) {
            return null;
        }

        return hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);
    }

    public function isValidNotificationSignature(array $payload): bool
    {
        $expected = $this->calculateSignatureKey($payload);
        $given = $payload['signature_key'] ?? null;

        if (! $expected || ! is_string($given) || $given === '') {
            return false;
        }

        return hash_equals($expected, $given);
    }

    public function mapTransactionStatus(?string $transactionStatus, ?string $fraudStatus = null): string
    {
        $status = Str::lower((string) $transactionStatus);
        $fraud = Str::lower((string) $fraudStatus);

        if ($status === 'capture') {
            return $fraud === 'challenge' ? 'challenge' : 'capture';
        }

        return match ($status) {
            'settlement' => 'settlement',
            'pending' => 'pending',
            'deny' => 'deny',
            'expire' => 'expire',
            'cancel' => 'cancel',
            'refund' => 'refund',
            'partial_refund' => 'partial_refund',
            'authorize' => 'authorize',
            default => $status !== '' ? $status : 'failure',
        };
    }

    private function configValue(string $key): ?string
    {
        $value = $this->config()[$key] ?? null;

        return is_string($value) && $value !== '' ? $value : null;
    }

    private function snapPayload(Payment $payment): array
    {
        $amount = (int) $payment->amount;
        $user = $payment->pendaftaran?->user;
        $customerDetails = [
            'first_name' => $user?->nama ?: 'Pemohon',
        ];

        if (is_string($user?->email) && $user->email !== '') {
            $customerDetails['email'] = $user->email;
        }

        $payload = [
            'transaction_details' => [
                'order_id' => $payment->order_id,
                'gross_amount' => $amount,
            ],
            'customer_details' => $customerDetails,
            'item_details' => [
                [
                    'id' => 'pendaftaran-rpl',
                    'price' => $amount,
                    'quantity' => 1,
                    'name' => 'Biaya Pendaftaran RPL',
                ],
            ],
        ];

        $callbacks = array_filter([
            'finish' => $this->configValue('finish_redirect_url'),
            'unfinish' => $this->configValue('unfinish_redirect_url'),
            'error' => $this->configValue('error_redirect_url'),
        ]);

        if ($callbacks !== []) {
            $payload['callbacks'] = $callbacks;
        }

        return $payload;
    }

    private function normalizeResponse(object|array $response): array
    {
        if (is_array($response)) {
            return $response;
        }

        $encoded = json_encode($response);

        if ($encoded === false) {
            return [];
        }

        $decoded = json_decode($encoded, true);

        return is_array($decoded) ? $decoded : [];
    }
}
