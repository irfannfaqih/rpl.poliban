"use client";

import { User, ShieldCheck, Mail, Briefcase, Key, Phone, MapPin, GraduationCap, Building } from "lucide-react";

export default function ProfilPimpinan() {
  const pimpinanInfo = {
    nama: "Dr. H. Ahmad Susanto, M.T.",
    jabatan: "Direktur Politeknik Negeri Banjarmasin",
    nip: "196805121995031001",
    email: "direktur@poliban.ac.id",
    phone: "0811-500-1234",
    address: "Jl. Brigjen H. Hasan Basry, Banjarmasin",
    officePhone: "(0511) 3305052",
    education: "S3 Teknik Sipil - Institut Teknologi Sepuluh Nopember",
    role: "Pimpinan RPL"
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Profil Pimpinan</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Informasi profil pimpinan/eksekutif yang memiliki otorisasi untuk menerbitkan Surat Keputusan (SK).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Photo & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border shadow-sm p-6 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center text-3xl font-bold mb-4">
              {pimpinanInfo.nama.charAt(0)}
            </div>
            <h2 className="font-bold text-lg text-foreground">{pimpinanInfo.nama}</h2>
            <p className="text-sm text-muted-foreground">{pimpinanInfo.jabatan}</p>
            
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/50">
                <ShieldCheck className="h-3.5 w-3.5" /> Otorisasi SK Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Data Diri */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/20 flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-bold">Informasi Pejabat Berwenang</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Nama Lengkap */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Lengkap</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{pimpinanInfo.nama}</span>
                  </div>
                </div>
                {/* 2. Otorisasi Sistem */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Otorisasi Sistem</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{pimpinanInfo.role}</span>
                  </div>
                </div>
                {/* 3. Jabatan Fungsional */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jabatan Struktural</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{pimpinanInfo.jabatan}</span>
                  </div>
                </div>
                {/* 4. NIP/NIK */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">NIP / NIK</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{pimpinanInfo.nip}</span>
                  </div>
                </div>
                {/* 5. E-Mail */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-Mail Kampus</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{pimpinanInfo.email}</span>
                  </div>
                </div>
                {/* 6. Nomor Telepon/HP */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nomor HP</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{pimpinanInfo.phone}</span>
                  </div>
                </div>
                {/* 7. Alamat Kantor */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Alamat Instansi</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{pimpinanInfo.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
