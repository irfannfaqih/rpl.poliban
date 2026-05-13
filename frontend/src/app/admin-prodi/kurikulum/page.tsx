"use client";

import { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";

interface Cpmk {
  id: number;
  kode: string;
  deskripsi: string;
}

interface MataKuliah {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  deskripsi: string | null;
  cpmk_count: number;
  cpmk?: Cpmk[];
}

export default function KurikulumPage() {
  const [activeTab, setActiveTab] = useState("kurikulum");
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<MataKuliah[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<MataKuliah | null>(null);

  const formKode = useRef<HTMLInputElement>(null);
  const formNama = useRef<HTMLInputElement>(null);
  const formSks = useRef<HTMLInputElement>(null);
  const formDesk = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/admin-prodi/mata-kuliah', {
        params: searchTerm ? { search: searchTerm } : {},
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch kurikulum:', err);
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
  const handleOpenEdit = (item: MataKuliah) => { setEditTarget(item); setIsFormModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin-prodi/mata-kuliah/${deleteTarget}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const handleSave = async () => {
    const payload = {
      kode: formKode.current?.value || '',
      nama: formNama.current?.value || '',
      sks: Number(formSks.current?.value) || 3,
      deskripsi: formDesk.current?.value || null,
    };
    try {
      setSaving(true);
      if (editTarget) {
        await api.put(`/admin-prodi/mata-kuliah/${editTarget.id}`, payload);
      } else {
        await api.post('/admin-prodi/mata-kuliah', payload);
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
        <h1 className="text-xl font-bold tracking-tight text-foreground">Kurikulum & Matriks Asesmen</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola daftar mata kuliah RPL dan tentukan metode asesmen (C1-C11) untuk masing-masing mata kuliah.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="kurikulum" className="text-sm font-medium">Daftar Kurikulum</TabsTrigger>
          <TabsTrigger value="matriks" className="text-sm font-medium">Matriks Asesmen MK</TabsTrigger>
        </TabsList>
        
        {/* TAB 1: Daftar Kurikulum */}
        <TabsContent value="kurikulum" className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari kode atau nama mata kuliah..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" /> Tambah Mata Kuliah
            </Button>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Kode MK</th>
                    <th className="px-6 py-4 font-semibold">Mata Kuliah</th>
                    <th className="px-6 py-4 font-semibold text-center">SKS</th>
                    <th className="px-6 py-4 font-semibold text-center">Jml CPMK</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</td></tr>
                  ) : (
                    data.map((mk) => (
                      <tr key={mk.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-medium font-mono text-foreground">{mk.kode}</td>
                        <td className="px-6 py-4 font-medium">{mk.nama}</td>
                        <td className="px-6 py-4 tabular-nums text-center">{mk.sks}</td>
                        <td className="px-6 py-4 tabular-nums text-center">
                          <Badge variant="secondary" className="font-mono">{mk.cpmk_count}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Aktif</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(mk)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(mk.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
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
        </TabsContent>

        {/* TAB 2: Matriks Asesmen MK (Form 13) */}
        <TabsContent value="matriks" className="mt-6 space-y-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4">
            <BookOpen className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-blue-900">Petunjuk Matriks Asesmen</h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Pilih metode asesmen yang sesuai dengan karakteristik setiap Mata Kuliah. 
                Metode ini akan menjadi acuan bagi Asesor dalam menentukan jenis Uji Lanjutan.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Pemetaan Metode Asesmen</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Centang metode yang berlaku untuk tiap MK</p>
              </div>
              <Button size="sm" className="gap-2">
                <Save className="h-4 w-4" /> Simpan Matriks
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-muted-foreground bg-background border-b uppercase tracking-wider text-center">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-left w-64 border-r bg-muted/10">Mata Kuliah</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Sertifikat asosiasi nasional/ internasional">C1<br/>Sert</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Observasi langsung / kunjungan industri">C2<br/>Obsrv</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Ujian lisan / wawancara">C3<br/>Lisan</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Peragaan / praktik">C4<br/>Prak</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Penilaian terhadap pekerjaan">C5<br/>Nilai P.</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Review terhadap pekerjaan yang telah dilakukan">C6<br/>Review</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Tes tertulis">C7<br/>Tulis</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Pertanyaan tertulis pelamar">C8<br/>Prt Tls</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Lap tertulis dari supervisor">C9<br/>Lap SPV</th>
                    <th className="px-2 py-3 font-semibold border-r" title="Catatan harian pekerjaan (log book)">C10<br/>Log</th>
                    <th className="px-2 py-3 font-semibold" title="Bukti /Dokumen laporan pekerjaan">C11<br/>Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-center">
                  {loading ? (
                    <tr><td colSpan={12} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
                  ) : (
                    data.map((mk) => (
                      <tr key={mk.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 text-left border-r bg-muted/5">
                          <div className="font-medium text-foreground line-clamp-1" title={mk.nama}>{mk.nama}</div>
                          <div className="text-xs text-muted-foreground">{mk.kode} • {mk.sks} SKS</div>
                        </td>
                        {Array.from({ length: 11 }, (_, i) => (
                          <td key={i} className={`px-2 py-3 ${i < 10 ? 'border-r' : ''}`}>
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary" />
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-muted/10 border-t text-xs text-muted-foreground space-y-1">
              <p><strong>Legenda Metode Asesmen:</strong></p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                <div>C1: Sertifikat Asosiasi</div>
                <div>C2: Observasi Langsung</div>
                <div>C3: Ujian Lisan/Wawancara</div>
                <div>C4: Peragaan/Praktik</div>
                <div>C5: Penilaian Pekerjaan</div>
                <div>C6: Review Pekerjaan</div>
                <div>C7: Tes Tertulis</div>
                <div>C8: Pertanyaan Tertulis</div>
                <div>C9: Laporan Supervisor</div>
                <div>C10: Log Book Pekerjaan</div>
                <div>C11: Dokumen Portofolio</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-background rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">{editTarget ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}</h3>
              <p className="text-xs text-muted-foreground mt-1">Lengkapi informasi kurikulum.</p>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kode MK</label>
                <Input ref={formKode} defaultValue={editTarget?.kode || ""} placeholder="Contoh: TI123" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Mata Kuliah</label>
                <Input ref={formNama} defaultValue={editTarget?.nama || ""} placeholder="Contoh: Pemrograman Web" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bobot SKS</label>
                  <Input ref={formSks} type="number" defaultValue={editTarget?.sks || ""} placeholder="3" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deskripsi</label>
                  <Input ref={formDesk} defaultValue={editTarget?.deskripsi || ""} placeholder="Opsional" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>Batal</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Menyimpan...</> : 'Simpan Mata Kuliah'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Hapus Mata Kuliah
            </DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus mata kuliah ini dari kurikulum? Matriks asesmen terkait akan ikut terhapus.
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
