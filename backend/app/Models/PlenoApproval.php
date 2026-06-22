<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlenoApproval extends Model
{
    protected $table = 'pleno_approvals';

    protected $fillable = [
        'pendaftaran_id',
        'status',
        'submitted_by',
        'submitted_at',
        'kaprodi_approved_by',
        'kaprodi_approved_at',
        'kaprodi_rejected_by',
        'kaprodi_rejected_at',
        'kaprodi_catatan',
        'pimpinan_approved_by',
        'pimpinan_approved_at',
        'pimpinan_rejected_by',
        'pimpinan_rejected_at',
        'pimpinan_catatan',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'kaprodi_approved_at' => 'datetime',
            'kaprodi_rejected_at' => 'datetime',
            'pimpinan_approved_at' => 'datetime',
            'pimpinan_rejected_at' => 'datetime',
        ];
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function kaprodiApprover()
    {
        return $this->belongsTo(User::class, 'kaprodi_approved_by');
    }

    public function kaprodiRejecter()
    {
        return $this->belongsTo(User::class, 'kaprodi_rejected_by');
    }

    public function pimpinanApprover()
    {
        return $this->belongsTo(User::class, 'pimpinan_approved_by');
    }

    public function pimpinanRejecter()
    {
        return $this->belongsTo(User::class, 'pimpinan_rejected_by');
    }
}
