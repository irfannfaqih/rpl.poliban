<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProdiSeeder extends Seeder
{
    public function run(): void
    {
        $prodi = [
            // Jurusan Teknik Sipil
            ['kode' => 'TS-D3',    'nama' => 'Teknik Sipil',                              'jenjang' => 'D3', 'jurusan' => 'Teknik Sipil'],
            ['kode' => 'TBR-D4',   'nama' => 'Teknik Bangunan Rawa',                      'jenjang' => 'D4', 'jurusan' => 'Teknik Sipil'],
            ['kode' => 'TG-D3',    'nama' => 'Teknik Geodesi',                             'jenjang' => 'D3', 'jurusan' => 'Teknik Sipil'],
            ['kode' => 'TP-D3',    'nama' => 'Teknik Pertambangan',                        'jenjang' => 'D3', 'jurusan' => 'Teknik Sipil'],
            ['kode' => 'TRKJJ-D4', 'nama' => 'Teknik Rekayasa Konstruksi Jalan dan Jembatan', 'jenjang' => 'D4', 'jurusan' => 'Teknik Sipil'],
            // Jurusan Teknik Mesin
            ['kode' => 'TM-D3',    'nama' => 'Teknik Mesin',           'jenjang' => 'D3', 'jurusan' => 'Teknik Mesin'],
            ['kode' => 'TMO-D3',   'nama' => 'Teknik Mesin Otomotif',  'jenjang' => 'D3', 'jurusan' => 'Teknik Mesin'],
            ['kode' => 'AB-D3',    'nama' => 'Alat Berat',             'jenjang' => 'D3', 'jurusan' => 'Teknik Mesin'],
            // Jurusan Teknik Elektro
            ['kode' => 'TL-D3',    'nama' => 'Teknik Listrik',                    'jenjang' => 'D3', 'jurusan' => 'Teknik Elektro'],
            ['kode' => 'EL-D3',    'nama' => 'Elektronika',                       'jenjang' => 'D3', 'jurusan' => 'Teknik Elektro'],
            ['kode' => 'TI-D3',    'nama' => 'Teknik Informatika',                'jenjang' => 'D3', 'jurusan' => 'Teknik Elektro'],
            ['kode' => 'SIKC-D4',  'nama' => 'Sistem Informasi Kota Cerdas',      'jenjang' => 'D4', 'jurusan' => 'Teknik Elektro'],
            ['kode' => 'TRPE-D4',  'nama' => 'Teknik Rekayasa Pembangkit Energi', 'jenjang' => 'D4', 'jurusan' => 'Teknik Elektro'],
            // Jurusan Akuntansi
            ['kode' => 'AK-D3',    'nama' => 'Akuntansi',                             'jenjang' => 'D3', 'jurusan' => 'Akuntansi'],
            ['kode' => 'KA-D3',    'nama' => 'Komputerisasi Akuntansi',               'jenjang' => 'D3', 'jurusan' => 'Akuntansi'],
            ['kode' => 'ALKS-D4',  'nama' => 'Akuntansi Lembaga Keuangan Syariah',    'jenjang' => 'D4', 'jurusan' => 'Akuntansi'],
            // Jurusan Administrasi Bisnis
            ['kode' => 'ABN-D3',   'nama' => 'Administrasi Bisnis',  'jenjang' => 'D3', 'jurusan' => 'Administrasi Bisnis'],
            ['kode' => 'MI-D3',    'nama' => 'Manajemen Informatika','jenjang' => 'D3', 'jurusan' => 'Administrasi Bisnis'],
            ['kode' => 'BD-D4',    'nama' => 'Bisnis Digital',       'jenjang' => 'D4', 'jurusan' => 'Administrasi Bisnis'],
        ];

        $now = now();
        foreach ($prodi as &$p) {
            $p['status'] = 'aktif';
            $p['created_at'] = $now;
            $p['updated_at'] = $now;
        }

        DB::table('prodi')->insert($prodi);
    }
}
