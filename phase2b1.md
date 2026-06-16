# PHASE 2B.1 — HIGH IMPACT BACKEND & DATABASE OPTIMIZATION

Phase 2A telah selesai dan menghasilkan daftar bottleneck yang telah dibuktikan secara teknis.

Pada tahap ini, fokus hanya pada optimasi dengan ROI tertinggi.

Jangan melakukan audit ulang.

Jangan mencari bottleneck baru.

Jangan mengubah fitur bisnis.

Jangan mengubah workflow bisnis.

Jangan melakukan refactor besar yang tidak berhubungan langsung dengan bottleneck yang telah ditemukan.

Tujuan utama tahap ini adalah menghilangkan bottleneck backend dan database yang memberikan dampak terbesar terhadap response time, lock contention, CPU usage, memory usage, dan scalability.

---

# FOKUS UTAMA

Hanya kerjakan item berikut:

## P0 — Transaction Lock Reduction

Perbaiki seluruh proses yang melakukan:

- PDF generation
- QR generation
- File hashing
- File storage
- File processing
- Heavy CPU operation
- Heavy I/O operation

di dalam:

- database transaction
- row lock
- pessimistic lock

Identifikasi seluruh lokasi yang melakukan pola tersebut.

Pastikan:

- transaction hanya mencakup operasi database yang benar-benar diperlukan
- lock hanya aktif selama perubahan data kritikal
- proses berat dijalankan setelah commit
- tidak ada race condition baru yang muncul
- integritas data tetap terjaga

Periksa seluruh implementasi yang berkaitan dengan:

- SK
- PDF
- QR
- Arsip
- File generation
- Bulk processing

Cari pola serupa di seluruh codebase.

Jangan hanya memperbaiki lokasi yang dilaporkan.

---

## P0 — Bulk Processing Hardening

Perbaiki proses yang menjalankan operasi berat secara paralel tanpa pembatasan.

Analisis:

- Promise.all
- parallel processing
- concurrent PDF generation
- concurrent QR generation
- concurrent file creation

Pastikan terdapat mekanisme yang aman dan terukur.

Tujuan:

- mencegah lonjakan CPU
- mencegah lonjakan memory
- mencegah lock contention
- mencegah server overload

---

## P1 — PDF Asset Optimization

Analisis seluruh aset yang digunakan untuk PDF.

Fokus pada:

- logo
- image
- embedded asset
- base64 asset

Temuan Phase 2A menunjukkan:

- logo 3.59 MB
- cache base64 4.78 MB
- PDF sekitar 3.15 MB

Optimalkan secara menyeluruh.

Target:

- mengurangi ukuran asset
- mengurangi memory usage
- mengurangi waktu rendering
- mengurangi ukuran file PDF

Pastikan hasil visual tetap layak digunakan pada dokumen resmi.

---

## P1 — PDF Generation Optimization

Analisis proses rendering PDF.

Cari:

- proses berulang
- asset loading berulang
- query berulang
- transformasi data berulang

Optimalkan tanpa mengubah hasil akhir dokumen.

---

## P2 — Database Index Optimization

Implementasikan seluruh composite index yang memiliki dampak terbesar berdasarkan hasil Phase 2A.

Prioritaskan:

- query yang menghasilkan filesort
- query yang melakukan full scan
- query yang sering dipanggil
- query pada halaman utama sistem

Sebelum menambahkan index:

- verifikasi query aktual
- verifikasi pola filter
- verifikasi pola sorting

Jangan menambahkan index secara membabi buta.

Hapus redundant index hanya jika terbukti aman.

---

# BATASAN

Jangan mengerjakan:

- polling optimization
- frontend optimization
- React optimization
- caching strategy
- queue migration
- email optimization
- export optimization
- AT2 optimization
- dashboard optimization

Area tersebut akan dikerjakan pada fase berikutnya.

Fokus hanya pada bottleneck backend dan database yang memiliki dampak terbesar.

---

# PERSYARATAN IMPLEMENTASI

Untuk setiap perubahan:

1. Jelaskan root cause.
2. Jelaskan alasan teknis perubahan.
3. Jelaskan dampak yang diharapkan.
4. Pastikan tidak menimbulkan regression.
5. Tambahkan atau perbarui automated test jika relevan.
6. Verifikasi bahwa integritas data tetap terjaga.

---

# VERIFIKASI WAJIB

Setelah implementasi selesai:

Lakukan verifikasi ulang:

- PHP test
- Route registration
- Build frontend
- Database migration
- SK workflow
- PDF generation
- File generation
- Integrity constraint

Bandingkan kondisi sebelum dan sesudah optimasi.

---

# OUTPUT

## PHASE 2B.1 IMPLEMENTATION REPORT

### 1. Perubahan Yang Dilakukan

Untuk setiap perubahan:

- lokasi file
- root cause
- solusi

### 2. Database Optimization

- index yang ditambahkan
- index yang dihapus
- alasan teknis

### 3. PDF Optimization

- ukuran asset sebelum
- ukuran asset sesudah
- ukuran PDF sebelum
- ukuran PDF sesudah

### 4. Concurrency Optimization

- lokasi yang diperbaiki
- mekanisme yang digunakan

### 5. Benchmark

Bandingkan:

- sebelum
- sesudah

Jika pengukuran aktual tidak tersedia, berikan estimasi teknis yang masuk akal.

### 6. Regression Check

Tampilkan seluruh regression yang ditemukan.

### 7. Final Decision

Berikan salah satu:

- PHASE 2B.1 PASSED
- PHASE 2B.1 PASSED WITH MINOR ISSUES
- PHASE 2B.1 FAILED

### 8. Next Recommendation

Tentukan apakah sistem siap melanjutkan ke:

- PHASE 2B.2
- atau perlu perbaikan tambahan terlebih dahulu
