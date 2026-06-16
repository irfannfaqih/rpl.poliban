# Production Readiness Audit - SIRPL POLIBAN

Tanggal audit: 15 Juni 2026  
Objek audit: keadaan filesystem dan runtime lokal saat audit  
Stack: Laravel 12.53, PHP 8.3, MySQL, Sanctum, Next.js 16.2.4, React 19, React Query, Zustand

## 1. Executive Summary

### Kesimpulan

**Status: TIDAK DIREKOMENDASIKAN PRODUCTION**

Fitur utama telah terbentuk dan frontend dapat menghasilkan production build, tetapi sistem belum memenuhi batas aman untuk data pengguna nyata. Risiko keseluruhan **Critical** karena terdapat broken object-level authorization, penyimpanan dokumen pribadi pada storage publik, dokumen SK yang dapat berubah setelah diterbitkan, migrasi yang menghapus data, dependency dengan advisory critical/high, dan hampir tidak ada automated test bisnis.

### Temuan Paling Kritis

1. Pemohon dapat menghapus dokumen milik pemohon lain melalui IDOR.
2. Admin Prodi dapat melihat/mengubah arsip dan AT2 lintas prodi.
3. KTP, ijazah, transkrip, arsip, dan bukti sanggah disimpan pada disk publik.
4. SK yang sudah diterbitkan dapat diterbitkan ulang, diubah oleh finalisasi ulang, atau berubah akibat sanggah/profil penerbit.
5. Migrasi AT2 menghapus seluruh data `uji_lanjutan` dan `uji_lanjutan_item`.
6. Dependency audit menemukan PHPSpreadsheet critical, Laravel/Symfony/Next.js high, dan advisory lain.
7. Test hanya berisi 2 assertion contoh; tidak ada test otorisasi, workflow, PDF, upload, atau concurrency.

### Hasil Pemeriksaan Otomatis

| Pemeriksaan | Hasil |
|---|---|
| `npm run build` | Lulus, 38 route berhasil dibangun |
| `npm run lint` | Gagal: 285 error, 61 warning |
| `php artisan test` | Lulus hanya 2 test contoh, 2 assertion |
| Coverage | Tidak tersedia karena Xdebug/PCOV tidak terpasang |
| `vendor/bin/pint --test` | Gagal: 97 style issue dan 1 parse error |
| `composer validate --strict` | Lock file tidak sinkron dengan `composer.json` |
| `composer audit --locked` | 17 advisory pada 11 package, termasuk critical/high |
| `npm audit --omit=dev` | 18 vulnerability: 5 high, 13 moderate |
| Migration status | Semua migrasi lokal tercatat sudah dijalankan |
| Runtime | `APP_DEBUG` aktif, queue `sync`, config/routes tidak dicache |
| Database health | Gagal karena view dengan orphan `DEFINER` |

## 2. Temuan Audit

### F-01 - IDOR Penghapusan Dokumen Pemohon

**Prioritas:** Critical  
**Lokasi:** `backend/app/Http/Controllers/Api/Pemohon/BorangController.php:471-479`

**Deskripsi:** Endpoint menerima `{pendaftaran}` dan `{dokumen}`, tetapi hanya mengotorisasi pendaftaran. Tidak ada pemeriksaan bahwa `dokumen.pendaftaran_id` sama dengan pendaftaran tersebut.

**Root Cause:** Route model binding dilakukan secara independen dan nested binding tidak di-scope.

**Dampak:** Pemohon yang mengetahui/menebak ID dokumen dapat menghapus file dan record milik pemohon lain menggunakan ID pendaftaran miliknya sendiri.

**Risiko Jangka Pendek:** Kehilangan bukti asesmen dan kebocoran pola ID.

**Risiko Jangka Panjang:** Data corruption, sengketa asesmen, dan pelanggaran perlindungan data.

**Rekomendasi:** Gunakan scoped binding atau query dokumen melalui relasi pendaftaran.

**Contoh Implementasi:**

```php
$dokumen = $pendaftaran->dokumen()->findOrFail($dokumen->id);
Storage::disk('private')->delete($dokumen->file_path);
$dokumen->delete();
```

