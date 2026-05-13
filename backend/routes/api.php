<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SuperAdmin\GelombangController;
use App\Http\Controllers\Api\SuperAdmin\ProdiController;
use App\Http\Controllers\Api\SuperAdmin\PenggunaController;
use App\Http\Controllers\Api\SuperAdmin\AuditLogController;
use App\Http\Controllers\Api\AdminProdi\KurikulumController;
use App\Http\Controllers\Api\AdminProdi\PendaftaranController;
use App\Http\Controllers\Api\AdminProdi\JadwalController;
use App\Http\Controllers\Api\AdminProdi\PlenoController;
use App\Http\Controllers\Api\Asesor\TugasController as AsesorTugasController;
use App\Http\Controllers\Api\Asesor\WorkspaceController as AsesorWorkspaceController;
use App\Http\Controllers\Api\Asesor\UjianController as AsesorUjianController;
use App\Http\Controllers\Api\Pemohon\BorangController;
use App\Http\Controllers\Api\Pemohon\PemohonExtraController;
use App\Http\Controllers\Api\Pimpinan\PimpinanController as PimpinanCtrl;
use Illuminate\Support\Facades\Route;

// ═══ Public Routes ═══
Route::post('/login', [AuthController::class, 'login']);

// ═══ Authenticated Routes ═══
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // ─── Super Admin ───
    Route::middleware('role:super_admin')->prefix('super-admin')->group(function () {
        Route::apiResource('gelombang', GelombangController::class);
        Route::patch('gelombang/{gelombang}/toggle-status', [GelombangController::class, 'toggleStatus']);

        Route::apiResource('prodi', ProdiController::class);
        Route::patch('prodi/{prodi}/toggle-status', [ProdiController::class, 'toggleStatus']);

        Route::apiResource('pengguna', PenggunaController::class);
        Route::patch('pengguna/{pengguna}/reset-password', [PenggunaController::class, 'resetPassword']);
        Route::patch('pengguna/{pengguna}/toggle-status', [PenggunaController::class, 'toggleStatus']);

        Route::get('audit-log', [AuditLogController::class, 'index']);
    });

    // ─── Admin Prodi ───
    Route::middleware('role:admin_prodi')->prefix('admin-prodi')->group(function () {
        // Kurikulum (MK + CPMK)
        Route::apiResource('mata-kuliah', KurikulumController::class);
        Route::get('mata-kuliah/{mataKuliah}/cpmk', [KurikulumController::class, 'cpmkIndex']);
        Route::post('mata-kuliah/{mataKuliah}/cpmk', [KurikulumController::class, 'cpmkStore']);
        Route::put('mata-kuliah/{mataKuliah}/cpmk/{cpmk}', [KurikulumController::class, 'cpmkUpdate']);
        Route::delete('mata-kuliah/{mataKuliah}/cpmk/{cpmk}', [KurikulumController::class, 'cpmkDestroy']);

        // Pendaftaran
        Route::get('pendaftaran', [PendaftaranController::class, 'index']);
        Route::get('pendaftaran/{pendaftaran}', [PendaftaranController::class, 'show']);
        Route::post('pendaftaran/{pendaftaran}/verifikasi', [PendaftaranController::class, 'verifikasi']);
        Route::post('pendaftaran/{pendaftaran}/assign-asesor', [PendaftaranController::class, 'assignAsesor']);
        Route::patch('pendaftaran/{pendaftaran}/status', [PendaftaranController::class, 'updateStatus']);

        // Jadwal Asesmen
        Route::apiResource('jadwal', JadwalController::class)->except(['show']);

        // Pleno
        Route::get('pleno', [PlenoController::class, 'index']);
        Route::get('pleno/{pendaftaran}', [PlenoController::class, 'show']);
        Route::post('pleno/{pendaftaran}/keputusan', [PlenoController::class, 'updateKeputusan']);
        Route::post('pleno/{pendaftaran}/finalize', [PlenoController::class, 'finalize']);
    });

    // ─── Asesor ───
    Route::middleware('role:asesor')->prefix('asesor')->group(function () {
        Route::get('tugas', [AsesorTugasController::class, 'index']);
        Route::get('tugas/{tugas}', [AsesorTugasController::class, 'show']);

        // Workspace
        Route::post('tugas/{tugas}/pra-asesmen', [AsesorWorkspaceController::class, 'savePraAsesmen']);
        Route::post('tugas/{tugas}/evaluasi-portofolio', [AsesorWorkspaceController::class, 'saveEvaluasiPortofolio']);
        Route::post('tugas/{tugas}/penilaian-cpmk', [AsesorWorkspaceController::class, 'savePenilaianCpmk']);
        Route::post('tugas/{tugas}/pemetaan-mk', [AsesorWorkspaceController::class, 'savePemetaanMk']);
        Route::post('tugas/{tugas}/submit-final', [AsesorWorkspaceController::class, 'submitFinal']);

        // Ujian Tulis
        Route::get('tugas/{tugas}/soal', [AsesorUjianController::class, 'index']);
        Route::post('tugas/{tugas}/soal', [AsesorUjianController::class, 'store']);
    });

    // ─── Pimpinan ───
    Route::middleware('role:pimpinan')->prefix('pimpinan')->group(function () {
        Route::get('dashboard', [PimpinanCtrl::class, 'dashboard']);
        Route::get('sk', [PimpinanCtrl::class, 'listSk']);
        Route::post('sk/{sk}/terbitkan', [PimpinanCtrl::class, 'terbitkanSk']);
    });

    // ─── Pemohon ───
    Route::middleware('role:pemohon')->prefix('pemohon')->group(function () {
        Route::get('pendaftaran', [BorangController::class, 'getPendaftaran']);
        Route::post('pendaftaran/start', [BorangController::class, 'startPendaftaran']);

        // Borang sections
        Route::post('pendaftaran/{pendaftaran}/data-diri', [BorangController::class, 'saveDataDiri']);
        Route::post('pendaftaran/{pendaftaran}/riwayat-pendidikan', [BorangController::class, 'saveRiwayatPendidikan']);
        Route::post('pendaftaran/{pendaftaran}/transkrip', [BorangController::class, 'saveTranskrip']);
        Route::post('pendaftaran/{pendaftaran}/pengalaman', [BorangController::class, 'savePengalaman']);
        Route::post('pendaftaran/{pendaftaran}/evaluasi-diri', [BorangController::class, 'saveEvaluasiDiri']);
        Route::post('pendaftaran/{pendaftaran}/dokumen', [BorangController::class, 'uploadDokumen']);
        Route::delete('pendaftaran/{pendaftaran}/dokumen/{dokumen}', [BorangController::class, 'deleteDokumen']);
        Route::post('pendaftaran/{pendaftaran}/submit', [BorangController::class, 'submitBorang']);

        // Extra
        Route::get('jadwal', [PemohonExtraController::class, 'jadwal']);
        Route::get('ujian/soal', [PemohonExtraController::class, 'getSoalUjian']);
        Route::post('ujian/jawaban', [PemohonExtraController::class, 'submitJawaban']);
        Route::get('hasil', [PemohonExtraController::class, 'getHasil']);
        Route::post('sanggah', [PemohonExtraController::class, 'submitSanggah']);
    });
});
