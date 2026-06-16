# Phase 1.5 Security & Data Integrity Hardening Verification

Tanggal verifikasi: 15 Juni 2026  
Ruang lingkup: seluruh instruksi pada `confirmation.md`  
Metode: pembacaan codebase, penelusuran route dan jalur mutasi, pemeriksaan
schema/database aktual, pencarian bypass berulang, serta verifikasi otomatis.

## 1. Phase 1.5 Executive Summary

### Kesimpulan

**Tingkat keyakinan terhadap klaim penyelesaian Phase 1: rendah.**

Perbaikan Phase 1 telah menutup sejumlah masalah awal: middleware role aktif,
policy pendaftaran sudah diterapkan pada banyak endpoint, file baru disimpan ke
disk private, unique constraint utama sudah aktif, password reset memakai
Laravel Password Broker, dependency audit bersih, dan database aktual tidak
menunjukkan kontradiksi yang diperiksa.

Namun, verifikasi independen menemukan jalur bypass dan regression yang belum
ditutup. Risiko tertinggi adalah:

1. SK terbit masih dapat berubah atau hilang melalui perubahan/penghapusan data
   relasi yang dipakai untuk merender PDF.
2. Akun pemohon dapat dihapus permanen dan menghapus pendaftaran beserta SK
   melalui database cascade.
3. Workflow AT2 dapat dibuat, diubah, dan dinilai di luar fase yang sah.
4. Hasil asesmen tetap dapat diubah setelah asesor melakukan submit final.
5. File dokumen yatim masih berada pada storage publik, sementara verifier
   Phase 1 menghasilkan false positive.
6. Rollback workflow dapat meninggalkan draft SK lama yang kemudian masih dapat
   diterbitkan.
7. Migration lama masih mengandung operasi penghapusan data production.

### Kondisi Saat Ini

| Area | Penilaian |
|---|---|
| Authorization dasar dan role middleware | Cukup, tetapi masih ada cross-resource conflict |
| Private file security | Gagal karena file publik yatim dan fallback legacy |
| Workflow integrity | Gagal karena state bypass dan race condition |
| SK immutability | Gagal secara menyeluruh; hanya row SK yang dikunci |
| Database aktual | Constraint aktif dan data yang diperiksa konsisten |
| Migration safety | Gagal untuk deployment yang belum melewati migration destruktif |
| Test confidence | Rendah |
| Risiko keseluruhan | **Critical** |

## 2. Verification Findings

### V-01 - SK Terbit Bergantung pada Data Relasi yang Tetap Mutable

**Severity:** Critical

**Lokasi terkait:**

- `backend/resources/views/pdf/sk_keputusan.blade.php:33`
- `backend/resources/views/pdf/sk_keputusan.blade.php:73`
- `backend/resources/views/pdf/sk_keputusan.blade.php:125`
- `backend/app/Http/Controllers/Api/AdminProdi/KurikulumController.php:70`
- `backend/app/Http/Controllers/Api/AdminProdi/KurikulumController.php:92`
- `backend/database/migrations/2026_05_10_000013_create_pleno_sanggah_sk_tables.php:14`
- `backend/app/Http/Controllers/Api/SuperAdmin/ProdiController.php:53`

**Bukti teknis:**

- PDF SK membaca langsung `pendaftaran.prodi`, `plenoMk`,
  `pleno.mataKuliah.kode`, `nama`, dan `sks`.
- Admin Prodi tetap dapat memperbarui atau menghapus mata kuliah.
- Foreign key `pleno_mk.mata_kuliah_id` menggunakan `cascadeOnDelete()`.
- Super Admin tetap dapat mengubah nama/jenjang prodi.
- `content_hash` hanya disimpan saat penerbitan; tidak digunakan untuk
  memverifikasi atau merender ulang dokumen.

**Risiko:**

PDF dengan nomor SK yang sama dapat menghasilkan isi berbeda setelah mata
kuliah/prodi berubah. Penghapusan mata kuliah dapat menghapus baris keputusan
SK melalui cascade.

**Rekomendasi:**