### F-02 - Broken Tenant Isolation Admin Prodi

**Prioritas:** Critical  
**Lokasi:** `AdminProdi/ArsipController.php:45-84`, `AdminProdi/UjiLanjutanController.php:17-201`

**Deskripsi:** `ArsipController::show/upload` dan seluruh endpoint AT2 Admin Prodi tidak memverifikasi bahwa pendaftaran berada pada `prodi_id` admin login.

**Root Cause:** Middleware hanya memeriksa role, bukan ownership/tenant scope.

**Dampak:** Admin Prodi dapat membaca arsip, mengunggah arsip, mengatur jadwal, menyetujui/menolak reschedule, dan membaca AT2 milik prodi lain.

**Risiko Jangka Pendek:** Manipulasi proses lintas prodi.

**Risiko Jangka Panjang:** Hilangnya isolasi organisasi dan audit trail yang dapat dipercaya.

**Rekomendasi:** Terapkan policy pada setiap objek dan global tenant scope/service query.

**Contoh Implementasi:**

```php
$pendaftaran = Pendaftaran::whereKey($id)
    ->where('prodi_id', $request->user()->prodi_id)
    ->firstOrFail();
```

### F-03 - Dokumen Pribadi Disimpan pada Storage Publik

**Prioritas:** Critical  
**Lokasi:** `BorangController.php:437`, `ArsipController.php:74`, `PemohonExtraController.php:253`, `config/filesystems.php:43,77`

**Deskripsi:** KTP, ijazah, transkrip, portofolio, arsip, dan bukti sanggah disimpan di disk `public`, yang ditautkan ke `/storage`.

**Root Cause:** Satu disk digunakan untuk avatar/QR publik dan dokumen sensitif.

**Dampak:** Otorisasi controller dapat dilewati bila URL/path diketahui, tersimpan di log, browser history, referer, backup, atau dibagikan.

**Risiko Jangka Pendek:** Unauthorized disclosure PII.

**Risiko Jangka Panjang:** Pelanggaran privasi, reputasi, dan kepatuhan.

**Rekomendasi:** Pisahkan `private-documents` dan `public-assets`; unduh private file hanya melalui controller berotorisasi atau temporary signed URL berdurasi pendek. Tambahkan malware scanning dan `Content-Disposition: attachment`.

### F-04 - SK Tidak Immutable Setelah Diterbitkan

**Prioritas:** Critical  
**Lokasi:** `PlenoController.php:115-137`, `PimpinanController.php:54-72`, `SanggahController.php:73-109`, `pdf/sk_keputusan.blade.php:166-167`

**Deskripsi:**

- Admin dapat memanggil finalisasi ulang dan mengubah SK kembali menjadi `menunggu_sk`.
- Pimpinan dapat menerbitkan ulang SK yang sudah `sk_terbit`.
- `nomor_sk` tidak unique.
- Sanggah dapat mengubah hasil/total SKS setelah SK terbit.
- Nama/NIP penerbit dibaca dari profil terkini, bukan snapshot saat penerbitan.

**Root Cause:** Tidak ada state machine immutable, versioning dokumen, snapshot penandatangan, atau constraint nomor SK.

**Dampak:** PDF lama dapat berubah ketika diunduh ulang; QR lama dapat tidak valid setelah total SKS berubah; nomor SK dapat duplikat.

**Risiko Jangka Pendek:** Dokumen resmi saling tidak konsisten.

**Risiko Jangka Panjang:** Masalah legal, akademik, dan audit.

**Rekomendasi:** Setelah penerbitan, kunci SK dan hasil sumbernya. Simpan snapshot nomor, nama/NIP/jabatan penerbit, detail keputusan, hash PDF, versi, dan waktu penerbitan. Koreksi harus menghasilkan revisi baru, bukan overwrite.

### F-05 - Migrasi Production Menghapus Data

**Prioritas:** Critical  
**Lokasi:** `2026_06_06_100003_restructure_uji_lanjutan_table.php:25-41`, `2026_06_03_094032_drop_deprecated_tables_phase_7.php:14-25`

