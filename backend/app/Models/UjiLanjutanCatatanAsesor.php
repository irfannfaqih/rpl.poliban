<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UjiLanjutanCatatanAsesor extends Model
{
    use HasFactory;

    protected $table = "uji_lanjutan_catatan_asesor";

    protected $fillable = [
        "uji_lanjutan_id",
        "asesor_id",
        "catatan_akhir",
        "nilai_akhir",
        "is_submitted",
    ];

    protected function casts(): array
    {
        return [
            "is_submitted" => "boolean",
            "nilai_akhir"  => "decimal:2",
        ];
    }

    public function ujiLanjutan()
    {
        return $this->belongsTo(UjiLanjutan::class);
    }

    public function asesor()
    {
        return $this->belongsTo(User::class, "asesor_id");
    }
}
