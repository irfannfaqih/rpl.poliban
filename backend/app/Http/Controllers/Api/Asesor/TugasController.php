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
        $asesorId = $request->user()->id;

        $perPage = min(max($request->integer('per_page', 100), 1), 100);
        $data = PenugasanAsesor::select([
            'id',
            'pendaftaran_id',
            'asesor_id',
            'status',
            'butuh_at2',
            'created_at',
            'updated_at',
        ])->with([
            'pendaftaran:id,user_id,prodi_id,gelombang_id,nomor_pendaftaran,status_alur,created_at',
            'pendaftaran.user:id,nama,instansi',
            'pendaftaran.prodi:id,kode,nama',
            'pendaftaran.riwayatPendidikan:id,pendaftaran_id,institusi',
            'pendaftaran.ujiLanjutan:id,pendaftaran_id,fase_tulis',
            'pendaftaran.ujiLanjutan.catatanAsesor' => fn ($query) => $query
                ->select([
                    'id',
                    'uji_lanjutan_id',
                    'asesor_id',
                    'is_submitted',
                ])
                ->where('asesor_id', $asesorId),
            'pendaftaran.skKeputusan:id,pendaftaran_id,status',
            'praAsesmen:id,penugasan_asesor_id,is_submitted,rekomendasi,submitted_at',
        ])
            ->where('asesor_id', $asesorId)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($data);
    }

    public function show(Request $request, PenugasanAsesor $tugas): JsonResponse
    {
        if ($tugas->asesor_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $view = $request->query('view', 'workspace');
        if ($view === 'pra') {
            $relations = [
                'pendaftaran.user:id,nama,email,phone',
                'pendaftaran.prodi:id,kode,nama',
                'pendaftaran.jadwalAsesmen:id,pendaftaran_id,tanggal,waktu,tempat,link_meeting',
                'praAsesmen',
            ];
        } elseif ($view === 'result') {
            $relations = [
                'pendaftaran.user:id,nama,email',
                'pendaftaran.prodi:id,kode,nama',
                'pendaftaran.ujiLanjutan:id,pendaftaran_id,fase_tulis,status,nilai_at2_final',
                'pendaftaran.ujiLanjutan.catatanAsesor' => fn ($query) => $query
                    ->where('asesor_id', $request->user()->id),
                'pendaftaran.plenoMk.mataKuliah:id,kode,nama,sks',
                'pendaftaran.skKeputusan:id,pendaftaran_id,status,total_sks_diakui',
                'praAsesmen',
            ];
        } else {
            $relations = [
                'pendaftaran.user:id,nama,email,phone',
                'pendaftaran.dataDiri',
                'pendaftaran.riwayatPendidikan',
                'pendaftaran.transkripAsal',
                'pendaftaran.pengalamanKerja',
                'pendaftaran.evaluasiDiri.cpmk',
                'pendaftaran.dokumen',
                'pendaftaran.prodi.mataKuliah.cpmk',
                'pendaftaran.prodi.mataKuliah.matriksAsesmen',
                'praAsesmen',
                'evaluasiPortofolio',
                'penilaianCpmk.cpmk',
                'pemetaanMk.mkPoliban',
            ];
        }

        $tugas->load($relations);

        return response()->json(['data' => $tugas]);
    }
}
