"use client";

import { useState, useEffect, useRef } from "react";
import { 
  CalendarDays, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2,
  Loader2,
  AlertCircle,
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

interface Gelombang {
  id: number;
  nama: string;
  tgl_buka: string;
  tgl_tutup: string;
  tgl_sanggah: string;
  biaya: string;
  status: string;
  status_dinamis: string;
}

export default function ManajemenGelombangPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Gelombang | null>(null);

  // Form refs
  const formNama = useRef<HTMLInputElement>(null);
  const formBuka = useRef<HTMLInputElement>(null);
  const formTutup = useRef<HTMLInputElement>(null);
  const formSanggah = useRef<HTMLInputElement>(null);
  const formBiaya = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data with React Query
  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['gelombang', debouncedSearch],
    queryFn: async () => {
      const { data: res } = await api.get('/super-admin/gelombang', {
        params: debouncedSearch ? { search: debouncedSearch } : {},
      });
      return res.data as Gelombang[];
    }
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/super-admin/gelombang/${id}`);
    },
    onSuccess: () => {
      toast.success('Gelombang berhasil dihapus');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['gelombang'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus gelombang');
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await api.put(`/super-admin/gelombang/${id}`, { status });
    },
    onSuccess: () => {
      toast.success('Status gelombang berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['gelombang'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editTarget) {
        await api.put(`/super-admin/gelombang/${editTarget.id}`, payload);
      } else {
        await api.post('/super-admin/gelombang', payload);
      }
    },
    onSuccess: () => {
      toast.success(`Gelombang berhasil ${editTarget ? 'diperbarui' : 'ditambahkan'}`);
      setIsFormModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['gelombang'] });
    },
    onError: (err: any) => {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach((e: any) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan');
      }
    }
  });

  const handleOpenAdd = () => {
    setEditTarget(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: Gelombang) => {
    setEditTarget(item);
    setIsFormModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
  };

  const handleStatusClick = (g: Gelombang) => {
    const current = g.status_dinamis;
    let nextStatus = '';
    if (current === 'aktif') nextStatus = 'selesai';
    else if (current === 'selesai') nextStatus = 'draft';
    else if (current === 'draft') nextStatus = 'aktif';
    changeStatusMutation.mutate({ id: g.id, status: nextStatus });
  };

  const handleSave = () => {
    saveMutation.mutate({
      nama: formNama.current?.value || '',
      tgl_buka: formBuka.current?.value || '',
      tgl_tutup: formTutup.current?.value || '',
      tgl_sanggah: formSanggah.current?.value || '',
      biaya: Number(formBiaya.current?.value) || 0,
      status: editTarget?.status || 'draft',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Manajemen Gelombang Pendaftaran</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Pengaturan tertinggi untuk membuka atau menutup keran pendaftaran RPL. Hanya satu gelombang yang dapat aktif dalam satu waktu.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari tahun ajaran..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
          <Plus className="h-4 w-4" />
          Buka Gelombang Baru
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Tahun Ajaran / Periode</th>
                <th className="px-6 py-4 font-semibold">Timeline Pendaftaran</th>
                <th className="px-6 py-4 font-semibold text-center">Batas Sanggah</th>
                <th className="px-6 py-4 font-semibold text-right">Biaya (Rp)</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                data.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{g.nama}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">ID: {g.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/50 text-xs font-bold">
                          {formatDate(g.tgl_buka)}
                        </div>
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">s/d</span>
                        <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-1 rounded border border-red-100 dark:border-red-900/50 text-xs font-bold">
                          {formatDate(g.tgl_tutup)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {formatDate(g.tgl_sanggah)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs">
                      {Number(g.biaya).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {g.status_dinamis === "aktif" ? (
                        <Badge 
                          className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent shadow-none gap-1 cursor-pointer"
                          onClick={() => handleStatusClick(g)}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Aktif
                        </Badge>
                      ) : g.status_dinamis === "selesai" ? (
                        <Badge 
                          variant="outline" 
                          className="text-slate-500 border-slate-200 dark:border-slate-800 cursor-pointer"
                          onClick={() => handleStatusClick(g)}
                        >
                          Selesai
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="bg-amber-50 text-amber-700 border-amber-200 cursor-pointer"
                          onClick={() => handleStatusClick(g)}
                        >
                          Draft
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(g)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(g.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
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
          <div className="bg-background rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">{editTarget ? 'Edit Konfigurasi Gelombang' : 'Konfigurasi Gelombang Baru'}</h3>
              <p className="text-xs text-muted-foreground mt-1">Ubah atau buat periode pendaftaran.</p>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama / Tahun Ajaran</label>
                <Input ref={formNama} defaultValue={editTarget?.nama || ""} placeholder="Contoh: Tahun Ajaran 2026/2027 Ganjil" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tgl Buka Pendaftaran</label>
                  <Input ref={formBuka} type="date" defaultValue={editTarget ? editTarget.tgl_buka.split('T')[0] : ""} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tgl Tutup Pendaftaran</label>
                  <Input ref={formTutup} type="date" defaultValue={editTarget ? editTarget.tgl_tutup.split('T')[0] : ""} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Batas Masa Sanggah</label>
                  <Input ref={formSanggah} type="date" defaultValue={editTarget ? editTarget.tgl_sanggah.split('T')[0] : ""} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Biaya Pendaftaran (Rp)</label>
                  <Input ref={formBiaya} type="number" defaultValue={editTarget?.biaya || ""} placeholder="2500000" />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900 flex gap-3 mt-4">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  <strong>Catatan Otomatisasi:</strong> Sistem akan otomatis menolak pendaftar baru jika tanggal hari ini melewati <strong>Tgl Tutup Pendaftaran</strong>. 
                  Sistem juga otomatis menutup akses Form RP-19 jika melewati <strong>Batas Masa Sanggah</strong>.
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setIsFormModalOpen(false)} disabled={saveMutation.isPending}>Batal</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
                {saveMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menyimpan...</> : 'Simpan Gelombang'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Konfirmasi Penghapusan
            </DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus data gelombang ini? Tindakan ini tidak dapat dibatalkan dan akan memengaruhi riwayat pendaftaran di dalam sistem.
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
