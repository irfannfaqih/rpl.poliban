<?php

namespace Tests\Feature;

use App\Models\Gelombang;
use App\Models\Payment;
use App\Models\PaymentGatewayEvent;
use App\Models\Pendaftaran;
use App\Models\Prodi;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MidtransNotificationWebhookTest extends TestCase
{
    private string $serverKey = 'sandbox-server-key';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');

        Config::set('payment.midtrans.server_key', $this->serverKey);

        foreach ([
            'payment_gateway_events',
            'payments',
            'pendaftaran',
            'gelombang',
            'prodi',
            'users',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::create('users', function ($table) {
            $table->increments('id');
            $table->string('nama')->nullable();
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->string('role', 30);
            $table->string('status', 20)->default('aktif');
            $table->timestamps();
        });

        Schema::create('prodi', function ($table) {
            $table->increments('id');
            $table->string('kode', 10)->unique();
            $table->string('nama');
            $table->string('jenjang', 10);
            $table->string('jurusan', 100)->nullable();
            $table->string('status', 20)->default('aktif');
            $table->timestamps();
        });

        Schema::create('gelombang', function ($table) {
            $table->increments('id');
            $table->string('nama');
            $table->date('tgl_buka');
            $table->date('tgl_tutup');
            $table->date('tgl_sanggah');
            $table->decimal('biaya', 12, 0);
            $table->string('status', 20)->default('aktif');
            $table->timestamps();
        });

        Schema::create('pendaftaran', function ($table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('gelombang_id');
            $table->unsignedInteger('prodi_id');
            $table->string('nomor_pendaftaran', 20)->unique();
            $table->string('status_alur', 50)->default('pre_submit');
            $table->string('midtrans_order_id', 50)->nullable();
            $table->string('midtrans_status', 30)->nullable();
            $table->text('catatan_admin')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function ($table) {
            $table->increments('id');
            $table->unsignedInteger('pendaftaran_id');
            $table->string('gateway', 50)->default('midtrans');
            $table->string('order_id', 50)->unique();
            $table->unsignedBigInteger('amount');
            $table->string('currency', 3)->default('IDR');
            $table->string('status', 32)->default('pending');
            $table->string('snap_token', 255)->nullable();
            $table->text('redirect_url')->nullable();
            $table->string('payment_type', 50)->nullable();
            $table->string('va_number', 50)->nullable();
            $table->text('qr_string')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_gateway_events', function ($table) {
            $table->increments('id');
            $table->unsignedInteger('payment_id')->nullable();
            $table->string('gateway', 50)->default('midtrans');
            $table->string('event_type', 50)->default('notification');
            $table->string('order_id', 50)->nullable();
            $table->string('transaction_status', 32)->nullable();
            $table->string('fraud_status', 32)->nullable();
            $table->boolean('signature_valid')->default(false);
            $table->json('payload');
            $table->timestamp('received_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('processing_result')->nullable();
            $table->timestamps();
        });
    }

    public function test_valid_settlement_notification_updates_payment_and_pendaftaran(): void
    {
        [$pendaftaran, $payment] = $this->makePayment();
        $payload = $this->payload($payment->order_id, 'settlement');

        $response = $this->postJson('/api/payment/midtrans/notification', $payload);

        $response->assertOk()
            ->assertJsonPath('data.order_id', $payment->order_id)
            ->assertJsonPath('data.payment_status', 'settlement')
            ->assertJsonPath('data.status_alur', 'payment_verified');

        $payment->refresh();
        $pendaftaran->refresh();

        $this->assertSame('settlement', $payment->status);
        $this->assertNotNull($payment->paid_at);
        $this->assertSame('settlement', $pendaftaran->midtrans_status);
        $this->assertSame('payment_verified', $pendaftaran->status_alur);
        $this->assertDatabaseHas('payment_gateway_events', [
            'payment_id' => $payment->id,
            'signature_valid' => true,
            'transaction_status' => 'settlement',
        ]);
    }

    public function test_invalid_signature_is_rejected_without_updating_payment(): void
    {
        [$pendaftaran, $payment] = $this->makePayment();
        $payload = $this->payload($payment->order_id, 'settlement', [
            'signature_key' => str_repeat('0', 128),
        ]);

        $response = $this->postJson('/api/payment/midtrans/notification', $payload);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'Signature Midtrans tidak valid.');

        $payment->refresh();
        $pendaftaran->refresh();

        $this->assertSame('pending', $payment->status);
        $this->assertNull($payment->paid_at);
        $this->assertNull($pendaftaran->midtrans_status);
        $this->assertSame('waiting_payment', $pendaftaran->status_alur);
        $this->assertDatabaseHas('payment_gateway_events', [
            'payment_id' => $payment->id,
            'signature_valid' => false,
            'processing_result' => 'Signature tidak valid.',
        ]);
    }

    public function test_unknown_order_id_returns_404_but_logs_event(): void
    {
        $payload = $this->payload('SIRPL-UNKNOWN-001', 'settlement');

        $response = $this->postJson('/api/payment/midtrans/notification', $payload);

        $response->assertStatus(404)
            ->assertJsonPath('message', 'Payment tidak ditemukan.');

        $this->assertDatabaseHas('payment_gateway_events', [
            'payment_id' => null,
            'order_id' => 'SIRPL-UNKNOWN-001',
            'signature_valid' => true,
            'processing_result' => 'Payment tidak ditemukan.',
        ]);
    }

    public function test_duplicate_settlement_notification_is_idempotent(): void
    {
        [$pendaftaran, $payment] = $this->makePayment();
        $payload = $this->payload($payment->order_id, 'settlement');

        $this->postJson('/api/payment/midtrans/notification', $payload)->assertOk();
        $paidAt = $payment->refresh()->paid_at;

        $this->postJson('/api/payment/midtrans/notification', $payload)->assertOk();

        $payment->refresh();
        $pendaftaran->refresh();

        $this->assertTrue($paidAt->eq($payment->paid_at));
        $this->assertSame('settlement', $payment->status);
        $this->assertSame('payment_verified', $pendaftaran->status_alur);
        $this->assertSame(2, PaymentGatewayEvent::where('payment_id', $payment->id)->count());
    }

    public function test_pending_notification_does_not_mark_pendaftaran_verified(): void
    {
        [$pendaftaran, $payment] = $this->makePayment();

        $this->postJson('/api/payment/midtrans/notification', $this->payload($payment->order_id, 'pending'))
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.status_alur', 'waiting_payment');

        $payment->refresh();
        $pendaftaran->refresh();

        $this->assertSame('pending', $payment->status);
        $this->assertNull($payment->paid_at);
        $this->assertSame('waiting_payment', $pendaftaran->status_alur);
    }

    public function test_capture_challenge_does_not_mark_payment_paid(): void
    {
        [$pendaftaran, $payment] = $this->makePayment();

        $this->postJson('/api/payment/midtrans/notification', $this->payload($payment->order_id, 'capture', [
            'fraud_status' => 'challenge',
        ]))->assertOk()
            ->assertJsonPath('data.payment_status', 'challenge')
            ->assertJsonPath('data.status_alur', 'waiting_payment');

        $payment->refresh();
        $pendaftaran->refresh();

        $this->assertSame('challenge', $payment->status);
        $this->assertNull($payment->paid_at);
        $this->assertSame('waiting_payment', $pendaftaran->status_alur);
    }

    public function test_paid_payment_is_not_downgraded_to_pending(): void
    {
        [$pendaftaran, $payment] = $this->makePayment([
            'status' => 'settlement',
            'paid_at' => now()->subMinute(),
        ], [
            'status_alur' => 'payment_verified',
            'midtrans_status' => 'settlement',
        ]);
        $paidAt = $payment->paid_at;

        $this->postJson('/api/payment/midtrans/notification', $this->payload($payment->order_id, 'pending'))
            ->assertOk()
            ->assertJsonPath('data.payment_status', 'settlement')
            ->assertJsonPath('data.status_alur', 'payment_verified');

        $payment->refresh();
        $pendaftaran->refresh();

        $this->assertSame('settlement', $payment->status);
        $this->assertTrue($paidAt->eq($payment->paid_at));
        $this->assertSame('payment_verified', $pendaftaran->status_alur);
    }

    private function makePayment(array $paymentOverrides = [], array $pendaftaranOverrides = []): array
    {
        $user = User::create([
            'nama' => 'Pemohon Test',
            'email' => uniqid('pemohon-', true).'@example.test',
            'password' => bcrypt('password'),
            'role' => 'pemohon',
            'status' => 'aktif',
        ]);
        $prodi = Prodi::create([
            'kode' => 'SI',
            'nama' => 'Sistem Informasi',
            'jenjang' => 'D4',
            'jurusan' => 'Teknologi Informasi',
            'status' => 'aktif',
        ]);
        $gelombang = Gelombang::create([
            'nama' => 'Gelombang Test',
            'tgl_buka' => now()->subDay()->toDateString(),
            'tgl_tutup' => now()->addDay()->toDateString(),
            'tgl_sanggah' => now()->addDays(2)->toDateString(),
            'biaya' => 2500000,
            'status' => 'aktif',
        ]);
        $pendaftaran = Pendaftaran::create(array_merge([
            'user_id' => $user->id,
            'gelombang_id' => $gelombang->id,
            'prodi_id' => $prodi->id,
            'nomor_pendaftaran' => 'RPL-TEST-'.uniqid(),
            'status_alur' => 'waiting_payment',
        ], $pendaftaranOverrides));
        $payment = Payment::create(array_merge([
            'pendaftaran_id' => $pendaftaran->id,
            'gateway' => 'midtrans',
            'order_id' => 'SIRPL-TEST-'.uniqid(),
            'amount' => 2500000,
            'currency' => 'IDR',
            'status' => 'pending',
        ], $paymentOverrides));

        return [$pendaftaran, $payment];
    }

    private function payload(string $orderId, string $transactionStatus, array $overrides = []): array
    {
        $payload = array_merge([
            'order_id' => $orderId,
            'status_code' => '200',
            'gross_amount' => '2500000.00',
            'transaction_status' => $transactionStatus,
            'fraud_status' => 'accept',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'midtrans-'.uniqid(),
            'currency' => 'IDR',
        ], $overrides);

        if (! array_key_exists('signature_key', $overrides)) {
            $payload['signature_key'] = hash(
                'sha512',
                $payload['order_id'].$payload['status_code'].$payload['gross_amount'].$this->serverKey,
            );
        }

        return $payload;
    }
}
