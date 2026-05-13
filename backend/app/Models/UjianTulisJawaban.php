<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UjianTulisJawaban extends Model
{
    protected $table = 'ujian_tulis_jawaban';
    protected $fillable = ['ujian_tulis_soal_id', 'pendaftaran_id', 'jawaban', 'submitted_at'];
    protected function casts(): array { return ['submitted_at' => 'datetime']; }

    public function soal() { return $this->belongsTo(UjianTulisSoal::class, 'ujian_tulis_soal_id'); }
    public function pendaftaran() { return $this->belongsTo(Pendaftaran::class); }
}
