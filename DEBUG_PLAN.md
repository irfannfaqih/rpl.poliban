# IMPLEMENTATION PLAN — RPL System Bug Fixes & Feature Completion

> **Dokumen ini adalah panduan implementasi lengkap untuk perbaikan bug, penambahan fitur, dan pembersihan technical debt pada sistem RPL (Rekognisi Pembelajaran Lampau).**
>
> Baca dokumen ini sebelum memulai development. Setiap item memiliki konteks file, kode sebelum/sesudah, dan alasan perubahan. Jalankan Phase secara berurutan — Phase 1 dan 2 adalah prasyarat untuk semua phase berikutnya.

---

## Urutan Eksekusi yang Disarankan

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
```

- **Phase 1–4**: Backend-first, harus selesai sebelum frontend disentuh lebih jauh
- **Phase 2**: Semua migration harus dijalankan (`php artisan migrate`) sebelum development fitur lanjutan
- **Phase 5–6**: Bisa paralel setelah Phase 1–4 selesai
- **Phase 7**: Cleanup — aman dilakukan kapan saja tapi disarankan setelah Phase 1–4
- **Phase 8–9**: Fitur besar dan optimasi — lakukan terakhir

---

## 🔴 Phase 1 — Keamanan & Auth Guard

**Scope:** Celah keamanan aktif + halaman yang bisa diakses tanpa login
**Estimasi:** 2 hari
**Sumber:** Code Audit
**Prioritas:** CRITICAL — harus diselesaikan pertama sebelum apapun

---

### 1.1 — Jangan Expose `temp_password` di API Response

**File:** `app/Http/Controllers/Api/SuperAdmin/PenggunaController.php`
**Masalah:** `temp_password` dikembalikan langsung di JSON response. Siapapun yang bisa intercept traffic (proxy, log aggregator, browser devtools) bisa membaca password ini.
**Solusi:** Kirim password via email, jangan pernah expose di response body.

```php
// ❌ HAPUS — BERBAHAYA:
return response()->json(['temp_password' => $tempPassword]);

// ✅ GANTI DENGAN:
Mail::to($pengguna->email)->send(new ResetPasswordMail($pengguna, $tempPassword));
return response()->json(['message' => 'Password direset, dikirim ke email pengguna.']);
```

**Langkah tambahan:**
1. Buat class `App\Mail\ResetPasswordMail`
2. Buat blade view `resources/views/mail/reset-password.blade.php`
3. Pastikan `.env` sudah dikonfigurasi untuk mail driver (SMTP/Mailgun/SES)
4. Test kirim email di environment staging sebelum deploy

---

### 1.2 — Tambah Validasi `mimes` pada Semua Upload

**File:** `app/Http/Controllers/Api/BorangController.php`, `app/Http/Controllers/Api/ArsipController.php`
**Masalah:** Tanpa validasi `mimes`, user bisa mengupload file executable, script PHP, atau file berbahaya lainnya yang bisa dieksekusi di server jika disimpan di direktori publik.

```php
// ✅ BorangController::uploadDokumen() — tambah/update rule:
'file' => 'required|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',

