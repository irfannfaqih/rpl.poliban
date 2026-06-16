# Implementation Plan Final: Restrukturisasi AT2

## Ringkasan Perubahan Besar

Restrukturisasi alur Asesmen Tahap 2 (AT2) dari sistem berbasis waktu otomatis menjadi sistem berbasis kontrol manusia yang lebih fleksibel dan realistis. Perubahan mencakup 3 area utama:

1. **Penjadwalan AT2 dipindah ke Admin Prodi** (sebelumnya asesor)
2. **Tombol "Mulai Ujian" untuk asesor** menggantikan window waktu otomatis
3. **Fitur reschedule** untuk pemohon yang tidak bisa hadir

---

## Klarifikasi Desain

| Pertanyaan | Keputusan |
|---|---|
| Tombol Mulai untuk siapa | Hanya C3 (soal tertulis online). C1/C4/Cn = tatap muka, tidak perlu tombol mulai digital |
| Siapa yang jadwalkan AT2 | **Admin Prodi** — jadwal + penugasan asesor ke AT2 |
| Peran asesor | Eksekusi lapangan: mulai ujian, nilai, submit |
| Siapa approve reschedule | **Admin Prodi** |
| Batas request reschedule | Maksimal H-1 (satu hari sebelum tanggal ujian yang dijadwalkan) |
| Batas jumlah reschedule | Maksimal 1 kali per pendaftaran |
| Instrumen setelah reschedule | Boleh diubah asesor selama ujian belum dimulai (`ujian_dimulai_at = null`) |

---

## Alur AT2 Final (End-to-End)

```
[1] ADMIN PRODI — Penjadwalan
    ├── Set tanggal + waktu + tempat + link meeting
    ├── Set durasi pengerjaan (menit) — untuk C3
    └── Notifikasi ke Asesor + Pemohon bahwa jadwal ditetapkan

[2] ASESOR — Persiapan Instrumen
    ├── Tambah MK + metode (C1/C3/C4/Cn)
    ├── Isi soal per MK (C3: jawaban singkat + kunci)
    ├── Instrumen bisa diubah selama ujian_dimulai_at = null
    └── Klik "Terbitkan ke Pemohon" (instrumen dikirim, jadwal sudah di-set admin)

[3] PEMOHON — Menunggu
    ├── Lihat jadwal AT2 (dari Admin Prodi)
    ├── Konfirmasi kehadiran
    ├── ATAU: Ajukan Reschedule (max H-1, max 1x) + alasan

[4] ADMIN PRODI — Review Reschedule (jika ada)
    ├── Approve → set jadwal baru → notif Asesor + Pemohon
    └── Reject + catatan → notif Pemohon

[5] ASESOR — Hari Pelaksanaan (C3 saja)
    ├── Pemohon hadir → Klik "Mulai Ujian" → ujian_dimulai_at = now()
    │       Pemohon: soal muncul + countdown durasi
    │       Submit jawaban → fase: koreksi
    └── Pemohon tidak hadir → Klik "Tandai Tidak Hadir"
            fase: tidak_hadir → nilai AT2 = 0

[6] ASESOR — Penilaian
    ├── Beri skor 1-5 per soal/instrumen
    ├── Input catatan akhir (opsional)
    └── Submit nilai → fase: selesai → lanjut ke Pleno
```

---

## Database Changes

### Kolom baru di `uji_lanjutan`

```sql
ALTER TABLE uji_lanjutan
  ADD COLUMN ujian_dimulai_at     TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN reschedule_status    VARCHAR(20) NULL DEFAULT NULL,  -- diajukan | disetujui | ditolak
  ADD COLUMN reschedule_alasan    TEXT NULL DEFAULT NULL,
  ADD COLUMN reschedule_catatan   TEXT NULL DEFAULT NULL,         -- catatan dari Admin Prodi
  ADD COLUMN reschedule_count     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN dijadwalkan_oleh     BIGINT UNSIGNED NULL DEFAULT NULL,  -- FK ke users (admin_prodi)
  ADD COLUMN dijadwalkan_at       TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE uji_lanjutan
  ADD CONSTRAINT fk_uji_lanjutan_dijadwalkan_oleh
  FOREIGN KEY (dijadwalkan_oleh) REFERENCES users(id) ON DELETE SET NULL;
```

### Perubahan `fase_tulis` — tambah nilai baru

```
buat_soal | menunggu_jawaban | koreksi | selesai | tidak_hadir
```