**Deskripsi:** Migrasi secara eksplisit menghapus seluruh item dan sesi AT2, menonaktifkan foreign key, menjalankan raw DDL, serta memiliki migrasi one-way yang menghapus tabel.

**Root Cause:** Strategi migrasi development dipakai sebagai migrasi deployment.

**Dampak:** Kehilangan data saat deployment dan rollback yang tidak mungkin.

**Rekomendasi:** Ganti dengan expand-migrate-contract: tambah schema baru, backfill tervalidasi, dual-read/write sementara, cutover, backup, baru hapus kolom pada rilis terpisah.

### F-06 - Dependency Memiliki Vulnerability Aktif

**Prioritas:** Critical  
**Lokasi:** `backend/composer.lock`, `frontend/package-lock.json`

**Deskripsi:** `composer audit` menemukan 17 advisory, termasuk PHPSpreadsheet critical, Laravel 12.53 di bawah versi perbaikan 12.60, dan Symfony mail/mime high. `npm audit` menemukan 5 high termasuk Next.js 16.2.4.

**Root Cause:** Tidak ada dependency security gate dan lock file tidak dirawat konsisten.

**Dampak:** Risiko injection, request confusion, DoS, dan vulnerability framework.

**Rekomendasi:** Upgrade dependency ke versi patched, regenerasi lock file, jalankan regression test, dan jadikan `composer audit`/`npm audit` gate CI.

### F-07 - Verifikasi dan Finalisasi Workflow Dapat Dilewati

**Prioritas:** High  
**Lokasi:** `PendaftaranController.php:84-122`, `PlenoController.php:84-137`

**Deskripsi:** Variabel `$allValid` hanya memeriksa jumlah dokumen dan tidak digunakan. Request `submit` selalu memindahkan status ke `pra_asesmen`, walaupun item invalid. Finalisasi pleno tidak memastikan semua MK memiliki keputusan final valid.

**Root Cause:** Validasi UI dianggap sebagai penegak workflow; backend tidak memiliki transition guard terpusat.

**Dampak:** Berkas invalid dapat lolos dan SK dapat dibuat dari keputusan tidak lengkap/sembarang string maksimal dua karakter.

**Rekomendasi:** Implementasikan domain state machine dan precondition server-side pada setiap transisi.

### F-08 - Integritas Item AT2 Tidak Di-scope

**Prioritas:** High  
**Lokasi:** `Asesor/UjiLanjutanController.php:303-313`, `Pemohon/UjiLanjutanController.php:91-121`

**Deskripsi:** Validasi hanya `exists:uji_lanjutan_item,id`. Asesor dapat mengirim ID item sesi lain dan membuat penilaian pada item tersebut. Pemohon dapat mengirim ID asing/tidak relevan lalu sistem tetap mengubah fase ke `koreksi`, walaupun tidak ada jawaban miliknya yang diperbarui.

**Root Cause:** Foreign object ID tidak divalidasi terhadap parent resource.

**Dampak:** Cross-assessment data corruption dan ujian dapat diselesaikan tanpa jawaban lengkap.

**Rekomendasi:** Gunakan `Rule::exists()->where('uji_lanjutan_id', $uji->id)`, cek jumlah item tepat, dan transaction.

### F-09 - Operasi Replace dan Transisi Tidak Transaksional

**Prioritas:** High  
**Lokasi:** `BorangController.php:202-207,230-237,270-288`, `WorkspaceController.php:315-344`, `PlenoController.php:121-146`

**Deskripsi:** Pola delete-all lalu insert, perubahan status, pembuatan SK, notifikasi, dan sinkronisasi relasi dilakukan tanpa transaction.

**Root Cause:** Transaction hanya digunakan pada nomor pendaftaran dan penerbitan SK.

**Dampak:** Error di tengah request meninggalkan data kosong/sebagian dan status tidak konsisten.

**Rekomendasi:** Bungkus unit bisnis dalam `DB::transaction`, gunakan upsert, idempotency key, dan locking pada transisi kompetitif.

### F-10 - Race Condition pada Submit Asesor, Jadwal, dan Nomor

**Prioritas:** High  
**Lokasi:** `WorkspaceController.php:376-390`, `UjiLanjutanController.php:323-346`, `PendaftaranService.php:24-55`