// ✅ ArsipController::upload() — sudah ada mimes tapi perlu disinkronkan:
'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
```

**Catatan tambahan:**
- `max:10240` = maksimal 10MB. Sesuaikan dengan kebutuhan bisnis.
- Pastikan file disimpan di luar `public/` atau gunakan `Storage::disk('private')` untuk dokumen sensitif.
- Pertimbangkan tambahan validasi antivirus scan untuk production.

---

### 1.3 — Rate Limiting Endpoint Autentikasi

**File:** `routes/api.php`
**Masalah:** Tanpa rate limiting, endpoint login/register rentan terhadap brute-force attack dan credential stuffing.

```php
// ✅ Tambahkan throttle middleware:
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});
```

**Penjelasan:** `throttle:10,1` = maksimal 10 request per 1 menit per IP. Sesuaikan angka ini dengan kebutuhan — jika ada banyak user dari IP yang sama (NAT/proxy kantor), pertimbangkan `throttle:30,1`.

---

### 1.4 — Fix Race Condition `nomor_pendaftaran`

**File:** `app/Http/Controllers/Api/AuthController.php`, `app/Http/Controllers/Api/BorangController.php`
**Masalah:** Menggunakan `rand()` atau `count() + 1` untuk generate nomor pendaftaran menyebabkan race condition — jika dua request masuk bersamaan, keduanya bisa mendapat nomor yang sama. Ini melanggar uniqueness dan menyebabkan data kotor.

```php
// ✅ Buat file baru: app/Services/PendaftaranService.php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class PendaftaranService
{
    /**
     * Generate nomor pendaftaran unik dengan format RPL-YYYY-XXXX.
     * Menggunakan DB::table query yang aman dari race condition
     * karena dijalankan dalam konteks transaksi DB.
     *
     * @return string Contoh: RPL-2026-0042
     */
    public function generateNomor(): string
    {
        $tahun = date('Y');
        $seq = DB::table('pendaftaran')
            ->where('nomor_pendaftaran', 'like', "RPL-{$tahun}-%")
            ->count() + 1;
        return 'RPL-' . $tahun . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
```

**Langkah tambahan:**
1. Daftarkan service di `AppServiceProvider` atau gunakan dependency injection langsung
2. Inject `PendaftaranService` di `AuthController` dan `BorangController`
3. Hapus semua penggunaan `rand()` untuk generate nomor pendaftaran
4. Untuk production dengan traffic tinggi, pertimbangkan menggunakan DB transaction dengan `LOCK IN SHARE MODE` atau sequence table tersendiri

---

### 1.5 — Pisahkan Penanganan 401 vs 403 di Interceptor

**File:** `frontend/src/lib/api.ts`
**Masalah:** Saat ini 401 dan 403 keduanya menyebabkan redirect ke login. Ini salah — 403 berarti user sudah login tapi tidak punya akses, bukan berarti sesi expired. Redirect ke login pada 403 membingungkan user.

```typescript
// ✅ Pisahkan logic:

// 401 = token tidak valid / expired → paksa logout
if (error.response?.status === 401) {
    sessionStorage.clear();
    if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login?session_expired=1';
    }
}

// 403 = akses ditolak (sesi masih valid, tapi tidak punya izin)
// → JANGAN redirect ke login, biarkan UI menampilkan pesan "Akses Ditolak"
// Hapus || error.response?.status === 403 dari kondisi redirect yang ada
```

**Catatan:** Di halaman login, baca query param `?session_expired=1` untuk menampilkan toast/alert "Sesi Anda telah berakhir, silakan login kembali."

---

### 1.6 — Buat Auth Guard di Semua Layout Frontend

**File baru:** `frontend/src/components/AuthGuard.tsx`
**Masalah:** Halaman-halaman dashboard bisa diakses langsung via URL tanpa login, karena tidak ada guard yang memverifikasi sesi di sisi client.

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Komponen ini wajib di-wrap di setiap layout yang membutuhkan autentikasi.
 * Akan redirect ke login jika tidak terautentikasi,
 * atau redirect ke dashboard yang sesuai jika role tidak cocok.
 */
export function AuthGuard({ children, allowedRoles }: {
    children: React.ReactNode;
    allowedRoles: string[];
}) {
    const { user, isAuthenticated, fetchMe } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/auth/login');
            return;
        }
        if (user && !allowedRoles.includes(user.role)) {
            router.replace(getRoleDashboard(user.role));
        }
    }, [isAuthenticated, user]);

    // Tampilkan loading state saat mengecek autentikasi
    if (!isAuthenticated || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <span className="text-muted-foreground text-sm">Memuat...</span>
            </div>
        );
    }

    return <>{children}</>;
}
```

**Wajib diterapkan di semua layout berikut:**
- `app/pemohon/layout.tsx` → `allowedRoles={['pemohon']}`
- `app/asesor/layout.tsx` → `allowedRoles={['asesor']}`
- `app/admin-prodi/layout.tsx` → `allowedRoles={['admin_prodi']}`
- `app/super-admin/layout.tsx` → `allowedRoles={['super_admin']}`
- `app/pimpinan/layout.tsx` → `allowedRoles={['pimpinan']}`

---

### 1.7 — Hapus `withCredentials: true`

**File:** `frontend/src/lib/api.ts`
**Masalah:** Aplikasi ini menggunakan token-based auth (Bearer token di header), bukan cookie-based auth. `withCredentials: true` hanya dibutuhkan untuk cookie/session auth dan menyebabkan preflight CORS request yang tidak perlu, yang memperlambat setiap request API.

```typescript
// ❌ HAPUS baris ini dari konfigurasi axios/fetch:
withCredentials: true,
```

---

## 🔴 Phase 2 — Schema: Missing Fields Kritis (PRD Oversight)

**Scope:** Kolom yang hilang dari DB menyebabkan fitur PRD tidak bisa berjalan sama sekali
**Estimasi:** 2–3 hari
**Sumber:** PRD Deviation + DB Audit
**PENTING:** Semua migration di Phase 2 harus dijalankan (`php artisan migrate`) sebelum development fitur lanjutan apapun dimulai.

---

### 2.1 — `mata_kuliah`: 7 Kolom Hilang + Fix Unique Scope

**Referensi PRD:** Bab 4.3 Halaman 2.2 — Oversight
**Masalah:** Tabel `mata_kuliah` saat ini hanya punya: `id, prodi_id, kode, nama, sks, deskripsi`. Semua kolom penting untuk Form 13 dan Section C borang pemohon tidak ada. Selain itu, kolom `kode` bersifat unique secara global, padahal seharusnya hanya unique per prodi (dua prodi bisa punya MK dengan kode yang sama).

```php
// ✅ Migration baru: add_fields_to_mata_kuliah_table

Schema::table('mata_kuliah', function (Blueprint $table) {
    $table->tinyInteger('semester')->unsigned()->nullable()->after('sks');
    // Nilai: 1–8. Nullable untuk MK lintas semester atau pilihan.

    $table->tinyInteger('level_kkni')->unsigned()->nullable()->after('semester');
    // Nilai: 1–9 sesuai KKNI Indonesia.

    $table->text('cp_sikap')->nullable()->after('deskripsi');
    // Capaian Pembelajaran: Sikap

    $table->text('cp_pengetahuan')->nullable()->after('cp_sikap');
    // Capaian Pembelajaran: Pengetahuan

    $table->text('cp_keterampilan')->nullable()->after('cp_pengetahuan');
    // Capaian Pembelajaran: Keterampilan Umum + Khusus

    $table->text('indikator_kinerja')->nullable()->after('cp_keterampilan');
    // Indikator Kinerja Minimal (IKM)

    $table->string('profil_lulusan')->nullable()->after('indikator_kinerja');
    // Profil lulusan yang relevan dengan MK ini

    $table->boolean('is_active')->default(true)->after('profil_lulusan');
    // Untuk toggle aktif/nonaktif MK tanpa hapus data (lihat Phase 6.5)

    // FIX: kode seharusnya unique per prodi, bukan globally unique
    $table->dropUnique(['kode']); // hapus unique constraint lama
    $table->unique(['prodi_id', 'kode']); // unique per prodi — benar
});
```

**Langkah tambahan:**
- Update `KurikulumController::store()` dan `update()` untuk menerima dan menyimpan field baru
- Update `cpmkStore()` untuk menggunakan validasi `unique(['mata_kuliah_id', 'kode'])` bukan unique global
- Update resource/transformer jika ada untuk menyertakan field baru di response

---

### 2.2 — `borang_data_diri`: 4 Kolom Hilang

**Referensi PRD:** Bab 4.1 Section A — Oversight
**Masalah:** Form data diri pemohon di PRD meminta agama, kebangsaan, kode pos, dan no telepon rumah, tapi kolom-kolom ini tidak ada di tabel.

```php
// ✅ Migration baru: add_fields_to_borang_data_diri_table

Schema::table('borang_data_diri', function (Blueprint $table) {
    $table->enum('agama', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'])
          ->nullable()->after('jenis_kelamin');

    $table->string('kebangsaan', 50)->default('Indonesia')->after('agama');
    // Default Indonesia karena mayoritas pemohon WNI

    $table->char('kode_pos', 5)->nullable()->after('alamat');
    // Kode pos Indonesia selalu 5 digit

    $table->string('no_telp_rumah', 20)->nullable()->after('no_hp');
    // Opsional — tidak semua pemohon punya telepon rumah
});
```

**Langkah tambahan:**
- Update `BorangController::saveDataDiri()`: tambahkan validasi untuk field baru
- Update `BorangDataDiri::$fillable`: tambahkan `agama`, `kebangsaan`, `kode_pos`, `no_telp_rumah`
- Update frontend form Section A untuk menampilkan field baru

---

### 2.3 — `dokumen.tipe`: Tambah `ktp` dan `portofolio_p01`–`p10`

**Referensi PRD:** Bab 4.1 Section A (KTP wajib) + Section D (P01–P10) — Oversight
**Masalah:** Enum `tipe` saat ini: `['ijazah', 'transkrip', 'sertifikat', 'portofolio', 'tambahan']`. KTP tidak ada sebagai tipe sendiri. Portofolio P01–P10 tidak terdistingkasi — semua dimasukkan sebagai `portofolio` generik sehingga tidak bisa ditrack per unit kompetensi.

```php
// ✅ Migration baru: update_dokumen_tipe_enum
// Tidak perlu truncate tabel — cukup modifikasi enum MySQL langsung:

DB::statement("ALTER TABLE dokumen MODIFY COLUMN tipe ENUM(
    'ktp',
    'ijazah',
    'transkrip',
    'sertifikat',
    'portofolio_p01',
    'portofolio_p02',
    'portofolio_p03',
    'portofolio_p04',
    'portofolio_p05',
    'portofolio_p06',
    'portofolio_p07',
    'portofolio_p08',
    'portofolio_p09',
    'portofolio_p10',
    'tambahan'
) NOT NULL");
```

**Langkah tambahan:**
- Update `BorangController::uploadDokumen()`: perbarui validasi `in:` untuk menyertakan nilai baru
- Update frontend store dan form upload untuk mengirim tipe yang benar per upload
- Jika ada data `portofolio` lama di DB, buat migration script untuk migrasi ke `portofolio_p01` dst.

---

### 2.4 — `transkrip_asal`: Tambah `kode_mk`

**Referensi PRD:** Bab 4.1 Section B.1 — Oversight
**Masalah:** Transkrip nilai dari kampus asal tidak menyimpan kode mata kuliah, hanya nama MK. Ini menyulitkan proses pemetaan dan verifikasi.

```php
// ✅ Migration baru: add_kode_mk_to_transkrip_asal_table

Schema::table('transkrip_asal', function (Blueprint $table) {
    $table->string('kode_mk', 20)->nullable()->after('pendaftaran_id');
    // Nullable karena transkrip lama mungkin tidak punya kode MK
});
```

**Langkah tambahan:**
- Update `BorangController::saveTranskrip()`: tambahkan `kode_mk` ke validasi dan simpan ke DB
- Update model `TranskripAsal::$fillable`
- Update frontend form Section B untuk menyertakan input kode MK

---

### 2.5 — `pengalaman_kerja`: Tambah `status_kepegawaian` + Granularitas Bulan

**Referensi PRD:** Bab 4.1 Section A.3 — Oversight
**Masalah:** PRD mensyaratkan input periode "MM/YYYY" (bulan + tahun) bukan hanya tahun. Juga butuh status kepegawaian untuk menentukan jenis pengalaman kerja.

```php
// ✅ Migration baru: add_fields_to_pengalaman_kerja_table

Schema::table('pengalaman_kerja', function (Blueprint $table) {
    $table->enum('status_kepegawaian', ['tetap', 'kontrak', 'freelance', 'magang'])
          ->nullable()->after('jabatan_peran');

    $table->tinyInteger('bulan_mulai')->unsigned()->nullable()->after('tahun_mulai');
    // Nilai: 1–12 (Januari–Desember)

    $table->tinyInteger('bulan_selesai')->unsigned()->nullable()->after('tahun_selesai');
    // Nullable karena mungkin masih bekerja di tempat tersebut
});
```

**Langkah tambahan:**
- Update controller dan model untuk menerima field baru
- Update frontend form: ganti input tahun menjadi MM/YYYY (bisa gunakan input type="month")
- Validasi: `bulan_mulai` dan `bulan_selesai` harus antara 1–12

---

### 2.6 — `uji_lanjutan_item`: Tambah `bobot_persen` + `panduan_penilaian`

**Referensi PRD:** Bab 4.4 Halaman 3.3a — Oversight
**Masalah:** Tanpa `bobot_persen`, nilai rata-rata berbobot tidak bisa dihitung. Ini memutus fitur scoring Form 09. Tanpa `panduan_penilaian`, asesor tidak punya rubrik untuk menilai.

```php
// ✅ Migration baru: add_fields_to_uji_lanjutan_item_table

Schema::table('uji_lanjutan_item', function (Blueprint $table) {
    $table->tinyInteger('bobot_persen')->unsigned()->nullable()->after('kunci_jawaban');
    // Nilai: 1–100. Total semua item dalam satu uji lanjutan sebaiknya = 100.

    $table->text('panduan_penilaian')->nullable()->after('bobot_persen');
    // Rubrik/panduan untuk asesor dalam menilai jawaban

    // Ganti field mata_kuliah (string) menjadi FK + pertahankan string sebagai fallback:
    $table->unsignedBigInteger('mata_kuliah_id')->nullable()->after('mata_kuliah');
    $table->foreign('mata_kuliah_id')
          ->references('id')
          ->on('mata_kuliah')
          ->nullOnDelete();
    // nullOnDelete: jika MK dihapus, item ujian tidak ikut terhapus
});
```

**Update scoring logic di `UjiLanjutanController::submitNilai()`:**

```php
// ✅ Hitung nilai akhir berbobot:
$totalBobot = collect($validated['items'])->sum('bobot_persen') ?: 100;
// Jika total bobot tidak 100, normalisasi secara otomatis

$nilaiAkhir = collect($validated['items'])
    ->sum(fn($item) => $item['skor'] * $item['bobot_persen']) / $totalBobot;
```

---

### 2.7 — `uji_lanjutan`: Tambah `konfirmasi_kehadiran` + `jenis_ujian`

**Referensi PRD:** Bab 4.2 Halaman 1.6 — Oversight
**Masalah:** Tidak ada cara untuk track apakah pemohon sudah konfirmasi kehadirannya untuk uji lanjutan. Jenis ujian (tulis/wawancara/praktek) juga tidak tersimpan.

```php
// ✅ Migration baru: add_fields_to_uji_lanjutan_table

Schema::table('uji_lanjutan', function (Blueprint $table) {
    $table->enum('jenis_ujian', ['tulis', 'wawancara', 'praktek'])
          ->nullable()->after('asesor_id');

    $table->boolean('konfirmasi_kehadiran')->default(false)->after('catatan_akhir');
    // true = pemohon sudah konfirmasi hadir

    $table->timestamp('konfirmasi_at')->nullable()->after('konfirmasi_kehadiran');
    // Timestamp saat konfirmasi dilakukan
});
```

**Langkah tambahan:**
- Tambah endpoint `POST /pemohon/uji-lanjutan/{id}/konfirmasi` (lihat Phase 6.3 untuk implementasi lengkap)

---

### 2.8 — `sanggah`: Tambah `asesor_id` + `diputus_at`

**Referensi PRD:** Bab 3.4 — Oversight
**Masalah:** Tidak ada FK ke asesor yang menangani sanggahan, dan tidak ada timestamp keputusan. Ini membuat sanggahan bisa direspon berkali-kali.

```php
// ✅ Migration baru: add_fields_to_sanggah_table

Schema::table('sanggah', function (Blueprint $table) {
    $table->foreignId('asesor_id')
          ->nullable()
          ->constrained('users')
          ->nullOnDelete()
          ->after('mata_kuliah_id');
    // Asesor yang bertanggung jawab memutuskan sanggahan ini

    $table->timestamp('diputus_at')->nullable()->after('respon_asesor');
    // Timestamp saat keputusan dibuat — digunakan sebagai lock
});
```

**Update `SanggahController::update()`:**

```php
// ✅ Guard: cegah double-decision
if ($sanggah->diputus_at !== null) {
    return response()->json(['message' => 'Sanggahan sudah diputus.'], 403);
}

$sanggah->update([
    'status'         => $validated['status'],
    'respon_asesor'  => $validated['respon_asesor'],
    'diputus_at'     => now(), // set timestamp keputusan
]);
```

**Update `PemohonExtraController::submitSanggah()`:**

```php
// ✅ Sertakan asesor_id saat membuat sanggahan:
$sanggah = Sanggah::create([
    // ...field lainnya...
    'asesor_id' => $asesor->id, // ambil dari penugasan_asesor yang aktif
]);
```

---

### 2.9 — `pra_asesmen`: Tambah `submitted_at`

**Referensi PRD:** Bab 3.2 — Oversight
**Masalah:** Field `is_submitted` hanya berupa boolean — tidak ada timestamp kapan submit terjadi. Timestamp diperlukan untuk audit trail dan deadline enforcement.

```php
// ✅ Migration baru: add_submitted_at_to_pra_asesmen_table

Schema::table('pra_asesmen', function (Blueprint $table) {
    $table->timestamp('submitted_at')->nullable()->after('is_submitted');
    // Set saat is_submitted diubah menjadi true
});
```

**Update `WorkspaceController::savePraAsesmen()` saat submit:**

```php
// ✅ Set submitted_at bersamaan dengan is_submitted:
$pra->update([
    'is_submitted' => true,
    'submitted_at' => now(),
]);
```

---

### 2.10 — `pendaftaran`: Tambah `pra_pemetaan_payload`

**Referensi PRD:** Bab 4.3 Halaman 2.3 — Oversight (opsional tapi eksplisit di PRD)
**Masalah:** PRD menyebutkan payload pra-pemetaan yang harus disimpan saat verifikasi admin, tapi kolom tidak ada.

```php
// ✅ Migration baru: add_pra_pemetaan_payload_to_pendaftaran_table

Schema::table('pendaftaran', function (Blueprint $table) {
    $table->json('pra_pemetaan_payload')->nullable()->after('catatan_admin');
    // Menyimpan mapping awal MK asal → MK Poliban dari admin
    // Format: [{"mk_asal": "...", "mk_poliban_id": 123, "keterangan": "..."}, ...]
});
```

**Langkah tambahan:**
- Update `PendaftaranController::verifikasi()` untuk menerima dan menyimpan payload ini
- Dokumentasikan format JSON yang diharapkan di kode

---

### 2.11 — `evaluasi_portofolio`: Fix Enum ke Framework VATC

**Referensi PRD:** Bab 4.4 Halaman 3.2a — Oversight
**Masalah:** PRD mensyaratkan evaluasi menggunakan framework V/A/T/C (Valid/Autentik/Terkini/Cukup) per kategori portofolio. Saat ini hanya ada kolom `sesuai/tidak_sesuai` — kehilangan 4 dimensi evaluasi yang merupakan inti dari standar asesmen.

```php
// ✅ Migration baru: update_evaluasi_portofolio_to_vatc

Schema::table('evaluasi_portofolio', function (Blueprint $table) {
    $table->dropColumn('kesesuaian');
    // Hapus kolom lama yang tidak sesuai PRD

    $table->boolean('valid')->nullable()->after('status_dokumen');
    // V — apakah bukti valid (sesuai dengan yang diklaim)?

    $table->boolean('autentik')->nullable()->after('valid');
    // A — apakah bukti asli milik pemohon?

    $table->boolean('terkini')->nullable()->after('autentik');
    // T — apakah bukti masih relevan/terkini?

    $table->boolean('cukup')->nullable()->after('terkini');
    // C — apakah bukti cukup membuktikan kompetensi?

    $table->text('catatan_evaluasi')->nullable()->after('cukup');
    // Menggantikan kolom rekomendasi_at2 yang tidak sesuai
});
```

**Catatan:** Nullable karena asesor mungkin belum mengisi semua dimensi VATC sekaligus.

---

### 2.12 — Buat Tabel `banding_eksternal`

**Referensi PRD:** Bab 3.4 Jalur 2 — Oversight
**Masalah:** Tabel ini tidak ada sama sekali di schema. Fitur banding eksternal (jalur kedua setelah sanggah) tidak bisa berjalan tanpa tabel ini.

```php
// ✅ Migration baru: create_banding_eksternal_table

Schema::create('banding_eksternal', function (Blueprint $table) {
    $table->id();

    $table->foreignId('pendaftaran_id')
          ->constrained('pendaftaran')
          ->cascadeOnDelete();
    // Jika pendaftaran dihapus, banding juga dihapus

    $table->foreignId('user_id')
          ->constrained('users')
          ->restrictOnDelete();
    // Pemohon yang mengajukan banding. restrictOnDelete: user tidak bisa dihapus
    // selama masih punya banding aktif.

    $table->text('alasan');
    // Alasan pengajuan banding — wajib diisi

    $table->string('bukti_path')->nullable();
    // Path file bukti pendukung banding (opsional)

    $table->enum('status', ['diajukan', 'diproses', 'diterima', 'ditolak'])
          ->default('diajukan');

    $table->text('respon_pimpinan')->nullable();
    // Respon/keputusan dari pimpinan

    $table->foreignId('diproses_oleh')
          ->nullable()
          ->constrained('users')
          ->nullOnDelete();
    // Pimpinan/admin yang memproses banding ini

    $table->timestamp('diputus_at')->nullable();
    // Timestamp keputusan — digunakan sebagai lock

    $table->timestamps();
});
```

**Langkah tambahan:**
- Buat model `App\Models\BandingEksternal` dengan `$fillable` yang sesuai
- Buat `BandingEksternal` resource/controller
- Tambah endpoint di `PimpinanController` atau buat `BandingEksternalController` tersendiri
- Tambah endpoint pemohon: `POST /pemohon/banding` untuk mengajukan banding

---

### 2.13 — `audit_log`: Tambah `impersonated_by`

**Referensi PRD:** Bab 4.6 Halaman 4.4 Fitur Impersonate — Oversight
**Masalah:** Ketika Super Admin menggunakan fitur impersonate (lihat Phase 6.6), audit log harus mencatat siapa yang sebenarnya melakukan aksi (Super Admin asli), bukan hanya user yang di-impersonate.

```php
// ✅ Migration baru: add_impersonated_by_to_audit_log_table

Schema::table('audit_log', function (Blueprint $table) {
    $table->foreignId('impersonated_by')
          ->nullable()
          ->constrained('users')
          ->nullOnDelete()
          ->after('user_id');
    // Null = aksi normal. Berisi ID Super Admin jika mode impersonate aktif.
});
```

---

### 2.14 — Fix Migration `down()` Typo di `penilaian_cpmk`

**File:** `database/migrations/2026_05_22_021612_update_penilaian_cpmk_enum_to_diakui.php`
**Masalah:** Method `down()` mengacu ke tabel `diakui` yang tidak ada — typo fatal. Jika migration ini di-rollback, akan throw error dan seluruh rollback batch gagal.

```php
// ❌ SEBELUM — typo fatal:
Schema::table('diakui', ...); // tabel 'diakui' tidak ada!

// ✅ SESUDAH — benar:
public function down(): void
{
    Schema::table('penilaian_cpmk', function (Blueprint $table) {
        $table->dropColumn('nilai');
    });

    Schema::table('penilaian_cpmk', function (Blueprint $table) {
        // Kembalikan ke enum sebelumnya
        $table->enum('nilai', ['K', 'CK', 'C', 'M'])->nullable()->after('cpmk_id');
    });
}
```

---

## 🟠 Phase 3 — Schema: Indexes, Constraints & Naming

**Scope:** Index yang hilang menyebabkan query lambat saat data tumbuh; constraint yang hilang menyebabkan data kotor
**Estimasi:** 1 hari
**Sumber:** DB Audit
**Catatan:** Kumpulkan semua perubahan Phase 3 dalam satu migration besar untuk efisiensi.

---

### 3.1 — Tambah Semua Index yang Hilang

```php
// ✅ Migration: add_performance_indexes_and_constraints

// Notifications — query "notif yang belum dibaca user X" akan lambat tanpa ini
Schema::table('notifications', function (Blueprint $table) {
    $table->index(['user_id', 'is_read'], 'idx_notif_user_read');
    $table->index(['user_id', 'created_at'], 'idx_notif_user_created');
    // idx_notif_user_created: untuk sorting notifikasi terbaru
});

// Pendaftaran — query filter per prodi dan per status sering digunakan
Schema::table('pendaftaran', function (Blueprint $table) {
    $table->index(['prodi_id', 'status_alur'], 'idx_pend_prodi_status');
    $table->index(['user_id', 'status_alur'], 'idx_pend_user_status');
});

// Penugasan asesor — query "semua tugas asesor X"
Schema::table('penugasan_asesor', function (Blueprint $table) {
    $table->index('asesor_id', 'idx_penugasan_asesor');
});

// Pemetaan MK — compound index + unique constraint cegah duplikat
Schema::table('pemetaan_mk', function (Blueprint $table) {
    $table->index(['penugasan_asesor_id', 'mk_poliban_id'], 'idx_pemetaan_compound');
    $table->unique(['penugasan_asesor_id', 'mk_poliban_id'], 'uq_pemetaan');
    // uq_pemetaan: satu asesor tidak bisa memetakan MK yang sama dua kali
    // untuk satu penugasan yang sama
});

// Pleno MK — query pleno per pendaftaran
Schema::table('pleno_mk', function (Blueprint $table) {
    $table->index(['pendaftaran_id', 'mata_kuliah_id'], 'idx_pleno_compound');
});

// Evaluasi diri — query per pendaftaran
Schema::table('evaluasi_diri', function (Blueprint $table) {
    $table->index('pendaftaran_id', 'idx_evaluasi_pendaftaran');
});

// Transkrip asal — query per pendaftaran
Schema::table('transkrip_asal', function (Blueprint $table) {
    $table->index('pendaftaran_id', 'idx_transkrip_pendaftaran');
});

// Dokumen — query "semua dokumen tipe X untuk pendaftaran Y"
Schema::table('dokumen', function (Blueprint $table) {
    $table->index(['pendaftaran_id', 'tipe'], 'idx_dokumen_compound');
});

// CPMK — kode harus unique per MK
Schema::table('cpmk', function (Blueprint $table) {
    $table->unique(['mata_kuliah_id', 'kode'], 'uq_cpmk_per_mk');
    // Mencegah dua CPMK dengan kode yang sama dalam satu MK
});
```

---

### 3.2 — Rename `arsip_dokumens` ke `arsip_dokumen`

**Masalah:** Nama tabel menggunakan plural bahasa Inggris (`dokumens`) yang tidak konsisten dengan konvensi penamaan tabel lain di project ini.

```php
// ✅ Di migration yang sama:
Schema::rename('arsip_dokumens', 'arsip_dokumen');
```

**Update model:**

```php
// app/Models/ArsipDokumen.php — tambahkan:
protected $table = 'arsip_dokumen'; // override nama tabel
```

---

### 3.3 — Tambah `SoftDeletes` ke `User` Model

**Masalah:** Kolom `deleted_at` sudah ada di tabel `users` (dari migration), tapi trait `SoftDeletes` belum ditambahkan ke model. Akibatnya `delete()` melakukan hard delete, dan semua query tidak mengecek `deleted_at IS NULL` secara otomatis.

```php
// ✅ app/Models/User.php — tambahkan:
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes; // tambah SoftDeletes
    // ...
}
```

**Update `PenggunaController::destroy()` dengan error handling:**

```php
// ✅ Handle FK constraint violation:
public function destroy(User $pengguna): JsonResponse
{
    try {
        $pengguna->delete(); // sekarang soft delete — set deleted_at, bukan hapus row
    } catch (\Illuminate\Database\QueryException $e) {
        return response()->json([
            'message' => 'Pengguna tidak dapat dihapus karena masih memiliki data aktif.'
        ], 422);
    }
    return response()->json(['message' => 'Pengguna berhasil dinonaktifkan.']);
}
```

---

## 🔴 Phase 4 — Bug Logic Backend

**Scope:** Bug yang menghasilkan data salah, crash, atau silent failure
**Estimasi:** 1–2 hari
**Sumber:** Code Audit + DB Audit

---

### 4.1 — Fix `mata_kuliah_id` yang Tidak Ada di `evaluasi_diri`

**File:** `app/Http/Controllers/Api/AdminProdi/PlenoController.php`
**Masalah:** Kode mencoba `pluck('mata_kuliah_id')` dari `evaluasi_diri`, padahal kolom itu tidak ada di tabel tersebut. Ini akan throw error `SQLSTATE[42S22]: Column not found` pada setiap pleno pertama.

```php
// ❌ SEBELUM — crash karena kolom tidak ada:
$claimedMkIds = EvaluasiDiri::where('pendaftaran_id', $pendaftaran->id)
    ->pluck('mata_kuliah_id')
    ->unique();

// ✅ SESUDAH — ambil via relasi CPMK yang benar:
$claimedMkIds = EvaluasiDiri::where('pendaftaran_id', $pendaftaran->id)
    ->with('cpmk')
    ->get()
    ->pluck('cpmk.mata_kuliah_id')
    ->filter()   // hilangkan null jika ada evaluasi tanpa cpmk
    ->unique();
```

---

### 4.2 — Fix Double Query di `PlenoController::index()`

**File:** `app/Http/Controllers/Api/AdminProdi/PlenoController.php`
**Masalah:** `$query->get()` dipanggil dua kali — sekali untuk memproses data, sekali lagi di return. Query kedua menghasilkan data baru yang tidak diproses oleh `compilePlenoMk()`.

```php
// ❌ SEBELUM — $query->get() dipanggil dua kali:
$pendaftarans = $query->get(); // query 1 — diproses
foreach ($pendaftarans as $p) {
    $this->compilePlenoMk($p);
}
return response()->json(['data' => $query->get()]); // query 2 — data baru, belum diproses!

// ✅ SESUDAH — gunakan hasil query yang sama:
$pendaftarans = $query->get(); // satu query
foreach ($pendaftarans as $p) {
    if ($p->plenoMk()->count() === 0) {
        $this->compilePlenoMk($p); // hanya compile jika belum ada
    }
}
// Load relasi yang dibutuhkan frontend sekaligus (eager loading)
$pendaftarans->load([
    'user:id,nama',
    'plenoMk.mataKuliah:id,kode,nama,sks'
]);
return response()->json(['data' => $pendaftarans]); // gunakan collection yang sudah ada
```

---

### 4.3 — Aktifkan Delete Soal Lama di `UjiLanjutanController`

**File:** `app/Http/Controllers/Api/Asesor/UjiLanjutanController.php`
**Masalah:** Kode untuk menghapus soal lama yang tidak ada di request terbaru di-comment out. Akibatnya, setiap save akan terus menambah soal — soal yang dihapus dari frontend tidak pernah benar-benar terhapus dari DB.

```php
// ✅ Uncomment dan pastikan berjalan sebelum loop save:

// Kumpulkan ID soal yang masih ada di request (yang ingin dipertahankan)
$existingIds = collect($validated['items'])
    ->pluck('id')
    ->filter()   // hilangkan null (soal baru yang belum punya ID)
    ->values()
    ->all();

// Hapus soal lama yang tidak ada di request — ini artinya user sudah menghapusnya
\App\Models\UjiLanjutanItem::where('uji_lanjutan_id', $ujiLanjutan->id)
    ->whereNotIn('id', $existingIds)
    ->delete();

// Lanjut loop save/update soal yang ada di request...
```

---

### 4.4 — Enforce Form 02 Sebelum Workspace (PRD Critical Rule)

**File:** `app/Http/Controllers/Api/Asesor/WorkspaceController.php`
**Masalah:** PRD menyatakan asesor tidak boleh mengisi evaluasi portofolio, penilaian CPMK, pemetaan MK, atau submit final sebelum Form Pra-Asesmen (Form 02) diselesaikan. Guard ini tidak ada.

```php
// ✅ Tambahkan private method guard:

/**
 * Memastikan Form Pra-Asesmen sudah di-submit sebelum akses workspace.
 * Panggil di awal setiap method workspace yang membutuhkan guard ini.
 */
private function requirePraAsesmenSubmitted(PenugasanAsesor $tugas): ?JsonResponse
{
    $submitted = $tugas->praAsesmen?->is_submitted ?? false;
    if (!$submitted) {
        return response()->json([
            'message' => 'Form Pra-Asesmen (Form 02) wajib diselesaikan terlebih dahulu.',
            'code'    => 'PRA_ASESMEN_REQUIRED',
        ], 403);
    }
    return null; // null = boleh lanjut
}
```

**Panggil di awal method-method berikut:**
- `saveEvaluasiPortofolio()`
- `savePenilaianCpmk()`
- `savePemetaanMk()`
- `submitFinal()`

```php
// Contoh penggunaan:
public function saveEvaluasiPortofolio(Request $request, $tugasId): JsonResponse
{
    $tugas = PenugasanAsesor::findOrFail($tugasId);

    if ($guard = $this->requirePraAsesmenSubmitted($tugas)) {
        return $guard; // kembalikan error response jika belum submit
    }

    // ... lanjut logic normal
}
```

---

### 4.5 — Fix `JsonResponse` Import Hilang

**File:** `app/Http/Controllers/Api/Pemohon/UjiLanjutanController.php`
**Masalah:** `JsonResponse` digunakan sebagai return type hint tapi tidak di-import. Menyebabkan fatal error saat controller dipanggil.

```php
// ✅ Tambahkan di bagian atas file, bersama import lainnya:
use Illuminate\Http\JsonResponse;
```

---

### 4.6 — Enforce Deadline Sanggah dari `gelombang.tgl_sanggah`

**File:** `app/Http/Controllers/Api/Pemohon/PemohonExtraController.php` — method `submitSanggah()`
**Masalah:** Tidak ada pengecekan deadline sanggah. User bisa mengajukan sanggahan kapan saja, bahkan setelah masa sanggah berakhir.

```php
// ✅ Tambahkan di awal submitSanggah():

$pendaftaran->load('gelombang'); // pastikan relasi gelombang sudah di-load

if (now()->gt($pendaftaran->gelombang->tgl_sanggah)) {
    return response()->json([
        'message' => 'Batas waktu pengajuan sanggahan telah lewat pada ' .
            $pendaftaran->gelombang->tgl_sanggah->format('d F Y') . '.',
    ], 422);
}
```

**Catatan:** Pastikan `tgl_sanggah` di-cast sebagai `datetime` di model `Gelombang` agar method `->format()` bisa dipanggil.

---

### 4.7 — Handle Exception `restrictOnDelete` di Destroy User

**File:** `app/Http/Controllers/Api/SuperAdmin/PenggunaController.php`
**Masalah:** Jika user masih punya FK references (penugasan, pendaftaran, dll.), `delete()` akan throw `QueryException` dengan MySQL error code 1451. Tanpa try-catch, ini menghasilkan 500 error generik.

```php
// ✅ Full implementation dengan semua guard:
public function destroy(User $pengguna): JsonResponse
{
    // Guard: tidak bisa menghapus diri sendiri
    if ($pengguna->id === auth()->id()) {
        return response()->json([
            'message' => 'Tidak dapat menghapus akun sendiri.'
        ], 422);
    }

    try {
        $pengguna->delete(); // soft delete jika SoftDeletes sudah ditambahkan (Phase 3.3)
    } catch (\Illuminate\Database\QueryException $e) {
        // Error code 1451 = FK constraint violation (ada data yang bergantung pada user ini)
        if (str_contains($e->getMessage(), '1451')) {
            return response()->json([
                'message' => 'Pengguna tidak dapat dihapus karena masih memiliki penugasan atau data aktif. Nonaktifkan akun sebagai gantinya.'
            ], 422);
        }
        throw $e; // re-throw error lain yang tidak dikenali
    }

    return response()->json(['message' => 'Pengguna berhasil dihapus.']);
}
```

---

### 4.8 — Hapus Dead Code `getSoalUjian()` dan Sistem Ujian Lama

**File:** `app/Http/Controllers/Api/Pemohon/PemohonExtraController.php`
**Masalah:** Method `getSoalUjian()` mengacu ke sistem ujian lama yang sudah digantikan oleh `uji_lanjutan_item`. Dead code ini membingungkan dan bisa menyebabkan developer baru mengira sistem lama masih digunakan.

**Langkah:**
1. Hapus method `getSoalUjian()` dari `PemohonExtraController`
2. Model `UjianTulisSoal` dan `UjianTulisJawaban` bisa dipertahankan untuk referensi data historis tapi tambahkan `@deprecated` docblock
3. Hapus route yang mengarah ke `getSoalUjian()` jika ada

---

## 🔴 Phase 5 — Frontend: Bersihkan Mock Data & Sambungkan API

**Scope:** Store Zustand yang masih berisi data palsu — harus dihapus sebelum testing integrasi
**Estimasi:** 3–4 hari
**Sumber:** Code Audit

---

### 5.1 — Bersihkan `useAsesorStore` Sepenuhnya

**Masalah:** Store berisi `mockTugasList` hardcoded dan `asesorInfo` statis. Frontend tidak pernah benar-benar memanggil API asesor — semua data adalah dummy.

**Redesign store — hanya simpan UI state:**

```typescript
// ✅ frontend/src/store/useAsesorStore.ts — redesign:

interface AsesorState {
    activeTugasId: string | null;
    // ID tugas yang sedang aktif — untuk navigasi antar halaman workspace

    praAsesmenDraft: Record<string, Partial<PraAsesmenData>>;
    // Draft form pra-asesmen yang belum di-save ke server
    // Key: tugasId, Value: data draft

    setActiveTugas: (id: string | null) => void;
    updateDraft: (tugasId: string, data: Partial<PraAsesmenData>) => void;
    clearDraft: (tugasId: string) => void;
}
```

**Data tugas pindah ke React Query hooks:**

```typescript
// ✅ Buat file baru: frontend/src/hooks/useAsesorTugas.ts

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Semua tugas asesor yang login
export const useAsesorTugas = () => useQuery({
    queryKey: ['asesor', 'tugas'],
    queryFn: () => api.get('/asesor/tugas').then(r => r.data.data),
    staleTime: 30_000, // cache 30 detik sebelum refetch
});

// Detail satu tugas (dengan semua relasi: pendaftaran, pemohon, MK, dll)
export const useAsesorTugasDetail = (id: string) => useQuery({
    queryKey: ['asesor', 'tugas', id],
    queryFn: () => api.get(`/asesor/tugas/${id}`).then(r => r.data.data),
    enabled: !!id, // hanya fetch jika id sudah ada
});
```

---

### 5.2 — Hapus `useAdminProdiStore`, Ganti dengan `useAuthStore`

**Masalah:** `useAdminProdiStore` menduplikasi informasi user yang sudah ada di `useAuthStore`. Dua sumber kebenaran untuk data yang sama.

```typescript
// ✅ Hapus file: frontend/src/store/useAdminProdiStore.ts

// Ganti semua penggunaan useAdminProdiStore dengan:
import { useAuthStore } from '@/store/useAuthStore';

const { user } = useAuthStore();
// user.nama, user.prodi, user.role, dll. sudah tersedia langsung
const adminProdi = user;
```

**Langkah:**
1. Search seluruh codebase untuk `useAdminProdiStore`
2. Replace dengan `useAuthStore`
3. Hapus file store lama
4. Hapus import yang tidak terpakai

---

### 5.3 — Bersihkan `usePendaftaranStore` dari Semua Simulasi

**Masalah:** Store menggunakan `setTimeout` untuk simulasi submit dan pembayaran. Data jadwal juga hardcoded. User production akan submit pendaftaran tapi tidak ada yang benar-benar tersimpan di DB.

```typescript
// ✅ Hapus dari store:
// - mockJadwal / jadwal hardcoded
// - submitPendaftaran dengan setTimeout
// - simulatePayment dengan setTimeout

// ✅ Ganti dengan React Query:
export const usePendaftaran = () => useQuery({
    queryKey: ['pendaftaran'],
    queryFn: () => api.get('/pemohon/pendaftaran').then(r => r.data.data),
    refetchOnWindowFocus: true, // refresh saat tab difokuskan kembali
});

export const useSubmitPendaftaran = () => useMutation({
    mutationFn: (data) => api.post('/pemohon/pendaftaran', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendaftaran'] }),
});

// ✅ Store Zustand hanya perlu menyimpan:
interface PendaftaranState {
    pendaftaranId: number | null;
    setPendaftaranId: (id: number) => void;
    // ID ini didapat dari response API setelah pendaftaran berhasil dibuat
}
```

---

### 5.4 — Fix Sidebar Notification Badge Berdasarkan Data Real

**Masalah:** Badge notifikasi di sidebar menampilkan nilai statis/hardcoded, bukan jumlah notifikasi yang belum dibaca dari API.

```typescript
// ✅ frontend/src/app/pemohon/layout.tsx:

const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifikasi', 'unread'],
    queryFn: async () => {
        const { data } = await api.get('/pemohon/notifikasi');
        return (data.data as Notification[]).filter(n => !n.is_read).length;
    },
    refetchInterval: 30_000, // polling setiap 30 detik
    // Untuk real-time, pertimbangkan WebSocket/SSE dari Midtrans integration (Phase 8.1)
});

// Di sidebarLinks config, ganti nilai statis dengan:
{
    href: "/pemohon/notifikasi",
    label: "Notifikasi",
    hasBadge: unreadCount > 0,
    badgeCount: unreadCount
}
```

---

### 5.5 — Lengkapi Semua TypeScript Types

**Masalah:** Type `StatusAlur` tidak mencakup `ditolak` — status yang valid di DB tapi tidak ada di TypeScript. Menyebabkan TypeScript error atau silent cast.

```typescript
// ✅ frontend/src/lib/alur.ts — tambah 'ditolak':

export type StatusAlur =
    | 'pre_submit'
    | 'waiting_payment'
    | 'payment_verified'
    | 'waiting_verification'
    | 'pra_asesmen'
    | 'asesmen_tahap2'
    | 'pleno'
    | 'finished'
    | 'ditolak'; // ← tambahkan

// Tambah mapping untuk status baru di getRedirectPath:
export const getRedirectPath = (status: StatusAlur): string => {
    switch (status) {
        case 'ditolak':
            return '/pemohon/dashboard';
            // Tampilkan status ditolak di dashboard, jangan lempar ke halaman error
        // ...rest dari case yang sudah ada
    }
};
```

---

### 5.6 — Ganti `prodi.ts` Hardcoded dengan API Call

**Masalah:** Data kurikulum (daftar MK per prodi) tersimpan sebagai file TypeScript statis. Ketika admin menambah/ubah MK, perubahan tidak langsung tercermin di frontend tanpa deploy ulang.

```typescript
// ✅ Hapus data kurikulum statis dari prodi.ts (atau seluruh file jika isinya hanya itu)

// ✅ Ganti dengan React Query hook:
export const useKurikulum = (prodiId: number | null) => useQuery({
    queryKey: ['kurikulum', prodiId],
    queryFn: () =>
        api.get(`/admin-prodi/mata-kuliah?prodi_id=${prodiId}`)
           .then(r => r.data.data),
    enabled: !!prodiId,
    staleTime: 5 * 60_000, // cache 5 menit — data kurikulum jarang berubah
});
```

**Update `useBorangStore`:**
- Validasi Section D yang sebelumnya menggunakan data statis dari `prodi.ts` harus diupdate untuk menggunakan data dari hook ini
- Pastikan validasi tidak berjalan sebelum data dari API selesai di-fetch (`isLoading` state)

---

## 🟡 Phase 6 — PRD Feature Gaps yang Tersisa

**Scope:** Fitur yang ada di PRD tapi belum diimplementasi (bukan schema — murni fitur)
**Estimasi:** 3–4 hari
**Sumber:** PRD Deviation

---

### 6.1 — Enforce Sanggah: Briefing "Saya Mengerti" Sebelum Form Aktif

**Referensi PRD:** Bab 3.4 + 4.2 Halaman 1.7
**Deskripsi:** Sebelum pemohon bisa mengisi form sanggahan, harus ada halaman/section briefing yang menjelaskan konsekuensi sanggah. Form baru aktif setelah user menyatakan mengerti.

**Implementasi frontend:**

```typescript
// ✅ Di halaman sanggah pemohon:

const [briefingDiakui, setBriefingDiakui] = useState(false);

// Briefing content — bisa dari konten statis atau CMS
// Tampilkan teks penjelasan tentang proses sanggah, konsekuensi, dll.

// Tombol "Saya Mengerti":
<button
    onClick={() => setBriefingDiakui(true)}
    className={briefingDiakui ? 'hidden' : 'block'}
>
    Saya Mengerti dan Ingin Mengajukan Sanggahan
</button>

// Form sanggah (textarea, upload bukti):
<div className={briefingDiakui ? 'block' : 'pointer-events-none opacity-50'}>
    {/* Form sanggah */}
</div>
```

**Catatan:** State `briefingDiakui` bersifat per-session (tidak perlu persist ke DB). Jika page di-refresh, user harus klik ulang.

---

### 6.2 — Countdown Deadline Sanggah di Frontend

**Referensi PRD:** Bab 4.2 Halaman 1.7
**Deskripsi:** Tampilkan sisa waktu pengajuan sanggah secara real-time.

```typescript
// ✅ Di halaman hasil/sanggah:

const { data: pendaftaran } = usePendaftaran();
const deadline = pendaftaran?.gelombang?.tgl_sanggah;
const isDeadlinePassed = deadline ? new Date() > new Date(deadline) : false;

// Tampilkan:
{isDeadlinePassed ? (
    <p className="text-destructive">Masa sanggahan telah berakhir.</p>
) : (
    <CountdownTimer targetDate={deadline} />
    // Implementasi CountdownTimer menggunakan useEffect + setInterval
)}
```

**Langkah:**
- Buat komponen `CountdownTimer` yang menampilkan HH:MM:SS atau "X hari lagi"
- Jika deadline sudah lewat, disable tombol submit sanggah di frontend
- Backend tetap enforce deadline (Phase 4.6) sebagai layer keamanan kedua

---

### 6.3 — Konfirmasi Kehadiran Uji Lanjutan

**Referensi PRD:** Bab 4.2 Halaman 1.6
**Deskripsi:** Pemohon perlu mengkonfirmasi kehadiran untuk uji lanjutan. Konfirmasi ini notifikasi ke asesor.

**Backend — endpoint baru:**

```php
// ✅ routes/api.php — tambah di grup pemohon:
Route::post('uji-lanjutan/{id}/konfirmasi', [PemohonUjiLanjutanController::class, 'konfirmasiKehadiran']);

// ✅ PemohonUjiLanjutanController::konfirmasiKehadiran():
public function konfirmasiKehadiran(Request $request, $id): JsonResponse
{
    $uji = UjiLanjutan::findOrFail($id);

    // Guard: pastikan uji lanjutan milik pemohon yang login
    if ($uji->pendaftaran->user_id !== $request->user()->id) {
        return response()->json(['message' => 'Unauthorized.'], 403);
    }

    // Guard: cegah konfirmasi ganda
    if ($uji->konfirmasi_kehadiran) {
        return response()->json(['message' => 'Kehadiran sudah dikonfirmasi sebelumnya.'], 422);
    }

    $uji->update([
        'konfirmasi_kehadiran' => true,
        'konfirmasi_at'        => now(),
    ]);

    // Notifikasi ke asesor
    Notification::create([
        'user_id' => $uji->asesor_id,
        'judul'   => 'Konfirmasi Kehadiran Uji Lanjutan',
        'isi'     => 'Pemohon ' . $uji->pendaftaran->user->nama . ' telah mengkonfirmasi kehadiran.',
        'tipe'    => 'info',
    ]);

    return response()->json(['message' => 'Kehadiran berhasil dikonfirmasi.']);
}
```

---

### 6.4 — Lock Jawaban Ujian Tulis Setelah Submit

**Referensi PRD:** Bab 4.2 Halaman 1.6a — Aturan Kritis
**Deskripsi:** Setelah pemohon submit jawaban, tidak boleh ada perubahan. Guard ini perlu dibuat eksplisit.

```php
// ✅ Tambahkan guard di awal submitJawaban():

public function submitJawaban(Request $request, $id): JsonResponse
{
    $ujiLanjutan = UjiLanjutan::where('id', $id)->firstOrFail();

    // GUARD: cek fase — hanya bisa submit jika masih dalam fase menunggu jawaban
    if ($ujiLanjutan->fase_tulis !== 'menunggu_jawaban') {
        return response()->json([
            'message' => 'Jawaban sudah dikunci dan tidak dapat diubah lagi.',
            'code'    => 'JAWABAN_TERKUNCI',
        ], 403);
    }

    // ... lanjut simpan jawaban dan ubah fase ke 'koreksi'
}
```

**Catatan:** Frontend juga harus hide/disable tombol submit dan input jawaban saat `fase_tulis !== 'menunggu_jawaban'`.

---

### 6.5 — Tambah Fitur `is_active` Toggle di Mata Kuliah

**Referensi PRD:** Bab 4.3 Halaman 2.2
**Deskripsi:** Admin prodi bisa menonaktifkan MK tanpa menghapusnya. MK yang tidak aktif tidak muncul di form pemohon tapi data historisnya tetap ada.

```php
// ✅ routes/api.php — tambah di grup admin-prodi:
Route::patch('mata-kuliah/{mataKuliah}/toggle-active', [KurikulumController::class, 'toggleActive']);

// ✅ KurikulumController::toggleActive():
public function toggleActive(Request $request, MataKuliah $mataKuliah): JsonResponse
{
    // Guard: pastikan MK milik prodi admin yang login
    if ($mataKuliah->prodi_id !== $request->user()->prodi_id) {
        return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $mataKuliah->update(['is_active' => !$mataKuliah->is_active]);

    return response()->json([
        'message' => 'Status MK berhasil diperbarui.',
        'data'    => $mataKuliah->fresh(),
    ]);
}
```

**Update query di controller lain:**
- Di semua query yang menampilkan daftar MK untuk pemohon, tambahkan `.where('is_active', true)`
- Admin prodi tetap bisa melihat semua MK termasuk yang tidak aktif (untuk manajemen)

---

### 6.6 — Super Admin: Fitur Impersonate

**Referensi PRD:** Bab 4.6 Halaman 4.4
**Deskripsi:** Super Admin bisa masuk ke akun user lain untuk debugging/support tanpa tahu password user tersebut. Semua aksi saat impersonate harus tercatat di audit log.

```php
// ✅ routes/api.php — tambah di grup super_admin:
Route::post('impersonate/{user}', [ImpersonateController::class, 'start']);
Route::delete('impersonate', [ImpersonateController::class, 'stop']);

// ✅ Buat file baru: app/Http/Controllers/Api/SuperAdmin/ImpersonateController.php

public function start(Request $request, User $user): JsonResponse
{
    // Guard: super admin tidak bisa impersonate super admin lain
    if ($user->role === 'super_admin') {
        return response()->json(['message' => 'Tidak bisa impersonate super admin lain.'], 403);
    }

    // Buat token sementara untuk user target
    $token = $user->createToken(
        'impersonate-by-' . $request->user()->id,
        ['impersonated_by:' . $request->user()->id] // abilities/claims
    );

    // Catat ke audit log
    AuditLog::create([
        'user_id'         => $user->id,
        'impersonated_by' => $request->user()->id,
        'action'          => 'IMPERSONATE_START',
        'module'          => 'User',
        'detail'          => 'Super Admin mengambil sesi user: ' . $user->email,
        'ip_address'      => $request->ip(),
    ]);

    return response()->json([
        'token'    => $token->plainTextToken,
        'user'     => $user,
        'message'  => 'Impersonate berhasil. Semua aksi akan tercatat atas nama Super Admin.',
    ]);
}

public function stop(Request $request): JsonResponse
{
    // Hapus token impersonate
    $request->user()->currentAccessToken()->delete();

    AuditLog::create([
        'user_id'   => $request->user()->id,
        'action'    => 'IMPERSONATE_STOP',
        'module'    => 'User',
        'detail'    => 'Sesi impersonate diakhiri.',
        'ip_address' => $request->ip(),
    ]);

    return response()->json(['message' => 'Sesi impersonate telah diakhiri.']);
}
```

**Frontend — banner impersonate:**

```tsx
// ✅ Tampilkan banner kuning saat mode impersonate aktif:
{isImpersonating && (
    <div className="bg-yellow-400 text-black px-4 py-2 text-center text-sm font-medium">
        ⚠️ Anda sedang dalam mode impersonate sebagai <strong>{user?.nama}</strong>.
        <button onClick={stopImpersonate} className="ml-4 underline">
            Kembali ke Akun Saya
        </button>
    </div>
)}
```

---

## 🔵 Phase 7 — Konsolidasi & Technical Debt

**Scope:** Duplikasi, inkonsistensi, dead code yang memperlambat pengembangan
**Estimasi:** 2 hari
**Sumber:** Code Audit + DB Audit

---

### 7.1 — Merge Model Notifikasi, Drop Tabel Lama

**Masalah:** Ada dua tabel untuk notifikasi: `notifikasi` (lama) dan `notifications` (baru, Laravel default). Dua sistem berjalan paralel menyebabkan notifikasi tidak konsisten.

```php
// ✅ Migration: drop_notifikasi_table_and_cleanup
Schema::dropIfExists('notifikasi');
```

**Langkah:**
1. Migrasikan data dari `notifikasi` ke `notifications` jika ada data penting
2. Hapus model `app/Models/Notifikasi.php`
3. Hapus relasi `notifikasi()` dari `app/Models/User.php`
4. Pastikan `NotificationController` sudah menggunakan model `Notification` (bukan `Notifikasi`)
5. Pastikan index sudah ditambahkan (Phase 3.1)

---

### 7.2 — Deprecate Sistem Ujian Lama (`ujian_tulis_*`)

**Masalah:** Tabel `ujian_tulis_soal` dan `ujian_tulis_jawaban` dari sistem ujian lama sudah tidak digunakan, digantikan oleh `uji_lanjutan_item`.

**Jika tidak ada data di production:**

```php
// ✅ Migration: drop_old_ujian_tulis_tables
Schema::dropIfExists('ujian_tulis_jawaban'); // drop jawaban dulu (ada FK ke soal)
Schema::dropIfExists('ujian_tulis_soal');
```

**Langkah:**
1. **Verifikasi dulu** — cek apakah ada data di kedua tabel sebelum drop
2. Hapus model `app/Models/UjianTulisSoal.php`
3. Hapus model `app/Models/UjianTulisJawaban.php`
4. Hapus relasi `ujianTulisSoal()` dari `app/Models/PenugasanAsesor.php`

---

### 7.3 — Hapus Pivot `evaluasi_diri_dokumen` yang Tidak Pernah Ditulis

**Masalah:** Tabel pivot ini ada di schema tapi tidak pernah ada kode yang menyimpan data ke dalamnya. Relasi `dokumenPendukung()` di model tidak pernah dipanggil.

```php
// ✅ Migration: drop_evaluasi_diri_dokumen_table
Schema::dropIfExists('evaluasi_diri_dokumen');
```

**Langkah:**
1. Hapus relasi `dokumenPendukung()` dari `app/Models/EvaluasiDiri.php`
2. Pastikan tidak ada kode yang masih mengacu ke relasi ini

---

### 7.4 — Standarisasi Import di `api.php`

**Masalah:** `routes/api.php` menggunakan FQCN (Fully Qualified Class Name) inline di beberapa tempat dan `use` statement di tempat lain — tidak konsisten dan sulit dibaca.

```php
// ✅ Pindahkan semua FQCN inline ke use statement di atas:

// Contoh use statement yang perlu ditambahkan:
use App\Http\Controllers\Api\AdminProdi\ArsipController;
use App\Http\Controllers\Api\Asesor\SanggahController;
use App\Http\Controllers\Api\Pemohon\PembayaranController;
// ... dll sesuai yang ada di routes

// Hapus semua FQCN inline dari body routes (App\Http\Controllers\...)
```

---

### 7.5 — Buat `PendaftaranPolicy` untuk Sentralisasi Otorisasi

**Masalah:** Logika otorisasi "apakah user X boleh akses pendaftaran Y" tersebar di banyak controller dengan cara yang tidak konsisten. Beberapa controller bahkan tidak melakukan check sama sekali.

```bash
php artisan make:policy PendaftaranPolicy --model=Pendaftaran
```

```php
// ✅ app/Policies/PendaftaranPolicy.php:

class PendaftaranPolicy
{
    public function view(User $user, Pendaftaran $pendaftaran): bool
    {
        return match($user->role) {
            'pemohon'     => $user->id === $pendaftaran->user_id,
            'admin_prodi' => $user->prodi_id === $pendaftaran->prodi_id,
            'asesor'      => $pendaftaran->penugasanAsesor()
                                ->where('asesor_id', $user->id)
                                ->exists(),
            'super_admin', 'pimpinan' => true,
            default => false,
        };
    }

    public function update(User $user, Pendaftaran $pendaftaran): bool
    {
        return match($user->role) {
            'pemohon'     => $user->id === $pendaftaran->user_id
                             && in_array($pendaftaran->status_alur, ['pre_submit', 'waiting_payment']),
            'admin_prodi' => $user->prodi_id === $pendaftaran->prodi_id,
            'super_admin' => true,
            default => false,
        };
    }
}
```

**Gantikan semua:**
```php
// ❌ Sebelum (tersebar di controller):
if ($entity->user_id !== $request->user()->id) {
    return response()->json(['message' => 'Unauthorized'], 403);
}

// ✅ Sesudah (sentralisasi via Policy):
$this->authorize('view', $pendaftaran);
```

---

### 7.6 — Hapus Redundant Role Check di `ArsipController`

**Masalah:** Middleware di `routes/api.php` sudah memastikan hanya `admin_prodi` yang bisa mengakses route ini. Check manual `if ($user->role !== 'admin_prodi')` di dalam controller adalah duplikasi yang tidak perlu.

```php
// ✅ Hapus semua blok ini dari ArsipController:
if ($user->role !== 'admin_prodi') {
    return response()->json(['message' => 'Unauthorized'], 403);
}
// Middleware sudah handle ini — tidak perlu diulang di controller.
```

---

### 7.7 — Tambah Audit Trail Observer

**Masalah:** Perubahan data kritis (pendaftaran, pleno, SK) tidak tercatat secara otomatis. Audit log hanya diisi secara manual di beberapa tempat.

```php
// ✅ Buat file baru: app/Observers/AuditObserver.php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
    private function record(string $action, Model $model): void
    {
        if (!auth()->check()) return;
        // Tidak log jika tidak ada user yang login (misal: seeder, job)

        AuditLog::create([
            'user_id'         => auth()->id(),
            'impersonated_by' => session('impersonated_by'), // set dari ImpersonateController
            'action'          => $action,
            'module'          => class_basename($model),
            'detail'          => json_encode([
                'id'      => $model->getKey(),
                'changes' => $model->getDirty(), // hanya field yang berubah
            ]),
            'ip_address'      => request()->ip(),
            'created_at'      => now(),
        ]);
    }

    public function created(Model $model): void  { $this->record('CREATE', $model); }
    public function updated(Model $model): void  { $this->record('UPDATE', $model); }
    public function deleted(Model $model): void  { $this->record('DELETE', $model); }
}
```

**Daftarkan di `app/Providers/AppServiceProvider.php`:**

```php
// ✅ Di method boot():
use App\Observers\AuditObserver;

Pendaftaran::observe(AuditObserver::class);
PlenoMk::observe(AuditObserver::class);
SkKeputusan::observe(AuditObserver::class);
Sanggah::observe(AuditObserver::class);
BandingEksternal::observe(AuditObserver::class);
User::observe(AuditObserver::class);
```

---

## 🟡 Phase 8 — Fitur Belum Selesai

**Scope:** Fitur yang ada di PRD, ada placeholder di kode, tapi belum diimplementasi
**Estimasi:** 7–10 hari
**Sumber:** Code Audit + PRD

---

### 8.1 — Integrasi Midtrans + Webhook Handler

**Referensi PRD:** Bab 4.1 Halaman 1.2 — Real-time via WebSocket

```bash
composer require midtrans/midtrans-php
```

**Update `PembayaranController::submitBayar()` — ganti simulasi:**

```php
// ✅ Integrasi Midtrans Snap:

\Midtrans\Config::$serverKey   = config('services.midtrans.server_key');
\Midtrans\Config::$isProduction = config('services.midtrans.production', false);
\Midtrans\Config::$isSanitized  = true;
\Midtrans\Config::$is3ds        = true;

$snapToken = \Midtrans\Snap::getSnapToken([
    'transaction_details' => [
        'order_id'     => 'RPL-' . $pendaftaran->id . '-' . time(),
        'gross_amount' => $pendaftaran->gelombang->biaya,
    ],
    'customer_details' => [
        'first_name' => $pendaftaran->user->nama,
        'email'      => $pendaftaran->user->email,
        'phone'      => $pendaftaran->borangDataDiri?->no_hp,
    ],
    'item_details' => [
        [
            'id'       => 'RPL-BIAYA',
            'price'    => $pendaftaran->gelombang->biaya,
            'quantity' => 1,
            'name'     => 'Biaya RPL Gelombang ' . $pendaftaran->gelombang->nama,
        ],
    ],
]);

$pendaftaran->update(['midtrans_order_id' => 'RPL-' . $pendaftaran->id . '-' . time()]);
return response()->json(['snap_token' => $snapToken]);
```

**Tambah `WebhookController` (route publik, tanpa auth middleware):**

```php
// ✅ routes/api.php — di luar middleware auth:
Route::post('/webhook/pembayaran', [WebhookController::class, 'handle']);

// ✅ Buat: app/Http/Controllers/Api/WebhookController.php:
public function handle(Request $request): JsonResponse
{
    \Midtrans\Config::$serverKey = config('services.midtrans.server_key');

    $notif = new \Midtrans\Notification();

    // Verifikasi signature key untuk keamanan
    $signatureKey = hash('sha512',
        $notif->order_id .
        $notif->status_code .
        $notif->gross_amount .
        config('services.midtrans.server_key')
    );

    if ($signatureKey !== $notif->signature_key) {
        return response()->json(['message' => 'Invalid signature'], 401);
    }

    $validStatuses = ['settlement', 'capture'];

    if (in_array($notif->transaction_status, $validStatuses)) {
        $pendaftaran = Pendaftaran::where('midtrans_order_id', $notif->order_id)->first();

        if ($pendaftaran && $pendaftaran->status_alur === 'waiting_payment') {
            $pendaftaran->update([
                'status_alur'      => 'payment_verified',
                'midtrans_status'  => $notif->transaction_status,
                'midtrans_paid_at' => now(),
            ]);

            // Notifikasi ke user
            Notification::create([
                'user_id' => $pendaftaran->user_id,
                'judul'   => 'Pembayaran Berhasil Diverifikasi',
                'isi'     => 'Pembayaran Anda telah berhasil diverifikasi. Silakan menunggu verifikasi admin.',
                'tipe'    => 'success',
            ]);

            // TODO: Broadcast via Laravel Echo/Pusher untuk update real-time di frontend
        }
    }

    return response()->json(['status' => 'ok']);
}
```

**Tambah ke `.env`:**
```
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_PRODUCTION=false
```

---

### 8.2 — Implementasi 19 PDF Blade Views

**Referensi PRD:** Bab 5.5 — Spatie Browsershot (bukan DomPDF)
**Masalah:** DomPDF yang digunakan saat ini tidak mendukung Flexbox/Grid CSS modern — layout form RPL tidak akan render dengan benar. PRD secara eksplisit menyebut Spatie Browsershot (headless Chrome).

```bash
composer require spatie/browsershot
npm install puppeteer
```

**Update `PdfService`:**

```php
// ✅ app/Services/PdfService.php:
use Spatie\Browsershot\Browsershot;

public function generate(string $viewName, array $data, string $filename): \Symfony\Component\HttpFoundation\Response
{
    $html = view($viewName, $data)->render();

    $pdf = Browsershot::html($html)
        ->format('A4')
        ->margins(15, 10, 15, 10) // mm: top, right, bottom, left
        ->showBackground() // render background colors/images
        ->waitUntilNetworkIdle() // tunggu font/gambar eksternal load
        ->pdf();

    return response($pdf, 200, [
        'Content-Type'        => 'application/pdf',
        'Content-Disposition' => 'inline; filename="' . $filename . '"',
    ]);
}
```

**Prioritas implementasi view (urutan pengerjaan):**

| No | Kode | Nama Form | Prioritas |
|----|------|-----------|-----------|
| 1 | F01 | Aplikasi RPL (Section A pemohon) | 🔴 Tinggi |
| 2 | F06 | Tanda Terima Portofolio | 🔴 Tinggi |
| 3 | F16 | Daftar Riwayat Hidup | 🔴 Tinggi |
| 4 | F02 | Pra Asesmen | 🔴 Tinggi |
| 5 | F12 | Matriks Alih Kredit | 🟡 Medium |
| 6 | F14 | Rekap Asesmen Asesor 1 | 🟡 Medium |
| 7 | F15 | Rekap Asesmen Asesor 2 | 🟡 Medium |
| 8–19 | F03–F19 | Sisa form | 🟢 Normal |

---

### 8.3 — Verifikasi & Buat Semua Blade Mail Views

**Masalah:** Beberapa Mail class ada tapi blade view-nya belum dibuat atau belum diverifikasi berfungsi.

| Mail Class | File Blade | Status | Prioritas |
|---|---|---|---|
| `WelcomeMail` | `resources/views/mail/welcome.blade.php` | Perlu verifikasi | 🔴 Tinggi |
| `ResetPasswordMail` | `resources/views/mail/reset-password.blade.php` | **Belum ada** (dibuat di Phase 1.1) | 🔴 Tinggi |
| `VerifikasiBerhasilMail` | `resources/views/mail/verifikasi-berhasil.blade.php` | Perlu verifikasi | 🟡 Medium |
| `PenugasanAsesorMail` | `resources/views/mail/penugasan-asesor.blade.php` | Perlu verifikasi | 🟡 Medium |
| `JadwalPraAsesmenMail` | `resources/views/mail/jadwal-pra-asesmen.blade.php` | Perlu verifikasi | 🟡 Medium |
| `JadwalUjianMail` | `resources/views/mail/jadwal-ujian.blade.php` | Perlu verifikasi | 🟡 Medium |
| `UjianTulisTersediaMail` | `resources/views/mail/ujian-tulis-tersedia.blade.php` | Perlu verifikasi | 🟡 Medium |
| `SKDiterbitkanMail` | `resources/views/mail/sk-diterbitkan.blade.php` | Perlu verifikasi | 🟡 Medium |

**Cara verifikasi:** Gunakan `php artisan tinker` atau buat route test untuk preview email:
```php
Route::get('/mail-preview/{type}', fn($type) => new App\Mail\{MailClass}($testData));
```

---

### 8.4 — QR Code pada SK Keputusan

**Deskripsi:** Setiap SK Keputusan harus memiliki QR code yang bisa di-scan untuk verifikasi keaslian dokumen.

```bash
composer require simplesoftwareio/simple-qrcode
```

**Di `PimpinanController::terbitkanSk()`:**

```php
// ✅ Generate QR code saat SK diterbitkan:

// URL untuk verifikasi SK — bisa diakses publik tanpa login
$qrContent = route('sk.verify', ['nomor' => $sk->nomor_sk]);

$qrPath = "qr/{$sk->pendaftaran_id}.png";

\QrCode::format('png')
       ->size(200)
       ->errorCorrection('H') // High error correction — tetap terbaca meski sebagian rusak
       ->generate($qrContent, storage_path("app/public/{$qrPath}"));

$sk->update(['qr_code_path' => $qrPath]);
```

**Tambah route verifikasi publik:**

```php
// ✅ routes/web.php (bukan api.php — akses publik):
Route::get('/sk/verify/{nomor}', [SkVerifyController::class, 'show'])->name('sk.verify');
// Tampilkan halaman sederhana dengan info SK: nama pemohon, MK yang diakui, tanggal
```

---

## 🟡 Phase 9 — Performa & Skalabilitas

**Scope:** Query yang akan lambat saat data tumbuh ke ribuan record
**Estimasi:** 2 hari
**Sumber:** DB Audit

---

### 9.1 — Pagination di Semua Endpoint Index

**Masalah:** Semua endpoint `index()` menggunakan `->get()` yang mengambil seluruh data sekaligus. Dengan 1000+ pendaftaran, ini akan menyebabkan memory exhaustion dan timeout.

```php
// ✅ Pattern standar — terapkan di semua controller index():

$perPage = min((int) $request->input('per_page', 20), 100);
// min() untuk cegah user request per_page=999999

$data = $query->paginate($perPage);

return response()->json([
    'data' => $data->items(),
    'meta' => [
        'current_page' => $data->currentPage(),
        'last_page'    => $data->lastPage(),
        'total'        => $data->total(),
        'per_page'     => $data->perPage(),
        'from'         => $data->firstItem(),
        'to'           => $data->lastItem(),
    ],
]);
```

**Endpoint yang wajib ditambahkan pagination:**
- `SuperAdmin/PenggunaController::index()`
- `SuperAdmin/GelombangController::index()`
- `SuperAdmin/ProdiController::index()`
- `SuperAdmin/AuditLogController::index()`
- `AdminProdi/PendaftaranController::index()`
- `AdminProdi/PlenoController::index()`
- `Asesor/TugasController::index()`
- `Pimpinan/SkController::index()`

---

### 9.2 — Fix N+1 Massif di `compilePlenoMk()`

**Masalah:** `compilePlenoMk()` saat ini menjalankan ~40 query per pemohon karena query dijalankan di dalam loop. Dengan 50 pemohon, ini = 2000 query untuk satu request halaman pleno.

```php
// ✅ Pre-load semua data sebelum masuk loop:

private function compilePlenoMk(Pendaftaran $pendaftaran): void
{
    // Load semua data yang dibutuhkan SEBELUM loop — cukup 6-8 query total
    $semuaTranskrip  = TranskripAsal::where('pendaftaran_id', $pendaftaran->id)->get();
    $tugasA1         = $pendaftaran->penugasanAsesor()->where('urutan', 'asesor_1')->first();
    $tugasA2         = $pendaftaran->penugasanAsesor()->where('urutan', 'asesor_2')->first();
    $semuaPemetaanA1 = $tugasA1
        ? PemetaanMk::where('penugasan_asesor_id', $tugasA1->id)->get()
        : collect();
    $semuaPemetaanA2 = $tugasA2
        ? PemetaanMk::where('penugasan_asesor_id', $tugasA2->id)->get()
        : collect();

    // Di dalam loop — gunakan in-memory filter, TIDAK ada query DB:
    foreach ($mkIds as $mkId) {
        $pemetaanA1 = $semuaPemetaanA1->firstWhere('mk_poliban_id', $mkId);
        $transkrip  = $semuaTranskrip->first(fn($t) =>
            str_contains($t->nama_mk, $pemetaanA1?->mk_asal_nama ?? '__NONE__')
        );
        // Proses selanjutnya menggunakan variable in-memory
    }
    // Dari ~40 query/pemohon → 8 query total (tidak peduli jumlah MK)
}
```

---

### 9.3 — Export Excel dengan Chunking

**Masalah:** Export seluruh data menggunakan `FromCollection` memuat semua data ke memori sekaligus. Dengan ribuan record, ini menyebabkan PHP memory limit error.

```php
// ✅ Ganti FromCollection ke FromQuery + WithChunkReading:

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithChunkReading;

class PlenoExport implements FromQuery, WithChunkReading
{
    public function __construct(private array $filters) {}

    public function query()
    {
        return Pendaftaran::with(['user:id,nama', 'plenoMk.mataKuliah'])
            ->where($this->filters);
        // Query dieksekusi per chunk, tidak semua sekaligus
    }

    public function chunkSize(): int
    {
        return 100; // proses 100 row per iterasi
    }
}
```

---

### 9.4 — Ganti LIKE `%...%` di `compilePlenoMk()` dengan FK Langsung

**Masalah:** Pencocokan transkrip asal ke MK Poliban menggunakan `LIKE '%nama_mk%'` yang tidak bisa menggunakan index dan rentan terhadap false positive.

**Solusi jangka panjang:**

Setelah `uji_lanjutan_item.mata_kuliah_id` (Phase 2.6) ditambahkan, lakukan hal yang sama untuk transkrip:

1. Tambah kolom `mk_poliban_id` di `transkrip_asal` (nullable FK ke `mata_kuliah`)
2. Saat asesor melakukan pemetaan MK, resolve dan simpan FK ini ke `transkrip_asal`
3. Di `compilePlenoMk()`, gunakan FK langsung alih-alih string matching LIKE

```php
// Jangka panjang — setelah kolom mk_poliban_id ditambahkan:
$transkrip = $semuaTranskrip->firstWhere('mk_poliban_id', $mkId);
// Tidak ada string matching — O(n) dengan in-memory filter
```

---

## 📊 Master Checklist Terpadu

Gunakan checklist ini untuk tracking progress. Tandai dengan `[x]` saat item selesai.

```
PHASE 1 — Keamanan & Auth (estimasi: 2 hari)
  [ ] 1.1  Hapus temp_password dari response + buat ResetPasswordMail + blade view
  [ ] 1.2  Tambah mimes validation semua upload (BorangController + ArsipController)
  [ ] 1.3  Rate limiting throttle:10,1 di route /login dan /register
  [ ] 1.4  Buat PendaftaranService::generateNomor(), hapus rand(), inject di 2 controller
  [ ] 1.5  Fix interceptor api.ts: pisahkan handler 401 vs 403
  [ ] 1.6  Buat AuthGuard component + wrap di 5 layout (pemohon, asesor, admin-prodi, super-admin, pimpinan)
  [ ] 1.7  Hapus withCredentials: true dari konfigurasi axios/fetch

PHASE 2 — Schema Missing Fields (estimasi: 3 hari)
  [ ] 2.1  mata_kuliah: +7 kolom (semester, level_kkni, cp_*, indikator, profil_lulusan, is_active), fix unique scope kode → per prodi
  [ ] 2.2  borang_data_diri: +agama, kebangsaan, kode_pos, no_telp_rumah
  [ ] 2.3  dokumen.tipe enum: +ktp, +portofolio_p01..p10, hapus 'portofolio' generik
  [ ] 2.4  transkrip_asal: +kode_mk
  [ ] 2.5  pengalaman_kerja: +status_kepegawaian, bulan_mulai, bulan_selesai
  [ ] 2.6  uji_lanjutan_item: +bobot_persen, panduan_penilaian, mata_kuliah_id FK + update scoring logic
  [ ] 2.7  uji_lanjutan: +konfirmasi_kehadiran, konfirmasi_at, jenis_ujian
  [ ] 2.8  sanggah: +asesor_id FK, diputus_at + update guard di SanggahController
  [ ] 2.9  pra_asesmen: +submitted_at + update WorkspaceController
  [ ] 2.10 pendaftaran: +pra_pemetaan_payload JSON
  [ ] 2.11 evaluasi_portofolio: hapus kesesuaian → tambah VATC (valid, autentik, terkini, cukup, catatan_evaluasi)
  [ ] 2.12 Buat tabel banding_eksternal + model BandingEksternal + controller + routes
  [ ] 2.13 audit_log: +impersonated_by FK ke users
  [ ] 2.14 Fix migration down() typo 'diakui' → 'penilaian_cpmk' di file 2026_05_22_021612

PHASE 3 — Schema Indexes & Constraints (estimasi: 1 hari)
  [ ] 3.1  Satu migration besar: tambah semua missing indexes (notifications, pendaftaran, penugasan_asesor, pemetaan_mk, pleno_mk, evaluasi_diri, transkrip_asal, dokumen, cpmk)
  [ ] 3.2  Rename tabel arsip_dokumens → arsip_dokumen + update model $table property
  [ ] 3.3  Tambah SoftDeletes trait ke User model + update PenggunaController::destroy()

PHASE 4 — Bug Logic Backend (estimasi: 2 hari)
  [ ] 4.1  Fix mata_kuliah_id di PlenoController: pluck via cpmk.mata_kuliah_id, bukan langsung dari evaluasi_diri
  [ ] 4.2  Fix double query di PlenoController::index(): gunakan $pendaftarans yang sudah ada, bukan $query->get() kedua
  [ ] 4.3  Aktifkan delete soal lama di UjiLanjutanController::saveItems()
  [ ] 4.4  Tambah requirePraAsesmenSubmitted() guard di WorkspaceController (4 method)
  [ ] 4.5  Tambah 'use Illuminate\Http\JsonResponse' di Pemohon/UjiLanjutanController
  [ ] 4.6  Enforce gelombang.tgl_sanggah di submitSanggah() PemohonExtraController
  [ ] 4.7  Handle QueryException error 1451 di PenggunaController::destroy() + guard hapus diri sendiri
  [ ] 4.8  Hapus method getSoalUjian() dead code dari PemohonExtraController

PHASE 5 — Frontend Mock Data Cleanup (estimasi: 4 hari)
  [ ] 5.1  Bersihkan useAsesorStore → hapus semua mock data, redesign state, buat useAsesorTugas hooks
  [ ] 5.2  Hapus file useAdminProdiStore.ts, replace semua usage dengan useAuthStore
  [ ] 5.3  Bersihkan usePendaftaranStore → hapus simulasi setTimeout, ganti dengan React Query mutations
  [ ] 5.4  Badge notifikasi sidebar: query unread count dari API dengan refetchInterval 30 detik
  [ ] 5.5  Lengkapi StatusAlur type: tambah 'ditolak' + update getRedirectPath()
  [ ] 5.6  Hapus prodi.ts hardcoded, ganti dengan useKurikulum() hook yang fetch dari API

PHASE 6 — PRD Feature Gaps (estimasi: 4 hari)
  [ ] 6.1  Halaman sanggah: tambah briefing state + tombol "Saya Mengerti" — form aktif hanya setelah diklik
  [ ] 6.2  Halaman sanggah: tambah komponen CountdownTimer untuk deadline + disable form jika expired
  [ ] 6.3  Backend: endpoint POST /pemohon/uji-lanjutan/{id}/konfirmasi + notifikasi asesor
  [ ] 6.4  Backend: guard fase_tulis di submitJawaban() — tolak jika bukan 'menunggu_jawaban'
  [ ] 6.5  Backend: route PATCH mata-kuliah/{id}/toggle-active + KurikulumController::toggleActive()
  [ ] 6.6  Backend: ImpersonateController (start + stop) + Frontend: banner impersonate mode

PHASE 7 — Technical Debt (estimasi: 2 hari)
  [ ] 7.1  Hapus tabel notifikasi lama, hapus model Notifikasi.php, hapus relasi dari User.php
  [ ] 7.2  (Verifikasi data dulu) Drop tabel ujian_tulis_jawaban + ujian_tulis_soal + hapus model
  [ ] 7.3  Drop tabel evaluasi_diri_dokumen + hapus relasi dokumenPendukung() dari EvaluasiDiri
  [ ] 7.4  Standarisasi semua import di routes/api.php: hapus FQCN inline → pindah ke use statement
  [ ] 7.5  Buat PendaftaranPolicy via artisan + implementasi view() dan update() + terapkan di controller
  [ ] 7.6  Hapus semua redundant role check manual di ArsipController
  [ ] 7.7  Buat AuditObserver + daftarkan untuk 6 model kritis di AppServiceProvider

PHASE 8 — Fitur Belum Selesai (estimasi: 10 hari)
  [ ] 8.1  Integrasi Midtrans Snap di PembayaranController + WebhookController (route publik) + verifikasi signature
  [ ] 8.2  Install Spatie Browsershot, update PdfService, implementasi 19 blade PDF views (prioritas F01, F06, F16, F02)
  [ ] 8.3  Verifikasi dan buat semua 8 blade mail views (WelcomeMail, ResetPasswordMail, dll.)
  [ ] 8.4  Install simple-qrcode, generate QR di terbitkanSk(), buat route publik sk.verify

PHASE 9 — Performa (estimasi: 2 hari)
  [ ] 9.1  Tambah pagination ke semua 8+ endpoint index() — gunakan pattern standar per_page max 100
  [ ] 9.2  Fix N+1 di compilePlenoMk(): pre-load semua query sebelum loop → dari ~40 query ke 8 query
  [ ] 9.3  Export Excel: ganti FromCollection ke FromQuery + WithChunkReading (chunkSize: 100)
  [ ] 9.4  (Long-term) Tambah mk_poliban_id FK di transkrip_asal, eliminasi LIKE string matching
```

---

## Catatan Penting untuk Developer

### Urutan Migration
Jangan jalankan migration Phase 3 sebelum Phase 2 selesai, karena beberapa index di Phase 3 bergantung pada kolom yang ditambahkan di Phase 2.

### Testing Setelah Setiap Phase
- Setelah Phase 1: Test semua endpoint auth, verifikasi tidak ada 401/403 yang salah redirect
- Setelah Phase 2: Jalankan `php artisan migrate` dan verifikasi semua kolom ada dengan `php artisan tinker` + `Schema::getColumnListing('nama_tabel')`
- Setelah Phase 4: Test semua bug scenario yang disebutkan di atas
- Setelah Phase 5: Verifikasi tidak ada network request ke mock/dummy data

### Environment Variables yang Perlu Ditambahkan
```env
# Midtrans (Phase 8.1)
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_PRODUCTION=false

# Mail (Phase 1.1)
MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="Sistem RPL"
```

### Rollback Plan
Setiap migration harus punya method `down()` yang berfungsi. Verifikasi dengan:
```bash
php artisan migrate:rollback --step=1
php artisan migrate
```
