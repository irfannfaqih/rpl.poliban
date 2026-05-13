"use client";

import { useState } from "react";
import { 
  ArrowRightLeft,
  Download,
  Eye,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const mockPemohon = [
  { id: "P01", nama: "Ahmad Fauzi", nim: "RPL-2024-001", status: "assessment_in_progress" },
  { id: "P02", nama: "Budi Santoso", nim: "RPL-2024-002", status: "waiting_pleno" },
];

// Simulasi data yang SUDAH diisi oleh Asesor di workspace mereka
const mockAsesorMappings = [
  { 
    kodeAsal: "INF101", namaAsal: "Algoritma Pemrograman", sksAsal: 3,
    kodePoliban: "TI101", namaPoliban: "Algoritma Pemrograman", sksPoliban: 3,
    kesenjangan: "Sesuai", keputusan: "Diakui Penuh", 
    catatanAsesor: "CP sepenuhnya tercakup oleh MK asal.",
    asesor: "Asesor 1 (Ir. H. Budi Santoso)",
  },
  { 
    kodeAsal: "INF102", namaAsal: "Basis Data", sksAsal: 3,
    kodePoliban: "TI102", namaPoliban: "Basis Data Dasar", sksPoliban: 3,
    kesenjangan: "Sesuai", keputusan: "Diakui Penuh", 
    catatanAsesor: "ERD dan SQL dasar terpenuhi.",
    asesor: "Asesor 1 (Ir. H. Budi Santoso)",
  },
  { 
    kodeAsal: "INF103", namaAsal: "Pemrograman Web", sksAsal: 3,
    kodePoliban: "TI103", namaPoliban: "Pemrograman Berbasis Web", sksPoliban: 3,
    kesenjangan: "Sebagian Sesuai", keputusan: "Diakui Sebagian", 
    catatanAsesor: "Frontend terpenuhi, backend framework belum cukup.",
    asesor: "Asesor 2 (Dr. Eng. Siti Aminah)",
  },
];

export default function MatriksAlihKreditPage() {
  const [selectedPemohon, setSelectedPemohon] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const getKesenanganBadge = (k: string) => {
    if (k === "Sesuai") return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px]">Sesuai</Badge>;
    if (k === "Sebagian Sesuai") return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[11px]">Sebagian Sesuai</Badge>;
    if (k === "Tidak Sesuai") return <Badge variant="outline" className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 text-[11px]">Tidak Sesuai</Badge>;
    return <Badge variant="outline" className="text-[11px]">—</Badge>;
  };

  const getKeputusanBadge = (k: string) => {
    if (k === "Diakui Penuh") return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] gap-1"><CheckCircle2 className="h-3 w-3" /> Diakui Penuh</Badge>;
    if (k === "Diakui Sebagian") return <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-[11px] gap-1"><AlertTriangle className="h-3 w-3" /> Diakui Sebagian</Badge>;
    if (k === "Tidak Diakui") return <Badge className="bg-red-600 text-white hover:bg-red-700 text-[11px] gap-1"><XCircle className="h-3 w-3" /> Tidak Diakui</Badge>;
    return <Badge variant="outline" className="text-[11px]">—</Badge>;
  };

  const diakuiCount = mockAsesorMappings.filter(m => m.keputusan === "Diakui Penuh").length;
  const sebagianCount = mockAsesorMappings.filter(m => m.keputusan === "Diakui Sebagian").length;
  const tidakCount = mockAsesorMappings.filter(m => m.keputusan === "Tidak Diakui").length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Review Matriks Alih Kredit</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Tinjau hasil pemetaan MK yang telah dikerjakan oleh Asesor. Anda dapat membantu mengedit jika diperlukan.
        </p>
      </div>

      {/* Select Pemohon */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
          Pilih Pendaftar
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedPemohon} onValueChange={(val) => { setSelectedPemohon(val); setIsEditMode(false); }}>
              <SelectTrigger className="w-full bg-background h-10">
                <SelectValue placeholder="Pilih mahasiswa untuk ditinjau...">
                  {selectedPemohon ? (() => {
                    const p = mockPemohon.find(x => x.id === selectedPemohon);
                    return p ? `${p.nama} — ${p.nim}` : null;
                  })() : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {mockPemohon.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama} — {p.nim}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2 h-10 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 border-transparent shrink-0" disabled={!selectedPemohon}>
            <Download className="h-4 w-4" />
            Download Formulir Pemetaan MK
          </Button>
        </div>
      </div>

      {selectedPemohon && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Status Banner */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex gap-4">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Mode Review (Read-Only)</h3>
              <p className="text-xs text-blue-800 dark:text-blue-400/90 leading-relaxed">
                Data di bawah ini diisi oleh Asesor melalui workspace mereka. Anda dalam mode <strong>baca saja</strong>. 
                Jika perlu mengoreksi atau membantu Asesor, klik tombol "Bantu Edit" di bawah.
              </p>
            </div>
            <Button 
              variant={isEditMode ? "destructive" : "outline"}
              size="sm" 
              className="gap-2 shrink-0 self-center"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? (
                <><Lock className="h-3.5 w-3.5" /> Kunci Kembali</>
              ) : (
                <><Pencil className="h-3.5 w-3.5" /> Bantu Edit</>
              )}
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{diakuiCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Diakui Penuh</div>
            </div>
            <div className="bg-card rounded-xl border p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{sebagianCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Diakui Sebagian</div>
            </div>
            <div className="bg-card rounded-xl border p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{tidakCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Tidak Diakui</div>
            </div>
          </div>

          {/* Mapping Table */}
          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-foreground">Hasil Pemetaan Asesor</h3>
              </div>
              {isEditMode && (
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1 animate-pulse">
                  <Unlock className="h-3 w-3" /> Mode Edit Aktif
                </Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/10 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold border-r">#</th>
                    <th className="px-4 py-3 font-semibold border-r">MK Asal (Transkrip)</th>
                    <th className="px-4 py-3 font-semibold border-r text-center">→</th>
                    <th className="px-4 py-3 font-semibold border-r">MK Poliban (Tujuan)</th>
                    <th className="px-4 py-3 font-semibold border-r text-center">Kesenjangan</th>
                    <th className="px-4 py-3 font-semibold border-r text-center">Keputusan</th>
                    <th className="px-4 py-3 font-semibold border-r">Catatan Asesor</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockAsesorMappings.map((row, idx) => (
                    <tr key={row.kodeAsal} className="group hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3 text-center text-muted-foreground border-r">{idx + 1}</td>
                      <td className="px-4 py-3 border-r">
                        <div className="font-medium text-foreground">{row.namaAsal}</div>
                        <div className="text-xs text-muted-foreground">{row.kodeAsal} • {row.sksAsal} SKS</div>
                      </td>
                      <td className="px-4 py-3 text-center border-r">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                      </td>
                      <td className="px-4 py-3 border-r">
                        <div className="font-medium text-foreground">{row.namaPoliban}</div>
                        <div className="text-xs text-muted-foreground">{row.kodePoliban} • {row.sksPoliban} SKS</div>
                      </td>
                      <td className="px-4 py-3 text-center border-r">
                        {getKesenanganBadge(row.kesenjangan)}
                      </td>
                      <td className="px-4 py-3 text-center border-r">
                        {getKeputusanBadge(row.keputusan)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">{row.catatanAsesor}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
