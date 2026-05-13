<?php

namespace App\Http\Controllers\Api\AdminProdi;

use App\Http\Controllers\Controller;
use App\Models\JadwalAsesmen;
use App\Models\Pendaftaran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JadwalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->user()->prodi_id;

        $query = JadwalAsesmen::with(['pendaftaran.user:id,nama', 'creator:id,nama'])
            ->whereHas('pendaftaran', fn($q) => $q->where('prodi_id', $prodiId));

        if ($request->filled('tanggal')) {
            $query->where('tanggal', $request->tanggal);
        }

        return response()->json(['data' => $query->orderByDesc('tanggal')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pendaftaran_id' => 'required|exists:pendaftaran,id',
            'tanggal' => 'required|date',
            'waktu' => 'required|string|max:30',
            'tempat' => 'required|string',
            'link_meeting' => 'nullable|string|max:255',
            'catatan' => 'nullable|string',
        ]);

        $validated['created_by'] = $request->user()->id;
        $jadwal = JadwalAsesmen::create($validated);

        return response()->json(['message' => 'Jadwal asesmen berhasil dibuat', 'data' => $jadwal], 201);
    }

    public function update(Request $request, JadwalAsesmen $jadwal): JsonResponse
    {
        $validated = $request->validate([
            'tanggal' => 'sometimes|date',
            'waktu' => 'sometimes|string|max:30',
            'tempat' => 'sometimes|string',
            'link_meeting' => 'nullable|string|max:255',
            'catatan' => 'nullable|string',
        ]);

        $jadwal->update($validated);

        return response()->json(['message' => 'Jadwal berhasil diperbarui', 'data' => $jadwal->fresh()]);
    }

    public function destroy(JadwalAsesmen $jadwal): JsonResponse
    {
        $jadwal->delete();
        return response()->json(['message' => 'Jadwal berhasil dihapus']);
    }
}
