<?php

use App\Http\Controllers\Api\AdminProdi\ArsipController;
use App\Http\Controllers\Api\AdminProdi\JadwalController;
use App\Http\Controllers\Api\AdminProdi\KurikulumController;
use App\Http\Controllers\Api\AdminProdi\PendaftaranController;
use App\Http\Controllers\Api\AdminProdi\PlenoController;
use App\Http\Controllers\Api\AdminProdi\UjiLanjutanController as AdminProdiUjiLanjutanController;
use App\Http\Controllers\Api\Asesor\SanggahController as AsesorSanggahController;
use App\Http\Controllers\Api\Asesor\TugasController as AsesorTugasController;
use App\Http\Controllers\Api\Asesor\UjiLanjutanController as AsesorUjiLanjutanController;
use App\Http\Controllers\Api\Asesor\WorkspaceController as AsesorWorkspaceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Pemohon\BorangController;
use App\Http\Controllers\Api\Pemohon\PembayaranController;
use App\Http\Controllers\Api\Pemohon\PemohonExtraController;
use App\Http\Controllers\Api\Pemohon\UjiLanjutanController as PemohonUjiLanjutanController;
use App\Http\Controllers\Api\Kaprodi\PlenoApprovalController as KaprodiPlenoApprovalController;
use App\Http\Controllers\Api\Pimpinan\PimpinanController as PimpinanCtrl;
use App\Http\Controllers\Api\PrivateFileController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\SuperAdmin\AuditLogController;
use App\Http\Controllers\Api\SuperAdmin\GelombangController;
use App\Http\Controllers\Api\SuperAdmin\PenggunaController;
use App\Http\Controllers\Api\SuperAdmin\ProdiController;
use Illuminate\Support\Facades\Route;

// ═══ Public Routes ═══
// Throttle login & register: maks 10 request per menit per IP untuk cegah brute force
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});
Route::get('/public/gelombang-aktif', [
    PublicController::class,
    'getGelombangAktif',
]);
Route::get('/public/prodi-aktif', [
    PublicController::class,
    'getProdiAktif',
]);
Route::get('/public/verify-sk/{id}', [
    PublicController::class,
    'verifySk',
]);

// ═══ Authenticated Routes ═══
use App\Http\Controllers\Api\Pemohon\NotificationController;

