<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PraAsesmen extends Model
{
    protected $table = "pra_asesmen";
    protected $fillable = [
        "penugasan_asesor_id",
        "langkah_1",
        "langkah_2",
        "langkah_3",
        "langkah_4",
        "langkah_5",
        "langkah_6",
        "langkah_7",
        "langkah_8",
        "catatan_observasi",
        "kebutuhan_khusus",
        "rekomendasi",
        "catatan_rekomendasi",
        "is_submitted",
        "submitted_at",
    ];
    protected function casts(): array
    {
        return [
            "is_submitted" => "boolean",
            "langkah_1" => "boolean",
            "langkah_2" => "boolean",
            "langkah_3" => "boolean",
            "langkah_4" => "boolean",
            "langkah_5" => "boolean",
            "langkah_6" => "boolean",
            "langkah_7" => "boolean",
            "langkah_8" => "boolean",
        ];
    }

    public function penugasanAsesor()
    {
        return $this->belongsTo(PenugasanAsesor::class);
    }
}
