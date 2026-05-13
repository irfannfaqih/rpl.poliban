"use client";

import { useState } from "react";
import { 
  FileBadge, 
  Search, 
  CheckCircle2, 
  XCircle,
  FileText,
  Stamp,
  Users,
  Filter
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

const mockKandidatSk = [
  { id: "RPL-2026-001", nama: "Ahmad Fauzi", prodi: "TI-D3", sksDiakui: 45, status: "menunggu_sk" },
  { id: "RPL-2026-003", nama: "Budi Santoso", prodi: "TI-D3", sksDiakui: 30, status: "menunggu_sk" },
  { id: "RPL-2026-015", nama: "Siti Aminah", prodi: "TM-D3", sksDiakui: 28, status: "menunggu_sk" },
  { id: "RPL-2026-042", nama: "Dewi Lestari", prodi: "AB-D4", sksDiakui: 55, status: "sk_terbit" },
  { id: "RPL-2026-050", nama: "Rahmat Hidayat", prodi: "SI-D3", sksDiakui: 0, status: "ditolak" },
];

export default function PenerbitanSKPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredKandidat = mockKandidatSk.filter(k => {
    const matchSearch = k.nama.toLowerCase().includes(searchTerm.toLowerCase()) || k.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || k.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const waitingCount = mockKandidatSk.filter(k => k.status === "menunggu_sk").length;

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredKandidat.filter(k => k.status === "menunggu_sk").length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredKandidat.filter(k => k.status === "menunggu_sk").map(k => k.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

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
                {mockKandidatSk.filter(k => k.status === "sk_terbit").length}
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
              placeholder="Cari pemohon atau no pendaftaran..." 
              className="pl-9 bg-background h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background h-10">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status SK" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="menunggu_sk">Menunggu SK</SelectItem>
              <SelectItem value="sk_terbit">SK Terbit</SelectItem>
              <SelectItem value="ditolak">Tidak Lolos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button 
          disabled={selectedIds.length === 0}
          onClick={() => setIsModalOpen(true)}
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
                    checked={filteredKandidat.filter(k => k.status === "menunggu_sk").length > 0 && selectedIds.length === filteredKandidat.filter(k => k.status === "menunggu_sk").length}
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Nama Pemohon</th>
                <th className="px-6 py-4 font-semibold">Prodi Tujuan</th>
                <th className="px-6 py-4 font-semibold text-center">SKS Diakui</th>
                <th className="px-6 py-4 font-semibold text-center">Status Keputusan</th>
                <th className="px-6 py-4 font-semibold text-right">Berkas Laporan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredKandidat.map((k) => (
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
                    <div className="font-bold text-foreground">{k.nama}</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{k.id}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                    {k.prodi}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-500">{k.sksDiakui}</span>
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
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 font-medium">
                      <FileText className="h-4 w-4" />
                      Lihat Hasil Pleno
                    </Button>
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
          <div className="py-4">
             <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-400">
                Aksi ini bersifat final dan berkekuatan hukum dalam sistem akademik kampus.
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={() => {
              // Simulate API call
              setIsModalOpen(false);
              setSelectedIds([]);
            }} className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold gap-2">
              <Stamp className="h-4 w-4" /> Sahkan SK Massal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
