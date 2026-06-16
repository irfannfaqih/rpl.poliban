<?php

namespace App\Http\Controllers\Api\Pemohon;

use App\Http\Controllers\Controller;
use App\Models\BorangDataDiri;
use App\Models\Cpmk;
use App\Models\Dokumen;
use App\Models\EvaluasiDiri;
use App\Models\MataKuliah;
use App\Models\Pendaftaran;
use App\Models\PengalamanKerja;
use App\Models\RiwayatPendidikan;
use App\Models\TranskripAsal;
use App\Services\PendaftaranService;
use App\Services\PrivateDocumentStorage;
use App\Services\RegistrationEligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BorangController extends Controller
{
    public function __construct(
        private PendaftaranService $pendaftaranService,
        private PrivateDocumentStorage $privateStorage,
        private RegistrationEligibilityService $registrationEligibility,
    ) {}
    /**
     * Get atau create pendaftaran aktif
     */
    public function getPendaftaran(Request $request): JsonResponse
    {
        $view = $request->query('view', 'form');
        $query = Pendaftaran::query()
            ->where("user_id", $request->user()->id)
            ->latest();

        if ($view === 'summary') {
            $query->select([
                'id',
                'user_id',
                'prodi_id',
                'nomor_pendaftaran',
                'status_alur',
                'midtrans_status',
                'created_at',
                'updated_at',
            ]);
        } elseif ($view === 'dashboard') {
            $query->select([
                'id',
                'user_id',
                'prodi_id',
                'nomor_pendaftaran',
                'status_alur',
                'created_at',
                'updated_at',
            ])->with([
                'dataDiri:id,pendaftaran_id,nama_lengkap',
                'prodi:id,kode,nama,jenjang',
                'jadwalAsesmen:id,pendaftaran_id,tanggal,waktu,tempat,link_meeting',
                'ujiLanjutan:id,pendaftaran_id,tanggal_ujian,waktu_ujian,tempat,link_meeting,fase_tulis,status',
                'skKeputusan:id,pendaftaran_id,total_sks_diakui,status',
            ])->withCount([
                'riwayatPendidikan',
                'pengalamanKerja',
                'evaluasiDiri',
                'dokumen as dokumen_wajib_count' => fn ($relation) =>
                    $relation->where('tipe', '!=', 'tambahan'),
                'dokumen as dokumen_tambahan_count' => fn ($relation) =>
                    $relation->where('tipe', 'tambahan'),
            ]);
        } elseif ($view === 'schedule') {
            $query->select([
                'id',
                'user_id',
                'prodi_id',
                'nomor_pendaftaran',
                'status_alur',
            ])->with([
                'penugasanAsesor:id,pendaftaran_id,asesor_id',
                'penugasanAsesor.asesor:id,nama',
            ]);
        } elseif ($view === 'archive') {
            $query->with([
                'user:id,nama,email',
                'gelombang:id,nama',
                'prodi:id,kode,nama,jenjang',
                'prodi.mataKuliah' => fn ($relation) => $relation
                    ->select(['id', 'prodi_id', 'kode', 'nama', 'sks'])
                    ->where('is_active', true)
                    ->orderBy('nama'),
                'dataDiri',
                'riwayatPendidikan',
                'transkripAsal',
                'pengalamanKerja',
                'evaluasiDiri.cpmk',
                'dokumen',
            ]);
        } else {
            $query->with([
                'user:id,nama,email',
                'gelombang:id,nama',
                'prodi:id,kode,nama,jenjang',
                'dataDiri',
                'riwayatPendidikan',
                'transkripAsal',
                'pengalamanKerja',
                'evaluasiDiri.cpmk',
                'dokumen',
            ]);
        }

        return response()->json(["data" => $query->first()]);
    }

    /**
     * Get kurikulum (mata kuliah + CPMK) for the pemohon's prodi
     */
    public function getKurikulum(Request $request): JsonResponse
    {
        // Get the pemohon's active pendaftaran to determine prodi
        $pendaftaran = Pendaftaran::where('user_id', $request->user()->id)
            ->latest()
            ->first();

        if (!$pendaftaran) {
            return response()->json(['data' => []]);
        }

        $kurikulum = MataKuliah::where('prodi_id', $pendaftaran->prodi_id)
            ->where('is_active', true)
            ->with(['cpmk' => function ($q) {
                $q->orderBy('kode');
            }])
            ->orderBy('kode')
            ->get()
            ->map(function ($mk) {
                return [
                    'kode' => $mk->kode,
                    'nama' => $mk->nama,
                    'sks' => $mk->sks,
                    'deskripsi' => $mk->deskripsi ?? 'Tidak ada deskripsi.',
                    'cpmk' => $mk->cpmk->map(function ($c) {
                        return [
                            'id' => (string) $c->id,
                            'deskripsi' => $c->deskripsi,
                        ];
                    })->values(),
                ];
            });

        return response()->json(['data' => $kurikulum]);
    }

    /**
     * Mulai pendaftaran baru
     */
    public function startPendaftaran(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "gelombang_id" => "required|exists:gelombang,id",
            "prodi_id" => "required|exists:prodi,id",
        ]);

        $pendaftaran = DB::transaction(function () use ($request, $validated) {
            $this->registrationEligibility->validate(
                $validated['gelombang_id'],
                $validated['prodi_id'],
            );

            $request->user()->newQuery()
                ->whereKey($request->user()->id)
                ->lockForUpdate()
                ->first();

            $existing = Pendaftaran::where("user_id", $request->user()->id)
                ->whereNotIn("status_alur", ["finished", "ditolak"])
                ->exists();
            abort_if($existing, 422, "Anda masih memiliki pendaftaran aktif.");

            $nomor = $this->pendaftaranService->generateNomor(
                $validated["prodi_id"],
            );

            return Pendaftaran::create([
                "user_id" => $request->user()->id,
                "gelombang_id" => $validated["gelombang_id"],
                "prodi_id" => $validated["prodi_id"],
                "nomor_pendaftaran" => $nomor,
                "status_alur" => "waiting_payment",
            ]);
        });

        return response()->json(
            ["message" => "Pendaftaran dimulai", "data" => $pendaftaran],
            201,
        );
    }

    // ═══ Section A: Data Diri ═══

    public function saveDataDiri(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $validated = $request->validate([
            "nama_lengkap" => "required|string|max:255",
            "nik" => "required|string|size:16",
            "tempat_lahir" => "required|string|max:100",
            "tanggal_lahir" => "required|date",
            "jenis_kelamin" => "required|in:L,P",
            "agama" =>
                "nullable|in:Islam,Kristen,Katolik,Hindu,Buddha,Konghucu",
            "kebangsaan" => "nullable|string|max:50",
            "no_hp" => "required|string|max:20",
            "no_telp_rumah" => "nullable|string|max:20",
            "alamat" => "required|string",
            "kode_pos" => "nullable|string|size:5",
            "email_pribadi" => "required|email",
        ]);

        $dataDiri = BorangDataDiri::updateOrCreate(
            ["pendaftaran_id" => $pendaftaran->id],
            $validated,
        );

        // Sinkronkan nama ke tabel users agar sidebar & session selalu konsisten
        $pendaftaran->user()->update(["nama" => $validated["nama_lengkap"]]);

        return response()->json([
            "message" => "Data diri berhasil disimpan",
            "data" => $dataDiri,
        ]);
    }

    // ═══ Section B: Riwayat Pendidikan ═══

    public function saveRiwayatPendidikan(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $validated = $request->validate([
            "items" => "required|array",
            "items.*.jenjang" => "required|string|max:50",
            "items.*.institusi" => "required|string|max:255",
            "items.*.program_studi" => "nullable|string|max:255",
            "items.*.tahun_masuk" => "required|integer",
            "items.*.tahun_lulus" => "required|integer",
            "items.*.ipk" => "nullable|numeric|min:0|max:4",
        ]);

        DB::transaction(function () use ($pendaftaran, $validated) {
            RiwayatPendidikan::where(
                "pendaftaran_id",
                $pendaftaran->id,
            )->delete();
            foreach ($validated["items"] as $item) {
                RiwayatPendidikan::create(
                    array_merge($item, ["pendaftaran_id" => $pendaftaran->id]),
                );
            }
        });

        return response()->json([
            "message" => "Riwayat pendidikan berhasil disimpan",
        ]);
    }

    public function saveTranskrip(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $validated = $request->validate([
            "items" => "nullable|array",
            "items.*.kode_mk" => "nullable|string|max:20",
            "items.*.semester" => "required|integer|min:1",
            "items.*.nama_mk" => "required|string",
            "items.*.sks" => "required|integer|min:1",
            "items.*.nilai_huruf" => "required|string|max:2",
            "items.*.nilai_angka" => "required|numeric|min:0|max:4",
        ]);

        DB::transaction(function () use ($pendaftaran, $validated) {
            TranskripAsal::where(
                "pendaftaran_id",
                $pendaftaran->id,
            )->delete();
            foreach ($validated["items"] ?? [] as $item) {
                TranskripAsal::create(
                    array_merge($item, ["pendaftaran_id" => $pendaftaran->id]),
                );
            }
        });

        return response()->json(["message" => "Transkrip berhasil disimpan"]);
    }

    // ═══ Section C: Pengalaman ═══

    public function savePengalaman(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $validated = $request->validate([
            "instansi" => "nullable|string|max:255",
            "pekerjaan" => "nullable|string|max:255",
            "alamat_instansi" => "nullable|string",
            "telp_instansi" => "nullable|string|max:50",
            "golongan" => "nullable|string|max:100",
            "items" => "nullable|array",
            "items.*.tipe" =>
                "required|in:kerja,pelatihan,organisasi,penghargaan",
            "items.*.nama" => "required|string|max:255",
            "items.*.jabatan_peran" => "nullable|string|max:255",
            "items.*.status_kepegawaian" =>
                "nullable|in:tetap,kontrak,freelance,magang",
            "items.*.bidang" => "nullable|string|max:100",
            "items.*.tahun_mulai" => "required|integer",
            "items.*.bulan_mulai" => "nullable|integer|min:1|max:12",
            "items.*.tahun_selesai" => "nullable|integer",
            "items.*.bulan_selesai" => "nullable|integer|min:1|max:12",
            "items.*.deskripsi" => "nullable|string",
        ]);

        DB::transaction(function () use ($pendaftaran, $validated) {
            PengalamanKerja::where(
                "pendaftaran_id",
                $pendaftaran->id,
            )->delete();

            if ($pendaftaran->dataDiri) {
                $pendaftaran->dataDiri->update([
                    'instansi' => $validated['instansi'] ?? null,
                    'pekerjaan' => $validated['pekerjaan'] ?? null,
                    'alamat_instansi' => $validated['alamat_instansi'] ?? null,
                    'telp_instansi' => $validated['telp_instansi'] ?? null,
                    'golongan' => $validated['golongan'] ?? null,
                ]);
            }

            foreach ($validated["items"] ?? [] as $item) {
                PengalamanKerja::create(
                    array_merge($item, ["pendaftaran_id" => $pendaftaran->id]),
                );
            }
        });

        return response()->json(["message" => "Pengalaman berhasil disimpan"]);
    }

    // ═══ Section D: Evaluasi Diri ═══

    public function saveEvaluasiDiri(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $request->validate([
            "items" => "required|array",
            "items.*.profisiensi" => "required|in:1,2,4,5",
            "items.*.dokumen_pendukung" => "required|array|min:1",
            "items.*.dokumen_pendukung.*" => "string",
        ]);

        $items = $request->input("items", []);
        \Illuminate\Support\Facades\Log::info(
            "saveEvaluasiDiri received items",
            ["items" => $items],
        );
        $processedItems = [];

        foreach ($items as $index => $item) {
            $cpmkIdOrKode = $item["cpmk_id"] ?? null;
            if (!$cpmkIdOrKode) {
                return response()->json(
                    [
                        "message" => "Validasi Gagal",
                        "errors" => [
                            "items.{$index}.cpmk_id" => [
                                "The cpmk_id field is required.",
                            ],
                        ],
                    ],
                    422,
                );
            }

            // Find CPMK by ID (numeric) or Kode (string)
            $cpmkQuery = Cpmk::whereHas(
                'mataKuliah',
                fn ($query) => $query
                    ->where('prodi_id', $pendaftaran->prodi_id)
                    ->where('is_active', true),
            );
            $cpmk = is_numeric($cpmkIdOrKode)
                ? (clone $cpmkQuery)->whereKey($cpmkIdOrKode)->first()
                : null;
            $cpmk ??= (clone $cpmkQuery)
                ->where('kode', $cpmkIdOrKode)
                ->first();

            if (!$cpmk) {
                return response()->json(
                    [
                        "message" => "Validasi Gagal",
                        "errors" => [
                            "items.{$index}.cpmk_id" => [
                                "The selected cpmk_id is invalid.",
                            ],
                        ],
                    ],
                    422,
                );
            }

            // Resolve dokumen_pendukung: ubah "DOK-X" ke ID database
            // "DOK-1" = dokumen tambahan pertama, "DOK-2" = kedua, dst.
            // "Ijazah", "Transkrip", "KTP", "PasFoto" = dokumen wajib by tipe
            $dokumenPendukungResolved = [];
            $dokumenTambahan = \App\Models\Dokumen::where("pendaftaran_id", $pendaftaran->id)
                ->where("tipe", "tambahan")
                ->orderBy("created_at")
                ->get();

            $wajibTipeMap = [
                'ijazah'   => 'ijazah',
                'transkrip' => 'transkrip',
                'ktp'      => 'ktp',
                'pasfoto'  => 'pas_foto',
            ];

            foreach ($item["dokumen_pendukung"] ?? [] as $dokKey) {
                if (preg_match('/^DOK-(\d+)$/i', $dokKey, $matches)) {
                    // "DOK-1" → ambil dokumen tambahan ke-1 (index 0)
                    $idx = (int)$matches[1] - 1;
                    if (isset($dokumenTambahan[$idx])) {
                        $dokumenPendukungResolved[] = (string) $dokumenTambahan[$idx]->id;
                    } else {
                        $dokumenPendukungResolved[] = $dokKey; // fallback
                    }
                } else {
                    // Dokumen wajib: cari by tipe
                    $tipe = $wajibTipeMap[strtolower($dokKey)] ?? null;
                    if ($tipe) {
                        $dokWajib = \App\Models\Dokumen::where("pendaftaran_id", $pendaftaran->id)
                            ->where("tipe", $tipe)
                            ->first();
                        $dokumenPendukungResolved[] = $dokWajib
                            ? (string) $dokWajib->id
                            : $dokKey;
                    } else {
                        $dokumenPendukungResolved[] = $dokKey;
                    }
                }
            }

            $processedItems[] = [
                "cpmk_id" => $cpmk->id,
                "profisiensi" => $item["profisiensi"],
                "dokumen_pendukung" => $dokumenPendukungResolved,
            ];
        }

        foreach ($processedItems as $item) {
            EvaluasiDiri::updateOrCreate(
                [
                    "pendaftaran_id" => $pendaftaran->id,
                    "cpmk_id" => $item["cpmk_id"],
                ],
                [
                    "profisiensi"       => (string) $item["profisiensi"],
                    "dokumen_pendukung" => $item["dokumen_pendukung"] ?? null,
                ],
            );
        }

        return response()->json([
            "message" => "Evaluasi diri berhasil disimpan",
        ]);
    }

    // ═══ Section E: Upload Dokumen ═══

    public function uploadDokumen(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $request->validate([
            "file" => "required|file|mimes:pdf,jpg,jpeg,png|max:10240",
            "tipe" =>
                "required|in:ktp,ijazah,transkrip,sertifikat,portofolio_p01,portofolio_p02,portofolio_p03,portofolio_p04,portofolio_p05,portofolio_p06,portofolio_p07,portofolio_p08,portofolio_p09,portofolio_p10,portofolio,tambahan",
            "deskripsi" => "nullable|string|max:255",
        ], [
            "file.mimes" => "Dokumen yang diunggah harus berekstensi .pdf, .jpg, .jpeg, atau .png"
        ]);

        $file = $request->file("file");
        $path = $this->privateStorage->store(
            $file,
            "dokumen/{$pendaftaran->id}",
        );

        // Tipe 'tambahan' dan 'portofolio_pXX' boleh punya lebih dari satu dokumen.
        // Tipe lain (ktp, ijazah, transkrip, sertifikat) hanya boleh satu — hapus yang lama.
        $tipe = $request->tipe;
        $isSingletonTipe =
            !in_array($tipe, ["tambahan"]) &&
            !str_starts_with($tipe, "portofolio_p");

        $existingDocs = collect();

        try {
            $dokumen = DB::transaction(function () use (
                $pendaftaran,
                $request,
                $file,
                $path,
                $isSingletonTipe,
                &$existingDocs,
            ) {
                if ($isSingletonTipe) {
                    $existingDocs = Dokumen::where(
                        "pendaftaran_id",
                        $pendaftaran->id,
                    )
                        ->where("tipe", $request->tipe)
                        ->lockForUpdate()
                        ->get();
                    Dokumen::whereKey($existingDocs->pluck('id'))->delete();
                }

                return Dokumen::create([
                    "pendaftaran_id" => $pendaftaran->id,
                    "tipe" => $request->tipe,
                    "deskripsi" => $request->deskripsi,
                    "file_path" => $path,
                    "file_name" => $file->getClientOriginalName(),
                    "file_size" => $file->getSize(),
                ]);
            });
        } catch (\Throwable $e) {
            $this->privateStorage->delete($path);
            throw $e;
        }

        $existingDocs->each(
            fn (Dokumen $doc) => $this->privateStorage->delete($doc->file_path),
        );

        return response()->json(
            ["message" => "Dokumen berhasil diupload", "data" => $dokumen],
            201,
        );
    }

    public function deleteDokumen(
        Request $request,
        Pendaftaran $pendaftaran,
        Dokumen $dokumen,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $ownedDocument = $pendaftaran->dokumen()
            ->whereKey($dokumen->getKey())
            ->firstOrFail();

        DB::transaction(fn () => $ownedDocument->delete());
        $this->privateStorage->delete($ownedDocument->file_path);

        return response()->json(["message" => "Dokumen berhasil dihapus"]);
    }

    // ═══ Submit Borang ═══

    public function submitBorang(
        Request $request,
        Pendaftaran $pendaftaran,
    ): JsonResponse {
        $this->authorize('update', $pendaftaran);

        $missing = collect([
            'data diri' => $pendaftaran->dataDiri()->exists(),
            'riwayat pendidikan' => $pendaftaran->riwayatPendidikan()->exists(),
            'transkrip nilai' => $pendaftaran->transkripAsal()->exists(),
            'evaluasi diri' => $pendaftaran->evaluasiDiri()->exists(),
            'dokumen ijazah' => $pendaftaran->dokumen()->where('tipe', 'ijazah')->exists(),
            'dokumen transkrip' => $pendaftaran->dokumen()->where('tipe', 'transkrip')->exists(),
        ])->filter(fn (bool $exists) => ! $exists)->keys();

        if ($missing->isNotEmpty()) {
            return response()->json([
                'message' => 'Borang belum lengkap.',
                'errors' => [
                    'borang' => ['Lengkapi: '.$missing->implode(', ').'.'],
                ],
            ], 422);
        }

        // Sinkronisasi dokumen: hapus dokumen di database yang tidak lagi ada di frontend (ghost files)
        $validUrls = $request->input("valid_dokumen_urls");
        if (is_array($validUrls)) {
            $ghostDocs = \App\Models\Dokumen::where(
                "pendaftaran_id",
                $pendaftaran->id,
            )
                ->whereNotIn("file_path", $validUrls)
                ->get();
            foreach ($ghostDocs as $ghost) {
                $ghost->delete();
                $this->privateStorage->delete($ghost->file_path);
            }
        }

        DB::transaction(function () use ($pendaftaran) {
            $locked = Pendaftaran::whereKey($pendaftaran->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                in_array($locked->status_alur, [
                    'pre_submit',
                    'payment_verified',
                ], true),
                409,
                'Borang tidak dapat disubmit pada tahap saat ini.',
            );
            abort_unless(
                $locked->canTransitionTo('waiting_verification'),
                409,
                'Transisi status borang tidak diizinkan.',
            );
            $locked->update(["status_alur" => "waiting_verification"]);
        });

        return response()->json([
            "message" =>
                "Borang berhasil disubmit. Menunggu verifikasi berkas oleh admin.",
        ]);
    }
}