**Deskripsi:** Dua asesor dapat submit bersamaan dan menghitung state dari snapshot berbeda. Pemeriksaan konflik jadwal hanya advisory dan tidak dikunci. Generator nomor pada SQLite tidak aman terhadap concurrency.

**Dampak:** Status tidak berpindah, berpindah dua kali, notifikasi duplikat, jadwal bentrok, atau duplicate-key error.

**Rekomendasi:** Gunakan row lock, transaction, unique constraints, dan idempotent transition service.

### F-11 - Password Reset Tidak Aman dan Tidak Reliabel

**Prioritas:** High  
**Lokasi:** `AuthController.php:293-327`, `PenggunaController.php:159-188`

**Deskripsi:** Password langsung diganti sebelum email berhasil, password sementara dibuat dengan `str_shuffle`/`rand`, dikirim plaintext melalui email, dan endpoint admin mengembalikan password ke frontend.

**Root Cause:** Implementasi reset berupa credential replacement, bukan token reset sekali pakai.

**Dampak:** Penyerang dapat memicu lockout; kegagalan email membuat pengguna kehilangan akses; credential terekspos di response/log/UI.

**Rekomendasi:** Gunakan password broker Laravel, token single-use berumur pendek, CSPRNG, rate limit per akun+IP, dan jangan mengembalikan password.

### F-12 - Tidak Ada Quality Gate dan Test Bisnis

**Prioritas:** High  
**Lokasi:** `backend/tests/`, seluruh frontend

**Deskripsi:** Hanya ada dua test scaffold. Tidak ada test frontend. Lint memiliki 346 masalah dan Pint gagal pada 97 file/style issue serta parse error `backend/test_mail.php`.

**Dampak:** Regression otorisasi, workflow, PDF, upload, dan pembayaran tidak akan terdeteksi sebelum rilis.

**Rekomendasi:** Prioritaskan integration test akses lintas role/prodi, state transition, upload private file, pembayaran webhook, SK immutability, concurrency, dan contract API.

### F-13 - Konfigurasi Runtime Belum Production

**Prioritas:** High  
**Lokasi:** runtime `artisan about`, `.env.example`, `config/app.php:70`

**Deskripsi:** Runtime saat audit memakai environment `local`, debug aktif, queue `sync`, config/routes tidak dicache, log debug, timezone UTC, sementara aturan bisnis menggunakan WITA/Asia Makassar.

**Dampak:** Stack trace/data sensitif dapat bocor; email/PDF memperlambat request; deadline dan jadwal dapat bergeser delapan jam.

**Rekomendasi:** Production environment terpisah: `APP_DEBUG=false`, timezone eksplisit, queue worker terkelola, config/route cache, HTTPS, secure cookie, log `info/warning`, dan smoke test pascadeploy.

### F-14 - Audit Trail Tidak Berfungsi sebagai Ledger

**Prioritas:** High  
**Lokasi:** `AuditObserver.php:12-41`, `AuditLogController.php`, tabel `audit_log`

**Deskripsi:** Observer menulis perubahan ke file log, sedangkan halaman audit membaca tabel `audit_log`. Tidak ditemukan writer ke model `AuditLog`. Observer juga menulis seluruh original/data model, berpotensi mencatat PII.

**Dampak:** UI audit kosong/tidak lengkap, log sensitif membengkak, dan bukti perubahan tidak queryable/immutable.

**Rekomendasi:** Buat audit service terstruktur dengan allowlist field, request/correlation ID, actor, impersonator, IP, before/after teredaksi, retention, dan append-only storage.

### F-15 - Pagination dan Export Dapat Menghabiskan Resource

**Prioritas:** High  
**Lokasi:** banyak controller memakai `paginate($request->get('per_page', ...))`; `PendaftarExport.php:22-27`; frontend meminta 500 record

**Deskripsi:** `per_page` tidak memiliki maksimum. Export pendaftar menggunakan `FromCollection` dan memuat semua record serta relasi ke memory. PDF dan email berjalan sinkron.

**Dampak:** Request dapat memicu memory exhaustion/timeout saat data besar atau disalahgunakan.

