<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenilaianCpmk extends Model
{
    protected $table = 'penilaian_cpmk';
    protected $fillable = ['penugasan_asesor_id', 'cpmk_id', 'nilai', 'catatan'];

    public function penugasanAsesor() { return $this->belongsTo(PenugasanAsesor::class); }
    public function cpmk() { return $this->belongsTo(Cpmk::class); }
}
