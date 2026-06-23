<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;

class PenggunaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with("prodi");

        if ($request->filled("search")) {
            $s = $request->search;
            $query->where(
                fn($q) => $q
                    ->where("nama", "like", "%{$s}%")
                    ->orWhere("email", "like", "%{$s}%"),
            );
        }
        if ($request->filled("role")) {
            $query->where("role", $request->role);
        }
        if ($request->filled("status")) {
            $query->where("status", $request->status);
        }

        $data = $query->orderByDesc("created_at")->paginate($request->get('per_page', 100));

        $data->getCollection()->transform(fn($u) => [
            "id" => $u->id,
            "nama" => $u->nama,
            "email" => $u->email,
            "nip" => $u->nip,
            "role" => $u->role,
            "prodi" => $u->prodi
                ? [
                    "id" => $u->prodi->id,
                    "kode" => $u->prodi->kode,
                    "nama" => $u->prodi->nama,
                ]
                : null,
            "jabatan" => $u->jabatan,
            "phone" => $u->phone,
            "status" => $u->status,
            "created_at" => $u->created_at,
        ]);

        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->has('nip')) {
            $request->merge(['nip' => $this->normalizeNip($request->input('nip'))]);
        }

        $validated = $request->validate([
            "nama" => "required|string|max:150",
            "email" => "required|email|max:254|unique:users,email",
            "password" => "required|string|min:8",
            "nip" => [
                "nullable",
                "string",
                "max:18",
                Rule::unique("users", "nip")->whereNotNull("nip"),
            ],
            "role" => [
                "required",
                Rule::in([
                    "pemohon",
                    "admin_prodi",
                    "kaprodi",
                    "asesor",
                    "pimpinan",
                    "super_admin",
                ]),
            ],
            "prodi_id" => "nullable|exists:prodi,id",
            "jabatan" => "nullable|string|max:100",
            "phone" => "nullable|string|max:15",
        ]);

        $validated["password"] = Hash::make($validated["password"]);
        $validated["force_change_password"] = true;

        $user = User::create($validated);

        return response()->json(
            [
                "message" => "Pengguna berhasil ditambahkan",
                "data" => $user->load("prodi"),
            ],
            201,
        );
    }

    public function show(User $pengguna): JsonResponse
    {
        return response()->json(["data" => $pengguna->load("prodi")]);
    }

    public function update(Request $request, User $pengguna): JsonResponse
    {
        if ($request->has('nip')) {
            $request->merge(['nip' => $this->normalizeNip($request->input('nip'))]);
        }

        $validated = $request->validate([
            "nama" => "sometimes|string|max:150",
            "email" => "sometimes|email|max:254|unique:users,email,{$pengguna->id}",
            "nip" => [
                "nullable",
                "string",
                "max:18",
                Rule::unique("users", "nip")
                    ->ignore($pengguna->id)
                    ->whereNotNull("nip"),
            ],
            "role" => [
                "sometimes",
                Rule::in([
                    "pemohon",
                    "admin_prodi",
                    "kaprodi",
                    "asesor",
                    "pimpinan",
                    "super_admin",
                ]),
            ],
            "prodi_id" => "nullable|exists:prodi,id",
            "jabatan" => "nullable|string|max:100",
            "phone" => "nullable|string|max:15",
            "status" => "sometimes|in:aktif,nonaktif",
        ]);

        $pengguna->update($validated);

        return response()->json([
            "message" => "Pengguna berhasil diperbarui",
            "data" => $pengguna->fresh()->load("prodi"),
        ]);
    }

    public function destroy(User $pengguna): JsonResponse
    {
        if ($pengguna->id === auth()->id()) {
            return response()->json(
                ["message" => "Tidak dapat menghapus akun sendiri."],
                422,
            );
        }

        if ($pengguna->pendaftaran()->exists()) {
            return response()->json([
                'message' => 'Pengguna dengan riwayat pendaftaran tidak dapat dihapus. Nonaktifkan akun sebagai gantinya.',
            ], 422);
        }

        try {
            // Hard delete — hapus permanen dari database
            $pengguna->forceDelete();
        } catch (\Illuminate\Database\QueryException $e) {
            if (
                str_contains($e->getMessage(), "1451") ||
                str_contains($e->getMessage(), "foreign key constraint")
            ) {
                return response()->json(
                    [
                        "message" =>
                            "Pengguna tidak dapat dihapus karena masih memiliki data aktif (penugasan, pendaftaran, dll). Nonaktifkan akun sebagai gantinya.",
                    ],
                    422,
                );
            }
            throw $e;
        }

        return response()->json(["message" => "Pengguna berhasil dihapus"]);
    }

    public function resetPassword(User $pengguna): JsonResponse
    {
        $status = Password::sendResetLink(["email" => $pengguna->email]);

        Log::info('password.reset.link.requested', [
            'context' => 'super_admin_reset',
            'status' => $status,
            'user_id' => $pengguna->id,
            'email_hash' => hash('sha256', strtolower($pengguna->email)),
            'email_domain' => substr(strrchr($pengguna->email, '@') ?: '', 1) ?: null,
        ]);

        if ($status === Password::RESET_THROTTLED) {
            return response()->json(
                [
                    "message" => "Permintaan reset password terlalu sering. Silakan tunggu beberapa saat sebelum mencoba lagi.",
                ],
                429,
            );
        }

        if ($status !== Password::RESET_LINK_SENT) {
            return response()->json(
                [
                    "message" => "Tautan reset belum dapat dikirim. Password pengguna tidak diubah.",
                ],
                503,
            );
        }

        return response()->json([
            "message" => "Tautan reset password berhasil dikirim ke email pengguna.",
        ]);
    }

    public function toggleStatus(User $pengguna): JsonResponse
    {
        if ($pengguna->id === auth()->id()) {
            return response()->json(
                ["message" => "Tidak dapat menonaktifkan akun sendiri."],
                422,
            );
        }

        $newStatus = $pengguna->status === "aktif" ? "nonaktif" : "aktif";
        $pengguna->update(["status" => $newStatus]);

        return response()->json([
            "message" => "Status pengguna diubah menjadi {$newStatus}",
            "data" => $pengguna->fresh()->load("prodi"),
        ]);
    }

    private function normalizeNip(mixed $nip): ?string
    {
        $normalized = is_string($nip) ? trim($nip) : null;

        return $normalized === null || $normalized === '' || $normalized === '-'
            ? null
            : $normalized;
    }
}
