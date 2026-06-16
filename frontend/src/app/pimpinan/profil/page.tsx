"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Briefcase, Building, Edit2, Key, Mail, MapPin, Phone, Save, ShieldCheck, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProfileForm {
  nama: string;
  jabatan: string;
  nip: string;
  phone: string;
  alamat: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  return (error as AxiosError<{ message?: string }>).response?.data?.message || fallback;
};

export default function ProfilPimpinan() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    nama: "",
    jabatan: "",
    nip: "",
    phone: "",
    alamat: "",
  });

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/me');
      return data.user;
    }
  });

  useEffect(() => {
    if (me) {
      setFormData({
        nama: me.nama || "",
        jabatan: me.jabatan || "",
        nip: me.nip || "",
        phone: me.phone || "",
        alamat: me.alamat || "",
      });
    }
  }, [me]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/update-profile', formData);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Profil berhasil diperbarui.");
      updateUser(data.user);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Gagal memperbarui profil."));
    }
  });

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const handleCancel = () => {
    setFormData({
      nama: me.nama || "",
      jabatan: me.jabatan || "",
      nip: me.nip || "",
      phone: me.phone || "",
      alamat: me.alamat || "",
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran maksimal foto adalah 5MB.");
      event.target.value = "";
      return;
    }

    const toastId = toast.loading("Mengunggah foto...");
    try {
      const payload = new FormData();
      payload.append("photo", file);

      const { data } = await api.post('/update-photo', payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      updateUser({ photo: data.photo });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(data.message || "Foto profil berhasil diperbarui.", { id: toastId });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Gagal mengunggah foto."), { id: toastId });
    } finally {
      event.target.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Profil Pimpinan</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Informasi profil pimpinan/eksekutif yang memiliki otorisasi untuk menerbitkan Surat Keputusan (SK).
          </p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={updateProfileMutation.isPending}>
              <X className="h-4 w-4 mr-2" /> Batal
            </Button>
            <Button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending || !formData.nama.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-2" /> Edit Profil
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Col: Photo & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border shadow-sm p-6 text-center">
            <div className="relative mx-auto h-24 w-24 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center text-3xl font-bold mb-4 group overflow-hidden">
              {me.photo ? (
                <img
                  src={`http://127.0.0.1:8000/storage/${me.photo}`}
                  alt="Profil"
                  className="h-full w-full object-cover"
                />
              ) : (
                me.nama.charAt(0)
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Edit2 className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-semibold">Ubah Foto</span>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            <h2 className="font-bold text-lg text-foreground">{me.nama}</h2>
            <p className="text-sm text-muted-foreground">{me.jabatan || "Pimpinan"}</p>

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
            <div className="px-6 py-4 border-b bg-muted/20">
              <h3 className="font-bold">Informasi Pejabat Berwenang</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Nama Lengkap */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Lengkap</label>
                  {isEditing ? (
                    <Input value={formData.nama} onChange={(event) => handleChange("nama", event.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.nama}</span>
                    </div>
                  )}
                </div>
                {/* 2. Otorisasi Sistem */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Otorisasi Sistem</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Pimpinan / Eksekutif</span>
                  </div>
                </div>
                {/* 3. Jabatan Fungsional */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jabatan Struktural</label>
                  {isEditing ? (
                    <Input value={formData.jabatan} onChange={(event) => handleChange("jabatan", event.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.jabatan || "-"}</span>
                    </div>
                  )}
                </div>
                {/* 4. NIP/NIK */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">NIP / NIK</label>
                  {isEditing ? (
                    <Input value={formData.nip} onChange={(event) => handleChange("nip", event.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.nip || "-"}</span>
                    </div>
                  )}
                </div>
                {/* 5. E-Mail */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-Mail Kampus</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{me.email}</span>
                  </div>
                </div>
                {/* 6. Nomor Telepon/HP */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nomor HP</label>
                  {isEditing ? (
                    <Input value={formData.phone} onChange={(event) => handleChange("phone", event.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.phone || "-"}</span>
                    </div>
                  )}
                </div>
                {/* 7. Alamat Kantor */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Alamat Instansi</label>
                  {isEditing ? (
                    <Input value={formData.alamat} onChange={(event) => handleChange("alamat", event.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.alamat || "-"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
