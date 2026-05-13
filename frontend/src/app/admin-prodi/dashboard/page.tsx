"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  RefreshCcw, 
  FolderOpen, 
  Unlock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";

interface PendaftaranItem {
  id: number;
  nomor_pendaftaran: string;
  status: string;
  created_at: string;
  user: { id: number; nama: string; email: string };
  borang_data_diri?: { institusi_asal: string } | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "draft":
    case "submitted":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Baru</Badge>;
    case "verifikasi":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Verifikasi</Badge>;
    case "asesmen":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Asesmen</Badge>;
    case "pleno":
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Pleno</Badge>;
    case "selesai":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Selesai</Badge>;
    case "ditolak":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Ditolak</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AntreanPendaftarPage() {
  const [data, setData] = useState<PendaftaranItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data: res } = await api.get('/admin-prodi/pendaftaran', { params });
      setData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pendaftaran:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

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
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground gap-2">
              <Filter className="h-4 w-4" /> Filter Status
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Pilih Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>Semua Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("verifikasi")}>Perlu Verifikasi</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("asesmen")}>Sedang Asesmen</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pleno")}>Menunggu Pleno</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" className="bg-background" title="Refresh" onClick={fetchData}>
            <RefreshCcw className="h-4 w-4" />
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
                    <td className="px-6 py-4 font-medium">{item.user?.nama}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.borang_data_diri?.institusi_asal || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
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
                            <DropdownMenuItem disabled={item.status !== "verifikasi"} className="text-amber-600 focus:text-amber-700">
                              <Unlock className="h-4 w-4 mr-2" /> Buka Gembok Form
                            </DropdownMenuItem>
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
    </div>
  );
}
