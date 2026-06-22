<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pleno_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pendaftaran_id')->unique()->constrained('pendaftaran')->cascadeOnDelete();
            $table->enum('status', [
                'menunggu_approval_kaprodi',
                'ditolak_kaprodi',
                'menunggu_approval_pimpinan',
                'ditolak_pimpinan',
                'approved_final',
            ])->default('menunggu_approval_kaprodi');
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('kaprodi_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('kaprodi_approved_at')->nullable();
            $table->foreignId('kaprodi_rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('kaprodi_rejected_at')->nullable();
            $table->text('kaprodi_catatan')->nullable();
            $table->foreignId('pimpinan_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('pimpinan_approved_at')->nullable();
            $table->foreignId('pimpinan_rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('pimpinan_rejected_at')->nullable();
            $table->text('pimpinan_catatan')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        DB::table('pendaftaran')
            ->where('status_alur', 'finished')
            ->orderBy('id')
            ->chunkById(100, function ($pendaftarans) {
                $now = now();
                foreach ($pendaftarans as $pendaftaran) {
                    DB::table('pleno_approvals')->insert([
                        'pendaftaran_id' => $pendaftaran->id,
                        'status' => 'approved_final',
                        'submitted_at' => $pendaftaran->updated_at ?? $now,
                        'kaprodi_approved_at' => $pendaftaran->updated_at ?? $now,
                        'pimpinan_approved_at' => $pendaftaran->updated_at ?? $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('pleno_approvals');
    }
};
