"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
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

interface Jurusan {
  id: number;
  nama_jurusan: string;
}

export default function ManajemenJurusanPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Jurusan | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const formNama = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['jurusan', debouncedSearch],
    queryFn: async () => {
      const { data: res } = await api.get('/super-admin/jurusan', {
        params: debouncedSearch ? { search: debouncedSearch } : {},
      });
      return res.data as Jurusan[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/super-admin/jurusan/${id}`);
    },
    onSuccess: () => {
      toast.success('Jurusan berhasil dihapus');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['jurusan'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus jurusan');
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editTarget) {
        await api.put(`/super-admin/jurusan/${editTarget.id}`, payload);
      } else {
        await api.post('/super-admin/jurusan', payload);
      }
    },
    onSuccess: () => {
      toast.success(`Jurusan berhasil ${editTarget ? 'diperbarui' : 'ditambahkan'}`);
      setIsFormModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['jurusan'] });
    },
    onError: (err: any) => {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || 'Gagal menyimpan jurusan');
      }
    }
  });

  const handleOpenAdd = () => { setEditTarget(null); setErrors({}); setIsFormModalOpen(true); };
  const handleOpenEdit = (item: Jurusan) => { setEditTarget(item); setErrors({}); setIsFormModalOpen(true); };

  const handleDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
  };

  const handleSave = () => {
    const payload = {
      nama_jurusan: formNama.current?.value || '',
    };

    const newErrors: Record<string, string[]> = {};
    if (!payload.nama_jurusan.trim()) newErrors.nama_jurusan = ["Nama Jurusan wajib diisi."];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveMutation.mutate(payload);
  };

  const filteredData = data.filter(j => j.nama_jurusan.toLowerCase().includes(debouncedSearch.toLowerCase()));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Manajemen Jurusan</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola daftar jurusan di institusi Anda.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama jurusan..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
          <Plus className="h-4 w-4" /> Tambah Jurusan
        </Button>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold w-16 text-center">ID</th>
                <th className="px-6 py-4 font-semibold">Nama Jurusan</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</td></tr>
              ) : (
                filteredData.map((j) => (
                  <tr key={j.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 text-center text-muted-foreground">{j.id}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{j.nama_jurusan}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(j)} className="h-8 gap-1.5"><Edit className="h-3.5 w-3.5" /> Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(j.id)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Jurusan" : "Tambah Jurusan"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Ubah nama jurusan." : "Masukkan nama jurusan baru."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Jurusan <span className="text-red-500">*</span></label>
              <Input ref={formNama} defaultValue={editTarget?.nama_jurusan} placeholder="e.g. Teknik Sipil" className={errors.nama_jurusan ? "border-red-500" : ""} />
              {errors.nama_jurusan && <p className="text-[10px] text-red-500">{errors.nama_jurusan[0]}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(val) => !val && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2"><Trash2 className="h-5 w-5" /> Hapus Jurusan</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Jurusan akan dihapus secara permanen dari sistem.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
