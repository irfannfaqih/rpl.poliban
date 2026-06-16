<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MataKuliah extends Model
{
    protected $table = "mata_kuliah";

    protected $fillable = [
        "prodi_id",
        "kode",
        "nama",
        "sks",
        "semester",
        "level_kkni",
        "deskripsi",
        "cp_sikap",
        "cp_pengetahuan",
        "cp_keterampilan",
        "indikator_kinerja",
        "profil_lulusan",
        "is_active",
    ];

    protected function casts(): array
    {
        return ["is_active" => "boolean"];
    }

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function cpmk()
    {
        return $this->hasMany(Cpmk::class, "mata_kuliah_id");
    }

    public function matriksAsesmen()
    {
        return $this->hasOne(MatriksAsesmen::class, "mata_kuliah_id");
    }
}
