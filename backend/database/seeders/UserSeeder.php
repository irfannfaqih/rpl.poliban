<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $password = Hash::make('password123');

        // Cari prodi TI-D3 ID
        $prodiTI = DB::table('prodi')->where('kode', 'TI-D3')->first();
        $prodiTM = DB::table('prodi')->where('kode', 'TM-D3')->first();

        DB::table('users')->insert([
            // Super Admin
            [
                'nama' => 'System Administrator',
                'email' => 'sysadmin@poliban.ac.id',
                'password' => $password,
                'nip' => '199001012020011001',
                'role' => 'super_admin',
                'prodi_id' => null,
                'jabatan' => 'IT Administrator',
                'phone' => '08115000001',
                'status' => 'aktif',
                'force_change_password' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Admin Prodi TI
            [
                'nama' => 'Budi Santoso, M.Kom.',
                'email' => 'budi.admin@poliban.ac.id',
                'password' => $password,
                'nip' => '198001012005011002',
                'role' => 'admin_prodi',
                'prodi_id' => $prodiTI?->id,
                'jabatan' => 'Sekretaris Prodi',
                'phone' => '08115000002',
                'status' => 'aktif',
                'force_change_password' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Asesor 1
            [
                'nama' => 'Dr. Budi Santoso',
                'email' => 'budi@poliban.ac.id',
                'password' => $password,
                'nip' => '198001012005011001',
                'role' => 'asesor',
                'prodi_id' => $prodiTI?->id,
                'jabatan' => 'Lektor Kepala',
                'phone' => '08115000003',
                'status' => 'aktif',
                'force_change_password' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Asesor 2
            [
                'nama' => 'Siti Aminah, M.Kom',
                'email' => 'siti@poliban.ac.id',
                'password' => $password,
                'nip' => '198203052008012002',
                'role' => 'asesor',
                'prodi_id' => $prodiTI?->id,
                'jabatan' => 'Lektor',
                'phone' => '08115000004',
                'status' => 'aktif',
                'force_change_password' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Asesor 3 (nonaktif, TM)
            [
                'nama' => 'Ahmad Yani, S.T., M.T.',
                'email' => 'ahmad@poliban.ac.id',
                'password' => $password,
                'nip' => '198912122015042005',
                'role' => 'asesor',
                'prodi_id' => $prodiTM?->id,
                'jabatan' => 'Asisten Ahli',
                'phone' => '08115000005',
                'status' => 'nonaktif',
                'force_change_password' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Pimpinan
            [
                'nama' => 'Dr. H. Ahmad Susanto',
                'email' => 'direktur@poliban.ac.id',
                'password' => $password,
                'nip' => '197508171999031004',
                'role' => 'pimpinan',
                'prodi_id' => null,
                'jabatan' => 'Direktur Utama',
                'phone' => '08115000006',
                'status' => 'aktif',
                'force_change_password' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Pemohon demo
            [
                'nama' => 'Ahmad Fauzi',
                'email' => 'fauzi@gmail.com',
                'password' => $password,
                'nip' => null,
                'role' => 'pemohon',
                'prodi_id' => $prodiTI?->id,
                'jabatan' => null,
                'phone' => '08215000007',
                'status' => 'aktif',
                'force_change_password' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
}
