<?php

namespace App\Services;

use App\Models\Gelombang;
use App\Models\Prodi;
use Illuminate\Validation\ValidationException;

class RegistrationEligibilityService
{
    public function validate(int $gelombangId, int $prodiId): void
    {
        $gelombang = Gelombang::whereKey($gelombangId)
            ->lockForUpdate()
            ->firstOrFail();
        $prodi = Prodi::whereKey($prodiId)
            ->lockForUpdate()
            ->firstOrFail();
        $today = now()->startOfDay();

        if ($prodi->status !== 'aktif') {
            $this->reject('Program studi yang dipilih tidak aktif.');
        }

        if ($gelombang->status !== 'aktif') {
            $this->reject('Gelombang pendaftaran tidak aktif.');
        }

        if ($gelombang->tgl_buka && $today->lt($gelombang->tgl_buka->startOfDay())) {
            $this->reject('Gelombang pendaftaran belum dibuka.');
        }

        if ($gelombang->tgl_tutup && $today->gt($gelombang->tgl_tutup->endOfDay())) {
            $this->reject('Gelombang pendaftaran telah ditutup.');
        }
    }

    private function reject(string $message): never
    {
        throw ValidationException::withMessages([
            'gelombang_id' => [$message],
        ]);
    }
}
