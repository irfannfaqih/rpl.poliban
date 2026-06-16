<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BorangDataDiri extends Model
{
    protected $table = "borang_data_diri";

    protected $fillable = [
        "pendaftaran_id",
        "nama_lengkap",
        "nik",
        "tempat_lahir",
        "tanggal_lahir",
        "jenis_kelamin",
        "agama",
        "kebangsaan",
        "no_hp",
        "no_telp_rumah",
        "alamat",
        "kode_pos",
        "email_pribadi",
        "pas_foto_path",
        "instansi",
        "pekerjaan",
        "alamat_instansi",
        "telp_instansi",
        "golongan",
    ];

    protected function casts(): array
    {
        return ["tanggal_lahir" => "date"];
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }
}