### Field yang berubah peran

| Field | Sebelum | Sesudah |
|---|---|---|
| `tanggal_ujian` | Diisi asesor | Diisi Admin Prodi |
| `waktu_ujian` | Dipakai hitung window | Hanya display informasi |
| `durasi_menit` | Diisi asesor di form instrumen | Diisi Admin Prodi saat jadwalkan |
| `tempat` | Diisi asesor | Diisi Admin Prodi |
| `link_meeting` | Diisi asesor | Diisi Admin Prodi |
| `ujian_dimulai_at` | (baru) | Diset asesor saat klik Mulai |

---

## Backend — Endpoints

### Endpoints BARU

| Method | Route | Actor | Fungsi |
|---|---|---|---|
| POST | `/admin-prodi/uji-lanjutan/{pendaftaranId}/jadwal` | Admin Prodi | Set jadwal AT2 (tanggal, waktu, durasi, tempat, link) |
| POST | `/asesor/uji-lanjutan/{pendaftaranId}/mulai` | Asesor | Mulai ujian → set `ujian_dimulai_at = now()` |
| POST | `/asesor/uji-lanjutan/{pendaftaranId}/tidak-hadir` | Asesor | Tandai tidak hadir → `fase = tidak_hadir` |
| POST | `/pemohon/uji-lanjutan/{id}/reschedule` | Pemohon | Ajukan reschedule + alasan |
| POST | `/admin-prodi/uji-lanjutan/{id}/reschedule/approve` | Admin Prodi | Setujui + jadwal baru |
| POST | `/admin-prodi/uji-lanjutan/{id}/reschedule/reject` | Admin Prodi | Tolak + catatan |

### Endpoints DIMODIFIKASI

| Route | Perubahan |
|---|---|
| `POST /asesor/uji-lanjutan/{id}/jadwal` | **DIHAPUS** — fungsinya dipindah ke admin-prodi |
| `POST /asesor/uji-lanjutan/{id}/soal` | Tidak berubah, tapi hapus `durasi_menit` dari payload (durasi diset admin) |
| `POST /asesor/uji-lanjutan/{id}/publish` | Tidak lagi validasi jadwal (jadwal sudah diset admin); hanya validasi instrumen ada |
| `GET /pemohon/uji-lanjutan` | Update `hitungWindowPengerjaan()` pakai `ujian_dimulai_at` |
| `POST /pemohon/uji-lanjutan/{id}/submit` | Guard pakai `ujian_dimulai_at` bukan waktu string |

### Validasi Guard

```php
// Mulai Ujian — guard:
// 1. Asesor ditugaskan ke pendaftaran ini
// 2. fase_tulis = "menunggu_jawaban" (C3)
// 3. ujian_dimulai_at masih null (belum pernah dimulai)
// 4. Ada instrumen C3

// Tidak Hadir — guard:
// 1. Asesor ditugaskan
// 2. fase_tulis = "menunggu_jawaban" ATAU "koreksi"
// 3. ujian_dimulai_at masih null (belum dimulai — tidak bisa tandai tidak hadir jika sudah mulai)

// Reschedule Pemohon — guard:
// 1. fase_tulis = "menunggu_jawaban"
// 2. reschedule_count < 1 (belum pernah reschedule)
// 3. reschedule_status != "diajukan" (tidak bisa double request)
// 4. ujian_dimulai_at = null (belum dimulai)
// 5. Tanggal hari ini < tanggal_ujian (H-1 minimum)

// Approve Reschedule Admin — guard:
// 1. reschedule_status = "diajukan"
// 2. ujian_dimulai_at = null

// hitungWindowPengerjaan() — logika baru:
// window_mulai = ujian_dimulai_at
// window_selesai = ujian_dimulai_at + durasi_menit
// dalam_window = ujian_dimulai_at != null AND now() between window_mulai and window_selesai
```

---

## Frontend — Halaman yang Berubah

### 1. Form AT2 Asesor (`/asesor/asesmen-tahap-2/form`)

**Dihapus dari form asesor:**
- Seluruh Section 1 "Jadwal Asesmen" (tanggal, waktu, durasi, tempat, link) — pindah ke Admin Prodi
- Durasi di Section 2 (card amber otomatis) — diset Admin Prodi
- Checklist syarat "Jadwal tersimpan" — tidak relevan lagi

