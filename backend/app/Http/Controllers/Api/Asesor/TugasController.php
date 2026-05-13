<?php

namespace App\Http\Controllers\Api\Asesor;

use App\Http\Controllers\Controller;
use App\Models\PenugasanAsesor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TugasController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = PenugasanAsesor::with([
            'pendaftaran.user:id,nama,email',
            'pendaftaran.prodi:id,kode,nama',
            'pendaftaran.gelombang:id,nama',
        ])
        ->where('asesor_id', $request->user()->id)
        ->orderByDesc('created_at')
        ->get();

        return response()->json(['data' => $data]);
    }

    public function show(PenugasanAsesor $tugas): JsonResponse
    {
        $tugas->load([
            'pendaftaran.user:id,nama,email,phone',
            'pendaftaran.dataDiri',
            'pendaftaran.riwayatPendidikan',
            'pendaftaran.transkripAsal',
            'pendaftaran.pengalamanKerja',
            'pendaftaran.evaluasiDiri.cpmk',
            'pendaftaran.dokumen',
            'pendaftaran.prodi.mataKuliah.cpmk',
            'praAsesmen',
            'evaluasiPortofolio',
            'penilaianCpmk.cpmk',
            'pemetaanMk.mkPoliban',
        ]);

        return response()->json(['data' => $tugas]);
    }
}
