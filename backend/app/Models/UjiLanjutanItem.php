<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UjiLanjutanItem extends Model
{
    use HasFactory;

    protected $table = "uji_lanjutan_item";

    protected $fillable = [
        "uji_lanjutan_id",
        "tipe",
        "mata_kuliah_id",
        "pertanyaan_instruksi",
        "kunci_jawaban",
        "jawaban_pemohon",
        "submitted_at",
    ];

    protected function casts(): array
    {
        return [
            "submitted_at" => "datetime",
        ];
    }

    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class, "mata_kuliah_id");
    }

    public function ujiLanjutan()
    {
        return $this->belongsTo(UjiLanjutan::class);
    }

    public function penilaian()
    {
        return $this->hasMany(UjiLanjutanPenilaian::class);
    }
}