Simpan snapshot penuh dokumen saat penerbitan: identitas pemohon, prodi,
keputusan per mata kuliah, kode, nama, SKS, total, penerbit, dan metadata.
Render PDF dari snapshot immutable atau simpan binary PDF final beserta hash.
Blok update/delete master data yang masih direferensikan SK terbit, atau gunakan
FK `restrict` dan versioning.

### V-02 - Penghapusan User Dapat Menghapus SK Terbit melalui Cascade

**Severity:** Critical

**Lokasi terkait:**

- `backend/app/Http/Controllers/Api/SuperAdmin/PenggunaController.php:129`
- `backend/app/Http/Controllers/Api/SuperAdmin/PenggunaController.php:140`
- `backend/database/migrations/2026_05_10_000005_create_pendaftaran_table.php:13`
- `backend/database/migrations/2026_05_10_000013_create_pleno_sanggah_sk_tables.php:45`

**Bukti teknis:**

`PenggunaController::destroy()` menjalankan `forceDelete()`. Relasi
`users -> pendaftaran -> sk_keputusan` menggunakan cascade delete. Penghapusan
oleh database tidak memicu event `SkKeputusan::deleting`, sehingga guard model
untuk SK terbit dapat dilewati.

**Risiko:**

Super Admin dapat menghapus dokumen keputusan resmi, seluruh bukti asesmen, dan
audit context pemohon secara permanen.

**Rekomendasi:**

Larangan hard delete user yang memiliki pendaftaran atau SK. Gunakan
deactivation/anonymization terkontrol. Ubah FK yang melindungi artefak resmi
menjadi `restrict`, dan tambahkan test penghapusan user dengan SK terbit.

### V-03 - AT2 Tidak Menegakkan State Machine pada Seluruh Endpoint

**Severity:** High

**Lokasi terkait:**

- `backend/app/Http/Controllers/Api/Asesor/UjiLanjutanController.php:52`
- `backend/app/Http/Controllers/Api/Asesor/UjiLanjutanController.php:60`
- `backend/app/Http/Controllers/Api/Asesor/UjiLanjutanController.php:135`
- `backend/app/Http/Controllers/Api/Asesor/UjiLanjutanController.php:176`
- `backend/app/Http/Controllers/Api/Asesor/UjiLanjutanController.php:315`
- `backend/app/Http/Controllers/Api/AdminProdi/UjiLanjutanController.php:17`

**Bukti teknis:**

- `show()` membuat sesi AT2 dengan `firstOrCreate()` hanya berdasarkan
  penugasan, tanpa memeriksa `status_alur=asesmen_tahap2`.
- Admin dapat membuat jadwal AT2 pada tahap pendaftaran lain.
- Instrumen masih dapat diubah pada fase `menunggu_jawaban`, yaitu setelah
  dipublikasikan selama ujian belum dimulai.
- `submitNilai()` hanya menolak fase `selesai`; fase `buat_soal`,
  `menunggu_jawaban`, dan `tidak_hadir` tidak ditolak.
- Sebagian transisi tidak memakai transaction dan row lock.

**Risiko:**

AT2 dapat muncul pada workflow yang tidak memerlukannya, soal dapat berubah
setelah publikasi, nilai dapat difinalisasi sebelum ujian sah, dan status dapat
berkonflik ketika request paralel.

**Rekomendasi:**

Buat state transition service tunggal untuk AT2. Semua endpoint mutasi wajib
memuat dan mengunci pendaftaran serta sesi, memeriksa fase sumber yang tepat,
dan mengubah fase dalam transaction yang sama.

### V-04 - Workspace Asesor Tetap Mutable Setelah Submit Final

**Severity:** High

**Lokasi terkait:**

- `backend/app/Http/Controllers/Api/Asesor/WorkspaceController.php:200`
- `backend/app/Http/Controllers/Api/Asesor/WorkspaceController.php:241`
- `backend/app/Http/Controllers/Api/Asesor/WorkspaceController.php:291`
- `backend/app/Http/Controllers/Api/Asesor/WorkspaceController.php:368`

**Bukti teknis:**

Endpoint evaluasi portofolio, penilaian CPMK, dan pemetaan MK hanya memeriksa
ownership tugas serta pra-asesmen submitted. Tidak ada guard
`status != submit_final`, tahap pendaftaran, atau keberadaan SK terbit.

