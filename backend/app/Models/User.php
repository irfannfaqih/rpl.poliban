<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'nama', 'email', 'password', 'nip', 'role',
        'prodi_id', 'jabatan', 'phone', 'status',
        'force_change_password',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'force_change_password' => 'boolean',
        ];
    }

    // ─── Relationships ───

    public function prodi()
    {
        return $this->belongsTo(Prodi::class);
    }

    public function pendaftaran()
    {
        return $this->hasMany(Pendaftaran::class);
    }

    public function penugasanAsesor()
    {
        return $this->hasMany(PenugasanAsesor::class, 'asesor_id');
    }

    public function notifikasi()
    {
        return $this->hasMany(Notifikasi::class);
    }

    // ─── Helpers ───

    public function isPemohon(): bool { return $this->role === 'pemohon'; }
    public function isAdminProdi(): bool { return $this->role === 'admin_prodi'; }
    public function isAsesor(): bool { return $this->role === 'asesor'; }
    public function isPimpinan(): bool { return $this->role === 'pimpinan'; }
    public function isSuperAdmin(): bool { return $this->role === 'super_admin'; }
}
