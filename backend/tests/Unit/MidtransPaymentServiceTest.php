<?php

namespace Tests\Unit;

use App\Models\Payment;
use App\Models\Pendaftaran;
use App\Services\Payment\MidtransPaymentService;
use Illuminate\Support\Facades\Config;
use RuntimeException;
use Tests\TestCase;

class MidtransPaymentServiceTest extends TestCase
{
    public function test_generate_order_id_uses_sirpl_prefix_and_stays_within_midtrans_safe_length(): void
    {
        $pendaftaran = new Pendaftaran(['id' => 123]);
        $pendaftaran->id = 123;

        $orderId = (new MidtransPaymentService)->generateOrderId($pendaftaran);

        $this->assertStringStartsWith('SIRPL-123-', $orderId);
        $this->assertLessThanOrEqual(50, strlen($orderId));
    }

    public function test_notification_signature_validation_uses_midtrans_formula(): void
    {
        Config::set('payment.midtrans.server_key', 'sandbox-server-key');

        $payload = [
            'order_id' => 'SIRPL-123-20260627120000-ABC123',
            'status_code' => '200',
            'gross_amount' => '150000.00',
        ];
        $payload['signature_key'] = hash(
            'sha512',
            $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'sandbox-server-key'
        );

        $this->assertTrue((new MidtransPaymentService)->isValidNotificationSignature($payload));

        $payload['signature_key'] = str_repeat('0', 128);

        $this->assertFalse((new MidtransPaymentService)->isValidNotificationSignature($payload));
    }

    public function test_is_configured_requires_midtrans_keys(): void
    {
        Config::set('payment.midtrans.server_key', null);
        Config::set('payment.midtrans.client_key', 'sandbox-client-key');
        Config::set('payment.midtrans.merchant_id', null);

        $this->assertFalse((new MidtransPaymentService)->isConfigured());

        Config::set('payment.midtrans.server_key', 'sandbox-server-key');
        Config::set('payment.midtrans.client_key', null);
        Config::set('payment.midtrans.merchant_id', null);

        $this->assertFalse((new MidtransPaymentService)->isConfigured());

        Config::set('payment.midtrans.server_key', 'sandbox-server-key');
        Config::set('payment.midtrans.client_key', 'sandbox-client-key');
        Config::set('payment.midtrans.merchant_id', null);

        $this->assertTrue((new MidtransPaymentService)->isConfigured());
    }

    public function test_sanitize_and_three_ds_flags_read_config_booleans(): void
    {
        Config::set('payment.midtrans.sanitize', false);
        Config::set('payment.midtrans.three_ds', true);

        $service = new MidtransPaymentService;

        $this->assertFalse($service->sanitizeEnabled());
        $this->assertTrue($service->threeDsEnabled());
    }

    public function test_create_snap_token_fails_before_sdk_call_when_config_is_missing(): void
    {
        Config::set('payment.midtrans.server_key', null);
        Config::set('payment.midtrans.client_key', null);
        Config::set('payment.midtrans.merchant_id', null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Konfigurasi Midtrans belum lengkap.');

        (new MidtransPaymentService)->createSnapToken(new Payment([
            'order_id' => 'SIRPL-TEST-001',
            'amount' => 2500000,
        ]));
    }

    public function test_fetch_transaction_status_requires_order_id(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Order ID payment tidak tersedia.');

        (new MidtransPaymentService)->fetchTransactionStatus(new Payment([
            'order_id' => '',
        ]));
    }

    public function test_transaction_status_mapping_handles_capture_challenge_and_standard_statuses(): void
    {
        $service = new MidtransPaymentService;

        $this->assertSame('challenge', $service->mapTransactionStatus('capture', 'challenge'));
        $this->assertSame('capture', $service->mapTransactionStatus('capture', 'accept'));
        $this->assertSame('settlement', $service->mapTransactionStatus('settlement'));
        $this->assertSame('pending', $service->mapTransactionStatus('pending'));
        $this->assertSame('partial_refund', $service->mapTransactionStatus('partial_refund'));
        $this->assertSame('failure', $service->mapTransactionStatus(null));
    }
}