**Rekomendasi:** Batasi `per_page` maksimal 100, gunakan cursor/chunk/queued export, simpan hasil export sementara, dan pindahkan PDF/email ke queue.

### F-16 - Query Berulang pada Evaluasi Diri dan Jadwal

**Prioritas:** Medium  
**Lokasi:** `BorangController.php:314-400`, `JadwalController.php:167-207`

**Deskripsi:** Dokumen tambahan di-query ulang untuk setiap CPMK dan dokumen wajib di-query per item. Pemeriksaan jadwal melakukan query nama user di dalam loop konflik.

**Dampak:** Jumlah query tumbuh terhadap jumlah CPMK/dokumen/jadwal.

**Rekomendasi:** Preload semua dokumen sekali dan `keyBy`, eager-load asesor, serta pindahkan konflik ke query/range model yang terindeks.

### F-17 - Token Bearer Disimpan di LocalStorage Tanpa Security Header

**Prioritas:** High  
**Lokasi:** `frontend/src/store/useAuthStore.ts:79,134-138`, `frontend/src/lib/api.ts:15-22`, `frontend/next.config.ts`

**Deskripsi:** Token disimpan dua kali di localStorage/persisted Zustand. Tidak ada CSP/HSTS/frame/content-type policy pada Next config.

**Dampak:** Satu XSS dapat mencuri token bearer delapan jam.

**Rekomendasi:** Gunakan Sanctum SPA cookie HttpOnly/Secure/SameSite bila arsitektur domain memungkinkan; tambahkan CSP ketat dan security headers; jangan persist token pada dua key.

### F-18 - Endpoint Mengungkap Detail Exception

**Prioritas:** Medium  
**Lokasi:** `AdminProdi/ArsipController.php:111-115`

**Deskripsi:** Pesan exception PDF dikembalikan langsung ke client. Debug runtime juga aktif.

**Dampak:** Path, query, struktur internal, dan detail library dapat terekspos.

**Rekomendasi:** Return error generik dengan correlation ID; simpan detail hanya di log terproteksi.

### F-19 - Fitur Impersonation Tidak Lengkap

**Prioritas:** Medium  
**Lokasi:** `frontend/src/components/ImpersonateBanner.tsx`, `frontend/src/store/useAuthStore.ts`, `routes/api.php`

**Deskripsi:** Frontend memanggil `DELETE /super-admin/impersonate`, tetapi route/backend tidak tersedia dan state tidak pernah diaktifkan.

**Dampak:** Fitur dead/inconsistent dan audit `impersonated_by` tidak pernah terisi.

**Rekomendasi:** Hapus sampai benar-benar dibutuhkan atau implementasikan end-to-end dengan token terpisah, expiry, banner, exit route, dan audit wajib.

### F-20 - Instance Database Mengandung View dengan Orphan DEFINER

**Prioritas:** High  
**Lokasi:** runtime MySQL

**Deskripsi:** `php artisan db:show --counts --views` gagal karena view `sefasont_delivered.frontend_report_data` memakai definer `sefasont_admin@localhost` yang tidak ada.

**Dampak:** Health/audit/backup dapat gagal dan menunjukkan instance atau restore bercampur dengan schema lain.

**Rekomendasi:** Pisahkan database/user per aplikasi, inventaris view, perbaiki definer menggunakan account deployment yang valid, dan uji backup-restore pada environment bersih.

## 3. Audit Database

### Struktur dan Integritas

