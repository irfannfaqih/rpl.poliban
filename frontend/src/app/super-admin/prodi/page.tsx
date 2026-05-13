"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2,
  XCircle,
  Power,
  AlertCircle,
  Loader2
} from "lucide-react";
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

interface Prodi {
  id: number;
  kode: string;
  nama: string;
  jenjang: string;
  jurusan: string;
  status: string;
  pendaftaran_count: number;
}

export default function ManajemenProdiPage() {
  const [data, setData] = useState<Prodi[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Prodi | null>(null);

  const formKode = useRef<HTMLInputElement>(null);
  const formNama = useRef<HTMLInputElement>(null);
  const formJurusan = useRef<HTMLInputElement>(null);
  const formJenjang = useRef<HTMLSelectElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/super-admin/prodi', {
        params: searchTerm ? { search: searchTerm } : {},
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch prodi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleOpenAdd = () => { setEditTarget(null); setIsFormModalOpen(true); };
  const handleOpenEdit = (item: Prodi) => { setEditTarget(item); setIsFormModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/super-admin/prodi/${deleteTarget}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus prodi');
    }
  };

  const handleToggleStatus = async (item: Prodi) => {
    try {
      await api.patch(`/super-admin/prodi/${item.id}/toggle-status`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleSave = async () => {
    const payload = {
      kode: formKode.current?.value || '',
      nama: formNama.current?.value || '',
      jurusan: formJurusan.current?.value || '',
      jenjang: formJenjang.current?.value || 'D3',
    };
    try {
      setSaving(true);
      if (editTarget) {
        await api.put(`/super-admin/prodi/${editTarget.id}`, payload);
      } else {
        await api.post('/super-admin/prodi', payload);
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
                <th className="px-6 py-4 font-semibold text-center">Jenjang</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Pendaftar</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</td></tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-foreground">{p.kode}</td>
                    <td className="px-6 py-4 font-medium">{p.nama}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.jurusan}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="secondary" className="font-mono">{p.jenjang}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.status === "aktif" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent shadow-none gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 dark:border-red-900/50 gap-1 bg-red-50 dark:bg-red-950/20">
                          <XCircle className="h-3 w-3" /> Nonaktif
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="secondary" className="font-mono">{p.pendaftaran_count}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button onClick={() => handleToggleStatus(p)} variant="ghost" size="icon" className={`h-8 w-8 ${p.status === 'aktif' ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`} title={p.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}>
                          <Power className="h-4 w-4" />
                        </Button>
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
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kode Prodi</label>
                  <Input ref={formKode} defaultValue={editTarget?.kode || ""} placeholder="TI-D3" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jenjang</label>
                  <select ref={formJenjang} defaultValue={editTarget?.jenjang || "D3"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Program Studi</label>
                <Input ref={formNama} defaultValue={editTarget?.nama || ""} placeholder="Teknik Informatika" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jurusan</label>
                <Input ref={formJurusan} defaultValue={editTarget?.jurusan || ""} placeholder="Teknik Elektro" />
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menyimpan...</> : 'Simpan Prodi'}
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">Ya, Hapus Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
