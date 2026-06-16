# PHASE 2H — PRODUCTION OPERATIONS CERTIFICATION

## Context

Baca seluruh hasil fase sebelumnya terlebih dahulu sebelum melakukan pekerjaan apa pun:

* Phase 2B.1
* Phase 2B.2
* Phase 2C
* Phase 2D
* Phase 2E
* Phase 2F
* Phase 2G.1
* Phase 2G.2
* Phase 2G.3

Pahami seluruh optimasi, hardening, queue, telemetry, health/readiness, retention, archive, lifecycle, audit search, dan workflow integrity yang sudah ada.

JANGAN mengubah fitur bisnis.

JANGAN mengubah workflow RPL.

JANGAN mengubah kontrak API.

JANGAN mengubah optimasi yang sudah lulus pada Phase 2B–2G.

Fokus fase ini hanya pada kesiapan operasional production.

---

# OBJECTIVE

Menentukan apakah sistem benar-benar siap GO LIVE dari sisi:

* deployment
* queue
* scheduler
* backup
* restore
* monitoring
* observability
* SMTP
* disaster recovery
* operational readiness

Bukan sekadar kode yang benar.

Tetapi sistem benar-benar dapat dioperasikan dengan aman.

---

# VALIDATION GROUP A — ENVIRONMENT CERTIFICATION

Audit:

* APP_ENV
* APP_DEBUG
* APP_URL
* SESSION_SECURE_COOKIE
* SESSION_DOMAIN
* CACHE_DRIVER
* QUEUE_CONNECTION
* MAIL_MAILER
* LOG_CHANNEL

Verifikasi:

1. konfigurasi production-safe tersedia
2. tidak ada dependency terhadap local environment
3. tidak ada fallback yang berbahaya
4. tidak ada secret hardcoded

Laporkan:

* PASS
* WARNING
* FAIL

beserta alasannya.

---

# VALIDATION GROUP B — DEPLOYMENT OPTIMIZATION

Verifikasi deployment checklist.

Pastikan tersedia prosedur:

* php artisan config:cache
* php artisan route:cache
* php artisan view:cache
* php artisan event:cache

Periksa:

* deployment order
* rollback safety
* cache clearing strategy

Cari gap operasional.

Jangan melakukan perubahan kecuali memang diperlukan.

---

# VALIDATION GROUP C — QUEUE OPERATIONS

Audit:

* queue connection
* worker configuration
* supervisor configuration
* queue heartbeat
* queue health
* queue probe

Verifikasi:

* retry
* timeout
* backoff
* failed job handling

Pastikan:

* worker restart aman
* worker crash recovery tersedia
* queue backlog dapat dipantau

Laporkan risiko yang masih tersisa.

---

# VALIDATION GROUP D — SCHEDULER OPERATIONS

Audit seluruh scheduled task.

Verifikasi:

* queue health
* SK materialization
* retention jobs
* archive jobs
* cache prune

Pastikan:

1. tidak ada schedule overlap berbahaya
2. tidak ada task yang berpotensi lock panjang
3. tidak ada task yang dapat menyebabkan data loss

Laporkan.

---

# VALIDATION GROUP E — BACKUP CERTIFICATION

Audit:

database backup strategy

storage backup strategy

private documents backup

audit archive backup

SK backup

Verifikasi:

* backup frequency
* retention policy
* offsite strategy
* encryption readiness

Jangan membuat backup baru.

Hanya audit.

---

# VALIDATION GROUP F — RESTORE CERTIFICATION

Verifikasi kesiapan restore:

* database
* dokumen
* private storage
* audit archive
* queue state

Periksa apakah sudah ada:

* restore procedure
* restore checklist
* restore validation

Laporkan gap yang masih ada.

---

# VALIDATION GROUP G — SMTP & EMAIL OPERATIONS

Audit:

* queued mail
* SMTP configuration
* mail failure handling
* retry behavior

Verifikasi:

* tidak ada email penting yang masih synchronous
* queue email tetap berjalan setelah restart worker

Laporkan.

---

# VALIDATION GROUP H — OBSERVABILITY

Audit:

* RequestTelemetry
* QueryTelemetry
* queue metrics
* lifecycle report
* health endpoint
* readiness endpoint

Verifikasi:

1. apakah seluruh komponen penting sudah terukur
2. apakah masih ada blind spot operasional
3. apakah alerting masih kurang

Laporkan.

---

# VALIDATION GROUP I — DISASTER RECOVERY

Audit kemampuan recovery untuk:

* database corruption
* worker failure
* SMTP outage
* storage loss
* deployment rollback

Buat penilaian:

* READY
* PARTIAL
* NOT READY

dengan alasan teknis.

---

# VALIDATION GROUP J — FINAL GO-LIVE CERTIFICATION

Buat penilaian akhir:

* GO
* GO WITH WARNINGS
* NO GO

Gunakan hanya bukti yang ditemukan.

Jangan berasumsi.

Jangan membuat rekomendasi yang memerlukan rewrite sistem.

Prioritaskan stabilitas dan keamanan.

---

# OUTPUT FORMAT

Berikan laporan:

## 1. Executive Summary

## 2. Environment Certification

## 3. Deployment Certification

## 4. Queue Certification

## 5. Scheduler Certification

## 6. Backup Certification

## 7. Restore Certification

## 8. SMTP Certification

## 9. Observability Certification

## 10. Disaster Recovery Certification

## 11. Remaining Risks

Pisahkan:

* Critical
* High
* Medium
* Low

## 12. Final Go-Live Decision

Pilih salah satu:

* GO
* GO WITH WARNINGS
* NO GO

Dan sertakan alasan teknis yang dapat dibuktikan.

Jika menemukan blocker nyata yang dapat diperbaiki dengan aman dan tanpa mengubah kontrak bisnis, lakukan remediation minimal lalu validasi ulang sebelum memberikan keputusan akhir.
