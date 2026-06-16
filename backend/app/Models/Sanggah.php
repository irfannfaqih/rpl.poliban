<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sanggah extends Model
{
    protected $table = "sanggah";
    protected $fillable = [
        "pendaftaran_id",
        "mata_kuliah_id",
        "asesor_id",
        "alasan",
        "bukti_path",
        "paham_prosedur",
        "status",
        "respon_asesor",
        "diputus_at",
    ];

    protected function casts(): array
    {
        return ["diputus_at" => "datetime"];
    }

    public function asesor()
    {
        return $this->belongsTo(User::class, "asesor_id");
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }
    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }
}
