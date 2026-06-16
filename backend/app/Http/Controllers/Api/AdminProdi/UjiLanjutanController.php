<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Pendaftaran;
use App\Models\PenugasanAsesor;
use App\Models\UjiLanjutan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UjiLanjutanController extends Controller
{
    // ─── Set Jadwal AT2 (Admin Prodi) ─────────────────────────────────────────

    public function setJadwal(Request $request, $pendaftaranId): JsonResponse
    {
        $adminId = $request->user()->id;
        $pendaftaran = Pendaftaran::findOrFail($pendaftaranId);
        $this->authorize('update', $pendaftaran);
        abort_unless(
            $pendaftaran->status_alur === 'asesmen_tahap2',
            409,
            'Jadwal AT2 hanya dapat dibuat pada tahap asesmen tahap 2.',
        );

        $validated = $request->validate([
            "tanggal_ujian" => "required|date|after_or_equal:today",
            "waktu_ujian"   => ["required", "string", "max:10", "regex:/^\d{1,2}:\d{2}$/"],
            "durasi_menit"  => "required|integer|min:1|max:480",
            "tempat"        => "nullable|string|max:500",
            "link_meeting"  => "nullable|string|max:2000",
        ]);

        $ujiLanjutan = DB::transaction(function () use (
            $pendaftaranId,
            $adminId,
            $validated,
        ) {
            $lockedPendaftaran = Pendaftaran::whereKey($pendaftaranId)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless(
                $lockedPendaftaran->status_alur === 'asesmen_tahap2',
                409,
            );
            $uji = UjiLanjutan::firstOrCreate(
                ["pendaftaran_id" => $pendaftaranId],
                [
                    "status" => "menjadwalkan",
                    "fase_tulis" => "buat_soal",
                    "dibuat_oleh" => $adminId,
                    "updated_by" => $adminId,
                ],
            );
            $locked = UjiLanjutan::whereKey($uji->id)
                ->lockForUpdate()
                ->firstOrFail();
            abort_if($locked->ujian_dimulai_at, 409);
            abort_if($locked->reschedule_status === 'diajukan', 409);
            abort_if(
                in_array($locked->fase_tulis, ['selesai', 'tidak_hadir'], true),
                409,
            );
            $locked->update(array_merge($validated, [
                "dijadwalkan_oleh" => $adminId,
                "dijadwalkan_at" => now(),
                "updated_by" => $adminId,
            ]));

            return $locked->fresh();
        });

        // Guard: tidak bisa ubah jadwal setelah ujian dimulai
        if ($ujiLanjutan->ujian_dimulai_at) {
            return response()->json([
                "message" => "Jadwal tidak dapat diubah setelah ujian dimulai.",
            ], 422);
        }

        // Guard: tidak bisa ubah jadwal jika ada reschedule sedang diajukan
        if ($ujiLanjutan->reschedule_status === "diajukan") {
            return response()->json([
                "message" => "Selesaikan review reschedule sebelum mengubah jadwal.",
            ], 422);
        }

        // Notifikasi ke pemohon
        $pendaftaran = $ujiLanjutan->pendaftaran()->with("user")->first();
        if ($pendaftaran) {
            $tgl = \Carbon\Carbon::parse($validated["tanggal_ujian"])->translatedFormat("l, d F Y");
            Notification::create([
                "user_id" => $pendaftaran->user_id,
                "title"   => "Jadwal Asesmen Tahap 2 Ditetapkan",
                "message" => "Jadwal AT2 Anda telah ditetapkan: {$tgl} pkl {$validated['waktu_ujian']} WITA di {$validated['tempat']}. Hadir tepat waktu.",
                "type"    => "info",
                "href"    => "/pemohon/asesmen-tahap-2",
            ]);

            // Notifikasi ke semua asesor yang ditugaskan
            $asesorIds = PenugasanAsesor::where("pendaftaran_id", $pendaftaranId)->pluck("asesor_id");
            foreach ($asesorIds as $asesorId) {
                Notification::create([
                    "user_id" => $asesorId,
                    "title"   => "Jadwal AT2 Ditetapkan",
                    "message" => "Jadwal AT2 untuk {$pendaftaran->user->nama} telah ditetapkan: {$tgl} pkl {$validated['waktu_ujian']} WITA.",
                    "type"    => "info",
                    "href"    => "/asesor/asesmen-tahap-2",
                ]);
            }
        }

        return response()->json([
            "message" => "Jadwal AT2 berhasil ditetapkan",
            "data"    => $ujiLanjutan->fresh()->load("dijadwalkanOleh:id,nama"),
        ]);
    }

    // ─── Approve Reschedule ───────────────────────────────────────────────────

    public function approveReschedule(Request $request, $pendaftaranId): JsonResponse
    {
        $adminId = $request->user()->id;
        $pendaftaranScope = Pendaftaran::findOrFail($pendaftaranId);
        $this->authorize('update', $pendaftaranScope);

        $validated = $request->validate([
            "catatan"       => "nullable|string|max:500",
            "tanggal_ujian" => "required|date|after_or_equal:today",
            "waktu_ujian"   => ["required", "string", "max:10", "regex:/^\d{1,2}:\d{2}$/"],
            "durasi_menit"  => "required|integer|min:1|max:480",
            "tempat"        => "nullable|string|max:500",
            "link_meeting"  => "nullable|string|max:2000",
        ]);

        $ujiLanjutan = DB::transaction(function () use (
            $pendaftaranId,
            $validated,
            $adminId,
        ) {
            $pendaftaran = Pendaftaran::whereKey($pendaftaranId)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($pendaftaran->status_alur === 'asesmen_tahap2', 409);
            $uji = UjiLanjutan::where("pendaftaran_id", $pendaftaranId)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($uji->reschedule_status === "diajukan", 409);
            abort_if($uji->ujian_dimulai_at, 409);
            $uji->update([
                "tanggal_ujian" => $validated["tanggal_ujian"],
                "waktu_ujian" => $validated["waktu_ujian"],
                "durasi_menit" => $validated["durasi_menit"],
                "tempat" => $validated["tempat"] ?? $uji->tempat,
                "link_meeting" => $validated["link_meeting"] ?? $uji->link_meeting,
                "reschedule_status" => "disetujui",
                "reschedule_catatan" => $validated["catatan"] ?? null,
                "reschedule_count" => $uji->reschedule_count + 1,
                "dijadwalkan_oleh" => $adminId,
                "dijadwalkan_at" => now(),
                "updated_by" => $adminId,
            ]);

            return $uji->fresh();
        });

        $pendaftaran = $ujiLanjutan->pendaftaran()->with("user")->first();
        $tgl = \Carbon\Carbon::parse($validated["tanggal_ujian"])->translatedFormat("l, d F Y");

        // Notif pemohon
        Notification::create([
            "user_id" => $pendaftaran->user_id,
            "title"   => "Reschedule AT2 Disetujui",
            "message" => "Permohonan perubahan jadwal AT2 Anda disetujui. Jadwal baru: {$tgl} pkl {$validated['waktu_ujian']} WITA.",
            "type"    => "success",
            "href"    => "/pemohon/asesmen-tahap-2",
        ]);

        // Notif asesor
        $asesorIds = PenugasanAsesor::where("pendaftaran_id", $pendaftaranId)->pluck("asesor_id");
        foreach ($asesorIds as $asesorId) {
            Notification::create([
                "user_id" => $asesorId,
                "title"   => "Jadwal AT2 Diperbarui (Reschedule)",
                "message" => "Jadwal AT2 {$pendaftaran->user->nama} diperbarui: {$tgl} pkl {$validated['waktu_ujian']} WITA.",
                "type"    => "info",
                "href"    => "/asesor/asesmen-tahap-2",
            ]);
        }

        return response()->json(["message" => "Reschedule disetujui dan jadwal baru telah ditetapkan."]);
    }

    // ─── Reject Reschedule ────────────────────────────────────────────────────

    public function rejectReschedule(Request $request, $pendaftaranId): JsonResponse
    {
        $pendaftaranScope = Pendaftaran::findOrFail($pendaftaranId);
        $this->authorize('update', $pendaftaranScope);

        $validated = $request->validate([
            "catatan" => "required|string|max:500",
        ]);

        $ujiLanjutan = DB::transaction(function () use (
            $pendaftaranId,
            $validated,
        ) {
            $pendaftaran = Pendaftaran::whereKey($pendaftaranId)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($pendaftaran->status_alur === 'asesmen_tahap2', 409);
            $uji = UjiLanjutan::where("pendaftaran_id", $pendaftaranId)
                ->lockForUpdate()
                ->firstOrFail();
            abort_unless($uji->reschedule_status === "diajukan", 409);
            abort_if($uji->ujian_dimulai_at, 409);
            $uji->update([
                "reschedule_status" => "ditolak",
                "reschedule_catatan" => $validated["catatan"],
            ]);

            return $uji->fresh();
        });

        $pendaftaran = $ujiLanjutan->pendaftaran()->with("user")->first();

        Notification::create([
            "user_id" => $pendaftaran->user_id,
            "title"   => "Reschedule AT2 Ditolak",
            "message" => "Permohonan perubahan jadwal AT2 Anda ditolak. Alasan: {$validated['catatan']}",
            "type"    => "warning",
            "href"    => "/pemohon/asesmen-tahap-2",
        ]);

        return response()->json(["message" => "Reschedule ditolak."]);
    }

    // ─── Get AT2 info for admin (untuk panel detail pendaftaran) ──────────────

    public function show(Request $request, $pendaftaranId): JsonResponse
    {
        $pendaftaran = Pendaftaran::findOrFail($pendaftaranId);
        $this->authorize('view', $pendaftaran);

        $ujiLanjutan = UjiLanjutan::with([
            "pendaftaran.user",
            "pendaftaran.prodi",
            "dijadwalkanOleh:id,nama",
            "items.mataKuliah:id,kode,nama",
            "catatanAsesor",
        ])->where("pendaftaran_id", $pendaftaranId)->first();

        return response()->json([
            "data" => $ujiLanjutan,
        ]);
    }
}
