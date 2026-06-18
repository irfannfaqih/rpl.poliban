<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use App\Models\PemetaanMk;
use App\Models\Pendaftaran;
use App\Models\Sanggah;
use App\Services\PrivateDocumentStorage;
use App\Services\SkDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PemohonExtraController extends Controller
{
    public function __construct(
        private PrivateDocumentStorage $privateStorage,
        private SkDocumentService $skDocumentService,
    ) {}

    /**
     * Jadwal asesmen pemohon - kembalikan jadwal yang paling relevan
     * berdasarkan status alur saat ini
     */
    public function jadwal(Request $request): JsonResponse
    {
        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)
            ->latest()
            ->first();
        if (! $pendaftaran) {
            return response()->json(['data' => []]);
        }

        if (in_array($pendaftaran->status_alur, ['pleno', 'finished', 'ditolak'], true)) {
            return response()->json(['data' => []]);
        }

        // Jika status AT2, kembalikan jadwal AT2 dari uji_lanjutan
        if ($pendaftaran->status_alur === 'asesmen_tahap2') {
            $uji = $pendaftaran->ujiLanjutan()->first();
            if ($uji && $uji->tanggal_ujian) {
                // Format data uji_lanjutan sama dengan jadwal_asesmen agar frontend tidak perlu diubah
                return response()->json([
                    'data' => [[
                        'id' => $uji->id,
                        'tanggal' => $uji->tanggal_ujian,
                        'waktu' => $uji->waktu_ujian,
                        'tempat' => $uji->tempat,
                        'link_meeting' => $uji->link_meeting,
                        'catatan' => null,
                        'tipe' => 'at2',
                    ]],
                ]);
            }
        }

        // Default: kembalikan jadwal pra-asesmen terbaru
        return response()->json([
            'data' => $pendaftaran
                ->jadwalAsesmen()
                ->with('creator:id,nama')
                ->latest()
                ->get(),
        ]);
    }

    /**
     * Download Kartu Peserta Asesmen (PDF)
     */
    public function downloadKartu(Request $request)
    {
        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)
            ->latest()
            ->first();

        if (! $pendaftaran) {
            return response()->json(['message' => 'Pendaftaran tidak ditemukan.'], 404);
        }

        $pendaftaran->loadMissing([
            'dataDiri',
            'user',
            'prodi',
            'riwayatPendidikan',
            'penugasanAsesor.asesor:id,nama',
            'jadwalAsesmen',
            'ujiLanjutan',
        ]);

        // Jika status AT2, gunakan jadwal dari uji_lanjutan
        if ($pendaftaran->status_alur === 'asesmen_tahap2') {
            $uji = $pendaftaran->ujiLanjutan;
            if ($uji && $uji->tanggal_ujian) {
                // Buat objek jadwal sementara dari data AT2
                $jadwalAt2 = new \stdClass;
                $jadwalAt2->tanggal_ujian = $uji->tanggal_ujian;
                $jadwalAt2->waktu_ujian = $uji->waktu_ujian;
                $jadwalAt2->tempat = $uji->tempat;
                $jadwalAt2->link_meeting = $uji->link_meeting;
                // Inject ke pendaftaran supaya template bisa pakai $pendaftaran->jadwalAsesmen
                $pendaftaran->setRelation('jadwalAsesmen', collect([$jadwalAt2]));
            }
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.kartu_asesmen', [
            'pendaftaran' => $pendaftaran,
        ]);

        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('isPhpEnabled', true);
        $pdf->setOption('isHtml5ParserEnabled', true);
        $pdf->setOption('enable_remote', false);
        $pdf->setOption('isFontSubsettingEnabled', false);

        $nama = str_replace(' ', '_', $pendaftaran->user->nama ?? 'pemohon');
        $filename = "Kartu_Asesmen_{$nama}.pdf";

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Hasil & SK
     */
    public function getHasil(Request $request): JsonResponse
    {
        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)
            ->latest()
            ->first();

        if (! $pendaftaran) {
            return response()->json(['data' => null]);
        }

        $pendaftaran->load('skKeputusan');

        $canShowFinalResult = $pendaftaran->status_alur === 'finished'
            && in_array($pendaftaran->skKeputusan?->status, ['menunggu_sk', 'sk_terbit'], true);

        if ($canShowFinalResult) {
            $pendaftaran->load([
                'plenoMk.mataKuliah:id,kode,nama,sks',
                'sanggah.mataKuliah:id,kode,nama',
            ]);
        } else {
            $pendaftaran->setRelation('plenoMk', collect());
            $pendaftaran->setRelation('sanggah', collect());
        }

        return response()->json(['data' => $pendaftaran]);
    }

    /**
     * Unduh Surat Keputusan RPL yang sudah diterbitkan.
     */
    public function downloadSk(Request $request) {
        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)
            ->latest()
            ->first();

        if (! $pendaftaran) {
            return response()->json(
                ['message' => 'Pendaftaran tidak ditemukan.'],
                404,
            );
        }

        $pendaftaran->loadMissing('skKeputusan');
        $sk = $pendaftaran->skKeputusan;

        if (! $sk) {
            return response()->json(
                ['message' => 'Surat Keputusan RPL belum tersedia.'],
                404,
            );
        }

        if (
            $sk->status !== 'sk_terbit' ||
            ! $sk->nomor_sk ||
            ! $sk->tanggal_terbit
        ) {
            return response()->json(
                [
                    'message' => 'Surat Keputusan RPL masih menunggu penerbitan oleh pimpinan.',
                ],
                409,
            );
        }

        try {
            $sk = $this->skDocumentService->materializePublished($sk);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Gagal materialisasi SK saat unduh: '.$e->getMessage());

            return response()->json([
                'message' => 'Surat Keputusan belum dapat diunduh karena file gagal dibuat.',
            ], 500);
        }

        $nama = preg_replace(
            '/[^A-Za-z0-9_-]+/',
            '_',
            data_get($sk->document_snapshot, 'pemohon.nama', 'Pemohon'),
        );
        $filename = "SK_RPL_{$nama}.pdf";

        return $this->privateStorage->response(
            $sk->pdf_path,
            $filename,
            'attachment',
        );
    }

    /**
     * Submit sanggah
     */
    public function submitSanggah(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pendaftaran_id' => 'required|exists:pendaftaran,id',
            'mata_kuliah_id' => [
                'required',
                Rule::exists('pleno_mk', 'mata_kuliah_id')->where(
                    fn ($query) => $query->where(
                        'pendaftaran_id',
                        $request->input('pendaftaran_id'),
                    ),
                ),
            ],
            'alasan' => 'required|string',
            'bukti_file' => 'nullable|file|max:10240', // 10MB
            'paham_prosedur' => 'required|accepted', // Wajib menyetujui prosedur banding
        ]);

        $pendaftaran = Pendaftaran::with('gelombang')->find(
            $validated['pendaftaran_id'],
        );
        if (! $pendaftaran) {
            abort(404, 'Pendaftaran not found');
        }
        $this->authorize('view', $pendaftaran);

        if (
            $pendaftaran->status_alur !== 'finished' ||
            $pendaftaran->skKeputusan?->status !== 'menunggu_sk'
        ) {
            return response()->json([
                'message' => 'Sanggahan hanya dapat diajukan setelah pleno selesai dan sebelum SK diterbitkan.',
            ], 409);
        }

        // Enforce deadline sanggah dari gelombang.tgl_sanggah (PRD Bab 3.4)
        if (
            $pendaftaran->gelombang &&
            now()->gt($pendaftaran->gelombang->tgl_sanggah)
        ) {
            return response()->json(
                [
                    'message' => 'Batas waktu pengajuan sanggahan telah lewat pada '.
                        $pendaftaran->gelombang->tgl_sanggah->format('d F Y').
                        '. '.
                        'Sanggahan tidak dapat lagi diajukan.',
                ],
                422,
            );
        }

        $path = null;
        if ($request->hasFile('bukti_file')) {
            $path = $this->privateStorage->store(
                $request->file('bukti_file'),
                "sanggah/{$validated['pendaftaran_id']}",
            );
        }

        // Cari asesor yang menilai MK ini via pemetaan_mk — assign sebagai penanggung jawab sanggah
        $pemetaan = PemetaanMk::where('mk_poliban_id', $validated['mata_kuliah_id'])
            ->whereHas(
                'penugasanAsesor',
                fn ($query) => $query->where(
                    'pendaftaran_id',
                    $pendaftaran->id,
                ),
            )
            ->with('penugasanAsesor:id,asesor_id')
            ->first();
        $asesorId = $pemetaan?->penugasanAsesor?->asesor_id
            ?? $pendaftaran->penugasanAsesor()->value('asesor_id');
        abort_if(! $asesorId, 409, 'Asesor penanggung jawab tidak ditemukan.');

        try {
            $sanggah = DB::transaction(function () use (
                $validated,
                $asesorId,
                $path,
            ) {
                $locked = Pendaftaran::whereKey($validated['pendaftaran_id'])
                    ->lockForUpdate()
                    ->firstOrFail();
                abort_unless(
                    $locked->status_alur === 'finished',
                    409,
                    'Tahap pengajuan sanggah sudah berubah.',
                );
                $sk = $locked->skKeputusan()->lockForUpdate()->first();
                abort_unless(
                    $sk?->status === 'menunggu_sk',
                    409,
                    'SK sudah diterbitkan atau tidak tersedia.',
                );
                abort_if(
                    Sanggah::where('pendaftaran_id', $locked->id)
                        ->where('mata_kuliah_id', $validated['mata_kuliah_id'])
                        ->lockForUpdate()
                        ->exists(),
                    409,
                    'Sanggahan untuk mata kuliah ini sudah diajukan.',
                );

                return Sanggah::create([
                    'pendaftaran_id' => $validated['pendaftaran_id'],
                    'mata_kuliah_id' => $validated['mata_kuliah_id'],
                    'asesor_id' => $asesorId,
                    'alasan' => $validated['alasan'],
                    'bukti_path' => $path,
                    'paham_prosedur' => true,
                    'status' => 'diajukan',
                ]);
            });
        } catch (\Throwable $e) {
            $this->privateStorage->delete($path);
            throw $e;
        }

        return response()->json(
            ['message' => 'Sanggah berhasil diajukan', 'data' => $sanggah],
            201,
        );
    }
}
