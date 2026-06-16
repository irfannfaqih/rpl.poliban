<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gelombang;
use App\Models\Prodi;
use App\Models\SkKeputusan;
use App\Services\QrCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function getGelombangAktif(): JsonResponse
    {
        $gelombang = Gelombang::where('status', 'aktif')
            ->whereDate('tgl_tutup', '>=', now())
            ->latest()
            ->get();

        return response()->json(['data' => $gelombang]);
    }

    public function getProdiAktif(): JsonResponse
    {
        $prodi = Prodi::where('status', 'aktif')->get();

        return response()->json(['data' => $prodi]);
    }

    /**
     * Verifikasi keaslian SK via QR Code.
     * Endpoint publik — tidak memerlukan autentikasi.
     */
    public function verifySk(Request $request, $id, QrCodeService $qrCodeService): JsonResponse
    {
        $sk = SkKeputusan::with(['pendaftaran.user:id,nama', 'pendaftaran.prodi:id,kode,nama', 'penerbit:id,nama'])
            ->find($id);

        if (! $sk) {
            return response()->json([
                'verified' => false,
                'message' => 'SK tidak ditemukan.',
            ], 404);
        }

        if ($sk->status !== 'sk_terbit') {
            return response()->json([
                'verified' => false,
                'message' => 'SK belum diterbitkan.',
            ], 404);
        }

        // Verifikasi token
        $token = $request->query('token', '');
        $isValid = $qrCodeService->verifyToken($sk, $token);

        if (! $isValid) {
            return response()->json([
                'verified' => false,
                'message' => 'Token verifikasi tidak valid. Dokumen ini mungkin tidak asli.',
            ], 403);
        }

        return response()->json([
            'verified' => true,
            'message' => 'Dokumen SK ini RESMI dan VALID diterbitkan oleh Politeknik Negeri Banjarmasin.',
            'data' => [
                'nomor_sk' => data_get($sk->document_snapshot, 'nomor_sk'),
                'tanggal_terbit' => data_get(
                    $sk->document_snapshot,
                    'tanggal_terbit',
                ),
                'nama_pemohon' => data_get(
                    $sk->document_snapshot,
                    'pemohon.nama',
                    '-',
                ),
                'program_studi' => data_get(
                    $sk->document_snapshot,
                    'prodi.nama',
                    '-',
                ),
                'total_sks_diakui' => data_get(
                    $sk->document_snapshot,
                    'total_sks_diakui',
                    0,
                ),
                'diterbitkan_oleh' => data_get(
                    $sk->document_snapshot,
                    'penerbit.nama',
                    '-',
                ),
                'document_hash' => $sk->content_hash,
                'pdf_hash' => $sk->pdf_hash,
                'status' => $sk->status,
            ],
        ]);
    }
}
