# PHASE 2A — DATABASE & PERFORMANCE INVESTIGATION

Sebelum melakukan optimasi apa pun, lakukan investigasi menyeluruh terhadap performa sistem.

Jangan langsung melakukan refactoring.

Jangan langsung menambahkan cache.

Jangan langsung mengubah struktur database.

Tujuan tahap ini adalah menemukan akar penyebab seluruh bottleneck yang masih ada pada aplikasi.

Asumsikan:

- Phase 1.6 telah selesai.
- Security dan Data Integrity sudah dianggap cukup.
- Fokus sekarang adalah Performance, Scalability, Resource Efficiency, dan Database Optimization.
- Sistem akan digunakan oleh ribuan pengguna dan volume data akan terus bertambah.

---

## Tujuan

Temukan seluruh area yang menyebabkan:

- Loading lambat.
- Response API lambat.
- Query database lambat.
- Konsumsi resource berlebihan.
- Penurunan performa ketika data bertambah.
- Penurunan performa ketika jumlah pengguna bertambah.

Jangan berasumsi.

Buktikan setiap temuan dengan analisis teknis.

---

# AUDIT DATABASE

Lakukan investigasi terhadap seluruh database.

Identifikasi:

- Missing index.
- Wrong index.
- Unused index.
- Over indexing.
- Full table scan.
- Expensive join.
- Inefficient relation.
- Table growth risk.
- Query plan yang buruk.
- Cardinality issue.
- Data duplication.
- Storage bloat.
- Tipe data yang terlalu besar.
- VARCHAR yang berlebihan.
- BIGINT yang tidak diperlukan.
- TEXT yang sebenarnya dapat diperkecil.
- Struktur yang menyebabkan query menjadi mahal.

Periksa:

- Seluruh tabel.
- Seluruh relasi.
- Seluruh foreign key.
- Seluruh index.

Estimasi dampak masing-masing terhadap performa.

---

# AUDIT QUERY

Analisis seluruh query yang dijalankan aplikasi.

Cari:

- N+1 Query.
- Query di dalam loop.
- Repeated Query.
- Duplicate Query.
- Over-fetching.
- Under-fetching.
- Missing eager loading.
- Relationship loading yang tidak efisien.
- Query yang mengambil data terlalu banyak.
- Query yang tidak menggunakan index.
- Query yang berpotensi menjadi bottleneck saat data besar.

Lacak query dari:

- Controller.
- Service.
- Repository.
- Model.
- Resource.
- Policy.
- Middleware.

---

# AUDIT BACKEND

Analisis:

- Endpoint lambat.
- Heavy serialization.
- Expensive transformation.
- Repeated business logic.
- Unnecessary processing.
- Excessive memory usage.
- Blocking operation.
- Sync process yang seharusnya async.
- Repeated file access.
- Repeated database access.

Cari endpoint yang berpotensi menjadi bottleneck terbesar.

---

# AUDIT FRONTEND

Cari:

- Duplicate request.
- Waterfall request.
- Infinite re-fetch.
- Excessive re-render.
- Over-fetching API.
- Komponen yang menyebabkan loading lambat.
- Query invalidation yang berlebihan.
- State management yang tidak efisien.
- Polling yang terlalu agresif.
- Request yang tidak diperlukan.

Analisis seluruh pola komunikasi frontend ↔ backend.

---

# AUDIT CACHE

Analisis:

- Area yang seharusnya menggunakan cache.
- Cache yang tidak efektif.
- Cache invalidation issue.
- Missing cache strategy.
- Data yang terlalu sering dihitung ulang.

Jangan langsung implementasi cache.

Identifikasi dulu area yang paling layak di-cache.

---

# AUDIT RESOURCE USAGE

Cari:

- CPU intensive process.
- Memory intensive process.
- Large payload response.
- Excessive JSON serialization.
- Excessive file operation.
- Resource leak.

Analisis dampaknya pada server production.

---

# SCALABILITY REVIEW

Evaluasi perilaku sistem jika:

- Data menjadi 10x lebih besar.
- Data menjadi 100x lebih besar.
- Pengguna aktif meningkat drastis.

Cari:

- Bottleneck terbesar.
- Komponen yang tidak scalable.
- Query yang akan memburuk secara eksponensial.
- Endpoint yang akan runtuh lebih dulu.

---

# OUTPUT

## 1. Executive Summary

- Kondisi performa saat ini.
- Estimasi tingkat kesehatan performa.
- Tingkat kesiapan untuk production load.

---

## 2. Top Performance Bottlenecks

Urutkan berdasarkan dampak terbesar.

Untuk setiap temuan:

- Prioritas:
  - Critical
  - High
  - Medium
  - Low

- Lokasi.
- Root cause.
- Dampak.
- Bukti teknis.

---

## 3. Database Findings

- Index issue.
- Schema issue.
- Storage issue.
- Query issue.

---

## 4. Backend Findings

- Endpoint lambat.
- Logic berat.
- Resource issue.

---

## 5. Frontend Findings

- Request issue.
- Rendering issue.
- Data fetching issue.

---

## 6. Scalability Findings

- Risiko ketika data bertambah.
- Risiko ketika pengguna bertambah.

---

## 7. Optimization Roadmap

Urutkan berdasarkan ROI tertinggi.

Tampilkan estimasi:

- Dampak performa.
- Kompleksitas implementasi.
- Risiko perubahan.

---

## 8. Final Decision

Berikan salah satu:

- READY FOR OPTIMIZATION
- READY FOR OPTIMIZATION WITH CAUTION
- REQUIRES FURTHER INVESTIGATION

Jangan melakukan optimasi apa pun pada tahap ini.

Fokus hanya pada menemukan dan membuktikan bottleneck yang sebenarnya.