**Risiko:**

Asesor dapat mengubah sumber keputusan setelah menyatakan penilaian final,
termasuk setelah pendaftaran berpindah ke AT2/pleno/finished.

**Rekomendasi:**

Tambahkan guard immutable pada seluruh endpoint workspace setelah
`submit_final`. Validasi ulang di dalam transaction dengan row lock atas tugas
dan pendaftaran.

### V-05 - Rollback Workflow Meninggalkan Draft SK yang Dapat Diterbitkan

**Severity:** Critical

**Lokasi terkait:**

- `backend/app/Models/Pendaftaran.php:38`
- `backend/app/Models/Pendaftaran.php:46`
- `backend/app/Http/Controllers/Api/AdminProdi/PendaftaranController.php:287`
- `backend/app/Http/Controllers/Api/Pimpinan/PimpinanController.php:55`
- `backend/app/Http/Controllers/Api/Pimpinan/PimpinanController.php:74`

**Bukti teknis:**

State machine mengizinkan `finished -> pra_asesmen`. Reset hanya membuka ulang
pra-asesmen dan tidak membatalkan draft `sk_keputusan` berstatus
`menunggu_sk`. Penerbitan SK hanya memeriksa status row SK, bukan memastikan
pendaftaran masih `finished` dan keputusan sumber masih sama dengan draft.

**Risiko:**

Pimpinan dapat menerbitkan SK lama ketika pendaftaran sudah dimundurkan untuk
asesmen ulang. Dokumen resmi dapat bertentangan dengan workflow aktif.

**Rekomendasi:**

Hapus transisi rollback dari `finished`, atau implementasikan proses revisi
formal yang membatalkan draft downstream secara atomik. Penerbitan wajib
mengunci pendaftaran, memeriksa tahap final, dan membangun snapshot terbaru di
dalam transaction.

### V-06 - Race Condition pada Pleno, Unlock, dan Penerbitan SK

**Severity:** Critical

**Lokasi terkait:**

- `backend/app/Http/Controllers/Api/AdminProdi/PlenoController.php:88`
- `backend/app/Http/Controllers/Api/AdminProdi/PlenoController.php:114`
- `backend/app/Http/Controllers/Api/AdminProdi/PendaftaranController.php:380`
- `backend/app/Http/Controllers/Api/Pimpinan/PimpinanController.php:67`

**Bukti teknis:**

- `updateKeputusan()` memeriksa status/SK sebelum transaction, lalu setelah
  mengunci pendaftaran tidak mengulang pemeriksaan tersebut.
- `unlock()` tidak memakai transaction atau row lock.
- Penerbitan SK mengunci row SK, tetapi tidak mengunci row pendaftaran dan
  keputusan pleno dengan urutan lock yang konsisten.

**Risiko:**

Request paralel dapat mengubah keputusan setelah snapshot SK dibuat, membuka
pendaftaran setelah SK terbit, atau menghasilkan SK dan workflow dengan state
berbeda.

**Rekomendasi:**

Gunakan satu lock order: pendaftaran, SK, lalu keputusan/detail. Seluruh
precondition harus diperiksa ulang setelah lock diperoleh.

### V-07 - Verifier Private Storage Menghasilkan False Positive

**Severity:** High

**Lokasi terkait:**

- `backend/storage/app/public/dokumen/`
- `backend/public/storage`
- `backend/app/Console/Commands/VerifyPhaseOne.php:73`
- `backend/app/Console/Commands/VerifyPhaseOne.php:91`
- `backend/app/Console/Commands/MigratePrivateDocuments.php:20`
- `backend/app/Services/PrivateDocumentStorage.php:48`

**Bukti teknis:**

- Ditemukan 15 file pada `storage/app/public/dokumen/{11,13,33}`.
- `public/storage` merupakan junction ke `storage/app/public`, sehingga file
  dapat diakses melalui URL `/storage/dokumen/...` jika path diketahui.
- `phase1:verify` tetap melaporkan `File sensitif tidak tersisa di public disk:
  PASS` karena hanya memeriksa path yang masih direferensikan database.
