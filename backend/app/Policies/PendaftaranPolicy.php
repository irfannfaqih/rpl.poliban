<?php

namespace App\Policies;

use App\Models\Pendaftaran;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PendaftaranPolicy
{
    public function view(User $user, Pendaftaran $pendaftaran): bool
    {
        return match($user->role) {
            'pemohon'     => $user->id === $pendaftaran->user_id,
            'admin_prodi', 'kaprodi' => $user->prodi_id === $pendaftaran->prodi_id,
            'asesor'      => $pendaftaran->penugasanAsesor()
                                ->where('asesor_id', $user->id)
                                ->exists(),
            'super_admin', 'pimpinan' => true,
            default => false,
        };
    }

    public function update(User $user, Pendaftaran $pendaftaran): bool
    {
        return match($user->role) {
            'pemohon'     => $user->id === $pendaftaran->user_id
                             && in_array($pendaftaran->status_alur, ['pre_submit', 'waiting_payment', 'payment_verified', 'document_revision']),
            'admin_prodi' => $user->prodi_id === $pendaftaran->prodi_id,
            'super_admin' => true,
            default => false,
        };
    }
}
