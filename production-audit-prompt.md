# PROMPT SUPER FINAL - PRODUCTION READINESS AUDIT

Anda bertindak sebagai gabungan dari Senior Software Architect, Senior Backend Engineer, Senior Frontend Engineer, Senior Database Architect, Database Administrator (DBA), Security Engineer, Performance Engineer, QA Engineer, DevOps Engineer, System Analyst, Scalability Engineer, Reliability Engineer, dan Production Readiness Reviewer.

Lakukan audit menyeluruh terhadap seluruh codebase, struktur database, konfigurasi sistem, dan arsitektur aplikasi yang saya berikan.

Asumsikan aplikasi ini sudah berada pada tahap akhir pengembangan, sebagian besar fitur telah berjalan sesuai kebutuhan, dan tujuan utama audit ini adalah memastikan aplikasi benar-benar siap sebelum masuk ke tahap integrasi pembayaran, deployment production, dan penggunaan oleh pengguna nyata.

Jangan hanya memeriksa apakah fitur berjalan atau tidak.

Lakukan investigasi mendalam terhadap seluruh sistem, termasuk:

- Arsitektur aplikasi.
- Struktur source code.
- Logika bisnis.
- Alur data.
- Struktur database.
- Relasi antar modul.
- Performa frontend.
- Performa backend.
- Performa database.
- Keamanan sistem.
- Maintainability.
- Scalability.
- Reliability.
- Observability.
- Integrasi internal maupun eksternal.
- Konsumsi resource.
- Kesiapan production.

Lakukan audit seperti seorang engineer senior yang bertanggung jawab memberikan persetujuan akhir sebelum aplikasi digunakan di lingkungan production.

---

# RUANG LINGKUP AUDIT

Lakukan penyusuran menyeluruh terhadap:

- Seluruh source code.
- Seluruh struktur database.
- Seluruh migrasi database.
- Seluruh relasi database.
- Seluruh query.
- Seluruh model.
- Seluruh service.
- Seluruh repository.
- Seluruh controller.
- Seluruh middleware.
- Seluruh helper.
- Seluruh utility.
- Seluruh API.
- Seluruh endpoint.
- Seluruh job.
- Seluruh queue.
- Seluruh scheduler.
- Seluruh event.
- Seluruh listener.
- Seluruh proses sinkron maupun asinkron.
- Seluruh dependency.
- Seluruh konfigurasi aplikasi.
- Seluruh konfigurasi server yang tersedia di codebase.
- Seluruh pola komunikasi frontend dan backend.
- Seluruh proses pengambilan data.
- Seluruh proses pengolahan data.
- Seluruh proses penyimpanan data.
- Seluruh proses penampilan data.

---

# TUJUAN AUDIT

## 1. AUDIT STABILITAS DAN KUALITAS SISTEM

Identifikasi:

- Bug yang sudah ada.
- Bug tersembunyi.
- Potensi bug di masa depan.
- Logic flaw.
- Edge case yang tidak tertangani.
- Race condition.
- Concurrency issue.
- Deadlock.
- State inconsistency.
- Data inconsistency.
- Resource leak.
- Memory leak.
- Error handling yang tidak memadai.
- Area yang berpotensi menyebabkan crash.
- Area yang berpotensi menyebabkan perilaku tidak terduga.
- Area yang berpotensi menyebabkan data corruption.
- Area yang berpotensi menyebabkan kehilangan data.

Jangan menganggap suatu fitur benar hanya karena fitur tersebut terlihat berjalan normal.

---

## 2. AUDIT PERFORMA

Analisis seluruh sistem untuk menemukan penyebab aplikasi terasa lambat.

Identifikasi:

- Bottleneck backend.
- Bottleneck frontend.
- Bottleneck database.
- Query lambat.
- Query yang tidak efisien.
- Query yang berulang.
- N+1 Query.
- Repeated Query.
- Over-fetching.
- Under-fetching.
- Missing eager loading.
- Eager loading berlebihan.
- Pagination yang tidak optimal.
- Missing cache.
- Cache yang tidak efektif.
- Repeated request.
- Request yang tidak diperlukan.
- Rendering yang tidak diperlukan.
- Re-render berlebihan.
- Proses sinkron yang seharusnya asinkron.
- Operasi yang mengonsumsi CPU berlebihan.
- Operasi yang mengonsumsi RAM berlebihan.
- Operasi yang mengonsumsi resource server berlebihan.
- Operasi yang akan memburuk secara signifikan ketika data bertambah.
- Operasi yang akan memburuk secara signifikan ketika jumlah pengguna meningkat.

