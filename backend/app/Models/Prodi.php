<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prodi extends Model
{
    protected $table = 'prodi';

    protected $fillable = [
        'kode', 'nama', 'jenjang', 'jurusan', 'jurusan_id', 'status',
    ];

    public function jurusanData()
    {
        return $this->belongsTo(Jurusan::class, 'jurusan_id');
    }

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