**Tetap di form asesor:**
- Section instrumen per MK (soal, pertanyaan, kunci)
- Tombol "Terbitkan ke Pemohon" (validasi: hanya cek instrumen ada, jadwal sudah diset admin)

**Tambah di form asesor (fase menunggu_jawaban, C3):**
- Info jadwal (read-only dari admin): tanggal, waktu, durasi
- Tombol hijau besar: **"Mulai Ujian"** (hanya muncul jika fase `menunggu_jawaban` + C3 + ujian belum dimulai)
- Tombol outline: **"Tandai Tidak Hadir"**
- Setelah mulai: display countdown sisa waktu + status pemohon (belum/sudah submit)

**Setelah Tandai Tidak Hadir:**
- Halaman berubah ke mode penilaian langsung (skip C3 online)
- Nilai default 0, asesor bisa submit dengan catatan

### 2. Halaman AT2 Pemohon (`/pemohon/asesmen-tahap-2`)

**Dihapus:**
- Countdown waktu berbasis `tanggal_ujian + waktu_ujian`
- Logic timezone parsing

**State baru yang ditangani:**

| State | Kondisi | Tampilan |
|---|---|---|
| `menunggu_instrumen` | fase bukan menunggu_jawaban/koreksi/selesai | "Asesor sedang menyiapkan instrumen" |
| `menunggu_mulai` | fase=menunggu_jawaban, ujian_dimulai_at=null, reschedule_status=null | Jadwal + tombol konfirmasi kehadiran |
| `reschedule_diajukan` | reschedule_status="diajukan" | "Permohonan perubahan jadwal sedang ditinjau Admin Prodi" |
| `reschedule_ditolak` | reschedule_status="ditolak" | "Ditolak: {catatan}" + jadwal asli |
| `dalam_ujian` | ujian_dimulai_at ada + dalam window | Soal + countdown sisa waktu |
| `waktu_habis_belum_submit` | window_selesai terlewat + belum submit | "Waktu habis, kirim jawaban terakhir?" |
| `sudah_submit` | fase=koreksi | "Jawaban terkirim, sedang dinilai" |
| `selesai` | fase=selesai | "Asesmen selesai" |
| `tidak_hadir` | fase=tidak_hadir | "Anda tidak hadir pada jadwal AT2. Hubungi Admin Prodi." |

**Tombol Reschedule:**
- Tampil hanya jika: `menunggu_mulai` + `reschedule_count < 1` + `hari ini < tanggal_ujian`
- Form: textarea alasan (minimal 20 karakter)
- Setelah submit: state berubah ke `reschedule_diajukan`

### 3. Admin Prodi — Halaman Pendaftaran Detail

**Tambah tab/section "Asesmen Tahap 2"** di halaman detail pendaftaran:
- Jika `status_alur = "asesmen_tahap2"` → tampil panel AT2
- Form jadwal: tanggal, waktu mulai, durasi (menit), tempat, link meeting
- Tombol "Simpan Jadwal AT2" → notifikasi ke asesor + pemohon
- Jika ada reschedule request: tampil card dengan tombol Setujui/Tolak + input catatan

**Notifikasi yang dikirim Admin Prodi:**
- Saat set jadwal → notif ke pemohon: "Jadwal AT2 Anda telah ditetapkan: {tanggal}, {waktu}, {tempat}"
- Saat set jadwal → notif ke asesor: "Jadwal AT2 untuk {nama_pemohon} telah ditetapkan"
- Saat approve reschedule → notif ke pemohon + asesor
- Saat reject reschedule → notif ke pemohon

---

## Notifikasi (Semua Trigger)

| # | Trigger | Kirim ke | Pesan |
|---|---|---|---|
| N1 | Admin set jadwal AT2 | Pemohon | "Jadwal Asesmen Tahap 2 Anda telah ditetapkan: {tanggal} pkl {waktu} WITA" |
| N2 | Admin set jadwal AT2 | Asesor | "Jadwal AT2 untuk {nama_pemohon} telah ditetapkan oleh Admin Prodi" |
| N3 | Pemohon ajukan reschedule | Admin Prodi | "{nama_pemohon} mengajukan perubahan jadwal AT2" |
| N4 | Admin approve reschedule | Pemohon | "Permohonan reschedule AT2 Anda disetujui. Jadwal baru: {tanggal}" |
| N5 | Admin approve reschedule | Asesor | "Jadwal AT2 {nama_pemohon} diperbarui. Silakan cek jadwal terbaru." |
| N6 | Admin reject reschedule | Pemohon | "Permohonan reschedule ditolak. Catatan: {catatan_admin}" |
| N7 | Asesor klik Mulai | Pemohon | "Ujian tertulis AT2 Anda telah dimulai. Buka halaman AT2 sekarang." |
| N8 | Asesor tandai Tidak Hadir | Pemohon | "Anda tercatat tidak hadir pada AT2. Hubungi Admin Prodi jika ada kendala." |
| N9 | Semua asesor submit nilai | Admin Prodi | "Penilaian AT2 {nama_pemohon} selesai. Siap untuk Pleno." |