Lakukan analisis seolah aplikasi akan digunakan oleh ribuan pengguna dan menyimpan jutaan data.

Jelaskan seluruh peluang optimasi yang dapat memberikan peningkatan performa paling signifikan.

---

## 3. AUDIT DATABASE

Lakukan audit mendalam terhadap seluruh desain database.

Identifikasi:

- Tabel yang memiliki fungsi serupa.
- Tabel yang berpotensi duplikat.
- Tabel yang sebenarnya dapat digabung.
- Struktur yang redundan.
- Struktur yang tidak memenuhi prinsip normalisasi database.
- Struktur yang terlalu kompleks.
- Struktur yang menyebabkan duplikasi data.
- Relasi yang tidak konsisten.
- Relasi yang tidak digunakan.
- Relasi yang salah.
- Foreign key yang hilang.
- Foreign key yang tidak optimal.
- Kolom yang tidak diperlukan.
- Kolom yang berpotensi duplikat.
- Data yang berulang.
- Data yang inkonsisten.
- Struktur yang berpotensi menyebabkan data corruption.
- Struktur yang berpotensi menyebabkan bottleneck ketika data bertambah besar.
- Struktur yang berpotensi menyebabkan query lambat.

Evaluasi tingkat normalisasi database dan berikan rekomendasi apabila terdapat pelanggaran prinsip normalisasi yang dapat mempengaruhi performa, integritas data, maupun maintainability.

Jika menemukan masalah database:

Jangan berhenti pada level database.

Lakukan penyusuran ke seluruh codebase yang menggunakan:

- Tabel tersebut.
- Kolom tersebut.
- Relasi tersebut.
- Query tersebut.
- Model terkait.
- Service terkait.
- API terkait.
- Logic bisnis terkait.

Identifikasi dampaknya terhadap:

- Query.
- Logic bisnis.
- API.
- Service.
- Controller.
- Relasi model.
- Validasi.
- Integritas data.
- Stabilitas sistem.
- Risiko refactoring.

Jelaskan hubungan antara masalah database dan implementasi kode yang terdampak.

---

## 4. AUDIT EFISIENSI STORAGE DAN OPTIMASI DATABASE

Lakukan audit mendalam terhadap efisiensi penyimpanan data.

Evaluasi apakah database dirancang secara optimal untuk penggunaan jangka panjang dengan pertumbuhan data yang besar.

Identifikasi:

- Penggunaan tipe data yang tidak efisien.
- Penggunaan ukuran kolom yang terlalu besar.
- VARCHAR yang terlalu besar dari kebutuhan sebenarnya.
- CHAR yang tidak sesuai penggunaan.
- Penggunaan TEXT atau LONGTEXT yang tidak diperlukan.
- Penggunaan BIGINT yang tidak diperlukan.
- Penggunaan DECIMAL yang berlebihan.
- Penggunaan string untuk data yang seharusnya integer, enum, boolean, atau foreign key.
- Kolom yang menyebabkan pemborosan storage.
- Struktur yang menyebabkan ukuran row terlalu besar.
- Struktur yang menyebabkan ukuran index terlalu besar.
- Index yang tidak efisien.
- Index yang berlebihan.
- Data yang disimpan berulang.
- Struktur yang menyebabkan pertumbuhan database tidak terkendali.
- Struktur yang menyebabkan backup semakin berat.
- Struktur yang menyebabkan restore semakin lambat.
- Struktur yang menyebabkan replikasi database menjadi tidak efisien.

Analisis:

- Efisiensi storage saat ini.
- Potensi pembengkakan database.
- Dampak terhadap performa query.
- Dampak terhadap ukuran backup.
- Dampak terhadap biaya server.
- Dampak terhadap skalabilitas sistem.

Jika menemukan peluang optimasi:

Jelaskan:

- Kondisi saat ini.
- Mengapa tidak optimal.
- Risiko jika dibiarkan.
- Struktur yang lebih optimal.
- Estimasi manfaat perbaikan.
- Estimasi penghematan storage.
- Estimasi peningkatan performa.

Lakukan evaluasi seolah database akan menyimpan jutaan hingga puluhan juta record di masa depan.

---

## 5. AUDIT KEAMANAN

Lakukan audit keamanan secara menyeluruh.

Identifikasi:

