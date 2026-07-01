<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jurusan extends Model
{
    protected $table = 'jurusan';
    protected $fillable = [
        'nama_jurusan',
        'ketua_jurusan_nama',
        'ketua_jurusan_nip',
    ];

    public function prodi()
    {
        return $this->hasMany(Prodi::class, 'jurusan_id');
    }
}
