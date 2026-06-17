"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit,
  KeyRound,
  UserX,
  UserCheck,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";

interface UserData {
  id: number;
  nama: string;
  email: string;
  nip: string | null;
  role: string;
  prodi: { id: number; kode: string; nama: string } | null;
  jabatan: string | null;
  phone: string | null;
  status: string;
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin_prodi: "Admin Prodi",
  asesor: "Asesor",
  pimpinan: "Pimpinan",
  pemohon: "Pemohon",
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-red-50 text-red-700 border-red-200",
  admin_prodi: "bg-purple-50 text-purple-700 border-purple-200",
  asesor: "bg-blue-50 text-blue-700 border-blue-200",
  pimpinan: "bg-amber-50 text-amber-700 border-amber-200",
  pemohon: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function ManajemenPenggunaPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<UserData | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Form refs
  const fNama = useRef<HTMLInputElement>(null);
  const fEmail = useRef<HTMLInputElement>(null);
  const fNip = useRef<HTMLInputElement>(null);
  const fPassword = useRef<HTMLInputElement>(null);
  const fPhone = useRef<HTMLInputElement>(null);
  const [fRole, setFRole] = useState("asesor");
  const [fProdiId, setFProdiId] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: prodiList = [] } = useQuery({
    queryKey: ["prodi"],
    queryFn: async () => {
      const { data: res } = await api.get("/super-admin/prodi");
      return res.data.map((p: any) => ({
        id: p.id,
        kode: p.kode,
        nama: p.nama,
      }));
    },
  });

  const { data = [], isLoading: loading } = useQuery({
    queryKey: ["pengguna", debouncedSearch, roleFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== "all") params.role = roleFilter;
      const { data: res } = await api.get("/super-admin/pengguna", { params });
      return res.data as UserData[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/super-admin/pengguna/${id}`);
    },
    onSuccess: () => {
      toast.success("Pengguna berhasil dihapus");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["pengguna"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data: res } = await api.patch(
        `/super-admin/pengguna/${id}/reset-password`,
      );
      return res.message;
    },
    onSuccess: (message) => {
      toast.success(message || "Tautan reset password berhasil dikirim");
      setResetTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal reset password");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/super-admin/pengguna/${id}/toggle-status`);
    },
    onSuccess: () => {
      toast.success("Status berhasil diubah");
      queryClient.invalidateQueries({ queryKey: ["pengguna"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengubah status");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editTarget) {
        await api.put(`/super-admin/pengguna/${editTarget.id}`, payload);
      } else {
        await api.post("/super-admin/pengguna", payload);
      }
    },
    onSuccess: () => {
      toast.success(
        `Pengguna berhasil ${editTarget ? "diperbarui" : "ditambahkan"}`,
      );
      setIsFormModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pengguna"] });
    },
    onError: (err: any) => {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || "Gagal menyimpan");
      }
    },
  });

  const handleOpenAdd = () => {
    setEditTarget(null);
    setFRole("asesor");
    setFProdiId("");
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: UserData) => {
    setEditTarget(item);
    setFRole(item.role);
    setFProdiId(item.prodi?.id?.toString() || "");
    setErrors({});
    setIsFormModalOpen(true);
  };

  const handleSave = () => {
    const rawNip = fNip.current?.value.trim() || "";
    const payload: any = {
      nama: fNama.current?.value || "",
      email: fEmail.current?.value || "",
      nip: rawNip && rawNip !== "-" ? rawNip : null,
      role: fRole,
      prodi_id: fProdiId && fProdiId !== "none" ? Number(fProdiId) : null,
      phone: fPhone.current?.value || null,
    };

    if (!editTarget) {
      payload.password = fPassword.current?.value || "";
    }

    const newErrors: Record<string, string[]> = {};
    if (!payload.nama.trim()) newErrors.nama = ["Nama Lengkap wajib diisi."];
    if (!payload.email.trim()) newErrors.email = ["Email wajib diisi."];
    if (!payload.role) newErrors.role = ["Role wajib dipilih."];
    if (!editTarget && !payload.password.trim())
      newErrors.password = ["Password wajib diisi untuk pengguna baru."];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
  };

  const handleResetPassword = () => {
    if (resetTarget) resetPasswordMutation.mutate(resetTarget);
  };

  const handleToggleStatus = (user: UserData) => {
    toggleStatusMutation.mutate(user.id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Manajemen Pengguna
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola akun staf Asesor dan Admin Prodi. Fitur ini eksklusif untuk
          Super Admin IT.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex w-full sm:w-auto gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau email..."
              className="pl-9 bg-background h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(val) => setRoleFilter(val || "all")}
          >
            <SelectTrigger className="w-[180px] bg-background h-10">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="asesor">Asesor</SelectItem>
              <SelectItem value="admin_prodi">Admin Prodi</SelectItem>
              <SelectItem value="pimpinan">Pimpinan</SelectItem>
              <SelectItem value="pemohon">Pemohon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground h-10"
        >
          <Plus className="h-4 w-4" /> Tambah Akun Staf
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Profil Staf</th>
                <th className="px-6 py-4 font-semibold">Kontak</th>
                <th className="px-6 py-4 font-semibold">Role & Prodi</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">
                  Aksi Super
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{u.nama}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {u.nip ? `NIP: ${u.nip}` : `ID: ${u.id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={ROLE_COLOR[u.role] || ""}
                        >
                          {ROLE_LABEL[u.role] || u.role}
                        </Badge>
                        {u.prodi && (
                          <span className="text-xs text-muted-foreground">
                            {u.prodi.nama}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.status === "aktif" ? (
                        <Badge
                          className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent shadow-none gap-1 cursor-pointer"
                          onClick={() => handleToggleStatus(u)}
                        >
                          <UserCheck className="h-3 w-3" /> Aktif
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-red-600 border-red-200 gap-1 bg-red-50 cursor-pointer"
                          onClick={() => handleToggleStatus(u)}
                        >
                          <UserX className="h-3 w-3" /> Nonaktif
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResetTarget(u.id)}
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Reset Password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Edit Data"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(u.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Hapus Akun"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-background rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">
                {editTarget ? "Edit Akun Staf" : "Registrasi Akun Staf"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Buat akun untuk Asesor atau Admin Prodi.
              </p>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${errors.nip && errors.nip.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  NIP
                </label>
                <Input
                  ref={fNip}
                  defaultValue={editTarget?.nip || ""}
                  placeholder="Kosongkan jika belum memiliki NIP"
                  maxLength={18}
                  className={
                    errors.nip && errors.nip.length > 0
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={() =>
                    setErrors((prev) => {
                      const e = { ...prev };
                      delete e.nip;
                      return e;
                    })
                  }
                />
                {errors.nip && errors.nip.length > 0 && (
                  <p className="text-[10px] text-red-500">{errors.nip[0]}</p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Biarkan kosong jika pengguna belum memiliki NIP. Jangan isi dengan tanda "-".
                </p>
              </div>
              <div className="space-y-1.5">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${errors.nama && errors.nama.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  Nama Lengkap
                </label>
                <Input
                  ref={fNama}
                  defaultValue={editTarget?.nama || ""}
                  placeholder="Dr. Budi Santoso"
                  className={
                    errors.nama && errors.nama.length > 0
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={() =>
                    setErrors((prev) => {
                      const e = { ...prev };
                      delete e.nama;
                      return e;
                    })
                  }
                />
                {errors.nama && errors.nama.length > 0 && (
                  <p className="text-[10px] text-red-500">{errors.nama[0]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${errors.email && errors.email.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  Email
                </label>
                <Input
                  ref={fEmail}
                  type="email"
                  defaultValue={editTarget?.email || ""}
                  placeholder="budi@poliban.ac.id"
                  className={
                    errors.email && errors.email.length > 0
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={() =>
                    setErrors((prev) => {
                      const e = { ...prev };
                      delete e.email;
                      return e;
                    })
                  }
                />
                {errors.email && errors.email.length > 0 && (
                  <p className="text-[10px] text-red-500">{errors.email[0]}</p>
                )}
              </div>
              {!editTarget && (
                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.password && errors.password.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    Password Awal
                  </label>
                  <Input
                    ref={fPassword}
                    type="password"
                    placeholder="Min. 8 karakter"
                    className={
                      errors.password && errors.password.length > 0
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                    onChange={() =>
                      setErrors((prev) => {
                        const e = { ...prev };
                        delete e.password;
                        return e;
                      })
                    }
                  />
                  {errors.password && errors.password.length > 0 && (
                    <p className="text-[10px] text-red-500">
                      {errors.password[0]}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${errors.phone && errors.phone.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
                >
                  No. HP
                </label>
                <Input
                  ref={fPhone}
                  defaultValue={editTarget?.phone || ""}
                  placeholder="08xxxxxxxxx"
                  maxLength={15}
                  className={
                    errors.phone && errors.phone.length > 0
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={() =>
                    setErrors((prev) => {
                      const e = { ...prev };
                      delete e.phone;
                      return e;
                    })
                  }
                />
                {errors.phone && errors.phone.length > 0 && (
                  <p className="text-[10px] text-red-500">{errors.phone[0]}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.role && errors.role.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    Role
                  </label>
                  <Select
                    value={fRole}
                    onValueChange={(val) => {
                      setFRole(val || "");
                      setErrors((prev) => {
                        const e = { ...prev };
                        delete e.role;
                        return e;
                      });
                    }}
                  >
                    <SelectTrigger
                      className={`bg-background ${errors.role && errors.role.length > 0 ? "border-red-500 focus:ring-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Pilih Role">
                        {ROLE_LABEL[fRole]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asesor">Asesor</SelectItem>
                      <SelectItem value="admin_prodi">Admin Prodi</SelectItem>
                      <SelectItem value="pimpinan">Pimpinan</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && errors.role.length > 0 && (
                    <p className="text-[10px] text-red-500">{errors.role[0]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.prodi_id && errors.prodi_id.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    Prodi
                  </label>
                  <Select
                    value={fProdiId}
                    onValueChange={(val) => {
                      setFProdiId(val || "none");
                      setErrors((prev) => {
                        const e = { ...prev };
                        delete e.prodi_id;
                        return e;
                      });
                    }}
                  >
                    <SelectTrigger
                      className={`bg-background ${errors.prodi_id && errors.prodi_id.length > 0 ? "border-red-500 focus:ring-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Pilih Prodi">
                        {fProdiId && fProdiId !== "none"
                          ? prodiList.find(
                              (p: any) => p.id.toString() === fProdiId,
                            )?.nama
                          : "Tanpa Prodi"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Prodi</SelectItem>
                      {prodiList.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.prodi_id && errors.prodi_id.length > 0 && (
                    <p className="text-[10px] text-red-500">
                      {errors.prodi_id[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsFormModalOpen(false)}
                disabled={saveMutation.isPending}
              >
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : editTarget ? (
                  "Simpan Perubahan"
                ) : (
                  "Buat Akun"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Hapus Akun Staf
            </DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus akun staf ini?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ya, Hapus Akun"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <KeyRound className="h-5 w-5" /> Reset Password
            </DialogTitle>
            <DialogDescription className="pt-2">
              Kirim tautan reset sekali pakai ke email pengguna? Password saat
              ini tetap berlaku sampai pengguna menyelesaikan proses reset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setResetTarget(null)}
              disabled={resetPasswordMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ya, Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
