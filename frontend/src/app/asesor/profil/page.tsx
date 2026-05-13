"use client";

import { useAsesorStore } from "@/store/useAsesorStore";
import { User, ShieldCheck, Mail, Building, Briefcase, Key, Phone, MapPin, GraduationCap, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ProfilAsesor() {
  const asesorInfo = useAsesorStore((s) => s.asesorInfo);

  if (!asesorInfo) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Biodata Asesor</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Lengkapi data diri, riwayat pendidikan, dan pekerjaan Anda sebelum memulai proses asesmen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Col: Photo & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border shadow-sm p-6 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mb-4">
              {asesorInfo.nama.charAt(0)}
            </div>
            <h2 className="font-bold text-lg text-foreground">{asesorInfo.nama}</h2>
            <p className="text-sm text-muted-foreground">{asesorInfo.jabatan}</p>
            
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Asesor Aktif
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
              <h3 className="font-bold">Data Pribadi</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Nama Lengkap */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Lengkap</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{asesorInfo.nama}</span>
                  </div>
                </div>
                {/* 2. Jenis Kelamin */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenis Kelamin</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Laki-laki</span>
                  </div>
                </div>
                {/* 3. Jabatan Fungsional */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jabatan Fungsional</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{asesorInfo.jabatan}</span>
                  </div>
                </div>
                {/* 4. NIP/NIK */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">NIP / NIK / Identitas Lain</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{asesorInfo.nip}</span>
                  </div>
                </div>
                {/* 5. Tempat & Tanggal Lahir */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempat & Tanggal Lahir</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Banjarmasin, 1 Januari 1980</span>
                  </div>
                </div>
                {/* 6. E-Mail */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-Mail</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">asesor@poliban.ac.id</span>
                  </div>
                </div>
                {/* 7. Nomor Telepon/HP */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nomor Telepon / HP</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">0812-3456-7890</span>
                  </div>
                </div>
                {/* 8. Alamat Kantor */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Alamat Kantor</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Jl. Brigjen H. Hasan Basry, Banjarmasin</span>
                  </div>
                </div>
                {/* 9. Nomor Telepon/Fax Kantor */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nomor Telepon / Fax Kantor</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">(0511) 3305052</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pendidikan & Pekerjaan */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/20 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-bold">Pendidikan, Pekerjaan & Asosiasi</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 10. Pendidikan */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bidang Keilmuan</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Teknik Informatika</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pendidikan Terakhir</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">S3 (Doktor)</span>
                  </div>
                </div>
                {/* 11. Pekerjaan */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Instansi</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Politeknik Negeri Banjarmasin</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jabatan</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{asesorInfo.jabatan}</span>
                  </div>
                </div>
                {/* 12. Keanggotaan Asosiasi Profesi */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keanggotaan Asosiasi Profesi</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Asosiasi Profesi Pendidikan Vokasi Indonesia (APPVI)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pengaturan Keamanan */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/20 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-bold">Keamanan Akun</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Kata Sandi Saat Ini</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">Kata Sandi Baru</Label>
                  <Input type="password" placeholder="Minimal 8 karakter" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">Konfirmasi Kata Sandi Baru</Label>
                  <Input type="password" placeholder="Ulangi kata sandi baru" />
                </div>
              </div>
              <div className="pt-2">
                <Button>Perbarui Kata Sandi</Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
