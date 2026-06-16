<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk Jalur 2 Sanggahan (Banding ke Pimpinan PT)
 * PRD Bab 3.4 — tabel banding_eksternal
 */
class BandingEksternal extends Model
{
    protected $table = 'banding_eksternal';

    protected $fillable = [
        'pendaftaran_id', 'user_id',
        'alasan', 'bukti_path', 'status',
        'respon_pimpinan', 'diproses_oleh', 'diputus_at',
    ];

    protected function casts(): array
    {
        return ['diputus_at' => 'datetime'];
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function pemohon()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function pemroses()
    {
        return $this->belongsTo(User::class, 'diproses_oleh');
    }
}
