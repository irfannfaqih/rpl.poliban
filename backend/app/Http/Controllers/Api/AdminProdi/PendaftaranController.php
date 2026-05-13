<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\Pendaftaran;
use App\Models\PenugasanAsesor;
use App\Models\User;
use App\Models\VerifikasiBerkas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PendaftaranController extends Controller
{
    /**
     * List pendaftaran di prodi admin yang login
     */
    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;

        $query = Pendaftaran::with(['user:id,nama,email', 'gelombang:id,nama', 'penugasanAsesor.asesor:id,nama'])
            ->where('prodi_id', $prodiId);

        if ($request->filled('status')) {
            $query->where('status_alur', $request->status);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('nomor_pendaftaran', 'like', "%{$s}%")
                ->orWhereHas('user', fn($u) => $u->where('nama', 'like', "%{$s}%")));
        }

        $data = $query->orderByDesc('created_at')->get();

        return response()->json(['data' => $data]);
    }

    /**
     * Detail pendaftaran lengkap
     */
    public function show(Pendaftaran $pendaftaran): JsonResponse
    {
        $pendaftaran->load([
            'user:id,nama,email,phone',
            'gelombang:id,nama',
            'dataDiri',
            'riwayatPendidikan',
            'transkripAsal',
            'pengalamanKerja',
            'evaluasiDiri.cpmk',
            'dokumen',
            'penugasanAsesor.asesor:id,nama',
        ]);

        return response()->json(['data' => $pendaftaran]);
    }

    /**
     * Verifikasi berkas pendaftaran
     */
    public function verifikasi(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.kode_dokumen' => 'required|string|max:30',
            'items.*.status' => 'required|in:valid,invalid',
            'items.*.catatan' => 'nullable|string',
        ]);

        foreach ($validated['items'] as $item) {
            VerifikasiBerkas::updateOrCreate(
                ['pendaftaran_id' => $pendaftaran->id, 'kode_dokumen' => $item['kode_dokumen']],
                ['status' => $item['status'], 'catatan' => $item['catatan'] ?? null, 'verified_by' => $request->user()->id]
            );
        }

        // Cek apakah semua valid → update status alur
        $allValid = $pendaftaran->fresh()->load('dokumen')
            ->dokumen->count() > 0; // simplified check

        if ($request->filled('submit') && $request->submit) {
            $pendaftaran->update(['status_alur' => 'pra_asesmen']);
        }

        return response()->json([
            'message' => 'Verifikasi berkas berhasil disimpan',
            'data' => VerifikasiBerkas::where('pendaftaran_id', $pendaftaran->id)->get(),
        ]);
    }

    /**
     * Assign asesor ke pendaftaran
     */
    public function assignAsesor(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'asesor_1_id' => 'required|exists:users,id',
            'asesor_2_id' => 'required|exists:users,id|different:asesor_1_id',
        ]);

        // Validasi bahwa user adalah asesor
        foreach (['asesor_1_id', 'asesor_2_id'] as $field) {
            $user = User::find($validated[$field]);
            if (!$user || $user->role !== 'asesor') {
                return response()->json(['message' => "User {$validated[$field]} bukan asesor."], 422);
            }
        }

        PenugasanAsesor::updateOrCreate(
            ['pendaftaran_id' => $pendaftaran->id, 'urutan' => 'asesor_1'],
            ['asesor_id' => $validated['asesor_1_id']]
        );
        PenugasanAsesor::updateOrCreate(
            ['pendaftaran_id' => $pendaftaran->id, 'urutan' => 'asesor_2'],
            ['asesor_id' => $validated['asesor_2_id']]
        );

        return response()->json([
            'message' => 'Asesor berhasil ditugaskan',
            'data' => $pendaftaran->fresh()->load('penugasanAsesor.asesor:id,nama'),
        ]);
    }

    /**
     * Update status alur pendaftaran
     */
    public function updateStatus(Request $request, Pendaftaran $pendaftaran): JsonResponse
    {
        $validated = $request->validate([
            'status_alur' => 'required|in:pre_submit,waiting_payment,payment_verified,waiting_verification,pra_asesmen,asesmen_tahap2,pleno,finished,ditolak',
            'catatan_admin' => 'nullable|string',
        ]);

        $pendaftaran->update($validated);

        return response()->json([
            'message' => 'Status pendaftaran diperbarui',
            'data' => $pendaftaran->fresh(),
        ]);
    }
}