- Migrator juga hanya memindahkan path yang direferensikan database.
- Layer private file masih fallback membaca disk `public`.

**Risiko:**

Dokumen yatim tidak dilindungi authorization. Regression file publik berikutnya
juga tetap dapat dibaca melalui fallback dan verifier tidak mendeteksinya.

**Rekomendasi:**

Scan direktori sensitif secara langsung, rekonsiliasi file terhadap database,
karantina/hapus file yatim setelah backup, lalu hapus fallback public setelah
migrasi terverifikasi. Tambahkan test bahwa direct URL menghasilkan 404.

### V-08 - Cross-Prodi CPMK Dapat Disisipkan ke Asesmen

**Severity:** High

**Lokasi terkait:**

- `backend/app/Http/Controllers/Api/Pemohon/BorangController.php:348`
- `backend/app/Http/Controllers/Api/Pemohon/BorangController.php:354`
- `backend/app/Http/Controllers/Api/Asesor/WorkspaceController.php:252`

**Bukti teknis:**

Pemohon mencari CPMK dengan `find(id)` atau kode global tanpa scope prodi.
Penilaian asesor hanya memakai `exists:cpmk,id`. Tidak ada validasi bahwa CPMK
berasal dari prodi pendaftaran.

**Risiko:**

Data evaluasi dan penilaian dapat mengacu pada kurikulum prodi lain, merusak
pleno dan laporan.

**Rekomendasi:**

Scope seluruh validasi CPMK melalui relasi mata kuliah dan
`pendaftaran.prodi_id`. Tambahkan unique/foreign integrity yang sesuai domain.

### V-09 - Authorization Sanggah Bertentangan dengan Authorization File

**Severity:** High

**Lokasi terkait:**

- `backend/app/Http/Controllers/Api/Asesor/SanggahController.php:18`
- `backend/app/Http/Controllers/Api/Asesor/SanggahController.php:40`
- `backend/app/Http/Controllers/Api/PrivateFileController.php:39`

**Bukti teknis:**

Semua asesor yang ditugaskan pada pendaftaran dapat melihat dan memutus
sanggah. Bukti file hanya dapat dibuka oleh asesor yang sama dengan
`sanggah.asesor_id`.

**Risiko:**

Asesor kedua dapat membuat keputusan tanpa dapat membaca bukti, atau hak akses
keputusan lebih luas daripada ownership sanggah yang dirancang.

**Rekomendasi:**

Tetapkan satu aturan domain: hanya asesor penanggung jawab, atau seluruh panel.
Gunakan policy yang sama untuk metadata, keputusan, dan file.

### V-10 - Sanggah Tidak Memiliki Stage Guard dan Constraint Duplikasi

**Severity:** Medium

**Lokasi terkait:**

- `backend/app/Http/Controllers/Api/Pemohon/PemohonExtraController.php:222`
- `backend/app/Http/Controllers/Api/Pemohon/PemohonExtraController.php:248`
- `backend/database/migrations/2026_05_10_000013_create_pleno_sanggah_sk_tables.php:31`

**Bukti teknis:**

Submit sanggah memeriksa owner, mata kuliah, deadline, dan SK belum terbit,
tetapi tidak mensyaratkan tahap hasil/pleno yang sah. Tidak ada unique
constraint atau lock untuk mencegah beberapa sanggah aktif pada pendaftaran dan
mata kuliah yang sama.

**Risiko:**

Sanggah dapat diajukan terlalu dini atau berulang, menghasilkan keputusan
paralel yang saling menimpa.

**Rekomendasi:**

Definisikan appeal window state secara eksplisit. Tambahkan transaction,
row lock, dan constraint untuk satu sanggah aktif/final per mata kuliah sesuai
aturan bisnis.

### V-11 - Registrasi Dapat Melewati Gelombang/Prodi Aktif

**Severity:** Medium

**Lokasi terkait:**

- `backend/app/Http/Controllers/Api/AuthController.php:84`
- `backend/app/Http/Controllers/Api/AuthController.php:90`
- `backend/app/Http/Controllers/Api/Pemohon/BorangController.php:97`

