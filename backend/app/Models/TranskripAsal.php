<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TranskripAsal extends Model
{
    protected $table = 'transkrip_asal';

    protected $fillable = [
        'pendaftaran_id', 'semester', 'nama_mk', 'sks',
        'nilai_huruf', 'nilai_angka',
    ];

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }
}
