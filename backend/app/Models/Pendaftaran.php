<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pendaftaran extends Model
{
    protected $table = "pendaftaran";

    protected $fillable = [
        "user_id",
        "gelombang_id",
        "prodi_id",
        "nomor_pendaftaran",
        "status_alur",
        "midtrans_order_id",
        "midtrans_status",
        "catatan_admin",
        "pra_pemetaan_payload",
    ];

    protected function casts(): array
    {
        return ["pra_pemetaan_payload" => "array"];
    }

    public function canTransitionTo(string $nextStatus): bool
    {
        if ($nextStatus === $this->status_alur) {
            return true;
        }

        if ($this->skKeputusan?->status === 'sk_terbit') {
            return false;
        }

        $allowed = [
            'pre_submit' => ['waiting_payment', 'waiting_verification', 'ditolak'],
            'waiting_payment' => ['payment_verified', 'pre_submit', 'ditolak'],
            'payment_verified' => ['waiting_verification', 'pre_submit', 'ditolak'],
            'waiting_verification' => ['pra_asesmen', 'pre_submit', 'ditolak'],
            'pra_asesmen' => ['asesmen_tahap2', 'pleno', 'pre_submit', 'ditolak'],
            'asesmen_tahap2' => ['pleno', 'ditolak'],
            'pleno' => ['finished'],
            'finished' => [],
            'ditolak' => ['pre_submit'],
        ];

        return in_array($nextStatus, $allowed[$this->status_alur] ?? [], true);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function gelombang()
    {
        return $this->belongsTo(Gelombang::class);
    }

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function dataDiri()
    {
        return $this->hasOne(BorangDataDiri::class);
    }

    public function riwayatPendidikan()
    {
        return $this->hasMany(RiwayatPendidikan::class);
    }

    public function transkripAsal()
    {
        return $this->hasMany(TranskripAsal::class);
    }

    public function pengalamanKerja()
    {
        return $this->hasMany(PengalamanKerja::class);
    }

    public function evaluasiDiri()
    {
        return $this->hasMany(EvaluasiDiri::class);
    }

    public function dokumen()
    {
        return $this->hasMany(Dokumen::class);
    }

    public function penugasanAsesor()
    {
        return $this->hasMany(PenugasanAsesor::class);
    }

    public function jadwalAsesmen()
    {
        return $this->hasMany(JadwalAsesmen::class);
    }

    public function plenoMk()
    {
        return $this->hasMany(PlenoMk::class);
    }

    public function sanggah()
    {
        return $this->hasMany(Sanggah::class);
    }

    public function skKeputusan()
    {
        return $this->hasOne(SkKeputusan::class);
    }

    public function plenoApproval()
    {
        return $this->hasOne(PlenoApproval::class);
    }

    public function verifikasiBerkas()
    {
        return $this->hasMany(VerifikasiBerkas::class);
    }

    public function ujiLanjutan()
    {
        return $this->hasOne(UjiLanjutan::class);
    }

    public function arsip_dokumen()
    {
        return $this->hasMany(ArsipDokumen::class, "pendaftaran_id");
    }

    public function bandingEksternal()
    {
        return $this->hasMany(BandingEksternal::class);
    }
}
