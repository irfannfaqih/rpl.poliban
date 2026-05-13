<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlenoMk extends Model
{
    protected $table = 'pleno_mk';
    protected $fillable = [
        'pendaftaran_id', 'mata_kuliah_id',
        'nilai_a1', 'bobot_a1', 'keputusan_a1',
        'nilai_a2', 'bobot_a2', 'keputusan_a2',
        'rata_rata', 'status', 'keputusan_final',
        'catatan_pleno', 'disahkan_oleh', 'disahkan_at',
    ];
    protected function casts(): array { return ['disahkan_at' => 'datetime']; }

    public function pendaftaran() { return $this->belongsTo(Pendaftaran::class); }
    public function mataKuliah() { return $this->belongsTo(MataKuliah::class); }
    public function pengesah() { return $this->belongsTo(User::class, 'disahkan_oleh'); }
}
