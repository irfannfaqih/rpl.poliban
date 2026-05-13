<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JadwalAsesmen extends Model
{
    protected $table = 'jadwal_asesmen';
    protected $fillable = ['pendaftaran_id', 'tanggal', 'waktu', 'tempat', 'link_meeting', 'catatan', 'created_by'];
    protected function casts(): array { return ['tanggal' => 'date']; }

    public function pendaftaran() { return $this->belongsTo(Pendaftaran::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
