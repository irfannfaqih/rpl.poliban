<?php

namespace App\Services;

use App\Models\Pendaftaran;
use App\Models\Prodi;
use Illuminate\Support\Facades\DB;

class PendaftaranService
{
    /**
     * Generate nomor pendaftaran yang dijamin unik menggunakan DB lock.
     *
     * Format: RPL-{KODE_PRODI}-{TAHUN_2DIGIT}-{URUTAN 4 DIGIT}
     * Contoh: RPL-TI-26-0001
     *
     * Menggunakan lockForUpdate() di dalam transaction untuk mencegah race condition
     * saat dua request masuk bersamaan dan membaca nilai yang sama.
     */
    public function generateNomor(int $prodiId): string
    {
        $prodi = Prodi::findOrFail($prodiId);
        $kodeProdi = strtoupper($prodi->kode);
        $tahun2digit = date("y"); // 26
        $prefix = "RPL-{$kodeProdi}-{$tahun2digit}-";

        // lockForUpdate() tidak didukung SQLite (local dev).
        // Pada MySQL/PostgreSQL (production) pakai locking transaction.
        if (DB::connection()->getDriverName() === "sqlite") {
            return $this->generateNomorSimple($prefix);
        }

        return DB::transaction(function () use ($prefix) {
            $lastNomor = Pendaftaran::where(
                "nomor_pendaftaran",
                "like",
                "{$prefix}%",
            )
                ->lockForUpdate()
                ->orderByDesc("nomor_pendaftaran")
                ->value("nomor_pendaftaran");

            $seq = $lastNomor ? ((int) substr($lastNomor, -4)) + 1 : 1;

            return $prefix . str_pad($seq, 4, "0", STR_PAD_LEFT);
        });
    }

    /**
     * Versi sederhana tanpa DB lock untuk SQLite (development).
     * Tidak race-condition safe, tapi SQLite biasanya single-writer.
     */
    private function generateNomorSimple(string $prefix): string
    {
        $lastNomor = Pendaftaran::where(
            "nomor_pendaftaran",
            "like",
            "{$prefix}%",
        )
            ->orderByDesc("nomor_pendaftaran")
            ->value("nomor_pendaftaran");

        $seq = $lastNomor ? ((int) substr($lastNomor, -4)) + 1 : 1;

        return $prefix . str_pad($seq, 4, "0", STR_PAD_LEFT);
    }
}