---

## Migration Files yang Diperlukan

```
2026_06_xx_000001_add_ujian_dimulai_at_to_uji_lanjutan.php
2026_06_xx_000002_add_reschedule_fields_to_uji_lanjutan.php
2026_06_xx_000003_add_dijadwalkan_oleh_to_uji_lanjutan.php
```

---

## Task List Implementasi (Urutan Pengerjaan)

### FASE 1: Backend Foundation
- [ ] T1: Migration kolom baru `uji_lanjutan`
- [ ] T2: Update model `UjiLanjutan` (fillable, casts)
- [ ] T3: Endpoint Admin Prodi: set jadwal AT2
- [ ] T4: Endpoint Asesor: mulai ujian
- [ ] T5: Endpoint Asesor: tidak hadir
- [ ] T6: Update `hitungWindowPengerjaan()` pakai `ujian_dimulai_at`
- [ ] T7: Update `publishSoal()` — hapus validasi jadwal (sudah diset admin)
- [ ] T8: Update `saveItems()` — hapus `durasi_menit` dari payload
- [ ] T9: Endpoint Pemohon: ajukan reschedule
- [ ] T10: Endpoint Admin Prodi: approve/reject reschedule
- [ ] T11: Routing semua endpoint baru
- [ ] T12: Notifikasi untuk semua trigger (N1-N9)

### FASE 2: Frontend Admin Prodi
- [ ] T13: Section AT2 di halaman detail pendaftaran admin-prodi
- [ ] T14: Form jadwal AT2 (tanggal, waktu, durasi, tempat, link)
- [ ] T15: Card review reschedule (approve/reject)

### FASE 3: Frontend Asesor
- [ ] T16: Hapus Section 1 (Jadwal) dan card durasi dari form AT2 asesor
- [ ] T17: Tambah info jadwal read-only (dari Admin Prodi)
- [ ] T18: Tombol "Mulai Ujian" + "Tandai Tidak Hadir"
- [ ] T19: Display countdown sisa waktu di sisi asesor
- [ ] T20: Display status pemohon (belum/sudah submit) real-time

### FASE 4: Frontend Pemohon
- [ ] T21: Update semua state AT2 pemohon (9 state baru)
- [ ] T22: Hapus countdown berbasis waktu server
- [ ] T23: Polling `ujian_dimulai_at` untuk auto-unlock soal
- [ ] T24: Tombol "Ajukan Perubahan Jadwal" + form alasan
- [ ] T25: State reschedule (diajukan, disetujui, ditolak)
- [ ] T26: State "Tidak Hadir"

---

## Catatan Tambahan

### Backward Compatibility
- Data `uji_lanjutan` yang sudah ada dengan `ujian_dimulai_at = null` → frontend pemohon tampil "Menunggu asesor memulai ujian"
- `waktu_ujian` tetap disimpan sebagai string display, bukan dipakai untuk window calculation
- Asesor yang sudah punya instrumen ter-publish tidak perlu ulang — cukup Admin Prodi set jadwal

### Yang Tidak Berubah
- Instrumen soal (C3 jawaban singkat, C1 pertanyaan lisan, C4 instruksi demo)
- Scoring 1-5 × rata-rata × 20
- Blind review (asesor tidak lihat nilai satu sama lain)
- Nilai AT2 final = rata-rata semua asesor
- Alur setelah selesai → Pleno

### Keputusan Desain Penting
- **Asesor tetap bisa edit instrumen** selama `ujian_dimulai_at = null` (sebelum mulai)
- **Reschedule max 1x** — enforced di backend dengan `reschedule_count`
- **Tidak ada auto-start** — selalu butuh klik manual asesor
- **Tidak ada reschedule setelah tandai tidak hadir** — harus koordinasi manual di luar sistem
