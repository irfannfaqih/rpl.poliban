"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Briefcase, Building, Calendar, Edit2, GraduationCap, Key, Mail, MapPin, Phone, Save, ShieldCheck, User, X as XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfilAsesor() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore(s => s.updateUser);
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/me');
      return data.user;
    }
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (me) {
      setFormData({
        nama: me.nama || "",
        jenis_kelamin: me.jenis_kelamin || "",
        tempat_lahir: me.tempat_lahir || "",
        tanggal_lahir: me.tanggal_lahir || "",
        phone: me.phone || "",
        alamat: me.alamat || "",
        jabatan: me.jabatan || "",
        nip: me.nip || "",
        bidang_keilmuan: me.bidang_keilmuan || "",
        pendidikan_terakhir: me.pendidikan_terakhir || "",
        instansi: me.instansi || "",
        jabatan_instansi: me.jabatan_instansi || "",
        asosiasi_profesi: me.asosiasi_profesi || "",
      });
    }
  }, [me]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put('/update-profile', formData);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Profil berhasil diperbarui!");
      setIsEditing(false);
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui profil.");
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/update-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password berhasil diubah!");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirmation("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengubah password.");
    }
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran maksimal foto adalah 5MB");
      return;
    }

    const toastId = toast.loading("Mengunggah foto...");
    try {
      const form = new FormData();
      form.append("photo", file);

      const res = await api.post('/update-photo', form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Foto profil berhasil diperbarui!", { id: toastId });
      updateUser({ photo: res.data.photo });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengunggah foto.", { id: toastId });
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
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Biodata Profil</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Lengkapi data diri, riwayat pendidikan, dan pekerjaan Anda.
          </p>
        </div>
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={updateProfileMutation.isPending}>
                <XIcon className="h-4 w-4 mr-2" /> Batal
              </Button>
              <Button onClick={() => updateProfileMutation.mutate()} disabled={updateProfileMutation.isPending}>
                <Save className="h-4 w-4 mr-2" /> {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" /> Edit Profil
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Col: Photo & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border shadow-sm p-6 text-center">
            <div className="relative mx-auto h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mb-4 group overflow-hidden">
              {me.photo ? (
                <img src={`http://127.0.0.1:8000/storage/${me.photo}`} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                me.nama.charAt(0)
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" title="Ubah Foto Profil">
                  <Edit2 className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-semibold">Ubah Foto</span>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            <h2 className="font-bold text-lg text-foreground">{me.nama}</h2>
            <p className="text-sm text-muted-foreground">{me.jabatan || (me.role === 'asesor' ? "Asesor" : "Pemohon")}</p>

            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Akun Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Data Diri */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/20">
              <h3 className="font-bold">Data Pribadi</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Lengkap</Label>
                  {isEditing ? (
                    <Input value={formData.nama} onChange={e => handleChange("nama", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.nama}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenis Kelamin</Label>
                  {isEditing ? (
                    <select
                      value={formData.jenis_kelamin}
                      onChange={e => handleChange("jenis_kelamin", e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Pilih</option>
                      <option value="Laki-Laki">Laki-Laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.jenis_kelamin || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jabatan Fungsional</Label>
                  {isEditing ? (
                    <Input value={formData.jabatan} onChange={e => handleChange("jabatan", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.jabatan || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">NIP / NIK / Identitas</Label>
                  {isEditing ? (
                    <Input value={formData.nip} onChange={e => handleChange("nip", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.nip || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempat Lahir</Label>
                  {isEditing ? (
                    <Input value={formData.tempat_lahir} onChange={e => handleChange("tempat_lahir", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.tempat_lahir || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal Lahir</Label>
                  {isEditing ? (
                    <Input type="date" value={formData.tanggal_lahir} onChange={e => handleChange("tanggal_lahir", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.tanggal_lahir || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-Mail</Label>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30 opacity-70">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{me.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nomor Telepon / HP</Label>
                  {isEditing ? (
                    <Input value={formData.phone} onChange={e => handleChange("phone", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.phone || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Alamat Lengkap</Label>
                  {isEditing ? (
                    <Input value={formData.alamat} onChange={e => handleChange("alamat", e.target.value)} />
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

          {/* Pendidikan & Pekerjaan */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/20">
              <h3 className="font-bold">Pendidikan, Pekerjaan & Asosiasi</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bidang Keilmuan</Label>
                  {isEditing ? (
                    <Input value={formData.bidang_keilmuan} onChange={e => handleChange("bidang_keilmuan", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.bidang_keilmuan || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pendidikan Terakhir</Label>
                  {isEditing ? (
                    <Input value={formData.pendidikan_terakhir} onChange={e => handleChange("pendidikan_terakhir", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.pendidikan_terakhir || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Instansi</Label>
                  {isEditing ? (
                    <Input value={formData.instansi} onChange={e => handleChange("instansi", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.instansi || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jabatan Instansi</Label>
                  {isEditing ? (
                    <Input value={formData.jabatan_instansi} onChange={e => handleChange("jabatan_instansi", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.jabatan_instansi || "-"}</span>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keanggotaan Asosiasi Profesi</Label>
                  {isEditing ? (
                    <Input value={formData.asosiasi_profesi} onChange={e => handleChange("asosiasi_profesi", e.target.value)} />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border bg-muted/30">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{me.asosiasi_profesi || "-"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pengaturan Keamanan */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/20">
              <h3 className="font-bold">Keamanan Akun</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Kata Sandi Saat Ini</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">Konfirmasi Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="Ulangi kata sandi baru"
                    value={newPasswordConfirmation}
                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button
                  onClick={() => updatePasswordMutation.mutate()}
                  disabled={updatePasswordMutation.isPending || !currentPassword || !newPassword || newPassword !== newPasswordConfirmation}
                >
                  {updatePasswordMutation.isPending ? "Menyimpan..." : "Perbarui Kata Sandi"}
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
