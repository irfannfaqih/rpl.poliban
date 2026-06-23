<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\JadwalAsesmen;
use App\Models\Pendaftaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JadwalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;

        $query = JadwalAsesmen::with(['pendaftaran.user:id,nama', 'pendaftaran.penugasanAsesor.asesor:id,nama', 'creator:id,nama'])
            ->whereHas('pendaftaran', fn($q) => $q->where('prodi_id', $prodiId));

        if ($request->filled('tanggal')) {
            $query->where('tanggal', $request->tanggal);
        }
        if ($request->filled('dari')) {
            $query->where('tanggal', '>=', $request->dari);
        }
        if ($request->filled('sampai')) {
            $query->where('tanggal', '<=', $request->sampai);
        }

        $data = $query->orderBy('tanggal')->orderBy('waktu')->paginate($request->get('per_page', 500));
        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pendaftaran_id' => 'required|exists:pendaftaran,id',
            'tanggal' => 'required|date',
            'waktu' => 'required|string|max:50',
            'tempat' => 'required|string|max:500',
            'link_meeting' => 'nullable|string|max:2000',
            'catatan' => 'nullable|string',
        ]);

        $pendaftaran = Pendaftaran::find($validated['pendaftaran_id']);
        if (!$pendaftaran || $pendaftaran->prodi_id !== $request->user()->prodi_id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated['created_by'] = $request->user()->id;
        $jadwal = JadwalAsesmen::create($validated);

        \App\Models\Notification::create([
            'user_id' => $pendaftaran->user_id,
            'title' => 'Jadwal Pra-Asesmen Ditetapkan',
            'message' => 'Jadwal pra-asesmen Anda telah ditetapkan pada ' . \Carbon\Carbon::parse($jadwal->tanggal)->translatedFormat('d F Y') . ' pukul ' . $jadwal->waktu . '. Silakan cek detailnya di menu Jadwal.',
            'type' => 'schedule',
            'href' => '/pemohon/jadwal'
        ]);

        // Kirim email undangan pra-asesmen
        $jadwal->load('pendaftaran.user');
        if ($pendaftaran->user && $pendaftaran->user->email) {
            try {
                \Illuminate\Support\Facades\Mail::to($pendaftaran->user->email)
                    ->queue(new \App\Mail\JadwalPraAsesmenMail($jadwal));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Gagal kirim JadwalPraAsesmenMail: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Jadwal asesmen berhasil dibuat', 'data' => $jadwal], 201);
    }

    // ─── Jadwal per tanggal (untuk timeline preview & conflict check) ──────────

    public function jadwalPerTanggal(Request $request): JsonResponse
    {
        $request->validate(['tanggal' => 'required|date']);
        $prodiId = $request->user()->prodi_id;
        $tanggal = $request->tanggal;

        // Pra Asesmen di tanggal ini
        $praAsesmen = JadwalAsesmen::with([
            'pendaftaran.user:id,nama',
            'pendaftaran.penugasanAsesor.asesor:id,nama',
        ])
            ->whereHas('pendaftaran', fn($q) => $q->where('prodi_id', $prodiId))
            ->where('tanggal', $tanggal)
            ->get()
            ->map(fn($j) => [
                'tipe'       => 'pra_asesmen',
                'label'      => 'Pra Asesmen',
                'waktu'      => $j->waktu,
                'durasi'     => null,
                'pemohon'    => $j->pendaftaran?->user?->nama,
                'tempat'     => $j->tempat,
                'asesor_ids' => $j->pendaftaran?->penugasanAsesor?->pluck('asesor_id')?->toArray() ?? [],
                'asesor'     => $j->pendaftaran?->penugasanAsesor?->map(fn($p) => $p->asesor?->nama)?->filter()?->values()?->toArray() ?? [],
            ]);

        // AT2 di tanggal ini
        $at2 = \App\Models\UjiLanjutan::with([
            'pendaftaran.user:id,nama',
            'pendaftaran.penugasanAsesor.asesor:id,nama',
        ])
            ->whereHas('pendaftaran', fn($q) => $q->where('prodi_id', $prodiId))
            ->where('tanggal_ujian', $tanggal)
            ->whereNotNull('waktu_ujian')
            ->get()
            ->map(fn($u) => [
                'tipe'       => 'at2',
                'label'      => 'AT2 (Asesmen Tahap 2)',
                'waktu'      => $u->waktu_ujian,
                'durasi'     => $u->durasi_menit,
                'pemohon'    => $u->pendaftaran?->user?->nama,
                'tempat'     => $u->tempat,
                'asesor_ids' => $u->pendaftaran?->penugasanAsesor?->pluck('asesor_id')?->toArray() ?? [],
                'asesor'     => $u->pendaftaran?->penugasanAsesor?->map(fn($p) => $p->asesor?->nama)?->filter()?->values()?->toArray() ?? [],
            ]);

        $semua = collect($praAsesmen)->merge($at2)
            ->sortBy(fn($j) => $j['waktu'])
            ->values();

        return response()->json(['data' => $semua]);
    }

    // ─── Cek konflik asesor untuk jadwal baru ─────────────────────────────────

    public function cekKonflik(Request $request): JsonResponse
    {
        $request->validate([
            'tanggal'         => 'required|date',
            'waktu'           => 'required|string|max:50',
            'durasi_menit'    => 'nullable|integer',
            'pendaftaran_id'  => 'nullable|integer', // exclude pendaftaran ini sendiri
            'tipe'            => 'required|in:pra_asesmen,at2',
        ]);

        $prodiId        = $request->user()->prodi_id;
        $tanggal        = $request->tanggal;
        $waktuBaru      = $request->waktu;
        $durasi         = $request->durasi_menit ?? 60;
        $excludeId      = $request->pendaftaran_id;

        // Hitung window jadwal baru (dalam menit dari tengah malam)
        [$hBaru, $mBaru] = array_map('intval', explode(':', str_replace('.', ':', $waktuBaru)));
        $mulaiBaruMenit  = $hBaru * 60 + $mBaru;
        $selesaiBaruMenit = $mulaiBaruMenit + $durasi;

        // Asesor yang akan terlibat di pendaftaran baru
        $asesorBaruIds = [];
        if ($excludeId) {
            $asesorBaruIds = \App\Models\PenugasanAsesor::where('pendaftaran_id', $excludeId)
                ->pluck('asesor_id')->toArray();
        }

        $konflik = [];

        // Cek Pra Asesmen di hari yang sama
        $praAsesmenList = JadwalAsesmen::with(['pendaftaran.penugasanAsesor', 'pendaftaran.user'])
            ->whereHas('pendaftaran', fn($q) => $q->where('prodi_id', $prodiId)->when($excludeId && $request->tipe === 'pra_asesmen', fn($q2) => $q2->where('id', '!=', $excludeId)))
            ->where('tanggal', $tanggal)
            ->get();

        foreach ($praAsesmenList as $j) {
            [$h, $m] = array_map('intval', explode(':', str_replace('.', ':', $j->waktu)));
            $mulai   = $h * 60 + $m;
            $selesai = $mulai + 90; // default durasi pra asesmen 90 menit

            if ($mulaiBaruMenit < $selesai && $selesaiBaruMenit > $mulai) {
                $asesorTerlibat = $j->pendaftaran?->penugasanAsesor?->pluck('asesor_id')?->toArray() ?? [];
                $bentrok        = array_intersect($asesorBaruIds, $asesorTerlibat);
                if (!empty($bentrok) || empty($asesorBaruIds)) {
                    $konflik[] = [
                        'tipe'    => 'pra_asesmen',
                        'waktu'   => $j->waktu,
                        'pemohon' => $j->pendaftaran?->user?->nama,
                        'asesor'  => \App\Models\User::whereIn('id', $asesorTerlibat)->pluck('nama')->toArray(),
                    ];
                }
            }
        }

        // Cek AT2 di hari yang sama
        $at2List = \App\Models\UjiLanjutan::with(['pendaftaran.penugasanAsesor', 'pendaftaran.user'])
            ->whereHas('pendaftaran', fn($q) => $q->where('prodi_id', $prodiId)->when($excludeId && $request->tipe === 'at2', fn($q2) => $q2->where('id', '!=', $excludeId)))
            ->where('tanggal_ujian', $tanggal)
            ->whereNotNull('waktu_ujian')
            ->get();

        foreach ($at2List as $u) {
            [$h, $m] = array_map('intval', explode(':', str_replace('.', ':', $u->waktu_ujian)));
            $mulai   = $h * 60 + $m;
            $selesai = $mulai + ($u->durasi_menit ?? 90);

            if ($mulaiBaruMenit < $selesai && $selesaiBaruMenit > $mulai) {
                $asesorTerlibat = $u->pendaftaran?->penugasanAsesor?->pluck('asesor_id')?->toArray() ?? [];
                $bentrok        = array_intersect($asesorBaruIds, $asesorTerlibat);
                if (!empty($bentrok) || empty($asesorBaruIds)) {
                    $konflik[] = [
                        'tipe'    => 'at2',
                        'waktu'   => $u->waktu_ujian,
                        'pemohon' => $u->pendaftaran?->user?->nama,
                        'asesor'  => \App\Models\User::whereIn('id', $asesorTerlibat)->pluck('nama')->toArray(),
                    ];
                }
            }
        }

        return response()->json([
            'ada_konflik' => !empty($konflik),
            'konflik'     => $konflik,
        ]);
    }

    public function update(Request $request, JadwalAsesmen $jadwal): JsonResponse
    {
        $validated = $request->validate([
            'tanggal' => 'sometimes|date',
            'waktu' => 'sometimes|string|max:50',
            'tempat' => 'sometimes|string|max:500',
            'link_meeting' => 'nullable|string|max:2000',
            'catatan' => 'nullable|string',
        ]);

        $updated = DB::transaction(function () use ($jadwal, $validated, $request) {
            $lockedJadwal = JadwalAsesmen::with('pendaftaran')
                ->whereKey($jadwal->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$lockedJadwal->pendaftaran || $lockedJadwal->pendaftaran->prodi_id !== $request->user()->prodi_id) {
                abort(403, 'Unauthorized.');
            }

            if ($this->isCompletedPraAsesmenSchedule($lockedJadwal)) {
                abort(409, 'Jadwal pra asesmen yang sudah selesai tidak dapat diubah.');
            }

            $lockedJadwal->update($validated);

            return $lockedJadwal->fresh(['pendaftaran.user:id,nama']);
        });

        return response()->json(['message' => 'Jadwal berhasil diperbarui', 'data' => $updated]);
    }

    public function destroy(Request $request, JadwalAsesmen $jadwal): JsonResponse
    {
        DB::transaction(function () use ($jadwal, $request) {
            $lockedJadwal = JadwalAsesmen::with('pendaftaran')
                ->whereKey($jadwal->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$lockedJadwal->pendaftaran || $lockedJadwal->pendaftaran->prodi_id !== $request->user()->prodi_id) {
                abort(403, 'Unauthorized.');
            }

            if ($this->isCompletedPraAsesmenSchedule($lockedJadwal)) {
                abort(409, 'Jadwal pra asesmen yang sudah selesai tidak dapat dibatalkan.');
            }

            $lockedJadwal->delete();
        });

        return response()->json(['message' => 'Jadwal berhasil dihapus']);
    }

    private function isCompletedPraAsesmenSchedule(JadwalAsesmen $jadwal): bool
    {
        return in_array($jadwal->pendaftaran?->status_alur, ['pleno', 'finished', 'selesai'], true);
    }
}
