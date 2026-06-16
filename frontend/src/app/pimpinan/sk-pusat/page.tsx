"use client";

import { useState } from "react";
import { 
  FileBadge, 
  Search, 
  CheckCircle2, 
  XCircle,
  FileText,
  Stamp,
  Filter,
  Loader2,
  AlertCircle
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function PenerbitanSKPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [nomorSkInput, setNomorSkInput] = useState("");

  const { data: skList = [], isLoading, error } = useQuery({
    queryKey: ["pimpinan-sk-list", statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const { data } = await api.get("/pimpinan/sk", { params });
      return data.data || [];
    }
  });

  const filteredKandidat = skList.filter((k: any) => {
    const nama = k.pendaftaran?.user?.nama || "";
    const regNo = k.pendaftaran?.nomor_pendaftaran || "";
    const matchSearch = nama.toLowerCase().includes(searchTerm.toLowerCase()) || regNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const waitingCount = skList.filter((k: any) => k.status === "menunggu_sk").length;
  const publishedCount = skList.filter((k: any) => k.status === "sk_terbit").length;

  const toggleSelectAll = () => {
    const listWaiting = filteredKandidat.filter((k: any) => k.status === "menunggu_sk");
    if (selectedIds.length === listWaiting.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listWaiting.map((k: any) => k.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!nomorSkInput.trim()) {
        throw new Error("Nomor SK wajib diisi!");
      }
      for (const skId of selectedIds) {
        await api.post(`/pimpinan/sk/${skId}/terbitkan`, {
          nomor_sk: nomorSkInput
        });
      }
    },
    onSuccess: () => {
      toast.success(`Berhasil menerbitkan SK untuk ${selectedIds.length} mahasiswa!`);
      setSelectedIds([]);
      setNomorSkInput("");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["pimpinan-sk-list"] });
      queryClient.invalidateQueries({ queryKey: ["pimpinan-dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.message || "Gagal menerbitkan SK");
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground animate-pulse">Memuat daftar SK keputusan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold">Gagal Memuat Data</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Terjadi kesalahan saat mengambil list SK keputusan dari server. Silakan coba kembali.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Penerbitan Surat Keputusan (SK) Pusat</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Daftar rekapitulasi akhir mahasiswa yang telah lolos Sidang Pleno di tingkat Prodi. Sahkan dan terbitkan SK Pengakuan SKS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900 p-4 flex items-center justify-between">
            <div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">Siap Diterbitkan</div>
              <div className="text-3xl font-black text-emerald-800 dark:text-emerald-500 mt-1">{waitingCount}</div>
            </div>
            <Stamp className="h-10 w-10 text-emerald-200 dark:text-emerald-800" />
         </div>
         <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900 p-4 flex items-center justify-between">
            <div>
              <div className="text-blue-700 dark:text-blue-400 font-bold text-sm">SK Telah Terbit</div>
              <div className="text-3xl font-black text-blue-800 dark:text-blue-500 mt-1">
                {publishedCount}
              </div>
            </div>
            <FileBadge className="h-10 w-10 text-blue-200 dark:text-blue-800" />
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari pemohon..." 
              className="pl-9 bg-background h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => {
            setStatusFilter(val || "all");
            setSelectedIds([]);
          }}>
            <SelectTrigger className="w-[180px] bg-background h-10">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status SK" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="menunggu_sk">Menunggu SK</SelectItem>
              <SelectItem value="sk_terbit">SK Terbit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          disabled={selectedIds.length === 0}
          onClick={() => {
            setNomorSkInput("");
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto gap-2 bg-emerald-600 text-white hover:bg-emerald-700 h-10 shadow-md font-bold"
        >
          <Stamp className="h-4 w-4" />
          Terbitkan SK Massal ({selectedIds.length})
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    onChange={toggleSelectAll}
                    checked={filteredKandidat.filter((k: any) => k.status === "menunggu_sk").length > 0 && selectedIds.length === filteredKandidat.filter((k: any) => k.status === "menunggu_sk").length}
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Nama Pemohon</th>
                <th className="px-6 py-4 font-semibold">Prodi Tujuan</th>
                <th className="px-6 py-4 font-semibold text-center">SKS Diakui</th>
                <th className="px-6 py-4 font-semibold text-center">Status Keputusan</th>
                <th className="px-6 py-4 font-semibold text-right">No. SK / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredKandidat.map((k: any) => (
                <tr key={k.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      checked={selectedIds.includes(k.id)}
                      onChange={() => toggleSelect(k.id)}
                      disabled={k.status !== "menunggu_sk"}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{k.pendaftaran?.user?.nama || "Tidak Ditemukan"}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{k.pendaftaran?.nomor_pendaftaran || `RPL-${k.pendaftaran_id}`}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                    {k.pendaftaran?.prodi?.nama || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-500">{k.total_sks_diakui}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {k.status === "menunggu_sk" ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-transparent shadow-none gap-1">
                        <Stamp className="h-3 w-3" /> Siap Disahkan
                      </Badge>
                    ) : k.status === "sk_terbit" ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> SK Terbit
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1">
                        <XCircle className="h-3 w-3" /> Ditolak
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {k.status === "sk_terbit" ? (
                      <span className="text-xs font-mono font-bold bg-muted px-2.5 py-1 rounded-md text-foreground border">{k.nomor_sk}</span>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          setSelectedIds([k.id]);
                          setNomorSkInput("");
                          setIsModalOpen(true);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5 font-bold text-xs"
                      >
                        <Stamp className="h-3.5 w-3.5" />
                        Sahkan
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredKandidat.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <FileBadge className="h-12 w-12 text-slate-300 mb-3" />
                      <p>Tidak ada data pemohon yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <Stamp className="h-5 w-5" />
              Penerbitan SK Legal
            </DialogTitle>
            <DialogDescription className="pt-3">
              Anda akan menerbitkan Surat Keputusan (SK) Pengakuan SKS untuk <strong>{selectedIds.length} mahasiswa</strong>.
              Tindakan ini akan meng-generate dokumen legal ber-QR Code secara massal dan status mereka akan berubah menjadi Lulus RPL.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
             <div className="space-y-2">
                <Label htmlFor="nomorSk" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nomor SK Keputusan</Label>
                <Input 
                   id="nomorSk" 
                   value={nomorSkInput}
                   onChange={(e) => setNomorSkInput(e.target.value)}
                   placeholder="Contoh: 123/SK/RPL/POLIBAN/2026"
                   className="h-10 bg-background font-mono text-sm"
                   required
                />
             </div>
             
             <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                Aksi ini bersifat final dan berkekuatan hukum dalam sistem akademik kampus. Pastikan nomor SK yang dimasukkan telah sesuai dengan dokumen resmi.
             </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button 
              onClick={() => publishMutation.mutate()} 
              disabled={!nomorSkInput.trim() || publishMutation.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold gap-2"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Stamp className="h-4 w-4" />
                  Sahkan SK Massal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
