<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SkKeputusan extends Model
{
    private static bool $artifactMaintenance = false;

    protected $table = 'sk_keputusan';
    protected $fillable = [
        'pendaftaran_id', 'total_sks_diakui', 'status', 'nomor_sk',
        'tanggal_terbit', 'published_at', 'version', 'content_hash',
        'diterbitkan_oleh', 'penerbit_nama', 'penerbit_nip',
        'penerbit_jabatan', 'qr_code_path', 'document_snapshot',
        'pdf_path', 'pdf_hash', 'generation_token', 'generation_started_at',
    ];
    protected function casts(): array
    {
        return [
            'tanggal_terbit' => 'date',
            'published_at' => 'datetime',
            'document_snapshot' => 'array',
            'generation_started_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function (SkKeputusan $sk) {
            if ($sk->getOriginal('status') !== 'sk_terbit') {
                return;
            }

            $allowed = [
                'updated_at',
                'generation_token',
                'generation_started_at',
            ];
            foreach (['qr_code_path', 'pdf_path', 'pdf_hash'] as $field) {
                if (
                    self::$artifactMaintenance ||
                    $sk->getOriginal($field) === null
                ) {
                    $allowed[] = $field;
                }
            }
            $disallowed = array_diff(array_keys($sk->getDirty()), $allowed);
            if ($disallowed !== []) {
                throw new \DomainException(
                    'SK yang sudah diterbitkan bersifat immutable.',
                );
            }
        });

        static::deleting(function (SkKeputusan $sk) {
            if ($sk->status === 'sk_terbit') {
                throw new \DomainException(
                    'SK yang sudah diterbitkan tidak dapat dihapus.',
                );
            }
        });
    }

    public static function maintainArtifacts(callable $callback): mixed
    {
        $previous = self::$artifactMaintenance;
        self::$artifactMaintenance = true;

        try {
            return $callback();
        } finally {
            self::$artifactMaintenance = $previous;
        }
    }

    public function pendaftaran() { return $this->belongsTo(Pendaftaran::class); }
    public function penerbit() { return $this->belongsTo(User::class, 'diterbitkan_oleh'); }
}
