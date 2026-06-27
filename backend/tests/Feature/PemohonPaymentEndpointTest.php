<?php

namespace Tests\Feature;

use App\Models\Gelombang;
use App\Models\Payment;
use App\Models\Pendaftaran;
use App\Models\Prodi;
use App\Models\User;
use App\Services\Payment\MidtransPaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PemohonPaymentEndpointTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        config()->set('payment.midtrans.server_key', null);
        config()->set('payment.midtrans.client_key', null);
        config()->set('payment.midtrans.merchant_id', null);

        foreach ([
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
            $table->unsignedInteger('prodi_id')->nullable();
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
    }

    public function test_pemohon_can_create_local_pending_payment_for_own_waiting_payment_pendaftaran(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        $this->bindFakeMidtransPaymentService();

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/payment/create");

        $response->assertCreated()
            ->assertJsonPath('data.reused', false)
            ->assertJsonPath('data.status_alur', 'waiting_payment')
            ->assertJsonPath('data.amount', 2500000)
            ->assertJsonPath('data.payment.status', 'pending')
            ->assertJsonPath('data.payment.snap_token', 'fake-snap-token')
            ->assertJsonPath('data.payment.redirect_url', 'https://app.sandbox.midtrans.com/snap/v2/vtweb/fake-snap-token');

        $this->assertDatabaseHas('payments', [
            'pendaftaran_id' => $pendaftaran->id,
            'amount' => 2500000,
            'status' => 'pending',
            'snap_token' => 'fake-snap-token',
            'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/fake-snap-token',
        ]);

        $pendaftaran->refresh();
        $this->assertSame('waiting_payment', $pendaftaran->status_alur);
        $this->assertNotNull($pendaftaran->midtrans_order_id);
        $this->assertSame('pending', $pendaftaran->midtrans_status);
    }

    public function test_create_payment_reuses_existing_pending_payment(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        $this->bindFakeMidtransPaymentService();
        Sanctum::actingAs($user);

        $this->postJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/payment/create")
            ->assertCreated();

        $secondResponse = $this->postJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/payment/create");

        $secondResponse->assertOk()
            ->assertJsonPath('data.reused', true);

        $this->assertSame(1, Payment::where('pendaftaran_id', $pendaftaran->id)->count());
    }

    public function test_create_payment_returns_422_when_midtrans_config_is_missing(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/payment/create");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Konfigurasi Midtrans belum lengkap.');
    }

    public function test_cannot_create_payment_if_pendaftaran_is_not_waiting_payment(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran([
            'status_alur' => 'pre_submit',
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/payment/create");

        $response->assertStatus(409)
            ->assertJsonPath('message', 'Pendaftaran tidak sedang menunggu pembayaran.');

        $this->assertDatabaseCount('payments', 0);
    }

    public function test_cannot_access_another_users_payment(): void
    {
        [, $pendaftaran] = $this->makePendaftaran();
        $otherUser = $this->makeUser('other-pemohon@example.test');

        Sanctum::actingAs($otherUser);

        $this->postJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/payment/create")
            ->assertForbidden();
    }

    public function test_status_endpoint_returns_latest_payment_status(): void
    {
        [$user, $pendaftaran] = $this->makePendaftaran();
        $payment = Payment::create([
            'pendaftaran_id' => $pendaftaran->id,
            'gateway' => 'midtrans',
            'order_id' => 'SIRPL-TEST-001',
            'amount' => 2500000,
            'currency' => 'IDR',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/pemohon/pendaftaran/{$pendaftaran->id}/payment/status");

        $response->assertOk()
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.is_paid', false)
            ->assertJsonPath('data.payment.id', $payment->id);
    }

    private function makePendaftaran(array $overrides = []): array
    {
        $user = $this->makeUser();
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
        ], $overrides));

        return [$user, $pendaftaran];
    }

    private function makeUser(string $email = 'pemohon@example.test'): User
    {
        return User::create([
            'nama' => 'Pemohon Test',
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => 'pemohon',
            'status' => 'aktif',
        ]);
    }

    private function bindFakeMidtransPaymentService(): void
    {
        $this->app->instance(MidtransPaymentService::class, new class extends MidtransPaymentService
        {
            public function isConfigured(): bool
            {
                return true;
            }

            public function generateOrderId(Pendaftaran $pendaftaran): string
            {
                return 'SIRPL-TEST-'.$pendaftaran->getKey();
            }

            public function createSnapToken(Payment $payment): array
            {
                return [
                    'token' => 'fake-snap-token',
                    'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/fake-snap-token',
                    'raw_response' => [
                        'token' => 'fake-snap-token',
                        'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/fake-snap-token',
                    ],
                ];
            }
        });
    }
}
