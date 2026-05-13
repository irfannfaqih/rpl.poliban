<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenugasanAsesor extends Model
{
    protected $table = 'penugasan_asesor';

    protected $fillable = [
        'pendaftaran_id', 'asesor_id', 'urutan', 'status',
    ];

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function asesor()
    {
        return $this->belongsTo(User::class, 'asesor_id');
    }

    public function praAsesmen()
    {
        return $this->hasOne(PraAsesmen::class);
    }

    public function evaluasiPortofolio()
    {
        return $this->hasMany(EvaluasiPortofolio::class);
    }

    public function penilaianCpmk()
    {
        return $this->hasMany(PenilaianCpmk::class);
    }

    public function pemetaanMk()
    {
        return $this->hasMany(PemetaanMk::class);
    }

    public function ujianTulisSoal()
    {
        return $this->hasMany(UjianTulisSoal::class);
    }
}
