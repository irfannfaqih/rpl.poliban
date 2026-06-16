"use client";

import { useBorangStore } from "@/store/useBorangStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Camera, UploadCloud, X, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function SectionA() {
  const data = useBorangStore((s) => s.data.sectionA);
  const updateSection = useBorangStore((s) => s.updateSection);
  const user = useAuthStore((s) => s.user);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      let needsUpdate = false;
      const updatedData = { ...data };
      
      if (!data.namaLengkap && user.nama) {
        updatedData.namaLengkap = user.nama;
        needsUpdate = true;
      }
      if (!data.emailPribadi && user.email) {
        updatedData.emailPribadi = user.email;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updateSection("sectionA", updatedData);
      }
    }
  }, [user, data.namaLengkap, data.emailPribadi, updateSection]);

  const update = (field: string, value: string) => {
    updateSection("sectionA", { ...data, [field]: value });
  };

  const triggerFileUpload = (accept: string, onFileSelect: (file: File) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        if (file.size > 2 * 1024 * 1024) {
          toast.error("Ukuran foto maksimal 2MB");
          return;
        }
        onFileSelect(file);
      }
    };
    input.click();
  };

  const handleUploadFoto = () => {
    triggerFileUpload(".jpg,.jpeg,.png", async (file) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("photo", file);

        const res = await api.post("/update-photo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        update("pasFoto", res.data.photo);
        toast.success("Foto profil berhasil diperbarui!");
      } catch (err: any) {
        toast.error("Gagal mengunggah foto: " + (err.response?.data?.message || err.message));
      } finally {
        setIsUploading(false);
      }
    });
  };

  const handleRemoveFoto = async () => {
    update("pasFoto", "");
    toast.success("Tautan foto dihapus dari borang. Silakan unggah foto baru jika perlu.");
  };

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">A. Data Diri</h2>
          <p className="text-sm text-muted-foreground">
            Informasi identitas pribadi dan foto profil pemohon RPL.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Photo Upload Section */}
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="relative">
            <div className="h-32 w-32 rounded-2xl bg-muted overflow-hidden border-2 border-border relative flex items-center justify-center">
              {data.pasFoto ? (
                <div className="relative h-full w-full">
                  <img src={`/storage/${data.pasFoto}`} alt="Profile" className="h-full w-full object-cover" />
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
              ) : isUploading ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <User className="h-16 w-16 text-muted-foreground/40" />
              )}
            </div>
            <button
              onClick={data.pasFoto ? handleRemoveFoto : handleUploadFoto}
              disabled={isUploading}
              className={`absolute -bottom-2 -right-2 p-2 rounded-xl shadow-lg transition-all ${
                data.pasFoto 
                ? "bg-destructive text-destructive-foreground hover:scale-105" 
                : "bg-primary text-primary-foreground hover:scale-105"
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {data.pasFoto ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h3 className="font-bold text-base">Pas Foto Terbaru <span className="text-destructive">*</span></h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Gunakan foto formal dengan latar belakang polos. Foto ini akan digunakan untuk kartu peserta dan profil akun Anda.
            </p>
            {!data.pasFoto ? (
              <button
                onClick={handleUploadFoto}
                disabled={isUploading}
                className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {isUploading ? "Mengunggah..." : "Unggah Foto (Maks. 2MB)"}
              </button>
            ) : (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Foto berhasil diunggah
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input
                id="namaLengkap"
                placeholder="Sesuai KTP/Ijazah"
                value={data.namaLengkap || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("namaLengkap", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">NIK <span className="text-destructive">*</span></Label>
              <Input
                id="nik"
                placeholder="16 digit NIK"
                maxLength={16}
                value={data.nik || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value.replace(/\D/g, "");
                  update("nik", v);
                }}
                className="h-11 font-mono"
              />
              <p className="text-xs text-muted-foreground">Hanya angka, 16 digit.</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tempatLahir">Tempat Lahir <span className="text-destructive">*</span></Label>
              <Input
                id="tempatLahir"
                placeholder="Kota kelahiran"
                value={data.tempatLahir || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("tempatLahir", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalLahir">Tanggal Lahir <span className="text-destructive">*</span></Label>
              <Input
                id="tanggalLahir"
                type="date"
                value={data.tanggalLahir || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("tanggalLahir", e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jenisKelamin">Jenis Kelamin <span className="text-destructive">*</span></Label>
              <select
                id="jenisKelamin"
                value={data.jenisKelamin || ""}
                onChange={(e) => update("jenisKelamin", e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agama">Agama <span className="text-destructive">*</span></Label>
              <select
                id="agama"
                value={data.agama || ""}
                onChange={(e) => update("agama", e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">Pilih</option>
                <option value="Islam">Islam</option>
                <option value="Kristen">Kristen</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kebangsaan">Kebangsaan <span className="text-destructive">*</span></Label>
              <select
                id="kebangsaan"
                value={data.kebangsaan || ""}
                onChange={(e) => update("kebangsaan", e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="">Pilih</option>
                <option value="WNI">WNI</option>
                <option value="WNA">WNA</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noHP">No. HP / WhatsApp <span className="text-destructive">*</span></Label>
              <Input
                id="noHP"
                placeholder="08xxxxxxxxxx"
                value={data.noHP || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value.replace(/\D/g, "");
                  update("noHP", v);
                }}
                className="h-11 font-mono"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emailPribadi">Email Pribadi <span className="text-destructive">*</span></Label>
              <Input
                id="emailPribadi"
                type="email"
                placeholder="nama@email.com"
                value={data.emailPribadi || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("emailPribadi", e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat Lengkap <span className="text-destructive">*</span></Label>
            <textarea
              id="alamat"
              rows={3}
              placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota, Provinsi"
              value={data.alamat || ""}
              onChange={(e) => update("alamat", e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
