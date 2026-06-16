<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UjiLanjutanPenilaian extends Model
{
    use HasFactory;

    protected $table = "uji_lanjutan_penilaian";

    protected $fillable = [
        "uji_lanjutan_item_id",
        "asesor_id",
        "skor",
    ];

    public function item()
    {
        return $this->belongsTo(UjiLanjutanItem::class, "uji_lanjutan_item_id");
    }

    public function asesor()
    {
        return $this->belongsTo(User::class, "asesor_id");
    }
}
