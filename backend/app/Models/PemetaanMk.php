<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PemetaanMk extends Model
{
    protected $table = 'pemetaan_mk';
    protected $fillable = ['penugasan_asesor_id', 'mk_asal_kode', 'mk_asal_nama', 'mk_poliban_id', 'kesenjangan', 'keputusan', 'catatan'];

    public function penugasanAsesor() { return $this->belongsTo(PenugasanAsesor::class); }
    public function mkPoliban() { return $this->belongsTo(MataKuliah::class, 'mk_poliban_id'); }
}
