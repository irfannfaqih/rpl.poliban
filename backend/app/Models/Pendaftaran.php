<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pendaftaran extends Model
{
    protected $table = 'pendaftaran';

    protected $fillable = [
        'user_id', 'gelombang_id', 'prodi_id', 'nomor_pendaftaran',
        'status_alur', 'midtrans_order_id', 'midtrans_status', 'catatan_admin',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function gelombang()
    {
        return $this->belongsTo(Gelombang::class);
    }

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function dataDiri()
    {
        return $this->hasOne(BorangDataDiri::class);
    }

    public function riwayatPendidikan()
    {
        return $this->hasMany(RiwayatPendidikan::class);
    }

    public function transkripAsal()
    {
        return $this->hasMany(TranskripAsal::class);
    }

    public function pengalamanKerja()
    {
        return $this->hasMany(PengalamanKerja::class);
    }

    public function evaluasiDiri()
    {
        return $this->hasMany(EvaluasiDiri::class);
    }

    public function dokumen()
    {
        return $this->hasMany(Dokumen::class);
    }

    public function penugasanAsesor()
    {
        return $this->hasMany(PenugasanAsesor::class);
    }

    public function jadwalAsesmen()
    {
        return $this->hasMany(JadwalAsesmen::class);
    }

    public function plenoMk()
    {
        return $this->hasMany(PlenoMk::class);
    }

    public function sanggah()
    {
        return $this->hasMany(Sanggah::class);
    }

    public function skKeputusan()
    {
        return $this->hasOne(SkKeputusan::class);
    }
}