- Broken Access Control.
- Authentication Issue.
- Authorization Issue.
- Privilege Escalation.
- Data Exposure.
- Sensitive Data Leakage.
- Injection Vulnerability.
- SQL Injection.
- XSS.
- CSRF.
- SSRF.
- Insecure File Handling.
- Insecure Upload.
- Weak Validation.
- Hardcoded Secret.
- Hardcoded Credential.
- Security Misconfiguration.
- Dependency Vulnerability.
- Insecure Endpoint.
- Insecure API.
- Insecure Storage.
- Insecure Session Management.
- Insecure Token Handling.
- Seluruh potensi celah keamanan lain yang realistis.

---

## 6. AUDIT ARSITEKTUR DAN MAINTAINABILITY

Identifikasi:

- Code Smell.
- Dead Code.
- Unused Component.
- Unused Service.
- Unused Table.
- Unused Relation.
- Unused Endpoint.
- Duplicated Code.
- Duplicated Logic.
- Tight Coupling.
- Poor Separation of Concerns.
- Overly Complex Logic.
- Hidden Technical Debt.
- Area yang akan menyulitkan maintenance.
- Area yang akan menyulitkan scaling.
- Area yang akan menyulitkan pengembangan fitur di masa depan.

---

## 7. AUDIT KESIAPAN PRODUCTION

Evaluasi apakah sistem benar-benar siap untuk production.

Identifikasi:

- Risiko deployment.
- Risiko downtime.
- Risiko data corruption.
- Risiko kehilangan data.
- Risiko scalability.
- Risiko reliability.
- Risiko observability.
- Risiko monitoring.
- Risiko backup.
- Risiko recovery.
- Risiko operasional.
- Konfigurasi yang belum siap production.
- Konfigurasi yang tidak aman.

---

# POLA BERPIKIR YANG HARUS DIGUNAKAN

Jangan menganggap suatu bagian aman hanya karena tidak menghasilkan error.

Jangan menganggap suatu implementasi benar hanya karena fitur terlihat berjalan.

Selalu cari:

- Root cause.
- Potensi masalah jangka panjang.
- Dampak terhadap sistem secara keseluruhan.
- Dampak terhadap performa.
- Dampak terhadap keamanan.
- Dampak terhadap skalabilitas.
- Dampak terhadap maintainability.
- Dampak terhadap biaya operasional.

Berpikir seperti engineer senior yang harus menandatangani persetujuan akhir sebelum aplikasi digunakan oleh pengguna nyata di lingkungan production.

---

# FORMAT OUTPUT

## 1. Executive Summary

Berikan:

- Ringkasan kondisi aplikasi.
- Tingkat kesiapan production.
- Tingkat risiko keseluruhan.
- Temuan paling kritis.

---

## 2. Temuan Audit

Untuk setiap temuan berikan:

- Judul.
- Prioritas:
  - Critical
  - High
  - Medium
  - Low

- Lokasi.
- Deskripsi.
- Root Cause.
- Dampak.
- Risiko Jangka Pendek.
- Risiko Jangka Panjang.
- Rekomendasi Perbaikan.
- Contoh Implementasi.

---

## 3. Audit Database

Berikan:

- Temuan struktur.
- Temuan normalisasi.
- Temuan redundansi.
- Temuan relasi.
- Temuan integritas data.
- Temuan storage.
- Temuan indexing.
- Dampak terhadap codebase.

---

## 4. Audit Performa

Berikan:

- Temuan bottleneck.
- Query lambat.
- N+1 Query.
- Repeated Query.
- Resource Waste.
- Peluang optimasi terbesar.
- Prioritas optimasi.

---

## 5. Audit Keamanan

Berikan:

- Temuan keamanan.
- Tingkat risiko.
- Potensi eksploitasi.
- Dampak.
- Solusi.

---

## 6. Production Readiness Report

Berikan salah satu hasil berikut:

- Siap Production
- Siap Production Dengan Perbaikan Minor
- Belum Siap Production
- Tidak Direkomendasikan Production

Sertakan alasan teknis yang mendasari keputusan tersebut.

---

## 7. Roadmap Prioritas Perbaikan

Urutkan seluruh perbaikan berdasarkan dampak terbesar terhadap:

- Stabilitas.
- Performa.
- Keamanan.
- Maintainability.
- Skalabilitas.
- Efisiensi Storage.
- Kesiapan Production.

Fokus pada perbaikan yang memberikan manfaat terbesar dengan pengurangan risiko terbesar.

Lakukan audit secara kritis, mendalam, menyeluruh, dan agresif. Temukan tidak hanya masalah yang terlihat secara langsung, tetapi juga masalah tersembunyi, implisit, potensial, serta masalah yang baru akan muncul ketika jumlah pengguna, traffic, dan volume data meningkat secara signifikan.
