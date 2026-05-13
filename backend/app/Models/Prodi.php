<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prodi extends Model
{
    protected $table = 'prodi';

    protected $fillable = [
        'kode', 'nama', 'jenjang', 'jurusan', 'status',
    ];

    public function mataKuliah()
    {
        return $this->hasMany(MataKuliah::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function pendaftaran()
    {
        return $this->hasMany(Pendaftaran::class);
    }
}
