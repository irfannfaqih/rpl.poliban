<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gelombang extends Model
{
    protected $table = 'gelombang';

    protected $fillable = [
        'nama', 'tgl_buka', 'tgl_tutup', 'tgl_sanggah', 'biaya', 'status',
    ];

    protected function casts(): array
    {
        return [
            'tgl_buka' => 'date',
            'tgl_tutup' => 'date',
            'tgl_sanggah' => 'date',
            'biaya' => 'decimal:0',
        ];
    }

    public function pendaftaran()
    {
        return $this->hasMany(Pendaftaran::class);
    }
}
