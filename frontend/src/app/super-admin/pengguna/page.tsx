"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  ShieldAlert, 
  KeyRound,
  UserX,
  UserCheck,
  AlertCircle,
  Trash2,
  Loader2
} from "lucide-react";
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
  super_admin: 'Super Admin',
  admin_prodi: 'Admin Prodi',
  asesor: 'Asesor',
  pimpinan: 'Pimpinan',
  pemohon: 'Pemohon',
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: 'bg-red-50 text-red-700 border-red-200',
  admin_prodi: 'bg-purple-50 text-purple-700 border-purple-200',
  asesor: 'bg-blue-50 text-blue-700 border-blue-200',
  pimpinan: 'bg-amber-50 text-amber-700 border-amber-200',
  pemohon: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function ManajemenPenggunaPage() {
  const [data, setData] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<UserData | null>(null);
  const [tempPw, setTempPw] = useState<string | null>(null);

  // Form refs
  const fNama = useRef<HTMLInputElement>(null);
  const fEmail = useRef<HTMLInputElement>(null);
  const fNip = useRef<HTMLInputElement>(null);
  const fPassword = useRef<HTMLInputElement>(null);
  const fPhone = useRef<HTMLInputElement>(null);
  const [fRole, setFRole] = useState("asesor");
  const [fProdiId, setFProdiId] = useState("");
  const [prodiList, setProdiList] = useState<{id: number; kode: string; nama: string}[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter !== 'all') params.role = roleFilter;
      const { data: res } = await api.get('/super-admin/pengguna', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProdi = async () => {
    try {
      const { data: res } = await api.get('/super-admin/prodi');
      setProdiList(res.data.map((p: any) => ({ id: p.id, kode: p.kode, nama: p.nama })));
    } catch {}
  };

  useEffect(() => { fetchData(); fetchProdi(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter]);

  const handleOpenAdd = () => {
    setEditTarget(null);
    setFRole("asesor");
    setFProdiId("");
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: UserData) => {
    setEditTarget(item);
    setFRole(item.role);
    setFProdiId(item.prodi?.id?.toString() || "");
    setIsFormModalOpen(true);
  };

  const handleSave = async () => {
    const payload: any = {
      nama: fNama.current?.value || '',
      email: fEmail.current?.value || '',
      nip: fNip.current?.value || null,
      role: fRole,
      prodi_id: fProdiId ? Number(fProdiId) : null,
      phone: fPhone.current?.value || null,
    };
    if (!editTarget) {
      payload.password = fPassword.current?.value || '';
    }

    try {
      setSaving(true);
      if (editTarget) {
        await api.put(`/super-admin/pengguna/${editTarget.id}`, payload);
      } else {
        await api.post('/super-admin/pengguna', payload);
      }
      setIsFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) alert(Object.values(errors).flat().join('\n'));
      else alert(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/super-admin/pengguna/${deleteTarget}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const { data: res } = await api.patch(`/super-admin/pengguna/${resetTarget}/reset-password`);
      setTempPw(res.temp_password);
      setResetTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal reset password');
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    try {
      await api.patch(`/super-admin/pengguna/${user.id}/toggle-status`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Manajemen Pengguna (Staf)</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola akun staf Asesor dan Admin Prodi. Fitur ini eksklusif untuk Super Admin IT.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex w-full sm:w-auto gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari nama atau email..." className="pl-9 bg-background h-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
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
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground h-10">
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
                <th className="px-6 py-4 font-semibold text-right">Aksi Super</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</td></tr>
              ) : (
                data.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{u.nama}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{u.nip ? `NIP: ${u.nip}` : `ID: ${u.id}`}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={ROLE_COLOR[u.role] || ''}>
                          {ROLE_LABEL[u.role] || u.role}
                        </Badge>
                        {u.prodi && <span className="text-xs font-mono text-muted-foreground">{u.prodi.kode}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.status === "aktif" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent shadow-none gap-1 cursor-pointer" onClick={() => handleToggleStatus(u)}>
                          <UserCheck className="h-3 w-3" /> Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 gap-1 bg-red-50 cursor-pointer" onClick={() => handleToggleStatus(u)}>
                          <UserX className="h-3 w-3" /> Nonaktif
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setResetTarget(u.id)} className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Reset Password">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(u)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Edit Data">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Hapus Akun">
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
              <h3 className="font-bold text-lg">{editTarget ? 'Edit Akun Staf' : 'Registrasi Akun Staf'}</h3>
              <p className="text-xs text-muted-foreground mt-1">Buat akun untuk Asesor atau Admin Prodi.</p>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">NIP</label>
                <Input ref={fNip} defaultValue={editTarget?.nip || ""} placeholder="198001012005011001" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Lengkap</label>
                <Input ref={fNama} defaultValue={editTarget?.nama || ""} placeholder="Dr. Budi Santoso" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                <Input ref={fEmail} type="email" defaultValue={editTarget?.email || ""} placeholder="budi@poliban.ac.id" />
              </div>
              {!editTarget && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password Awal</label>
                  <Input ref={fPassword} type="password" placeholder="Min. 8 karakter" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No. HP</label>
                <Input ref={fPhone} defaultValue={editTarget?.phone || ""} placeholder="08xxxxxxxxx" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</label>
                  <Select value={fRole} onValueChange={setFRole}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asesor">Asesor</SelectItem>
                      <SelectItem value="admin_prodi">Admin Prodi</SelectItem>
                      <SelectItem value="pimpinan">Pimpinan</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prodi</label>
                  <Select value={fProdiId} onValueChange={setFProdiId}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Pilih Prodi" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Prodi</SelectItem>
                      {prodiList.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.kode} - {p.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menyimpan...</> : editTarget ? 'Simpan Perubahan' : 'Buat Akun'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Temp Password Dialog */}
      <Dialog open={!!tempPw} onOpenChange={() => setTempPw(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600"><KeyRound className="h-5 w-5" /> Password Berhasil Direset</DialogTitle>
            <DialogDescription className="pt-2">
              Password sementara: <code className="bg-muted px-2 py-1 rounded font-bold text-foreground">{tempPw}</code>
              <br />Harap informasikan ke pengguna untuk segera mengganti password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => setTempPw(null)}>Tutup</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="h-5 w-5" /> Hapus Akun Staf</DialogTitle>
            <DialogDescription className="pt-2">Apakah Anda yakin ingin menghapus akun staf ini?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">Ya, Hapus Akun</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600"><KeyRound className="h-5 w-5" /> Reset Password</DialogTitle>
            <DialogDescription className="pt-2">Apakah Anda yakin ingin reset password? Password sementara akan di-generate.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setResetTarget(null)}>Batal</Button>
            <Button onClick={handleResetPassword} className="bg-amber-600 text-white hover:bg-amber-700">Ya, Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