Route::middleware('auth:sanctum')->group(function () {
    // Endpoint yang butuh autentikasi (untuk semua role)
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/update-profile', [AuthController::class, 'updateProfile']);
    Route::post('/update-photo', [AuthController::class, 'updatePhoto']);
    Route::post('/update-password', [AuthController::class, 'updatePassword']);

    Route::get('/private-files/dokumen/{dokumen}', [PrivateFileController::class, 'dokumen']);
    Route::get('/private-files/arsip/{arsip}', [PrivateFileController::class, 'arsip']);
    Route::get('/private-files/sanggah/{sanggah}', [PrivateFileController::class, 'sanggah']);

    // ─── Notifikasi (semua role) ───
    // NotificationController sudah generic: pakai request->user()->notifications()
    Route::get('/notifikasi', [NotificationController::class, 'index']);
    Route::patch('/notifikasi/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifikasi/{id}/read', [NotificationController::class, 'markRead']);

    // ─── Super Admin ───
    Route::middleware('role:super_admin')
        ->prefix('super-admin')
        ->group(function () {
            Route::apiResource('gelombang', GelombangController::class);
            Route::patch('gelombang/{gelombang}/toggle-status', [
                GelombangController::class,
                'toggleStatus',
            ]);

            Route::apiResource('prodi', ProdiController::class);
            Route::patch('prodi/{prodi}/toggle-status', [
                ProdiController::class,
                'toggleStatus',
            ]);

            Route::apiResource('jurusan', \App\Http\Controllers\Api\SuperAdmin\JurusanController::class);

            Route::apiResource('pengguna', PenggunaController::class);
            Route::patch('pengguna/{pengguna}/reset-password', [
                PenggunaController::class,
                'resetPassword',
            ]);
            Route::patch('pengguna/{pengguna}/toggle-status', [
                PenggunaController::class,
                'toggleStatus',
            ]);

            Route::get('audit-log', [AuditLogController::class, 'index']);
        });

    // ─── Admin Prodi ───
    Route::middleware('role:admin_prodi')
        ->prefix('admin-prodi')
        ->group(function () {
            // Kurikulum (MK + CPMK)
            Route::apiResource('mata-kuliah', KurikulumController::class);
            Route::get('mata-kuliah/{mataKuliah}/cpmk', [
                KurikulumController::class,
                'cpmkIndex',
            ]);
            Route::post('mata-kuliah/{mataKuliah}/cpmk', [
                KurikulumController::class,
                'cpmkStore',
            ]);
            Route::put('mata-kuliah/{mataKuliah}/cpmk/{cpmk}', [
                KurikulumController::class,
                'cpmkUpdate',
            ]);
            Route::delete('mata-kuliah/{mataKuliah}/cpmk/{cpmk}', [
                KurikulumController::class,
                'cpmkDestroy',
            ]);

            // Toggle is_active MK (PRD Bab 4.3 Halaman 2.2)
            Route::patch('mata-kuliah/{mataKuliah}/toggle-active', [
                KurikulumController::class,
                'toggleActive',
            ]);

            // Matriks Asesmen
            Route::post('mata-kuliah/{mataKuliah}/matriks', [
                KurikulumController::class,
                'saveMatriks',
            ]);

            // Pendaftaran
            Route::get('pendaftaran/export', [
                PendaftaranController::class,
                'exportExcel',
            ]);
            Route::get('pendaftaran', [PendaftaranController::class, 'index']);
            Route::get('asesor', [PendaftaranController::class, 'listAsesor']);
            Route::get('pendaftaran/{pendaftaran}', [
                PendaftaranController::class,
                'show',
            ]);
            Route::post('pendaftaran/{pendaftaran}/verifikasi', [
                PendaftaranController::class,
                'verifikasi',
            ]);
            Route::post('pendaftaran/{pendaftaran}/assign-asesor', [
                PendaftaranController::class,
                'assignAsesor',
            ]);
            Route::patch('pendaftaran/{pendaftaran}/status', [
                PendaftaranController::class,
                'updateStatus',
            ]);
            Route::post('pendaftaran/{pendaftaran}/unlock', [
                PendaftaranController::class,
                'unlock',
            ]);

            // Jadwal Asesmen
            Route::apiResource('jadwal', JadwalController::class)->except(['show']);
            Route::get('jadwal-per-tanggal', [JadwalController::class, 'jadwalPerTanggal']);
            Route::get('cek-konflik-jadwal', [JadwalController::class, 'cekKonflik']);

            // Pleno
            Route::get('/pleno/export', [
                PlenoController::class,
                'exportExcel',
            ]);
            Route::get('/pleno', [PlenoController::class, 'index']);
            Route::get('/pleno/{pendaftaran}', [
                PlenoController::class,
                'show',
            ]);
            Route::post('/pleno/{pendaftaran}/keputusan', [
                PlenoController::class,
                'updateKeputusan',
            ]);
            Route::post('/pleno/{pendaftaran}/finalize', [
                PlenoController::class,
                'finalize',
            ]);
            // Arsip
            Route::get('/arsip', [
                ArsipController::class,
                'index',
            ]);
            Route::get('/arsip/{pendaftaran}', [
                ArsipController::class,
                'show',
            ]);
            Route::post('/arsip/{pendaftaran}/upload', [
                ArsipController::class,
                'upload',
            ]);
            Route::get('/arsip/{pendaftaran}/pdf/{kode}', [
                ArsipController::class,
                'downloadPdf',
            ]);
            // Generate PDF formulir dari halaman matriks (F12)
            Route::get('/pendaftaran/{pendaftaran}/pdf/{kode}', [
                ArsipController::class,
                'downloadPdf',
            ]);

            // Uji Lanjutan / AT2 (Admin Prodi — set jadwal, approve/reject reschedule)
            Route::post('/pendaftaran/{pendaftaran_id}/at2/jadwal', [AdminProdiUjiLanjutanController::class, 'setJadwal']);
            Route::get('/pendaftaran/{pendaftaran_id}/at2', [AdminProdiUjiLanjutanController::class, 'show']);
            Route::post('/pendaftaran/{pendaftaran_id}/at2/reschedule/approve', [AdminProdiUjiLanjutanController::class, 'approveReschedule']);
            Route::post('/pendaftaran/{pendaftaran_id}/at2/reschedule/reject', [AdminProdiUjiLanjutanController::class, 'rejectReschedule']);
        });

    // â”€â”€â”€ Kaprodi â”€â”€â”€
    Route::middleware('role:kaprodi')
        ->prefix('kaprodi')
        ->group(function () {
            Route::get('pleno-approvals', [KaprodiPlenoApprovalController::class, 'index']);
            Route::get('pleno-approvals/{approval}', [KaprodiPlenoApprovalController::class, 'show']);
            Route::post('pleno-approvals/{approval}/approve', [KaprodiPlenoApprovalController::class, 'approve']);
            Route::post('pleno-approvals/{approval}/reject', [KaprodiPlenoApprovalController::class, 'reject']);
        });

    // ─── Asesor ───
    Route::middleware('role:asesor')
        ->prefix('asesor')
        ->group(function () {
            Route::get('tugas', [AsesorTugasController::class, 'index']);
            Route::get('tugas/{tugas}', [AsesorTugasController::class, 'show']);

            // Workspace
            Route::post('tugas/{tugas}/pra-asesmen', [
                AsesorWorkspaceController::class,
                'savePraAsesmen',
            ]);
            Route::post('tugas/{tugas}/evaluasi-portofolio', [
                AsesorWorkspaceController::class,
                'saveEvaluasiPortofolio',
            ]);
            Route::post('tugas/{tugas}/penilaian-cpmk', [
                AsesorWorkspaceController::class,
                'savePenilaianCpmk',
            ]);
            Route::post('tugas/{tugas}/pemetaan-mk', [
                AsesorWorkspaceController::class,
                'savePemetaanMk',
            ]);
            Route::post('tugas/{tugas}/submit-final', [
                AsesorWorkspaceController::class,
                'submitFinal',
            ]);

            // Uji Lanjutan / AT2 (Asesmen Tahap 2)
            Route::get('uji-lanjutan', [AsesorUjiLanjutanController::class, 'index']);
            Route::get('uji-lanjutan/{pendaftaran_id}', [AsesorUjiLanjutanController::class, 'show']);
            Route::get('uji-lanjutan/{pendaftaran_id}/copy-sources', [AsesorUjiLanjutanController::class, 'copySources']);
            Route::post('uji-lanjutan/{pendaftaran_id}/copy', [AsesorUjiLanjutanController::class, 'copyItems']);
            Route::post('uji-lanjutan/{pendaftaran_id}/soal', [AsesorUjiLanjutanController::class, 'saveItems']);
            Route::post('uji-lanjutan/{pendaftaran_id}/publish', [AsesorUjiLanjutanController::class, 'publishSoal']);
            Route::post('uji-lanjutan/{pendaftaran_id}/mulai', [AsesorUjiLanjutanController::class, 'mulaiUjian']);
            Route::post('uji-lanjutan/{pendaftaran_id}/tidak-hadir', [AsesorUjiLanjutanController::class, 'tidakHadir']);
            Route::post('uji-lanjutan/{pendaftaran_id}/nilai', [AsesorUjiLanjutanController::class, 'submitNilai']);

            // Sanggahan
            Route::get('sanggah', [
                AsesorSanggahController::class,
                'index',
            ]);
            Route::put('sanggah/{sanggah}', [
                AsesorSanggahController::class,
                'update',
            ]);
        });

    // ─── Pimpinan ───
    Route::middleware('role:pimpinan')
        ->prefix('pimpinan')
        ->group(function () {
            Route::get('dashboard', [PimpinanCtrl::class, 'dashboard']);
            Route::get('pleno-approvals', [PimpinanCtrl::class, 'listPlenoApprovals']);
            Route::post('pleno-approvals/{approval}/approve', [PimpinanCtrl::class, 'approvePleno']);
            Route::post('pleno-approvals/{approval}/reject', [PimpinanCtrl::class, 'rejectPleno']);
            Route::get('sk', [PimpinanCtrl::class, 'listSk']);
            Route::post('sk/{sk}/terbitkan', [
                PimpinanCtrl::class,
                'terbitkanSk',
            ]);
        });

    // ─── Pemohon ───
    Route::middleware('role:pemohon')
        ->prefix('pemohon')
        ->group(function () {
            Route::get('pendaftaran', [
                BorangController::class,
                'getPendaftaran',
            ]);
            Route::get('kurikulum', [
                BorangController::class,
                'getKurikulum',
            ]);
            Route::post('pendaftaran/start', [
                BorangController::class,
                'startPendaftaran',
            ]);

            // Borang sections
            Route::post('pendaftaran/{pendaftaran}/data-diri', [
                BorangController::class,
                'saveDataDiri',
            ]);
            Route::post('pendaftaran/{pendaftaran}/riwayat-pendidikan', [
                BorangController::class,
                'saveRiwayatPendidikan',
            ]);
            Route::post('pendaftaran/{pendaftaran}/transkrip', [
                BorangController::class,
                'saveTranskrip',
            ]);
            Route::post('pendaftaran/{pendaftaran}/pengalaman', [
                BorangController::class,
                'savePengalaman',
            ]);
            Route::post('pendaftaran/{pendaftaran}/evaluasi-diri', [
                BorangController::class,
                'saveEvaluasiDiri',
            ]);
            Route::post('pendaftaran/{pendaftaran}/dokumen', [
                BorangController::class,
                'uploadDokumen',
            ]);
            Route::delete('pendaftaran/{pendaftaran}/dokumen/{dokumen}', [
                BorangController::class,
                'deleteDokumen',
            ]);
            Route::post('pendaftaran/{pendaftaran}/submit', [
                BorangController::class,
                'submitBorang',
            ]);
            Route::post('pendaftaran/{pendaftaran}/bayar', [
                PembayaranController::class,
                'submitBayar',
            ]);

            // Extra
            Route::get('jadwal', [PemohonExtraController::class, 'jadwal']);
            Route::get('jadwal/kartu', [PemohonExtraController::class, 'downloadKartu']);
            // Uji Lanjutan (Asesmen Tahap 2)
            Route::get('uji-lanjutan', [
                PemohonUjiLanjutanController::class,
                'getUjiLanjutan',
            ]);
            Route::post('uji-lanjutan/{id}/submit', [
                PemohonUjiLanjutanController::class,
                'submitJawaban',
            ]);
            Route::patch('uji-lanjutan/{id}/draft', [
                PemohonUjiLanjutanController::class,
                'saveDraftJawaban',
            ]);
            // Konfirmasi kehadiran uji lanjutan (PRD Bab 4.2 Halaman 1.6)
            Route::post('uji-lanjutan/{id}/konfirmasi', [
                PemohonUjiLanjutanController::class,
                'konfirmasiKehadiran',
            ]);
            Route::post('uji-lanjutan/{id}/reschedule', [
                PemohonUjiLanjutanController::class,
                'ajukanReschedule',
            ]);

            Route::get('hasil', [PemohonExtraController::class, 'getHasil']);
            Route::get('hasil/sk', [PemohonExtraController::class, 'downloadSk']);
            Route::post('sanggah', [
                PemohonExtraController::class,
                'submitSanggah',
            ]);
            Route::get('/arsip/{pendaftaran}/pdf/{kode}', [
                ArsipController::class,
                'downloadPdf',
            ]);
        });
});
