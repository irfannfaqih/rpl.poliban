<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jurusan extends Model
{
    protected $table = 'jurusan';
    protected $fillable = ['nama_jurusan'];

    public function prodi()
    {
        return $this->hasMany(Prodi::class, 'jurusan_id');
    }
}
