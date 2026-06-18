<?php

namespace App\Models;

use App\Services\PrivateDocumentStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Sanggah extends Model
{
    protected $table = "sanggah";
    protected $fillable = [
        "pendaftaran_id",
        "mata_kuliah_id",
        "asesor_id",
        "alasan",
        "bukti_path",
        "paham_prosedur",
        "status",
        "respon_asesor",
        "diputus_at",
    ];

    protected function casts(): array
    {
        return ["diputus_at" => "datetime"];
    }

    protected $appends = ['bukti_files'];

    public function getBuktiFilesAttribute(): array
    {
        return collect($this->buktiFiles())->map(
            fn (array $file, int $index) => [
                'index' => $index,
                'name' => $file['name'],
                'size' => $file['size'] ?? null,
            ],
        )->all();
    }

    public function buktiFiles(): array
    {
        if (! $this->bukti_path) {
            return [];
        }

        if (! str_ends_with($this->bukti_path, '.manifest.json')) {
            return [[
                'path' => $this->bukti_path,
                'name' => basename($this->bukti_path),
                'size' => null,
            ]];
        }

        $disk = Storage::disk(PrivateDocumentStorage::DISK);
        if (! $disk->exists($this->bukti_path)) {
            return [];
        }

        $payload = json_decode($disk->get($this->bukti_path), true);
        if (! is_array($payload) || ! is_array($payload['files'] ?? null)) {
            return [];
        }

        return collect($payload['files'])->map(fn (array $file) => [
            'path' => $file['path'] ?? null,
            'name' => $file['name'] ?? basename($file['path'] ?? ''),
            'size' => $file['size'] ?? null,
        ])->filter(fn (array $file) => filled($file['path']))->values()->all();
    }

    public function buktiFileAt(int $index): ?array
    {
        return $this->buktiFiles()[$index] ?? null;
    }

    public function asesor()
    {
        return $this->belongsTo(User::class, "asesor_id");
    }

    public function pendaftaran()
    {
        return $this->belongsTo(Pendaftaran::class);
    }
    public function mataKuliah()
    {
        return $this->belongsTo(MataKuliah::class);
    }
}
