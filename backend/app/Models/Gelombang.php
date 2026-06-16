<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gelombang extends Model
{
    protected $table = 'gelombang';

    protected $fillable = [
        'nama', 'tgl_buka', 'tgl_tutup', 'tgl_sanggah', 'biaya', 'status',
    ];

    protected $appends = ['status_dinamis'];

    protected function casts(): array
    {
        return [
            'tgl_buka' => 'date',
            'tgl_tutup' => 'date',
            'tgl_sanggah' => 'date',
            'biaya' => 'decimal:0',
        ];
    }

    /**
     * Status dinamis — otomatis menyesuaikan berdasarkan tanggal.
     *
     * Logika:
     * - Jika status DB = 'aktif' dan hari ini > tgl_tutup → 'selesai'
     * - Jika status DB = 'draft' dan hari ini >= tgl_buka dan hari ini <= tgl_tutup → tetap 'draft' (perlu diaktifkan manual)
     * - Selain itu → gunakan status DB apa adanya
     */
    public function getStatusDinamisAttribute(): string
    {
        $dbStatus = $this->attributes['status'] ?? 'draft';

        if ($dbStatus === 'aktif' && $this->tgl_tutup && now()->startOfDay()->gt($this->tgl_tutup->endOfDay())) {
            return 'selesai';
        }

        return $dbStatus;
    }

    public function pendaftaran()
    {
        return $this->hasMany(Pendaftaran::class);
    }
}
