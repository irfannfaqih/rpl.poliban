"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Filter,
  FolderOpen,
  Loader2,
  MoreVertical,
  RefreshCcw,
  RefreshCw,
  Search,
  Unlock,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PendaftaranItem {
  id: number;
  nomor_pendaftaran: string;
  status_alur: string;
  created_at: string;
  user: { id: number; nama: string; email: string; instansi?: string };
  riwayat_pendidikan?: { institusi: string }[] | null;
  pengalaman_kerja?: any[];
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pre_submit":
      return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700">Registrasi</Badge>;
    case "waiting_payment":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Menunggu Pembayaran</Badge>;
    case "payment_verified":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Menunggu Borang</Badge>;
    case "waiting_verification":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">Verifikasi Berkas</Badge>;
    case "pra_asesmen":
      return <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800">Pra-Asesmen</Badge>;
    case "asesmen_tahap2":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">Asesmen Tahap 2</Badge>;
    case "pleno":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">Sidang Pleno</Badge>;
    case "finished":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">Selesai</Badge>;
    case "ditolak":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Ditolak</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">{status}</Badge>;
  }
};

export default function AntreanPendaftarPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data = [], isLoading: loading } = useQuery({
    queryKey: ['pendaftaran', debouncedSearch, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data: res } = await api.get('/admin-prodi/pendaftaran', { params });
      return res.data as PendaftaranItem[];
    }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['pendaftaran'] });
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/admin-prodi/pendaftaran/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Data_Pendaftar_RPL.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Gagal export excel", error);
    }
  };

  const [unlockTarget, setUnlockTarget] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleUnlockForm = async () => {
    if (!unlockTarget) return;
    setIsActionLoading(true);
    try {
      await api.post(`/admin-prodi/pendaftaran/${unlockTarget}/unlock`);
      toast.success("Gembok form berhasil dibuka");
      queryClient.invalidateQueries({ queryKey: ['pendaftaran'] });
      setUnlockTarget(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal membuka gembok form");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetPraAsesmen = async () => {
    if (!resetTarget) return;
    setIsActionLoading(true);
    try {
      await api.patch(`/admin-prodi/pendaftaran/${resetTarget}/status`, { status_alur: "pra_asesmen" });
      toast.success("Status pemohon berhasil direset ke Pra Asesmen");
      queryClient.invalidateQueries({ queryKey: ['pendaftaran'] });
      setResetTarget(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mereset status");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Antrean Pendaftar</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola antrean pendaftar RPL yang masuk ke program studi Anda. Lakukan verifikasi dan pantau status alur.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama, asal PT, atau ID pendaftaran..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="bg-background gap-2" onClick={handleExport} title="Export Rekapitulasi (F18)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></svg>
            Export Excel
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground gap-2">
              <Filter className="h-4 w-4" /> Filter Status
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Pilih Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>Semua Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("waiting_verification")}>Perlu Verifikasi</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pra_asesmen")}>Pra-Asesmen</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("asesmen_tahap2")}>Asesmen Tahap 2</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pleno")}>Sidang Pleno</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("finished")}>Selesai</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("ditolak")}>Ditolak</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" className="bg-background" title="Refresh" onClick={handleRefresh}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin text-muted-foreground' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">No. Reg</th>
                <th className="px-6 py-4 font-semibold">Tanggal Masuk</th>
                <th className="px-6 py-4 font-semibold">Nama Pendaftar</th>
                <th className="px-6 py-4 font-semibold">Asal Institusi</th>
                <th className="px-6 py-4 font-semibold">Status Alur</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Memuat data...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Tidak ada data pendaftar.</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 font-medium font-mono text-foreground">{item.nomor_pendaftaran || `RPL-${item.id}`}</td>
                    <td className="px-6 py-4 tabular-nums text-muted-foreground">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{item.user?.nama || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.riwayat_pendidikan?.[0]?.institusi || item.user?.instansi || item.pengalaman_kerja?.find((p: any) => p.tipe === 'kerja')?.nama || item.pengalaman_kerja?.[0]?.nama || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status_alur)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin-prodi/verifikasi?id=${item.id}`}>
                          <Button variant="secondary" size="sm" className="gap-2 h-8">
                            <FolderOpen className="h-3.5 w-3.5" /> Buka Berkas
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi Lainnya</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={["pre_submit", "waiting_payment", "finished", "ditolak"].includes(item.status_alur)}
                              onClick={() => setUnlockTarget(item.id)}
                              className="text-amber-600 focus:text-amber-700"
                            >
                              <Unlock className="h-4 w-4 mr-2" /> Buka Gembok Form
                            </DropdownMenuItem>
                            {item.status_alur === "ditolak" && (
                              <DropdownMenuItem
                                onClick={() => setResetTarget(item.id)}
                                className="text-blue-600 focus:text-blue-700"
                              >
                                <RefreshCw className="h-4 w-4 mr-2" /> Reset ke Pra Asesmen
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{data.length}</span> pendaftar
          </div>
        </div>
      </div>

      <Dialog open={!!unlockTarget} onOpenChange={() => setUnlockTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Unlock className="h-5 w-5" /> Buka Gembok Form
            </DialogTitle>
            <DialogDescription className="pt-2">
              Buka gembok form untuk pendaftar ini? Status akan dikembalikan ke pengisian borang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUnlockTarget(null)} disabled={isActionLoading}>Batal</Button>
            <Button onClick={handleUnlockForm} disabled={isActionLoading} className="bg-amber-600 text-white hover:bg-amber-700">
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ya, Buka Gembok'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <RefreshCw className="h-5 w-5" /> Reset ke Pra Asesmen
            </DialogTitle>
            <DialogDescription className="pt-2">
              Reset status pemohon ini ke Pra Asesmen? Asesor perlu melakukan pra-asesmen ulang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={isActionLoading}>Batal</Button>
            <Button onClick={handleResetPraAsesmen} disabled={isActionLoading} className="bg-blue-600 text-white hover:bg-blue-700">
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ya, Reset Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
