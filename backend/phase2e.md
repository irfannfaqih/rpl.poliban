# PHASE 2E — FINAL PRODUCTION VERIFICATION

Anda bertindak sebagai gabungan dari:

- Senior Software Architect
- Principal Backend Engineer
- Principal Frontend Engineer
- Principal Database Engineer
- Security Engineer
- Site Reliability Engineer (SRE)
- Performance Engineer
- QA Lead
- Production Readiness Reviewer

Seluruh remediation dari:

- Phase 1
- Phase 1.5
- Phase 1.6
- Phase 2A
- Phase 2B.1
- Phase 2B.2
- Phase 2D

diasumsikan sudah selesai.

Tujuan Phase 2E bukan melakukan implementasi baru.

Tujuan utama adalah melakukan verifikasi akhir terhadap seluruh hasil pekerjaan yang sudah dilakukan.

---

# RULES

JANGAN melakukan:

- refactor besar
- redesign arsitektur
- perubahan workflow
- perubahan database besar
- perubahan kontrak API
- implementasi fitur baru

Kecuali ditemukan bug kritis yang secara langsung menyebabkan sistem tidak layak production.

Jika menemukan masalah:

- dokumentasikan
- klasifikasikan tingkat risiko
- hanya perbaiki jika benar-benar menjadi blocker production

Phase ini adalah fase verifikasi, bukan fase pembangunan.

---

# OBJECTIVE

Buktikan bahwa:

- seluruh perbaikan sebelumnya benar-benar bekerja
- tidak ada regression lintas fase
- tidak ada konflik antar remediation
- tidak ada area yang kembali rusak setelah optimasi
- sistem tetap stabil setelah seluruh perubahan terkumpul

---

# VALIDATION GROUP A

# SECURITY REGRESSION

Verifikasi ulang:

### Authorization

Pastikan:

- ownership tetap aman
- cross-prodi tetap tertutup
- IDOR tidak muncul kembali
- private file tetap terlindungi
- sanggah authorization tetap benar
- asesor scope tetap benar

### Authentication

Pastikan:

- login
- logout
- password reset
- token revocation

tetap berfungsi.

### Workflow Security

Pastikan:

- workflow state machine tetap aktif
- transition guard tetap berjalan
- final submit tetap immutable
- SK tetap immutable

---

# VALIDATION GROUP B

# DATABASE REGRESSION

Verifikasi:

### Constraints

- unique constraints
- foreign keys
- restrict delete
- referential integrity

### Indexes

Pastikan:

- index baru masih digunakan
- tidak ada index invalid
- tidak ada migration yang meninggalkan database tidak konsisten

### Migration Safety

Lakukan:

- fresh migration
- rollback
- migrate ulang

Pastikan seluruh migration tetap aman.

---

# VALIDATION GROUP C

# PERFORMANCE REGRESSION

Verifikasi ulang seluruh optimasi:

### Query Optimization

Pastikan:

- query count tidak kembali naik
- payload tidak kembali membengkak

### Notification Optimization

Pastikan:

- polling tunggal masih aktif
- duplicate request tidak kembali muncul

### AT2 Optimization

Pastikan:

- autosave
- polling
- countdown isolation

tetap berjalan.

### Export Optimization

Pastikan:

- export tetap chunked
- memory tidak kembali membengkak

### Audit Search

Pastikan:

- fulltext index masih digunakan
- fallback tetap bekerja

---

# VALIDATION GROUP D

# QUEUE & TELEMETRY

Verifikasi:

### Queue

- email queue
- retry
- timeout
- failed jobs
- queue health

### Telemetry

- request telemetry
- slow query telemetry
- metrics abstraction
- error reporting abstraction

Pastikan seluruh komponen tetap aktif.

---

# VALIDATION GROUP E

# HEALTH & READINESS

Verifikasi:

### Liveness

Pastikan endpoint hidup.

### Readiness

Pastikan endpoint benar-benar memeriksa:

- database
- cache
- queue
- storage
- worker heartbeat

Lakukan simulasi kegagalan jika memungkinkan.

Pastikan readiness gagal ketika dependency gagal.

---

# VALIDATION GROUP F

# LOAD & STABILITY REVIEW

Lakukan sanity validation terhadap:

- endpoint utama
- workflow utama
- dashboard
- SK
- pleno
- borang
- AT2
- notifikasi
- export

Tujuan:

mencari regression setelah seluruh remediation selesai.

Tidak perlu mengulang load test besar Phase 2C.

Fokus pada validasi stabilitas akhir.

---

# VALIDATION GROUP G

# PRODUCTION READINESS CERTIFICATION

Evaluasi:

### Operational Readiness

- queue
- logging
- telemetry
- health checks
- deployment checklist

### Scalability Readiness

- database
- cache
- queue
- storage

### Security Readiness

- authorization
- private file
- workflow integrity
- auditability

### Reliability Readiness

- transaction
- retry
- failure handling
- recovery path

---

# OUTPUT FORMAT

## 1. Executive Summary

Berikan:

- kondisi sistem saat ini
- tingkat kesiapan production
- tingkat risiko keseluruhan

---

## 2. Regression Verification Result

Tampilkan:

- PASS
- FAIL
- WARNING

untuk setiap area utama.

---

## 3. Security Verification

---

## 4. Database Verification

---

## 5. Performance Verification

---

## 6. Queue & Telemetry Verification

---

## 7. Health & Readiness Verification

---

## 8. Production Readiness Certification

Berikan skor:

- Security
- Database
- Performance
- Scalability
- Reliability
- Maintainability
- Operational Readiness

Skala 0–100.

---

## 9. Remaining Risks

Pisahkan:

### Critical

### High

### Medium

### Low

Jika tidak ada, nyatakan secara eksplisit.

---

## 10. Final Decision

Gunakan salah satu:

- PHASE 2E PASSED
- PHASE 2E PASSED WITH MINOR RISKS
- PHASE 2E FAILED

Sertakan alasan teknis yang mendasari keputusan.

---

# IMPORTANT

Jangan fokus mencari masalah baru yang tidak relevan.

Fokus utama adalah membuktikan bahwa seluruh hasil remediation dari Phase 1 sampai Phase 2D:

- stabil
- konsisten
- tidak saling bertabrakan
- tidak menghasilkan regression

Phase 2E adalah final certification sebelum masuk ke Phase 3 (Payment Integration & Deployment Readiness).
