<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluasiDiri extends Model
{
    protected $table = 'evaluasi_diri';

    protected $fillable = [
        'pendaftaran_id', 'cpmk_id', 'profisiensi',
    ];

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function cpmk()
    {
        return $this->belongsTo(Cpmk::class);
    }

    public function dokumenPendukung()
    {
        return $this->belongsToMany(Dokumen::class, 'evaluasi_diri_dokumen');
    }
}
