<?php

namespace Database\Seeders;

use App\Models\Jurusan;
use App\Models\Prodi;
use Illuminate\Database\Seeder;

class AcademicOfficialTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $jurusans = [
            'Teknik Sipil' => 'Nama Ketua Jurusan Teknik Sipil',
            'Teknik Mesin' => 'Nama Ketua Jurusan Teknik Mesin',
            'Teknik Elektro' => 'Nama Ketua Jurusan Teknik Elektro',
            'Akuntansi' => 'Nama Ketua Jurusan Akuntansi',
            'Administrasi Bisnis' => 'Nama Ketua Jurusan Administrasi Bisnis',
        ];

        foreach ($jurusans as $namaJurusan => $namaKetuaJurusan) {
            Jurusan::updateOrCreate(
                ['nama_jurusan' => $namaJurusan],
                [
                    'ketua_jurusan_nama' => $namaKetuaJurusan,
                    'ketua_jurusan_nip' => '-',
                ]
            );
        }

        $prodis = [
            'TS-D3' => ['D3', 'Teknik Sipil', 'Teknik Sipil'],
            'TBR-D4' => ['D4', 'Teknik Bangunan Rawa', 'Teknik Sipil'],
            'TG-D3' => ['D3', 'Teknik Geodesi', 'Teknik Sipil'],
            'TP-D3' => ['D3', 'Teknik Pertambangan', 'Teknik Sipil'],
            'TRKJJ-D4' => ['D4', 'Teknik Rekayasa Konstruksi Jalan dan Jembatan', 'Teknik Sipil'],
            'TM-D3' => ['D3', 'Teknik Mesin', 'Teknik Mesin'],
            'TMO-D3' => ['D3', 'Teknik Mesin Otomotif', 'Teknik Mesin'],
            'AB-D3' => ['D3', 'Alat Berat', 'Teknik Mesin'],
            'TL-D3' => ['D3', 'Teknik Listrik', 'Teknik Elektro'],
            'EL-D3' => ['D3', 'Elektronika', 'Teknik Elektro'],
            'TI-D3' => ['D3', 'Teknik Informatika', 'Teknik Elektro'],
            'SIKC-D4' => ['D4', 'Sistem Informasi Kota Cerdas', 'Teknik Elektro'],
            'TRPE-D4' => ['D4', 'Teknik Rekayasa Pembangkit Energi', 'Teknik Elektro'],
            'AK-D3' => ['D3', 'Akuntansi', 'Akuntansi'],
            'KA-D3' => ['D3', 'Komputerisasi Akuntansi', 'Akuntansi'],
            'ALKS-D4' => ['D4', 'Akuntansi Lembaga Keuangan Syariah', 'Akuntansi'],
            'ABN-D3' => ['D3', 'Administrasi Bisnis', 'Administrasi Bisnis'],
            'MI-D3' => ['D3', 'Manajemen Informatika', 'Administrasi Bisnis'],
            'BD-D4' => ['D4', 'Bisnis Digital', 'Administrasi Bisnis'],
        ];

        foreach ($prodis as $kode => [$jenjang, $namaProdi, $namaJurusan]) {
            $jurusan = Jurusan::where('nama_jurusan', $namaJurusan)->first();

            Prodi::where('kode', $kode)->update([
                'jurusan_id' => $jurusan?->id,
                'koordinator_prodi_nama' => 'Nama Koordinator Prodi '.$jenjang.' '.$namaProdi,
                'koordinator_prodi_nip' => '-',
            ]);
        }
    }
}
