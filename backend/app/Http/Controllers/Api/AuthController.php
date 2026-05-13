<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login — return Sanctum token + user info
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('prodi')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if ($user->status === 'nonaktif') {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda telah dinonaktifkan. Hubungi administrator.'],
            ]);
        }

        // Revoke previous tokens (single device login)
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'nama' => $user->nama,
                'email' => $user->email,
                'nip' => $user->nip,
                'role' => $user->role,
                'prodi' => $user->prodi ? [
                    'id' => $user->prodi->id,
                    'kode' => $user->prodi->kode,
                    'nama' => $user->prodi->nama,
                ] : null,
                'jabatan' => $user->jabatan,
                'force_change_password' => $user->force_change_password,
            ],
        ]);
    }

    /**
     * Logout — revoke current token
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil']);
    }

    /**
     * Me — get authenticated user info
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('prodi');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'nama' => $user->nama,
                'email' => $user->email,
                'nip' => $user->nip,
                'role' => $user->role,
                'prodi' => $user->prodi ? [
                    'id' => $user->prodi->id,
                    'kode' => $user->prodi->kode,
                    'nama' => $user->prodi->nama,
                ] : null,
                'jabatan' => $user->jabatan,
                'phone' => $user->phone,
                'force_change_password' => $user->force_change_password,
            ],
        ]);
    }
}