**Bukti teknis:**

Endpoint register publik hanya memeriksa keberadaan ID prodi dan gelombang,
kemudian langsung membuat pendaftaran. Endpoint start tidak memeriksa
`tgl_buka` dan status prodi.

**Risiko:**

Input langsung ke API dapat membuat pendaftaran pada prodi nonaktif, gelombang
draft/selesai, atau sebelum periode dibuka.

**Rekomendasi:**

Gunakan validator/domain service yang sama untuk register dan start:
prodi aktif, gelombang aktif, dan waktu berada dalam `tgl_buka..tgl_tutup`.

### V-12 - Migration Lama Masih Destruktif

**Severity:** High

**Lokasi terkait:**

- `backend/database/migrations/2026_05_22_021612_update_penilaian_cpmk_enum_to_diakui.php:14`
- `backend/database/migrations/2026_05_22_021612_update_penilaian_cpmk_enum_to_diakui.php:32`
- `backend/database/migrations/2026_05_22_022005_update_evaluasi_diri_profisiensi_enum.php:15`

**Bukti teknis:**

Satu migration menjalankan `truncate()` pada `penilaian_cpmk` di `up()` dan
`down()`. Migration lain menghapus semua evaluasi dengan profisiensi `2`
sebelum mengganti enum.

**Risiko:**

Environment production yang belum menjalankan migration tersebut akan
kehilangan data asesmen saat deploy. Rollback juga destruktif.

**Rekomendasi:**

Ganti dengan migration konversi data non-destruktif atau preflight yang berhenti
jika data tidak dapat dipetakan. Jangan mengubah migration yang sudah deployed
tanpa strategi baseline; sediakan migration pengganti dan deployment runbook.

### V-13 - Utility Script Legacy Dapat Mengubah Data di Luar Workflow

**Severity:** Medium

**Lokasi terkait:**

- `backend/reset_scores_at2.php`
- `backend/debug_at2.php`
- `backend/dump_schema.php`
- `backend/test_mail.php`
- `backend/remove_underlines.php`
- `backend/app/Http/Controllers/Api/Asesor/UjianController.php`

**Bukti teknis:**

`reset_scores_at2.php` melakukan reset fase dan penghapusan nilai/catatan secara
langsung. Skrip berada di root backend dan tidak memiliki authorization,
confirmation, audit, atau environment guard. Controller ujian lama masih ada
meski tidak terdaftar pada route aktif.

**Risiko:**

Skrip dapat dijalankan manual pada environment yang salah atau terekspos bila
document root server salah konfigurasi. Legacy controller meningkatkan risiko
route lama diaktifkan kembali tanpa hardening.

**Rekomendasi:**

Hapus dari artefak deployment atau pindahkan operasi resmi menjadi command
Artisan terproteksi dengan environment guard, dry-run, confirmation, audit, dan
transaction. Hapus controller legacy setelah dependensi dipastikan tidak ada.

## 3. Regression Findings

| Lokasi | Penyebab | Dampak |
|---|---|---|
| `VerifyPhaseOne.php:73-97` | Pemeriksaan hanya berdasarkan path database | File publik yatim tidak terdeteksi tetapi status tetap PASS |
| `PrivateDocumentStorage.php:55-58` | Fallback kompatibilitas tetap aktif | File sensitif yang kembali tersimpan publik masih dilayani |
| `Pendaftaran.php:46` | Rollback dari `finished` ditambahkan tanpa cleanup downstream | Draft SK stale dapat diterbitkan |
| `PlenoController.php:114-128` | Lock ditambahkan tanpa recheck setelah lock | Race dengan penerbitan SK tetap terbuka |
| `SkKeputusan.php:24-48` | Immutability hanya pada model SK | Database cascade dan relasi mutable melewati guard |
| `PrivateFileController.php:44` dan `SanggahController.php:40` | Dua aturan authorization berbeda | Asesor dapat memutus sanggah tanpa akses bukti |
| `phase1-completion-verification.md` | Bukti otomatis tidak menguji disk yatim/jalur alternatif | Klaim `COMPLETED` dan `GO TO PHASE 2` tidak didukung penuh |