1. `pleno_mk` memiliki index `(pendaftaran_id, mata_kuliah_id)` tetapi tidak unique. `updateOrCreate` tetap dapat menghasilkan duplikat saat race. Tambahkan unique constraint.
2. `sk_keputusan.nomor_sk` tidak unique dan tidak diindeks. Tambahkan unique constraint sesuai format institusi.
3. `pendaftaran.midtrans_order_id` belum unique/indexed. Ini wajib sebelum integrasi pembayaran untuk idempotency callback.
4. `sanggah` tidak membatasi satu sanggah aktif per pendaftaran+MK dan tidak memastikan MK berasal dari hasil pendaftaran.
5. `penugasan_asesor` menjamin urutan unik, tetapi tidak menjamin asesor yang sama tidak mengisi kedua urutan pada level database.
6. `jadwal_asesmen` tidak memiliki constraint atau model interval untuk mencegah konflik; validasi saat ini hanya preview aplikasi.
7. JSON `evaluasi_diri.dokumen_pendukung` menyimpan ID dokumen tanpa foreign key. Referensi menjadi yatim ketika dokumen dihapus.
8. JSON `pra_pemetaan_payload` tidak tervalidasi schema/version dan berisiko drift.
9. Banyak enum database diubah dengan raw MySQL DDL, mengikat deployment ke MySQL dan meningkatkan lock/downtime.
10. `users.nip` pada endpoint profil menerima 255 karakter, sementara Super Admin membatasi 18; contract tidak konsisten.

### Normalisasi dan Redundansi

- Nama pemohon disimpan di `users.nama` dan `borang_data_diri.nama_lengkap`, lalu disinkronkan secara lazy pada endpoint `/me`. Ini menunjukkan dua sumber kebenaran.
- Dokumen pendukung sebelumnya memakai pivot ber-FK lalu diganti JSON ID. Storage lebih ringkas untuk baca, tetapi integritas relasional hilang.
- Status bisnis tersebar sebagai string/enum di controller, database, frontend `alur.ts`, dan komponen. Tidak ada satu definisi state machine.
- Identitas penandatangan SK tidak disnapshot, sehingga histori bergantung pada row user mutable.

### Storage

- `TEXT` pada catatan/deskripsi masuk akal, tetapi log seluruh model dapat menggandakan volume PII.
- Audit file `single` tanpa rotasi default berisiko tumbuh tanpa batas; gunakan daily/central logging dengan retention.
- File binary berada di filesystem lokal. Scaling horizontal akan membutuhkan shared object storage, backup terpisah, checksum, lifecycle, dan antivirus scanning.

### Indexing Prioritas

Tambahkan/verifikasi:

```text
UNIQUE pleno_mk(pendaftaran_id, mata_kuliah_id)
UNIQUE sk_keputusan(nomor_sk)
UNIQUE pendaftaran(midtrans_order_id)
UNIQUE penugasan_asesor(pendaftaran_id, asesor_id)
INDEX sanggah(pendaftaran_id, status)
INDEX uji_lanjutan(status, fase_tulis, tanggal_ujian)
INDEX audit_log(user_id, created_at)
```

## 4. Audit Performa

### Bottleneck Utama

1. Queue runtime `sync`: email dan pekerjaan berat menahan response HTTP.
2. Export pendaftar memuat seluruh data ke memory.
3. PDF DomPDF dibuat sinkron dan memuat banyak relasi/gambar base64.
4. Polling notifikasi per 30 detik pada beberapa komponen dapat menduplikasi request per user.
5. Endpoint borang mengembalikan hampir seluruh graph pendaftaran, kurikulum, CPMK, dokumen, asesor, jadwal, AT2, dan SK pada satu request.
6. Pagination dapat dinaikkan bebas oleh client.
7. Query berulang evaluasi dokumen dan konflik jadwal.
8. Pleno `index` melakukan compile/write saat GET, sehingga request baca mempunyai side effect dan beban tidak terduga.

### Prioritas Optimasi

1. Queue email, export, dan PDF.
2. Pecah endpoint borang berdasarkan section dan gunakan conditional includes.
3. Cap pagination dan gunakan cursor pagination untuk tabel besar.
4. Precompute pleno saat asesor selesai, bukan pada GET list.
5. Ganti polling notifikasi dengan satu polling global atau SSE/WebSocket setelah baseline stabil.
6. Tambahkan query monitoring dan slow-query threshold.

## 5. Audit Keamanan

