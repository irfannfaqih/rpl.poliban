<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluasiPortofolio extends Model
{
    protected $table = "evaluasi_portofolio";
    protected $fillable = [
        "penugasan_asesor_id",
        "kategori_no",
        "status_dokumen",
        "kesesuaian",
        "rekomendasi_at2",
    ];

    protected function casts(): array
    {
        return [];
    }

    public function penugasanAsesor()
    {
        return $this->belongsTo(PenugasanAsesor::class);
    }
}
