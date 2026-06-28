<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BorangDraft extends Model
{
    protected $fillable = [
        'pendaftaran_id',
        'user_id',
        'payload',
        'last_saved_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'last_saved_at' => 'datetime',
        ];
    }

    public function pendaftaran(): BelongsTo
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
