<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PenggunaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('prodi');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('nama', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
        }
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $data = $query->orderByDesc('created_at')->get()->map(fn($u) => [
            'id' => $u->id,
            'nama' => $u->nama,
            'email' => $u->email,
            'nip' => $u->nip,
            'role' => $u->role,
            'prodi' => $u->prodi ? ['id' => $u->prodi->id, 'kode' => $u->prodi->kode, 'nama' => $u->prodi->nama] : null,
            'jabatan' => $u->jabatan,
            'phone' => $u->phone,
            'status' => $u->status,
            'created_at' => $u->created_at,
        ]);

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'nip' => 'nullable|string|max:20|unique:users,nip',
            'role' => ['required', Rule::in(['pemohon', 'admin_prodi', 'asesor', 'pimpinan', 'super_admin'])],
            'prodi_id' => 'nullable|exists:prodi,id',
            'jabatan' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['force_change_password'] = true;

        $user = User::create($validated);

        return response()->json([
            'message' => 'Pengguna berhasil ditambahkan',
            'data' => $user->load('prodi'),
        ], 201);
    }

    public function show(User $pengguna): JsonResponse
    {
        return response()->json(['data' => $pengguna->load('prodi')]);
    }

    public function update(Request $request, User $pengguna): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$pengguna->id}",
            'nip' => "nullable|string|max:20|unique:users,nip,{$pengguna->id}",
            'role' => ['sometimes', Rule::in(['pemohon', 'admin_prodi', 'asesor', 'pimpinan', 'super_admin'])],
            'prodi_id' => 'nullable|exists:prodi,id',
            'jabatan' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'status' => 'sometimes|in:aktif,nonaktif',
        ]);

        $pengguna->update($validated);

        return response()->json([
            'message' => 'Pengguna berhasil diperbarui',
            'data' => $pengguna->fresh()->load('prodi'),
        ]);
    }

    public function destroy(User $pengguna): JsonResponse
    {
        if ($pengguna->id === auth()->id()) {
            return response()->json(['message' => 'Tidak dapat menghapus akun sendiri.'], 422);
        }

        $pengguna->delete(); // soft delete

        return response()->json(['message' => 'Pengguna berhasil dihapus']);
    }

    public function resetPassword(User $pengguna): JsonResponse
    {
        $tempPassword = 'poliban' . rand(1000, 9999);
        $pengguna->update([
            'password' => Hash::make($tempPassword),
            'force_change_password' => true,
        ]);

        // TODO: Send email with temp password

        return response()->json([
            'message' => 'Password berhasil direset',
            'temp_password' => $tempPassword, // hanya di dev, production kirim via email
        ]);
    }

    public function toggleStatus(User $pengguna): JsonResponse
    {
        if ($pengguna->id === auth()->id()) {
            return response()->json(['message' => 'Tidak dapat menonaktifkan akun sendiri.'], 422);
        }

        $newStatus = $pengguna->status === 'aktif' ? 'nonaktif' : 'aktif';
        $pengguna->update(['status' => $newStatus]);

        return response()->json([
            'message' => "Status pengguna diubah menjadi {$newStatus}",
            'data' => $pengguna->fresh()->load('prodi'),
        ]);
    }
}
