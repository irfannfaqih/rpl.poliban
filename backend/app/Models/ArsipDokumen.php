<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArsipDokumen extends Model
{
    use HasFactory;

    // Deklarasi eksplisit karena nama tabel tidak mengikuti pluralisasi Inggris
    protected $table = "arsip_dokumen";

    protected $fillable = [
        "pendaftaran_id",
        "kode_formulir",
        "file_path",
        "uploaded_by",
    ];

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, "uploaded_by");
    }
}
