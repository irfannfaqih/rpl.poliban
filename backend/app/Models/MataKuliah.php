<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MataKuliah extends Model
{
    protected $table = 'mata_kuliah';

    protected $fillable = [
        'prodi_id', 'kode', 'nama', 'sks', 'deskripsi',
    ];

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function cpmk()
    {
        return $this->hasMany(Cpmk::class);
    }
}