| Area | Risiko | Ringkasan |
|---|---|---|
| Broken access control | Critical | IDOR dokumen dan akses Admin Prodi lintas prodi |
| Sensitive file exposure | Critical | Dokumen pribadi berada pada disk publik |
| Official document integrity | Critical | SK dapat berubah/diterbitkan ulang |
| Dependency vulnerabilities | Critical | Advisory critical/high aktif |
| Authentication | High | Token localStorage, password reset plaintext |
| Authorization | High | Item AT2 dan beberapa nested resource tidak di-scope |
| File upload | High | Tidak ada malware scan; bukti sanggah tanpa MIME allowlist |
| Information disclosure | High | Debug aktif dan exception internal dikirim ke client |
| Rate limiting | Medium | Endpoint authenticated berat tidak memiliki limiter khusus |
| Auditability | High | Audit DB tidak ditulis; file log mencatat data sensitif |
| Security headers | High | Tidak ada CSP/HSTS/frame policy pada frontend config |

Tidak ditemukan penggunaan SQL raw dari input pengguna yang langsung menunjukkan SQL injection klasik. Query builder digunakan secara dominan. Namun, ini tidak mengurangi risiko broken access control yang saat ini lebih mudah dieksploitasi.

## 6. Production Readiness Report

### Keputusan

**TIDAK DIREKOMENDASIKAN PRODUCTION**

Alasan teknis:

1. Confidentiality gagal karena private document storage dan IDOR.
2. Integrity gagal karena workflow bypass dan SK mutable.
3. Availability berisiko karena dependency, unbounded pagination, export/PDF sinkron, dan queue sync.
4. Deployability gagal karena destructive migration dan lock file tidak konsisten.
5. Testability gagal karena tidak ada coverage bisnis.
6. Observability belum dapat dipercaya karena audit trail terpisah/tidak terisi.
7. Runtime config masih development dan database instance tidak bersih.

### Kriteria Minimum Sebelum Go-Live

- Semua Critical dan High access-control ditutup dan diuji.
- Dokumen sensitif dipindah ke private storage.
- SK dibuat immutable/versioned.
- Dependency critical/high di-upgrade.
- Migrasi diuji pada salinan data production dan memiliki rollback/backup plan.
- Test workflow utama dan authorization matrix berjalan di CI.
- `APP_DEBUG=false`, queue worker aktif, HTTPS/security headers, timezone konsisten.
- Backup-restore drill dan monitoring dasar berhasil.

## 7. Roadmap Prioritas Perbaikan

### P0 - Blocker Go-Live

1. Perbaiki IDOR dokumen, Arsip, dan AT2 lintas prodi.
2. Migrasikan dokumen sensitif ke private storage.
3. Kunci lifecycle SK dan snapshot seluruh data resmi.
4. Patch dependency critical/high.
5. Hapus/ganti migrasi destructive; siapkan rehearsal database.
6. Perbaiki verifikasi berkas dan finalisasi pleno server-side.
7. Tambahkan regression test untuk seluruh poin P0.

### P1 - Stabilitas dan Integritas

1. Transaction + row lock pada submit/finalize/replace operations.
2. Scope item AT2 dan validasi completeness.
3. Unique constraint nomor SK, pleno, pembayaran, dan penugasan.
4. Ganti password reset dengan reset-token flow.
5. Perbaiki timezone dan state machine terpusat.
6. Implementasikan audit ledger yang benar.

### P2 - Performa dan Operasional

1. Aktifkan asynchronous queue untuk email, PDF, dan export.
2. Batasi pagination dan ubah export menjadi queued/chunked.
3. Hilangkan query berulang dan side effect pada GET.
4. Konfigurasikan cache, route/config cache, log rotation, metrics, dan alerting.
5. Bersihkan database instance dan uji backup/restore.

### P3 - Maintainability

1. Selesaikan 285 lint error dan 97 issue Pint.
2. Tambahkan DTO/FormRequest, enum/state service, dan policy per resource.
3. Hapus script debug/dead feature dari artefak deployment.
4. Sinkronkan `composer.json` dengan lock file.
5. Tambahkan CI: test, lint, format, dependency audit, migration rehearsal, dan build.

## Batasan Audit

Audit dilakukan secara statis dan melalui command lokal yang tersedia. Tidak dilakukan penetration test aktif, load test terdistribusi, pengujian email eksternal, simulasi callback payment gateway, atau deployment ke infrastruktur production. Temuan runtime mengacu pada environment lokal saat audit dan perlu diverifikasi kembali pada staging yang identik dengan production.
