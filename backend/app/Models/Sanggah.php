<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sanggah extends Model
{
    protected $table = 'sanggah';
    protected $fillable = ['pendaftaran_id', 'mata_kuliah_id', 'alasan', 'bukti_path', 'status', 'respon_asesor'];

    public function pendaftaran() { return $this->belongsTo(Pendaftaran::class); }
    public function mataKuliah() { return $this->belongsTo(MataKuliah::class); }
}
