<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerifikasiBerkas extends Model
{
    protected $table = 'verifikasi_berkas';
    protected $fillable = ['pendaftaran_id', 'kode_dokumen', 'status', 'catatan', 'verified_by'];

    public function pendaftaran() { return $this->belongsTo(Pendaftaran::class); }
    public function verifier() { return $this->belongsTo(User::class, 'verified_by'); }
}
