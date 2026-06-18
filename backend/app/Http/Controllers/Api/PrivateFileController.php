<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArsipDokumen;
use App\Models\Dokumen;
use App\Models\Sanggah;
use App\Services\PrivateDocumentStorage;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrivateFileController extends Controller
{
    public function __construct(
        private PrivateDocumentStorage $storage,
    ) {}

    public function dokumen(Request $request, Dokumen $dokumen): StreamedResponse
    {
        $this->authorize('view', $dokumen->pendaftaran);

        return $this->storage->response(
            $dokumen->file_path,
            $dokumen->file_name ?: basename($dokumen->file_path),
        );
    }

    public function arsip(Request $request, ArsipDokumen $arsip): StreamedResponse
    {
        $this->authorize('view', $arsip->pendaftaran);

        return $this->storage->response(
            $arsip->file_path,
            $arsip->kode_formulir.'_'.basename($arsip->file_path),
        );
    }

    public function sanggah(Request $request, Sanggah $sanggah): StreamedResponse
    {
        $user = $request->user();
        $allowed = match ($user->role) {
            'pemohon' => $sanggah->pendaftaran->user_id === $user->id,
            'asesor' => $sanggah->pendaftaran->penugasanAsesor()
                ->where('asesor_id', $user->id)
                ->exists(),
            'admin_prodi' => $sanggah->pendaftaran->prodi_id === $user->prodi_id,
            'super_admin', 'pimpinan' => true,
            default => false,
        };
        abort_unless($allowed, 403);

        $file = $sanggah->buktiFileAt((int) $request->query('file', 0));
        abort_unless($file, 404, 'File tidak ditemukan.');

        return $this->storage->response(
            $file['path'],
            'bukti_sanggah_'.$file['name'],
        );
    }
}