Catatan tambahan: frontend production build lulus, tetapi `npm run lint`
gagal dengan 351 masalah (288 error, 63 warning). Ini bukan blocker Phase 1
secara langsung, namun menurunkan kemampuan lint untuk menangkap regression.

## 4. Test Coverage Assessment

### Area yang Sudah Terlindungi

- Beberapa transisi dasar `Pendaftaran::canTransitionTo()`.
- Policy owner dan scope prodi pada level unit.
- Penolakan perubahan langsung field SK terbit.
- Perubahan `qr_code_path` SK terbit.
- Smoke test halaman root.

### Area Kritis Tanpa Test

- Route middleware dan role matrix seluruh 125 route aplikasi.
- IDOR private document, arsip, dan sanggah.
- Direct URL `/storage/dokumen/*`.
- File yatim dan public fallback.
- Workspace mutation setelah `submit_final`.
- Seluruh state machine AT2 dan request paralel.
- Race pleno, unlock, sanggah, dan penerbitan SK.
- Rollback `finished -> pra_asesmen` dengan draft SK.
- Penghapusan user/mata kuliah yang direferensikan SK terbit.
- Snapshot penuh dan determinisme PDF SK.
- Verifikasi ulang `content_hash`.
- Scope CPMK lintas prodi.
- Sanggah duplikat dan authorization panel.
- Constraint database melalui integration test.
- Safety migration pada database berisi data.

### Hasil Verifikasi Otomatis

| Pemeriksaan | Hasil |
|---|---|
| `php artisan test` | PASS, 7 test dan 13 assertion |
| PHP lint | PASS |
| `php artisan phase1:verify` | 7/7 PASS, tetapi private-file check false positive |
| Migration status | Seluruh migration lokal `Ran`, Phase 1 batch 28 |
| Schema aktual | Unique index dan FK utama aktif |
| Consistency query aktual | Tidak ditemukan duplikasi/kontradiksi pada data saat audit |
| `composer audit` | Tidak ada advisory |
| `npm audit --omit=dev` | 0 vulnerability |
| `npm run build` | PASS, 39 halaman |
| `npm run lint` | FAIL, 351 masalah |
| Route inventory | 128 total, 125 route aplikasi |

**Tingkat kepercayaan test suite: rendah.**

Test yang ada membuktikan helper/model event dasar, tetapi belum menguji
controller, database, storage, concurrency, dan lifecycle SK yang menjadi inti
Phase 1.

## 5. Final Decision

# PHASE 1.5 FAILED

Alasan teknis:

1. Masih terdapat beberapa temuan Critical yang dapat mengubah atau menghapus
   SK terbit.
2. Workflow AT2 dan workspace dapat dimutasi di luar state yang sah.
3. Private storage belum bersih dan verifier menghasilkan false positive.
4. Jalur race condition belum ditutup secara konsisten.
5. Migration destruktif masih berisiko pada environment deployment lain.
6. Test suite belum mampu mencegah regression pada area tersebut.

Data database aktual yang diperiksa berada dalam kondisi konsisten, tetapi
kondisi itu belum dijamin oleh seluruh jalur kode.

## 6. Phase 2 Readiness

# NOT READY FOR PHASE 2

Phase 2 belum layak dimulai karena blocker yang tersisa berada pada keamanan,
integritas workflow, file pribadi, dan dokumen resmi. Optimasi atau deployment
sebelum blocker Critical/High diselesaikan akan mempertahankan jalur kerusakan
data yang tidak dapat dipulihkan dengan aman.

Kriteria minimum sebelum verifikasi ulang:

1. Terapkan snapshot penuh atau binary immutable untuk SK.
2. Tutup seluruh cascade delete terhadap SK terbit.
3. Terapkan state machine dan lock konsisten pada AT2, pleno, rollback, dan SK.
4. Kunci workspace setelah submit final.
5. Bersihkan seluruh file sensitif publik dan perbaiki verifier.
6. Scope CPMK dan sanggah secara konsisten.
7. Ganti migration destruktif dengan strategi deployment aman.
8. Tambahkan feature/integration/concurrency test untuk seluruh blocker.
