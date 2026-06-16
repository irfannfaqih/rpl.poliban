# Phase 1 Completion Verification

Tanggal verifikasi: 15 Juni 2026

## Status

Seluruh item yang sebelumnya berstatus `NOT COMPLETED` dan `REGRESSION RISK`
telah diimplementasikan dan diverifikasi menjadi `COMPLETED`.

## Bukti Per Item

### Private File Access dan Frontend Regression

- File dokumen, arsip, dan bukti sanggah disimpan pada disk
  `private-documents`.
- Akses file melalui endpoint terautentikasi `/api/private-files/*` dengan
  pemeriksaan ownership, penugasan asesor, atau scope prodi.
- Seluruh pemanggil frontend menggunakan authenticated blob download.
- Migrator legacy memindahkan 13 file dari public ke private storage.
- `php artisan documents:migrate-private --dry-run` setelah migrasi:
  `0 file dipindahkan`.
- `php artisan phase1:verify`: public sensitive file `PASS`, private file
  availability `PASS`.
- Production build Next.js lulus untuk 39 halaman.

### AT2 Scope dan Transaction Boundary

- ID instrumen divalidasi dengan `Rule::exists(...)->where(uji_lanjutan_id)`.
- Submit jawaban dan nilai harus mengirim exact set instrumen, tanpa ID asing
  atau duplikat.
- Submit pemohon, submit nilai asesor, penyimpanan instrumen, dan finalisasi
  tugas menggunakan transaction serta row lock.
- Perpindahan status ke pleno hanya terjadi setelah seluruh asesor selesai.

### Workflow Integrity

- Transisi status terpusat pada `Pendaftaran::canTransitionTo()`.
- Update status admin, submit final asesor, finalisasi pleno, dan penerbitan SK
  memakai transaction/row lock.
- Verifikasi berkas final wajib menyertakan dan memvalidasi `form01`, `form02`,
  `form16`, `ijazah`, dan `transkrip`.
- Pleno tidak dapat difinalisasi sebelum semua keputusan mata kuliah valid.
- Sanggah tidak dapat diputus ulang atau diproses setelah SK diterbitkan.

### Unique Constraints dan Data Integrity

Migration `2026_06_15_000001_add_phase1_integrity_constraints.php` telah
dijalankan pada batch 28 dengan preflight duplikasi.

Constraint yang diverifikasi langsung oleh `php artisan phase1:verify`:

- `uq_pleno_pendaftaran_mk`: `PASS`
- `uq_penugasan_pendaftaran_asesor`: `PASS`
- `uq_sk_nomor`: `PASS`
- `uq_pendaftaran_midtrans_order`: `PASS`

### SK Immutability

- Identitas penerbit, waktu terbit, versi, dan content hash disimpan sebagai
  snapshot.
- SK lama yang sudah terbit di-backfill saat migration.
- Model menolak perubahan isi dan penghapusan SK terbit; hanya penyelesaian
  path QR yang diizinkan.
- Pleno dan sanggah memeriksa status SK kembali di dalam transaction.
- `php artisan phase1:verify`: seluruh snapshot SK terbit lengkap `PASS`.
- Tes otomatis memastikan perubahan nomor SK terbit ditolak.

### Migration Safety

- Migration restrukturisasi tidak lagi menghapus data; migration berhenti
  dengan error bila tabel sumber masih berisi data.
- Drop tabel deprecated hanya dilakukan jika tabel kosong.
- Migration constraint baru melakukan preflight duplikasi sebelum membuat
  unique index.

### Password Reset Security

- Reset memakai token Laravel Password Broker.
- Password baru di-hash dan seluruh token API lama dicabut.
- Implementasi email/password sementara lama dihapus.
- Pencarian otomatis tidak menemukan referensi plaintext password reset lama.

### Dependency Security

- Laravel diperbarui ke `12.62.0`.
- PHPSpreadsheet diperbarui ke `1.30.5`.
- PSR-7, CommonMark, dan Symfony diperbarui ke versi patched.
- Next.js dan `eslint-config-next` diperbarui ke `16.2.6`.
- PostCSS dipaksa ke versi patched melalui override.
- Dependency CLI `shadcn` dihapus; stylesheet runtime yang digunakan disalin
  identik ke global CSS.
- `composer audit --locked`: tidak ada advisory.
- `npm audit --audit-level=moderate`: `0 vulnerabilities`.

## Verifikasi Otomatis

- `php artisan phase1:verify`: 7/7 pemeriksaan `PASS`.
- `php artisan test`: 7 tes, 13 assertion, seluruhnya lulus.
- PHP lint: 150 file lulus.
- `php artisan route:list --except-vendor`: 124 route aplikasi terdaftar.
- `npm run build`: production build lulus, 39 halaman dihasilkan.
- Migration Phase 1: status `Ran`, batch 28.

## Keputusan

`GO TO PHASE 2`

Item Phase 1 yang sebelumnya `NOT COMPLETED` atau `REGRESSION RISK` tidak lagi
memiliki blocker terverifikasi.
