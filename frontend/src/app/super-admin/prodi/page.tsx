"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";

type ApiError = { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };

const getApiError = (error: unknown): ApiError => error as ApiError;

interface ProdiFormPayload {
  kode: string;
  nama: string;
  jurusan_id: number | null;
  jenjang: string;
  koordinator_prodi_nama: string | null;
  koordinator_prodi_nip: string | null;
}

interface Prodi {
  id: number;
  kode: string;
  nama: string;
  jenjang: string;
  jurusan: string;
  jurusan_id: number;
  jurusan_data?: { id: number; nama_jurusan: string };
  koordinator_prodi_nama?: string | null;
  koordinator_prodi_nip?: string | null;
  status: string;
  pendaftaran_count: number;
}

export default function ManajemenProdiPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Prodi | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const formKode = useRef<HTMLInputElement>(null);
  const formNama = useRef<HTMLInputElement>(null);
  const formJurusan = useRef<HTMLSelectElement>(null);
  const formJenjang = useRef<HTMLSelectElement>(null);
  const formKoordinatorNama = useRef<HTMLInputElement>(null);
  const formKoordinatorNip = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Data with React Query
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['prodi', debouncedSearch],
    queryFn: async () => {
      const { data: res } = await api.get('/super-admin/prodi', {
        params: debouncedSearch ? { search: debouncedSearch } : {},
      });
      return res.data as Prodi[];
    }
  });

  const { data: jurusans = [] } = useQuery({
    queryKey: ['jurusans'],
    queryFn: async () => {
      const { data: res } = await api.get('/super-admin/jurusan');
      return res.data as { id: number; nama_jurusan: string }[];
    }
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/super-admin/prodi/${id}`);
    },
    onSuccess: () => {
      toast.success('Prodi berhasil dihapus');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['prodi'] });
    },
    onError: (error: unknown) => {
      const err = getApiError(error);
      toast.error(err.response?.data?.message || 'Gagal menghapus prodi');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/super-admin/prodi/${id}/toggle-status`);
    },
    onSuccess: () => {
      toast.success('Status prodi berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['prodi'] });
    },
    onError: (error: unknown) => {
      const err = getApiError(error);
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ProdiFormPayload) => {
      if (editTarget) {
        await api.put(`/super-admin/prodi/${editTarget.id}`, payload);
      } else {
        await api.post('/super-admin/prodi', payload);
      }
    },
    onSuccess: () => {
      toast.success(`Prodi berhasil ${editTarget ? 'diperbarui' : 'ditambahkan'}`);
      setIsFormModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['prodi'] });
    },
    onError: (error: unknown) => {
      const err = getApiError(error);
      if (err.response?.status === 422) {
        setErrors(err.response?.data?.errors || {});
      } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan prodi');
      }
    }
  });

  const handleOpenAdd = () => { setEditTarget(null); setErrors({}); setIsFormModalOpen(true); };
  const handleOpenEdit = (item: Prodi) => { setEditTarget(item); setErrors({}); setIsFormModalOpen(true); };

  const handleDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
  };

  const handleToggleStatus = (item: Prodi) => {
    toggleStatusMutation.mutate(item.id);
  };

  const handleSave = () => {
    const payload = {
      kode: formKode.current?.value || '',
      nama: formNama.current?.value || '',
      jurusan_id: formJurusan.current?.value ? parseInt(formJurusan.current.value) : null,
      jenjang: formJenjang.current?.value || 'D3',
      koordinator_prodi_nama: formKoordinatorNama.current?.value || null,
      koordinator_prodi_nip: formKoordinatorNip.current?.value || null,
    };

    const newErrors: Record<string, string[]> = {};
    if (!payload.kode.trim()) newErrors.kode = ["Kode Prodi wajib diisi."];
    if (!payload.nama.trim()) newErrors.nama = ["Nama Program Studi wajib diisi."];
    if (!payload.jurusan_id) newErrors.jurusan_id = ["Jurusan wajib dipilih."];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveMutation.mutate(payload);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Manajemen Program Studi</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola daftar program studi yang membuka jalur pendaftaran RPL di institusi Anda.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari kode atau nama prodi..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
          <Plus className="h-4 w-4" /> Tambah Prodi
        </Button>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Kode Prodi</th>
                <th className="px-6 py-4 font-semibold">Nama Program Studi</th>
                <th className="px-6 py-4 font-semibold">Jurusan</th>
                <th className="px-6 py-4 font-semibold">Koordinator Prodi</th>
                <th className="px-6 py-4 font-semibold text-center">Jenjang</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Pendaftar</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</td></tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-foreground">{p.kode}</td>
                    <td className="px-6 py-4 font-medium">{p.nama}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.jurusan_data?.nama_jurusan || p.jurusan}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{p.koordinator_prodi_nama || "-"}</div>
                      <div className="text-xs">NIP {p.koordinator_prodi_nip || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="secondary" className="font-mono">{p.jenjang}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.status === "aktif" ? (
                        <Badge 
                          className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent shadow-none gap-1 cursor-pointer"
                          onClick={() => handleToggleStatus(p)}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Aktif
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="text-red-600 border-red-200 dark:border-red-900/50 gap-1 bg-red-50 dark:bg-red-950/20 cursor-pointer"
                          onClick={() => handleToggleStatus(p)}
                        >
                          <XCircle className="h-3 w-3" /> Nonaktif
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="secondary" className="font-mono">{p.pendaftaran_count}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button onClick={() => handleOpenEdit(p)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => setDeleteTarget(p.id)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={p.pendaftaran_count > 0}>
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
              <h3 className="font-bold text-lg">{editTarget ? 'Edit Program Studi' : 'Tambah Program Studi'}</h3>
              <p className="text-xs text-muted-foreground mt-1">{editTarget ? 'Ubah informasi program studi.' : 'Daftarkan prodi baru yang akan membuka jalur RPL.'}</p>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${errors.kode ? 'text-red-500' : 'text-muted-foreground'}`}>Kode Prodi</label>
                  <Input 
                    ref={formKode} 
                    defaultValue={editTarget?.kode || ""} 
                    placeholder="TI-D3" 
                    className={errors.kode ? "border-red-500 focus-visible:ring-red-500" : ""}
                    onChange={() => setErrors(prev => ({ ...prev, kode: [] }))}
                  />
                  {errors.kode && errors.kode.length > 0 && <p className="text-[10px] text-red-500">{errors.kode[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${errors.jenjang ? 'text-red-500' : 'text-muted-foreground'}`}>Jenjang</label>
                  <select 
                    ref={formJenjang} 
                    defaultValue={editTarget?.jenjang || "D3"} 
                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${errors.jenjang ? 'border-red-500 focus:ring-red-500' : 'border-input focus:ring-ring'}`}
                    onChange={() => setErrors(prev => ({ ...prev, jenjang: [] }))}
                  >
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                  </select>
                  {errors.jenjang && errors.jenjang.length > 0 && <p className="text-[10px] text-red-500">{errors.jenjang[0]}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${errors.nama ? 'text-red-500' : 'text-muted-foreground'}`}>Nama Program Studi</label>
                <Input 
                  ref={formNama} 
                  defaultValue={editTarget?.nama || ""} 
                  placeholder="Teknik Informatika" 
                  className={errors.nama ? "border-red-500 focus-visible:ring-red-500" : ""}
                  onChange={() => setErrors(prev => ({ ...prev, nama: [] }))}
                />
                {errors.nama && errors.nama.length > 0 && <p className="text-[10px] text-red-500">{errors.nama[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${errors.jurusan_id ? 'text-red-500' : 'text-muted-foreground'}`}>Jurusan <span className="text-red-500">*</span></label>
                <select 
                  ref={formJurusan} 
                  defaultValue={editTarget?.jurusan_id || ""} 
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.jurusan_id ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  onChange={() => setErrors(prev => ({ ...prev, jurusan_id: [] }))}
                >
                  <option value="" disabled>Pilih Jurusan...</option>
                  {jurusans.map(j => (
                    <option key={j.id} value={j.id}>{j.nama_jurusan}</option>
                  ))}
                </select>
                {errors.jurusan_id && errors.jurusan_id.length > 0 && <p className="text-[10px] text-red-500">{errors.jurusan_id[0]}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${errors.koordinator_prodi_nama ? 'text-red-500' : 'text-muted-foreground'}`}>Nama Koordinator Prodi</label>
                  <Input
                    ref={formKoordinatorNama}
                    defaultValue={editTarget?.koordinator_prodi_nama || ""}
                    placeholder="Nama lengkap Koordinator Prodi"
                    className={errors.koordinator_prodi_nama ? "border-red-500 focus-visible:ring-red-500" : ""}
                    onChange={() => setErrors(prev => ({ ...prev, koordinator_prodi_nama: [] }))}
                  />
                  {errors.koordinator_prodi_nama && errors.koordinator_prodi_nama.length > 0 && <p className="text-[10px] text-red-500">{errors.koordinator_prodi_nama[0]}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ${errors.koordinator_prodi_nip ? 'text-red-500' : 'text-muted-foreground'}`}>NIP Koordinator Prodi</label>
                  <Input
                    ref={formKoordinatorNip}
                    defaultValue={editTarget?.koordinator_prodi_nip || ""}
                    placeholder="NIP Koordinator Prodi"
                    className={errors.koordinator_prodi_nip ? "border-red-500 focus-visible:ring-red-500" : ""}
                    onChange={() => setErrors(prev => ({ ...prev, koordinator_prodi_nip: [] }))}
                  />
                  {errors.koordinator_prodi_nip && errors.koordinator_prodi_nip.length > 0 && <p className="text-[10px] text-red-500">{errors.koordinator_prodi_nip[0]}</p>}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={saveMutation.isPending}>Batal</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
                {saveMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menyimpan...</> : 'Simpan Prodi'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Konfirmasi Penghapusan
            </DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus data prodi ini? Semua data pendaftar dan kurikulum terkait akan ikut terpengaruh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-red-600 text-white hover:bg-red-700">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ya, Hapus Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
