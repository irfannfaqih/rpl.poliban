# PHASE 2B.2 — FRONTEND, API & REQUEST OPTIMIZATION

Phase 2A Investigation telah selesai.

Phase 2B.1 High Impact Backend & Database Optimization telah selesai dan dinyatakan PASSED.

Tahap ini fokus pada bottleneck yang masih tersisa dan secara langsung memengaruhi pengalaman pengguna saat menggunakan aplikasi sehari-hari.

Jangan melakukan audit ulang.

Jangan mengulang pekerjaan Phase 2B.1.

Jangan mengubah workflow bisnis.

Jangan mengubah aturan bisnis.

Jangan mengubah authorization.

Jangan mengubah security model.

Jangan melakukan refactor besar yang tidak berhubungan dengan performa.

Fokus hanya pada optimasi request, frontend, API payload, query reduction, rendering, dan pola komunikasi frontend-backend.

---

# TUJUAN

Tujuan utama Phase 2B.2 adalah:

- Mengurangi waktu loading halaman.
- Mengurangi jumlah request yang tidak diperlukan.
- Mengurangi jumlah query yang tidak diperlukan.
- Mengurangi over-fetching data.
- Mengurangi re-render yang tidak diperlukan.
- Mengurangi polling berlebihan.
- Memaksimalkan cache yang sudah tersedia.
- Mengurangi beban backend akibat aktivitas frontend.
- Meningkatkan scalability untuk ribuan pengguna aktif.

---

# FOKUS IMPLEMENTASI

## P0 — Notification Optimization

Temuan Phase 2A menunjukkan:

- Polling notifikasi berjalan lebih dari satu kali.
- Dashboard menambah request notifikasi tambahan.
- Polling menghasilkan beban request yang tinggi ketika jumlah user meningkat.

Lakukan:

- Konsolidasi polling notifikasi.
- Hilangkan duplicate request.
- Pastikan satu sumber data dapat digunakan bersama oleh seluruh komponen yang memerlukan notifikasi.
- Maksimalkan cache React Query yang sudah ada.
- Pastikan data tetap akurat tanpa membebani backend.

Target:

- Mengurangi request notifikasi semaksimal mungkin.
- Menghilangkan polling ganda.
- Menghilangkan query backend yang identik dalam waktu berdekatan.

---

## P0 — AT2 Request Optimization

Temuan menunjukkan:

- Polling 3–5 detik.
- Autosave 30 detik.
- Countdown menyebabkan render berulang.
- Potensi ratusan request per detik pada skala besar.

Lakukan:

- Optimasi polling.
- Optimasi autosave.
- Pisahkan countdown dari render utama.
- Kurangi request yang tidak benar-benar diperlukan.
- Pastikan integritas data tetap terjaga.
- Pastikan tidak ada kehilangan jawaban.

Target:

- Mengurangi request rate secara signifikan.
- Mengurangi re-render besar yang terjadi terus menerus.

---

## P1 — API Payload Optimization

Temuan menunjukkan:

- Endpoint pemohon memuat terlalu banyak data.
- Endpoint tugas asesor memuat terlalu banyak relasi.
- Beberapa endpoint memuat data yang tidak digunakan halaman.

Lakukan:

- Analisis kebutuhan data aktual setiap halaman.
- Pisahkan summary endpoint dan detail endpoint bila diperlukan.
- Kurangi relasi yang tidak digunakan.
- Kurangi payload response.

Target:

- Response lebih kecil.
- Query lebih sedikit.
- Loading lebih cepat.

---

## P1 — Query Reduction

Temuan menunjukkan:

- GET pemohon menghasilkan banyak query.
- GET tugas asesor menghasilkan banyak query.
- Beberapa relasi dimuat berulang.

Lakukan:

- Eliminasi query yang tidak diperlukan.
- Eliminasi eager loading yang tidak digunakan.
- Eliminasi duplicate relation loading.
- Kurangi jumlah query tanpa mengubah hasil bisnis.

Target:

- Menurunkan query count secara signifikan.

---

## P1 — React Query Optimization

Analisis seluruh penggunaan React Query.

Cari:

- Query key duplikat.
- Cache yang tidak digunakan bersama.
- Refetch berlebihan.
- Invalidasi cache yang terlalu agresif.
- Query yang dapat memanfaatkan cache lebih baik.

Target:

- Memaksimalkan cache hit.
- Mengurangi request backend.

---

## P2 — React Rendering Optimization

Temuan menunjukkan:

- Store digunakan tanpa selector.
- Komponen besar dapat melakukan rerender berlebihan.
- Countdown memicu render induk.

Lakukan:

- Selector optimization.
- Memoization bila diperlukan.
- Isolasi state yang berubah cepat.
- Isolasi timer dan countdown.

Target:

- Mengurangi render tidak perlu.
- Mengurangi penggunaan CPU browser.

---

## P2 — Search Optimization

Temuan menunjukkan penggunaan:

LIKE '%keyword%'

Lakukan evaluasi:

- apakah dapat diperbaiki tanpa mengubah fitur.
- apakah ada pendekatan yang lebih efisien.

Implementasikan hanya jika aman.

---

# BATASAN

Jangan mengerjakan:

- Queue system.
- Email optimization.
- PDF optimization.
- SK optimization.
- Background worker.
- Export optimization.
- Deployment.
- Payment gateway.
- Security audit.
- Database redesign besar.

Area tersebut akan dikerjakan pada fase berikutnya.

---

# PERSYARATAN

Untuk setiap perubahan:

1. Jelaskan root cause.
2. Jelaskan alasan teknis.
3. Jelaskan dampak yang diharapkan.
4. Jelaskan risiko.
5. Pastikan tidak terjadi regression.
6. Tambahkan test jika relevan.

---

# VERIFIKASI WAJIB

Setelah implementasi:

- Backend test
- Frontend build
- Route verification
- React Query verification
- Notification verification
- AT2 verification
- Cache verification

Bandingkan kondisi sebelum dan sesudah.

---

# OUTPUT

## PHASE 2B.2 IMPLEMENTATION REPORT

### 1. Perubahan Yang Dilakukan

- lokasi file
- root cause
- solusi

### 2. Request Optimization

- sebelum
- sesudah

### 3. API Optimization

- query sebelum
- query sesudah

### 4. React Optimization

- render sebelum
- render sesudah

### 5. Cache Optimization

- cache hit improvement
- request reduction

### 6. Benchmark

Bandingkan:

- request count
- query count
- payload size
- render frequency

### 7. Regression Check

Tampilkan seluruh regression yang ditemukan.

### 8. Final Decision

- PHASE 2B.2 PASSED
- PHASE 2B.2 PASSED WITH MINOR ISSUES
- PHASE 2B.2 FAILED

### 9. Next Recommendation

Tentukan apakah sistem siap melanjutkan ke:

- PHASE 2B.3
- atau perlu perbaikan tambahan terlebih dahulu.
