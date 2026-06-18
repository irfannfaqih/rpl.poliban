<?php

namespace App\Services;

use App\Models\Pendaftaran;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class PdfService
{
    /**
     * Peta relasi yang dibutuhkan per kode formulir.
     * Hanya load relasi yang benar-benar dipakai oleh template — tidak load semua.
     * Formulir yang tidak terdaftar akan fallback ke RELASI_DASAR.
     */
    private const RELASI_PER_FORMULIR = [
        // F01 - Aplikasi RPL (data diri, pendidikan, pengalaman)
        'F01' => ['dataDiri', 'riwayatPendidikan', 'pengalamanKerja', 'prodi', 'dokumen'],

        // F02 - Daftar Cek Pra Asesmen (dokumen pemohon)
        'F02' => ['dataDiri', 'dokumen', 'prodi'],

        // F03 - Asesmen Mandiri (evaluasi diri + VATC asesor + dokumen bukti)
        'F03' => [
            'dataDiri', 'prodi', 'evaluasiDiri.cpmk.mataKuliah', 'dokumen',
            'penugasanAsesor.asesor', 'penugasanAsesor.penilaianCpmk.cpmk.mataKuliah',
        ],

        // F04 - Evaluasi Portofolio (evaluasi portofolio asesor)
        'F04' => [
            'dataDiri', 'prodi', 'penugasanAsesor.asesor',
            'penugasanAsesor.evaluasiPortofolio',
        ],

        // F05 - Asesmen Capaian Pembelajaran (penilaian CPMK kedua asesor)
        'F05' => [
            'prodi', 'evaluasiDiri.cpmk.mataKuliah', 'dokumen',
            'penugasanAsesor.asesor', 'penugasanAsesor.penilaianCpmk.cpmk.mataKuliah',
        ],

        // F06 - Tanda Terima Portofolio
        'F06' => ['dataDiri', 'prodi', 'dokumen'],

        // F07 - Biodata Asesor
        'F07' => ['penugasanAsesor.asesor', 'prodi'],

        // F08 - Asesmen Tahap 2 (jadwal AT2)
        'F08' => ['dataDiri', 'prodi', 'penugasanAsesor.asesor', 'ujiLanjutan'],

        // F09 - Perangkat Asesmen Tulis (instrumen AT2)
        'F09' => ['prodi', 'penugasanAsesor.asesor', 'ujiLanjutan.items'],

        // F10 - Lembar Jawaban Tulis
        'F10' => ['dataDiri', 'prodi', 'penugasanAsesor.asesor', 'ujiLanjutan.items'],

        // F11 - Lembar Pertanyaan Lisan
        'F11' => ['dataDiri', 'prodi', 'penugasanAsesor.asesor', 'ujiLanjutan.items'],

        // F12 - Matriks Alih Kredit
        'F12' => [
            'dataDiri', 'prodi',
            'penugasanAsesor.asesor', 'penugasanAsesor.pemetaanMk.mkPoliban',
        ],

        // F13 - Matriks Asesmen MK
        'F13' => ['prodi', 'penugasanAsesor.asesor', 'penugasanAsesor.pemetaanMk.mkPoliban'],

        // F14 - Rekap Asesmen Prodi (pleno + skor mandiri)
        'F14' => [
            'dataDiri', 'prodi', 'riwayatPendidikan',
            'evaluasiDiri.cpmk', 'plenoMk.mataKuliah',
        ],

        // F15 - Rekap Asesmen Pemohon
        'F15' => ['dataDiri', 'prodi', 'riwayatPendidikan', 'plenoMk.mataKuliah'],

        // F16 - CV / Daftar Riwayat Hidup
        'F16' => ['dataDiri', 'prodi', 'riwayatPendidikan', 'pengalamanKerja'],

        // F17 - Surat Sanggah
        'F17' => ['dataDiri', 'prodi', 'sanggah'],

        // F18 - Rekap Mahasiswa RPL
        'F18' => ['prodi', 'plenoMk.mataKuliah'],

        // F19 - Berita Acara Asesmen
        'F19' => ['dataDiri', 'prodi', 'penugasanAsesor.asesor', 'ujiLanjutan'],

        // REKAP - Rekap keseluruhan
        'REKAP' => ['dataDiri', 'prodi', 'riwayatPendidikan', 'pengalamanKerja', 'plenoMk.mataKuliah'],

        // SK - Surat Keputusan
        'SK' => ['skKeputusan'],

        // Kartu Peserta
        'KARTU' => [
            'dataDiri', 'prodi', 'riwayatPendidikan',
            'penugasanAsesor.asesor', 'jadwalAsesmen',
        ],
    ];

    /**
     * Relasi dasar yang selalu tersedia sebagai fallback
     * jika kode formulir tidak terdaftar di RELASI_PER_FORMULIR.
     */
    private const RELASI_DASAR = [
        'dataDiri',
        'riwayatPendidikan',
        'pengalamanKerja',
        'evaluasiDiri.cpmk.mataKuliah',
        'dokumen',
        'penugasanAsesor.asesor',
        'penugasanAsesor.evaluasiPortofolio',
        'penugasanAsesor.penilaianCpmk.cpmk',
        'penugasanAsesor.pemetaanMk.mkPoliban',
        'penugasanAsesor.praAsesmen',
        'ujiLanjutan.items',
        'skKeputusan.penerbit',
        'plenoMk.mataKuliah',
        'prodi',
        'sanggah',
        'jadwalAsesmen',
    ];

    /**
     * Generate PDF untuk dokumen tertentu.
     */
    public function generateDocumentPdf(Pendaftaran $pendaftaran, string $documentId)
    {
        // ── 1. Load HANYA relasi yang dibutuhkan formulir ini ──────────────────
        $relasi = self::RELASI_PER_FORMULIR[$documentId] ?? self::RELASI_DASAR;
        $pendaftaran->loadMissing($relasi);

        // ── 2. Logo Poliban: baca dari cache (1 hari), tidak baca disk tiap kali ─
        $logoBase64 = Cache::remember('poliban_pdf_logo_b64_v2', 86400, function () {
            $path = public_path('img/poliban-pdf.png');

            return file_exists($path) ? base64_encode(file_get_contents($path)) : '';
        });

        // ── 3. Data tambahan ────────────────────────────────────────────────────
        $isSk = $documentId === 'SK';
        $relation = fn (string $name, mixed $fallback = null) =>
            $pendaftaran->relationLoaded($name)
                ? $pendaftaran->getRelation($name)
                : $fallback;
        $pengalamanKerja = $relation('pengalamanKerja', collect());
        $riwayatPekerjaan = $isSk
            ? collect()
            : $pengalamanKerja->where('tipe', 'kerja');
        $pelatihan = $isSk
            ? collect()
            : $pengalamanKerja->whereIn(
                'tipe',
                ['pelatihan', 'penghargaan', 'organisasi'],
            );

        $qrCodeBase64 = null;
        $qrCodeMime = null;
        $sk = $relation('skKeputusan');
        if (
            $isSk &&
            $sk &&
            $sk->qr_code_path &&
            Storage::disk('public')->exists($sk->qr_code_path)
        ) {
            $qrCodeBase64 = base64_encode(Storage::disk('public')->get($sk->qr_code_path));
            $qrCodeMime = strtolower(pathinfo($sk->qr_code_path, PATHINFO_EXTENSION)) === 'svg'
                ? 'image/svg+xml'
                : 'image/png';
        }

        $jadwal = $isSk
            ? null
            : $relation('jadwalAsesmen', collect())->first();
        $penugasan = $isSk
            ? null
            : $relation('penugasanAsesor', collect())->first();
        $praData = $penugasan?->relationLoaded('praAsesmen')
            ? $penugasan->getRelation('praAsesmen')
            : null;

        $data = [
            'pendaftaran' => $pendaftaran,
            'dataDiri' => $isSk ? null : $relation('dataDiri'),
            'riwayatPendidikan' => $isSk
                ? collect()
                : $relation('riwayatPendidikan', collect()),
            'riwayatPekerjaan' => $riwayatPekerjaan,
            'pelatihan' => $pelatihan,
            'evaluasiDiri' => $isSk
                ? collect()
                : $relation('evaluasiDiri', collect()),
            'dokumen' => $isSk
                ? collect()
                : $relation('dokumen', collect()),
            'documentId' => $documentId,
            'sk' => $sk,
            'skSnapshot' => $sk?->document_snapshot,
            'qrCodeBase64' => $qrCodeBase64,
            'qrCodeMime' => $qrCodeMime,
            'sanggah' => $isSk ? null : $relation('sanggah'),
            'logoBase64' => $logoBase64,  // ← logo siap pakai untuk semua template
            // Alias untuk template yang pakai $imageData langsung
            'imageData' => $logoBase64,
            'jadwal' => $jadwal,
            'praData' => $praData,
        ];

        // ── 4. Tentukan view ────────────────────────────────────────────────────
        $viewMap = [
            'F01' => 'pdf.f01', 'F02' => 'pdf.f02', 'F03' => 'pdf.f03',
            'F04' => 'pdf.f04', 'F05' => 'pdf.f05', 'F06' => 'pdf.f06',
            'F07' => 'pdf.f07', 'F08' => 'pdf.f08', 'F09' => 'pdf.f09',
            'F10' => 'pdf.f10', 'F11' => 'pdf.f11', 'F12' => 'pdf.f12',
            'F13' => 'pdf.f13', 'F14' => 'pdf.f14', 'F15' => 'pdf.f15',
            'F16' => 'pdf.f16_cv', 'F17' => 'pdf.f17', 'F18' => 'pdf.f18',
            'F19' => 'pdf.f19', 'REKAP' => 'pdf.f16_rekap', 'SK' => 'pdf.sk_keputusan',
            'KARTU' => 'pdf.kartu_asesmen',
        ];

        $viewName = $viewMap[$documentId] ?? 'pdf.generic';
        if (! view()->exists($viewName)) {
            $viewName = 'pdf.generic';
        }

        // ── 5. Render PDF dengan opsi yang dioptimasi ───────────────────────────
        $pdf = Pdf::loadView($viewName, $data);

        $landscapeForms = ['F12', 'F13', 'F14', 'F15', 'F18'];
        $orientation = in_array($documentId, $landscapeForms) ? 'landscape' : 'portrait';
        $pdf->setPaper('A4', $orientation);

        $pdf->setOption('isPhpEnabled', true);
        $pdf->setOption('isHtml5ParserEnabled', true);
        $pdf->setOption('enable_remote', false);          // tidak ada resource URL eksternal
        $pdf->setOption('isFontSubsettingEnabled', false); // font subsetting lambat, matikan

        return $pdf;
    }
}
