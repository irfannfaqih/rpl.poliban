<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengalamanKerja extends Model
{
    protected $table = "pengalaman_kerja";

    protected $fillable = [
        "pendaftaran_id",
        "tipe",
        "nama",
        "jabatan_peran",
        "status_kepegawaian",
        "bidang",
        "tahun_mulai",
        "bulan_mulai",
        "tahun_selesai",
        "bulan_selesai",
        "deskripsi",
        "sertifikat_path",
    ];

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }
}
