<?php

namespace App\Models;

use App\Notifications\QueuedResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        "nama",
        "email",
        "password",
        "nip",
        "role",
        "prodi_id",
        "jabatan",
        "phone",
        "status",
        "force_change_password",
        "photo",
        "alamat",
        "tempat_lahir",
        "tanggal_lahir",
        "jenis_kelamin",
        "pendidikan_terakhir",
        "bidang_keilmuan",
        "instansi",
        "jabatan_instansi",
        "asosiasi_profesi",
    ];

    protected $hidden = ["password", "remember_token"];

    protected function casts(): array
    {
        return [
            "email_verified_at" => "datetime",
            "password" => "hashed",
            "force_change_password" => "boolean",
        ];
    }

    // ─── Relationships ───

    public function prodi()
    {
        return $this->belongsTo(Prodi::class, "prodi_id");
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function pendaftaran()
    {
        return $this->hasMany(Pendaftaran::class);
    }

    public function penugasanAsesor()
    {
        return $this->hasMany(PenugasanAsesor::class, "asesor_id");
    }

    // ─── Helpers ───

    public function isPemohon(): bool
    {
        return $this->role === "pemohon";
    }
    public function isAdminProdi(): bool
    {
        return $this->role === "admin_prodi";
    }

    public function isKaprodi(): bool
    {
        return $this->role === "kaprodi";
    }
    public function isAsesor(): bool
    {
        return $this->role === "asesor";
    }
    public function isPimpinan(): bool
    {
        return $this->role === "pimpinan";
    }
    public function isSuperAdmin(): bool
    {
        return $this->role === "super_admin";
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new QueuedResetPassword($token));
    }
}
