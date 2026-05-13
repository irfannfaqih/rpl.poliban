<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UjianTulisSoal extends Model
{
    protected $table = 'ujian_tulis_soal';
    protected $fillable = ['penugasan_asesor_id', 'mata_kuliah_id', 'nomor_soal', 'pertanyaan'];

    public function penugasanAsesor() { return $this->belongsTo(PenugasanAsesor::class); }
    public function mataKuliah() { return $this->belongsTo(MataKuliah::class); }
    public function jawaban() { return $this->hasMany(UjianTulisJawaban::class); }
}
