<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Jurusan;
use App\Models\Prodi;

class JurusanSeeder extends Seeder
{
    public function run()
    {
        $data = [
            'Teknik Sipil' => [
                'D3 Teknik Sipil',
                'D4 Teknik Bangunan Rawa',
                'D3 Teknik Geodesi',
                'D3 Teknik Pertambangan',
                'D4 Teknik Rekayasa Konstruksi Jalan dan Jembatan'
            ],
            'Teknik Mesin' => [
                'D3 Teknik Mesin',
                'D3 Teknik Mesin Otomotif',
                'D3 Alat Berat'
            ],
            'Teknik Elektro' => [
                'D3 Teknik Listrik',
                'D3 Elektronika',
                'D3 Teknik Informatika',
                'D4 Sistem Informasi Kota Cerdas',
                'D4 Teknik Rekayasa Pembangkit Energi'
            ],
            'Akuntansi' => [
                'D3 Akuntansi',
                'D3 Komputerisasi Akuntansi',
                'D4 Akuntansi Lembaga Keuangan Syariah (ALKS)'
            ],
            'Administrasi Bisnis' => [
                'D3 Administrasi Bisnis',
                'D3 Manajemen Informatika',
                'D4 Bisnis Digital'
            ]
        ];

        foreach ($data as $namaJurusan => $prodis) {
            $jurusan = Jurusan::firstOrCreate(['nama_jurusan' => $namaJurusan]);

            foreach ($prodis as $namaProdi) {
                // Remove D3 or D4 from start for searching
                $searchName = preg_replace('/^(D3|D4)\s+/', '', $namaProdi);
                
                if (str_contains($searchName, 'Akuntansi')) {
                    $altName = str_replace('Akuntansi', 'Akutansi', $searchName);
                    Prodi::where('nama', 'like', "%{$searchName}%")->orWhere('nama', 'like', "%{$altName}%")->update(['jurusan_id' => $jurusan->id]);
                } else {
                    Prodi::where('nama', 'like', "%{$searchName}%")->update(['jurusan_id' => $jurusan->id]);
                }
            }
        }
    }
}
