<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GelombangSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::table('gelombang')->insert([
            [
                'nama' => 'Tahun Ajaran 2026/2027 Ganjil',
                'tgl_buka' => '2026-06-01',
                'tgl_tutup' => '2026-07-31',
                'tgl_sanggah' => '2026-08-15',
                'biaya' => 2500000,
                'status' => 'aktif',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Tahun Ajaran 2025/2026 Ganjil',
                'tgl_buka' => '2025-05-15',
                'tgl_tutup' => '2025-07-15',
                'tgl_sanggah' => '2025-08-01',
                'biaya' => 2000000,
                'status' => 'selesai',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
