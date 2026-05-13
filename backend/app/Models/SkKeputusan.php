<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SkKeputusan extends Model
{
    protected $table = 'sk_keputusan';
    protected $fillable = ['pendaftaran_id', 'total_sks_diakui', 'status', 'nomor_sk', 'tanggal_terbit', 'diterbitkan_oleh', 'qr_code_path'];
    protected function casts(): array { return ['tanggal_terbit' => 'date']; }

    public function pendaftaran() { return $this->belongsTo(Pendaftaran::class); }
    public function penerbit() { return $this->belongsTo(User::class, 'diterbitkan_oleh'); }
}
