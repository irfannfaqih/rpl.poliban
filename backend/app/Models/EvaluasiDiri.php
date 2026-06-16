<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EvaluasiDiri extends Model
{
    protected $table = 'evaluasi_diri';

    protected $fillable = [
        'pendaftaran_id', 'cpmk_id', 'profisiensi', 'dokumen_pendukung',
    ];

    protected function casts(): array
    {
        return [
            'profisiensi'       => 'string',
            'dokumen_pendukung' => 'array',
        ];
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function cpmk()
    {
        return $this->belongsTo(Cpmk::class);
    }


}
