<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KurikulumSeeder extends Seeder
{
    public function run(): void
    {
        $prodiTI = DB::table('prodi')->where('kode', 'TI-D3')->first();
        $prodiSIKC = DB::table('prodi')->where('kode', 'SIKC-D4')->first();
        $now = now();

        if (!$prodiTI || !$prodiSIKC) return;

        // ═══ Kurikulum D3 Teknik Informatika ═══
        $mkTI = [
            ['kode' => 'TI101', 'nama' => 'Algoritma Pemrograman',      'sks' => 3],
            ['kode' => 'TI102', 'nama' => 'Basis Data',                 'sks' => 3],
            ['kode' => 'TI103', 'nama' => 'Pemrograman Berbasis Web',   'sks' => 3],
            ['kode' => 'TI104', 'nama' => 'Sistem Operasi',             'sks' => 3],
            ['kode' => 'TI105', 'nama' => 'Rekayasa Perangkat Lunak',   'sks' => 3],
        ];

        foreach ($mkTI as $mk) {
            DB::table('mata_kuliah')->insert([
                'prodi_id' => $prodiTI->id,
                'kode' => $mk['kode'],
                'nama' => $mk['nama'],
                'sks' => $mk['sks'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ═══ Kurikulum D4 SIKC ═══
        $mkSIKC = [
            ['kode' => 'SI201', 'nama' => 'Pengantar Sistem Informasi', 'sks' => 3],
            ['kode' => 'SI202', 'nama' => 'Dasar Internet of Things',   'sks' => 3],
            ['kode' => 'SI203', 'nama' => 'Pemodelan Proses Bisnis',    'sks' => 3],
        ];

        foreach ($mkSIKC as $mk) {
            DB::table('mata_kuliah')->insert([
                'prodi_id' => $prodiSIKC->id,
                'kode' => $mk['kode'],
                'nama' => $mk['nama'],
                'sks' => $mk['sks'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ═══ CPMK untuk MK TI ═══
        $cpmkData = [
            'TI101' => [
                'Mahasiswa mampu mengetahui dan memahami pengantar dan konsep dasar algoritma dan pemrograman',
                'Mahasiswa mampu mengetahui dan memahami dasar-dasar algoritma',
                'Mahasiswa mampu mempraktikkan tipe data, operator, dan identifier',
                'Mahasiswa mampu mempraktikkan Input dan output pada algoritma pemrograman',
                'Mahasiswa mampu mempraktikkan statement pengendalian/percabangan',
                'Mahasiswa mampu mempraktikkan statement perulangan',
            ],
            'TI102' => [
                'Mampu menjelaskan konsep database dan tingkatan yang ada dalam database',
                'Mampu menjelaskan komponen pendukung sebuah database',
                'Mampu merancang dan memodelkan basis data dengan ERD',
                'Mampu merancang dengan menggunakan teknik normalisasi',
            ],
            'TI103' => [
                'Mampu mengimplementasikan konsep dasar web dan HTML',
                'Mampu menjelaskan penggunaan CSS',
                'Mampu menjelaskan PHP, sintak PHP, membuat form',
                'Mampu membuat koneksi database dan aplikasi dengan PHP dan MySQL',
            ],
            'TI104' => [
                'Mampu memahami konsep dasar dari arsitektur sistem operasi',
                'Mampu mempraktikkan teknik booting dan manajemen proses',
                'Mampu mempraktikkan manajemen memori',
            ],
            'TI105' => [
                'Mampu memahami konsep rekayasa perangkat lunak',
                'Memahami Software Development Life Cycle (SDLC)',
                'Mampu mendesain perangkat lunak',
                'Mampu mengimplementasikan dan menguji perangkat lunak',
            ],
            'SI201' => [
                'Mahasiswa mampu mengetahui, memahami, dan menjelaskan konsep dan pengertian sistem informasi dan teknologi informasi',
                'Mahasiswa mampu mengetahui, memahami, dan menjelaskan jenis-jenis sistem informasi',
                'Mahasiswa mampu mengetahui, memahami, dan menjelaskan pengembangan dan pengadaan sistem informasi',
            ],
            'SI202' => [
                'Mampu memahami prinsip atau konsep dasar dari Internet of Things (IoT) serta arsitekturnya',
                'Mampu memahami berbagai macam bentuk solusi dan enablers Internet of Things (IoT)',
                'Mampu merancang, membangun, dan menerapkan pemrograman berbasis Internet of Things (IoT)',
            ],
            'SI203' => [
                'Mahasiswa mampu mengetahui dan memahami konsep, teori, dan metode dari pemodelan proses bisnis',
                'Mahasiswa mampu menjelaskan tentang bagian-bagian proses bisnis dan mampu mengimplementasikan serta menghasilkan sebuah sistem informasi',
                'Mahasiswa mampu merancang dan menganalisis model bisnis sesuai ide dan peluang yang ada saat ini',
            ],
        ];

        foreach ($cpmkData as $mkKode => $cpmkList) {
            $mk = DB::table('mata_kuliah')->where('kode', $mkKode)->first();
            if (!$mk) continue;

            foreach ($cpmkList as $i => $desc) {
                $no = $i + 1;
                DB::table('cpmk')->insert([
                    'mata_kuliah_id' => $mk->id,
                    'kode' => "{$mkKode}-{$no}",
                    'deskripsi' => $desc,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
