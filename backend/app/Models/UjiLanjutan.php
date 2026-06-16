<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UjiLanjutan extends Model
{
    use HasFactory;

    protected $table = "uji_lanjutan";

    protected $fillable = [
        "pendaftaran_id",
        "dibuat_oleh",
        "updated_by",
        "instrumen_updated_at",
        "dijadwalkan_oleh",
        "dijadwalkan_at",
        "jenis_ujian",
        "status",
        "fase_tulis",
        "tanggal_ujian",
        "waktu_ujian",
        "durasi_menit",
        "tempat",
        "link_meeting",
        "nilai_at2_final",
        "konfirmasi_kehadiran",
        "konfirmasi_at",
        "ujian_dimulai_at",
        "reschedule_status",
        "reschedule_alasan",
        "reschedule_catatan",
        "reschedule_count",
    ];

    protected function casts(): array
    {
        return [
            "tanggal_ujian"        => "date",
            "konfirmasi_kehadiran" => "boolean",
            "konfirmasi_at"        => "datetime",
            "instrumen_updated_at" => "datetime",
            "dijadwalkan_at"       => "datetime",
            "ujian_dimulai_at"     => "datetime",
            "nilai_at2_final"      => "decimal:2",
        ];
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }

    public function dibuatOleh()
    {
        return $this->belongsTo(User::class, "dibuat_oleh");
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, "updated_by");
    }

    public function dijadwalkanOleh()
    {
        return $this->belongsTo(User::class, "dijadwalkan_oleh");
    }

    public function items()
    {
        return $this->hasMany(UjiLanjutanItem::class);
    }

    public function penilaian()
    {
        return $this->hasManyThrough(UjiLanjutanPenilaian::class, UjiLanjutanItem::class);
    }

    public function catatanAsesor()
    {
        return $this->hasMany(UjiLanjutanCatatanAsesor::class);
    }
}
