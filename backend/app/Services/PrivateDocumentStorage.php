<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrivateDocumentStorage
{
    public const DISK = 'private-documents';

    public function store(UploadedFile $file, string $directory): string
    {
        return $file->store($directory, self::DISK);
    }

    public function delete(?string $path): void
    {
        if (! $path) {
            return;
        }

        Storage::disk(self::DISK)->delete($path);
    }

    public function response(
        ?string $path,
        string $fileName,
        string $disposition = 'inline',
    ): StreamedResponse {
        abort_if(! $path, 404, 'File tidak ditemukan.');

        $disk = Storage::disk(self::DISK);
        abort_unless($disk->exists($path), 404, 'File tidak ditemukan.');
        $safeName = str_replace(['"', "\r", "\n"], '', $fileName);

        return $disk->response($path, $safeName, [
            'Cache-Control' => 'private, no-store, max-age=0',
            'Content-Disposition' => $disposition.'; filename="'.$safeName.'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

}
