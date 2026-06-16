# Phase 1.6 Final Completion Report

Tanggal: 15 Juni 2026

## 1. Item yang Diperbaiki

### AT2 Race Condition

Root cause:

- Mutasi pemohon membaca state sebelum transaction.
- Autosave tidak mengunci sesi yang sama dengan submit.
- Konfirmasi kehadiran dan reschedule dapat diproses paralel.

Solusi:

- Semua mutasi mengunci `pendaftaran`, lalu `uji_lanjutan`.
- Status pendaftaran, fase, window ujian, ownership, dan instrumen diperiksa
  kembali setelah lock.
- Autosave dan submit mengunci row sesi serta instrumen yang sama.

File:

- `backend/app/Http/Controllers/Api/Pemohon/UjiLanjutanController.php`

### Concurrency Workflow

Root cause:

- Belum ada pembuktian otomatis untuk request bersaing.
- Unlock menganggap transisi ke status yang sama sebagai sukses.

Solusi:

- Unlock duplikat ditolak.
- Ditambahkan integration test untuk unlock, pleno versus finalisasi,
  finalisasi ganda, penerbitan SK ganda, serta autosave versus submit.

File:

- `backend/app/Http/Controllers/Api/AdminProdi/PendaftaranController.php`
- `backend/tests/Feature/PhaseOneRemediationFeatureTest.php`

### Migration Safety

Root cause:

- Transformasi historis menggunakan operasi destruktif dan SQL enum khusus.
- Fresh migration AT2 menjatuhkan kolom sebelum foreign key.
- Rollback Phase 1.6 tidak mengembalikan FK secara simetris.

Solusi:

- Transformasi nilai dilakukan row-by-row tanpa `TRUNCATE`.
- Nilai profisiensi historis tidak dihapus.
- Foreign key AT2 dilepas sebelum kolom.
- Migration Phase 1.6 mendukung rollback FK dengan preflight SK terbit.
- Ditambahkan migration verifikasi forward-only.
- Fresh migration dan migrasi dengan data diuji pada database MySQL sementara.

File:

- `backend/database/migrations/2026_05_22_021612_update_penilaian_cpmk_enum_to_diakui.php`
- `backend/database/migrations/2026_05_22_022005_update_evaluasi_diri_profisiensi_enum.php`
- `backend/database/migrations/2026_06_06_100003_restructure_uji_lanjutan_table.php`
- `backend/database/migrations/2026_06_15_000002_harden_phase1_6_integrity.php`
- `backend/database/migrations/2026_06_15_000003_verify_phase1_6_migration_safety.php`

### Feature Security Coverage

Test ditambahkan untuk:

- Authorization sanggah berdasarkan asesor penanggung jawab.
- Private file hanya dapat dibaca melalui authorization pendaftaran.
- CPMK lintas prodi ditolak.
- Gelombang tertutup dan prodi nonaktif ditolak.
- User dengan riwayat pendaftaran tidak dapat dihapus.
- Gelombang dan prodi dikunci saat registrasi dibuat.

File:

- `backend/tests/Feature/PhaseOneRemediationFeatureTest.php`
- `backend/app/Services/RegistrationEligibilityService.php`

### Cleanup

Solusi:

- Ditambahkan command pruning dengan dry-run default.
- 15 private orphan dan satu QR lama dihapus.
- Controller ujian lama dan utility `fix_pdf.php` dihapus.
- Verifier kini mendeteksi orphan, QR lama, FK yang salah, dan artefak legacy.

File:

- `backend/app/Console/Commands/PruneOrphanedDocuments.php`
- `backend/app/Console/Commands/VerifyPhaseOne.php`
- `backend/app/Http/Controllers/Api/Asesor/UjianController.php` (dihapus)
- `fix_pdf.php` (dihapus)

## 2. Test yang Ditambahkan

- `test_competing_unlock_requests_only_allow_first_transition`
- `test_autosave_cannot_overwrite_answers_after_submit`
- `test_duplicate_attendance_and_reschedule_requests_are_rejected`
- `test_competing_finalize_requests_create_only_one_draft_sk`
- `test_pleno_update_loses_race_against_finalization`
- `test_competing_sk_publication_only_materializes_once`
- `test_sanggah_metadata_and_decision_use_responsible_assessor`
- `test_private_file_requires_pendaftaran_authorization`
- `test_cross_prodi_cpmk_is_rejected`
- `test_registration_rejects_closed_wave_and_inactive_prodi`
- `test_user_with_registration_cannot_be_deleted`
- `test_fresh_and_data_filled_migrations_are_safe`

Hasil:

- 24 test lulus.
- 60 assertion lulus.

## 3. Verifikasi

| Area | Status |
|---|---|
| Authorization | PASS |
| Workflow dan state transition | PASS |
| AT2 race handling | PASS |
| Pleno concurrency | PASS |
| Unlock concurrency | PASS |
| Finalisasi concurrency | PASS |
| Penerbitan SK concurrency | PASS |
| SK snapshot dan PDF hash | PASS |
| Private storage | PASS |
| Orphan cleanup | PASS |
| Critical FK `RESTRICT` | PASS |
| Fresh migration | PASS |
| Data-filled migration | PASS |
| Rollback symmetry | PASS |
| PHP syntax | PASS |
| Route inventory | PASS |
| Frontend production build | PASS |

`phase1:verify`: 13 dari 13 pemeriksaan PASS.

## 4. Regression Check

Regression yang ditemukan selama implementasi:

- Unlock kedua sebelumnya tetap sukses. Sudah diperbaiki dan dilindungi test.
- Fresh migration AT2 gagal karena urutan drop FK/kolom. Sudah diperbaiki.
- Rollback unique sanggah berbenturan dengan indeks FK. Sudah diperbaiki.

Status regression tersisa: tidak ada blocker Phase 1.6 yang diketahui.

## 5. Final Decision

# PHASE 1.6 PASSED

## 6. Phase 2 Readiness

# READY FOR PHASE 2

Seluruh blocker Security & Data Integrity Phase 1.6 telah memiliki implementasi,
test otomatis, dan bukti verifikasi pada database serta storage aktual.
