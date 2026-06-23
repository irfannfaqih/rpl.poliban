<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\PendaftaranService;
use App\Services\RegistrationEligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private PendaftaranService $pendaftaranService,
        private RegistrationEligibilityService $registrationEligibility,
    ) {}
    /**
     * Login — return Sanctum token + user info
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            "email" => "required|email|max:254",
            "password" => "required|string",
        ]);

        $user = User::with("prodi")->where("email", $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                "email" => ["Email atau password salah."],
            ]);
        }

        if ($user->status === "nonaktif") {
            throw ValidationException::withMessages([
                "email" => [
                    "Akun Anda telah dinonaktifkan. Hubungi administrator.",
                ],
            ]);
        }

        // Revoke previous tokens (single device login)
        $user->tokens()->delete();

        $token = $user->createToken("auth-token")->plainTextToken;

        $status_alur = null;
        if ($user->role === 'pemohon') {
            $pendaftaran = \App\Models\Pendaftaran::where('user_id', $user->id)->first();
            $status_alur = $pendaftaran ? $pendaftaran->status_alur : null;
        }

        return response()->json([
            "message" => "Login berhasil",
            "token" => $token,
            "user" => [
                "id" => $user->id,
                "nama" => $user->nama,
                "email" => $user->email,
                "nip" => $user->nip,
                "role" => $user->role,
                "status_alur" => $status_alur,
                "prodi" => $user->prodi
                    ? [
                        "id" => $user->prodi->id,
                        "kode" => $user->prodi->kode,
                        "nama" => $user->prodi->nama,
                    ]
                    : null,
                "jabatan" => $user->jabatan,
                "force_change_password" => $user->force_change_password,
            ],
        ]);
    }

    /**
     * Register Pemohon
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "nama" => "required|string|max:150",
            "email" => "required|email|max:254|unique:users,email",
            "password" => "required|string|min:8",
            "prodi_id" => "required|integer|exists:prodi,id",
            "gelombang_id" => "required|integer|exists:gelombang,id",
        ]);

        $user = DB::transaction(function () use ($validated) {
            $this->registrationEligibility->validate(
                $validated['gelombang_id'],
                $validated['prodi_id'],
            );

            $user = User::create([
                "nama" => $validated["nama"],
                "email" => $validated["email"],
                "password" => Hash::make($validated["password"]),
                "role" => "pemohon",
                "status" => "aktif",
            ]);

            $nomor = $this->pendaftaranService->generateNomor(
                $validated["prodi_id"],
            );
            \App\Models\Pendaftaran::create([
                "user_id" => $user->id,
                "gelombang_id" => $validated["gelombang_id"],
                "prodi_id" => $validated["prodi_id"],
                "nomor_pendaftaran" => $nomor,
                "status_alur" => "waiting_payment",
            ]);

            return $user;
        });

        // Kirim email selamat datang
        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->queue(
                new \App\Mail\WelcomeMail($user),
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning(
                "Gagal kirim WelcomeMail: " . $e->getMessage(),
            );
        }

        $token = $user->createToken("auth-token")->plainTextToken;

        return response()->json(
            [
                "message" => "Registrasi berhasil",
                "token" => $token,
                "user" => [
                    "id" => $user->id,
                    "nama" => $user->nama,
                    "email" => $user->email,
                    "role" => $user->role,
                ],
            ],
            201,
        );
    }

    /**
     * Logout — revoke current token
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(["message" => "Logout berhasil"]);
    }

    /**
     * Me — get authenticated user info
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load("prodi");

        // Lazy sync: untuk pemohon, pastikan users.nama selalu konsisten dengan
        // borang_data_diri.nama_lengkap (sumber otoritatif nama lengkap pemohon).
        // Ini menangani kasus historis di mana nama borang sudah diubah tapi
        // users.nama belum terupdate.
        if ($user->role === 'pemohon') {
            $dataDiri = \App\Models\BorangDataDiri::whereHas(
                'pendaftaran',
                fn($q) => $q->where('user_id', $user->id)
            )->latest('id')->first();

            if ($dataDiri && !empty($dataDiri->nama_lengkap) && $dataDiri->nama_lengkap !== $user->nama) {
                $user->update(['nama' => $dataDiri->nama_lengkap]);
                $user->refresh();
            }
        }

        $status_alur = null;
        if ($user->role === 'pemohon') {
            $pendaftaran = \App\Models\Pendaftaran::where('user_id', $user->id)->first();
            $status_alur = $pendaftaran ? $pendaftaran->status_alur : null;
        }

        return response()->json([
            "user" => [
                "id" => $user->id,
                "nama" => $user->nama,
                "email" => $user->email,
                "nip" => $user->nip,
                "role" => $user->role,
                "status_alur" => $status_alur,
                "prodi" => $user->prodi
                    ? [
                        "id" => $user->prodi->id,
                        "kode" => $user->prodi->kode,
                        "nama" => $user->prodi->nama,
                    ]
                    : null,
                "jabatan" => $user->jabatan,
                "phone" => $user->phone,
                "alamat" => $user->alamat,
                "tempat_lahir" => $user->tempat_lahir,
                "tanggal_lahir" => $user->tanggal_lahir,
                "jenis_kelamin" => $user->jenis_kelamin,
                "pendidikan_terakhir" => $user->pendidikan_terakhir,
                "bidang_keilmuan" => $user->bidang_keilmuan,
                "instansi" => $user->instansi,
                "jabatan_instansi" => $user->jabatan_instansi,
                "asosiasi_profesi" => $user->asosiasi_profesi,
                "photo" => $user->photo,
                "force_change_password" => $user->force_change_password,
            ],
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            "nama" => "required|string|max:150",
            "jenis_kelamin" => "nullable|string|in:Laki-Laki,Perempuan",
            "tempat_lahir" => "nullable|string|max:255",
            "tanggal_lahir" => "nullable|date",
            "phone" => "nullable|string|max:20",
            "alamat" => "nullable|string",
            "jabatan" => "nullable|string|max:255",
            "nip" => "nullable|string|max:255",
            "bidang_keilmuan" => "nullable|string|max:255",
            "pendidikan_terakhir" => "nullable|string|max:255",
            "instansi" => "nullable|string|max:255",
            "jabatan_instansi" => "nullable|string|max:255",
            "asosiasi_profesi" => "nullable|string|max:255",
        ]);

        $user->update($validated);

        return response()->json([
            "message" => "Profil berhasil diperbarui",
            "user" => $user
        ]);
    }

    /**
     * Update user photo
     */
    public function updatePhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $user = $request->user();

        if ($request->hasFile('photo')) {
            if ($user->photo) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->photo);
            }
            
            $path = $request->file('photo')->store('avatars', 'public');
            $user->photo = $path;
            $user->save();
        }

        return response()->json([
            "message" => "Foto profil berhasil diperbarui",
            "photo" => $user->photo
        ]);
    }

    /**
     * Update user password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            "current_password" => "required|string",
            "new_password" => "required|string|min:8|confirmed",
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                "current_password" => ["Password saat ini tidak sesuai."],
            ]);
        }

        $user->password = Hash::make($request->new_password);
        $user->force_change_password = false;
        $user->save();

        return response()->json([
            "message" => "Password berhasil diubah",
        ]);
    }

    /**
     * Kirim tautan reset password sekali pakai ke email pengguna.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            "email" => "required|email|max:254",
        ]);

        $status = Password::sendResetLink($request->only("email"));

        Log::info('password.reset.link.requested', [
            'context' => 'forgot_password',
            'status' => $status,
            'email_hash' => hash('sha256', strtolower($request->input('email'))),
            'email_domain' => substr(strrchr($request->input('email'), '@') ?: '', 1) ?: null,
        ]);

        if ($status === Password::RESET_THROTTLED) {
            return response()->json([
                "message" => "Permintaan reset password terlalu sering. Silakan tunggu beberapa saat sebelum mencoba lagi.",
            ], 429);
        }

        if ($status === Password::RESET_LINK_SENT || $status === Password::INVALID_USER) {
            return response()->json([
                "message" => "Jika email terdaftar, instruksi reset password telah dikirimkan.",
            ]);
        }

        return response()->json([
            "message" => "Tautan reset belum dapat dikirim. Silakan coba lagi nanti.",
        ], 503);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "token" => "required|string",
            "email" => "required|email|max:254",
            "password" => "required|string|min:8|confirmed",
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password) {
                $user->forceFill([
                    "password" => Hash::make($password),
                    "force_change_password" => false,
                    "remember_token" => Str::random(60),
                ])->save();

                $user->tokens()->delete();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                "email" => ["Tautan reset tidak valid atau sudah kedaluwarsa."],
            ]);
        }

        return response()->json([
            "message" => "Password berhasil diubah. Silakan masuk kembali.",
        ]);
    }
}
