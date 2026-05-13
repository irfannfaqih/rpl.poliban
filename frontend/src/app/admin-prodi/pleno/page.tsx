"use client";

import { useState } from "react";
import { 
  Scale,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";

const mockPemohon = [
  { id: "P01", nama: "Ahmad Fauzi", nim: "RPL-2024-001", status: "waiting_pleno" },
  { id: "P02", nama: "Budi Santoso", nim: "RPL-2024-002", status: "assessment_in_progress" },
];

const mockPlenoData = [
  { 
    kode: "TI101", 
    nama: "Algoritma Pemrograman", 
    sks: 3,
    a1: { keputusan: "Diakui", nilai: "A", bobot: 4.0 },
    a2: { keputusan: "Diakui", nilai: "A", bobot: 4.0 },
    avg: 4.0,
    finalNilai: "A",
    status: "aman" // "aman", "selisih_minor", "selisih_mayor", "konflik"
  },
  { 
    kode: "TI102", 
    nama: "Basis Data", 
    sks: 3,
    a1: { keputusan: "Diakui", nilai: "B", bobot: 3.0 },
    a2: { keputusan: "Diakui", nilai: "C", bobot: 2.0 },
    avg: 2.5,
    finalNilai: "BC",
    status: "selisih_minor"
  },
  { 
    kode: "TI103", 
    nama: "Pemrograman Web", 
    sks: 3,
    a1: { keputusan: "Diakui", nilai: "A", bobot: 4.0 },
    a2: { keputusan: "Diakui", nilai: "C", bobot: 2.0 },
    avg: 3.0,
    finalNilai: "B",
    status: "selisih_mayor"
  },
  { 
    kode: "TI104", 
    nama: "Sistem Operasi", 
    sks: 3,
    a1: { keputusan: "Diakui", nilai: "B", bobot: 3.0 },
    a2: { keputusan: "Tidak Diakui", nilai: "E", bobot: 0.0 },
    avg: 1.5,
    finalNilai: "-",
    status: "konflik"
  },
];

export default function DashboardPlenoPage() {
  const [selectedPemohon, setSelectedPemohon] = useState("");
  const [isSahkanOpen, setIsSahkanOpen] = useState(false);
  const [keputusanFinal, setKeputusanFinal] = useState<Record<string, string>>({});
  const [catatanPleno, setCatatanPleno] = useState<Record<string, string>>({});

  const conflictRows = mockPlenoData.filter(mk => mk.status === "konflik" || mk.status === "selisih_mayor");
  const allConflictsResolved = conflictRows.every(mk => {
    const hasDecision = keputusanFinal[mk.kode] && keputusanFinal[mk.kode] !== "konflik";
    const hasNote = catatanPleno[mk.kode]?.trim();
    return hasDecision && hasNote;
  });
  const canSahkan = selectedPemohon && allConflictsResolved;

  const getStatusRowClass = (status: string) => {
    switch (status) {
      case "selisih_mayor": return "bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20";
      case "konflik": return "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20";
      default: return "hover:bg-muted/5";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "selisih_mayor": return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "konflik": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard Pleno</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Bandingkan hasil penilaian dua asesor, evaluasi selisih nilai, dan sahkan Rekapitulasi Penilaian.
        </p>
      </div>

      {/* Select Pemohon */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
          Pilih Pendaftar (Status: Menunggu Pleno)
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedPemohon} onValueChange={setSelectedPemohon}>
              <SelectTrigger className="w-full bg-background h-10">
                <SelectValue placeholder="Pilih mahasiswa untuk di-plenokan...">
                  {selectedPemohon ? (() => {
                    const p = mockPemohon.find(x => x.id === selectedPemohon);
                    return p ? `${p.nama} — ${p.nim}` : null;
                  })() : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {mockPemohon.filter(p => p.status === "waiting_pleno").map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama} — {p.nim}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <Button className="gap-2 h-10 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 border-transparent" disabled={!selectedPemohon}>
              <Download className="h-4 w-4" />
              Download Rekapitulasi Penilaian
            </Button>
            <Button className="gap-2 h-10 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 border-transparent" disabled={!selectedPemohon}>
              <FileText className="h-4 w-4" />
              Download Berita Acara
            </Button>
          </div>
        </div>
      </div>

      {selectedPemohon && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total SKS Diakui</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">12 <span className="text-sm font-medium text-muted-foreground">SKS</span></p>
            </div>
            <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total MK Diakui</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">4 <span className="text-sm font-medium text-muted-foreground">Mata Kuliah</span></p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">Isu Pleno</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-500">2 <span className="text-sm font-medium text-amber-700/80 dark:text-amber-500/80">Perlu Diskusi</span></p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-700" />
                <h3 className="font-bold text-sm">Komparasi Nilai Asesor</h3>
              </div>
              
              <Dialog open={isSahkanOpen} onOpenChange={setIsSahkanOpen}>
                <DialogTrigger 
                  className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-primary-foreground shadow hover:bg-emerald-700 gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  {...(!canSahkan ? { style: { opacity: 0.5, pointerEvents: 'none' as const } } : {})}
                >
                  Sahkan Pleno
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sahkan Nilai Pleno?</DialogTitle>
                    <DialogDescription>
                      Dengan mengesahkan, Anda menyatakan bahwa proses diskusi pleno telah selesai dan nilai akhir disetujui oleh kedua Asesor dan Prodi.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-900/50 my-2">
                    <div className="flex gap-2 text-amber-800 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                      <p className="text-sm leading-relaxed">
                        Terdapat 1 MK dengan status <strong>Konflik</strong> dan 1 MK dengan <strong>Selisih Mayor</strong>. Pastikan Anda telah mengedit keputusan akhir sebelum mengesahkan.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSahkanOpen(false)}>Batal</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsSahkanOpen(false)}>
                      Ya, Sahkan Pleno
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead className="text-[11px] text-muted-foreground bg-muted/10 border-b uppercase tracking-wider">
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 font-semibold border-r text-left w-64">Mata Kuliah</th>
                    <th colSpan={3} className="px-4 py-2 font-semibold border-r border-b bg-blue-50/30 dark:bg-blue-900/20">Asesor 1 (A1)</th>
                    <th colSpan={3} className="px-4 py-2 font-semibold border-r border-b bg-purple-50/30 dark:bg-purple-900/20">Asesor 2 (A2)</th>
                    <th colSpan={2} className="px-4 py-2 font-semibold border-b bg-emerald-50/30 dark:bg-emerald-900/20">Sistem / Final</th>
                  </tr>
                  <tr>
                    <th className="px-2 py-2 font-semibold border-r bg-blue-50/30 dark:bg-blue-900/20">Status</th>
                    <th className="px-2 py-2 font-semibold border-r bg-blue-50/30 dark:bg-blue-900/20">Mutu</th>
                    <th className="px-2 py-2 font-semibold border-r bg-blue-50/30 dark:bg-blue-900/20">SKS</th>
                    
                    <th className="px-2 py-2 font-semibold border-r bg-purple-50/30 dark:bg-purple-900/20">Status</th>
                    <th className="px-2 py-2 font-semibold border-r bg-purple-50/30 dark:bg-purple-900/20">Mutu</th>
                    <th className="px-2 py-2 font-semibold border-r bg-purple-50/30 dark:bg-purple-900/20">SKS</th>
                    
                    <th className="px-2 py-2 font-semibold border-r bg-emerald-50/30 dark:bg-emerald-900/20">Rata-rata</th>
                    <th className="px-2 py-2 font-semibold bg-emerald-50/30 dark:bg-emerald-900/20">Aksi Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockPlenoData.map((mk) => (
                    <tr key={mk.kode} className={`transition-colors ${getStatusRowClass(mk.status)}`}>
                      <td className="px-4 py-3 text-left border-r bg-muted/30">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(mk.status)}
                          <div>
                            <div className="font-medium text-foreground">{mk.nama}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{mk.kode} • {mk.sks} SKS</div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Asesor 1 */}
                      <td className="px-2 py-3 border-r text-xs">
                        {mk.a1.keputusan === "Diakui" ? (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-none">Diakui</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-none">Tidak</Badge>
                        )}
                      </td>
                      <td className="px-2 py-3 border-r font-medium">{mk.a1.nilai}</td>
                      <td className="px-2 py-3 border-r text-muted-foreground">{mk.a1.keputusan === "Diakui" ? mk.sks : 0}</td>

                      {/* Asesor 2 */}
                      <td className="px-2 py-3 border-r text-xs">
                        {mk.a2.keputusan === "Diakui" ? (
                          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-none">Diakui</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-none">Tidak</Badge>
                        )}
                      </td>
                      <td className="px-2 py-3 border-r font-medium">{mk.a2.nilai}</td>
                      <td className="px-2 py-3 border-r text-muted-foreground">{mk.a2.keputusan === "Diakui" ? mk.sks : 0}</td>

                      {/* Final */}
                      <td className="px-2 py-3 border-r font-bold text-slate-700">{mk.avg.toFixed(1)}</td>
                      <td className="px-2 py-3">
                        {(mk.status === "konflik" || mk.status === "selisih_mayor") ? (
                          <div className="space-y-2">
                            <Select 
                              value={keputusanFinal[mk.kode] || ""}
                              onValueChange={(val) => setKeputusanFinal(prev => ({...prev, [mk.kode]: val}))}
                            >
                              <SelectTrigger className={`h-8 text-xs font-semibold w-[120px] mx-auto ${
                                mk.status === "konflik" 
                                  ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                                  : "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                              }`}>
                                <SelectValue placeholder="Pilih..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Diakui (A)</SelectItem>
                                <SelectItem value="B">Diakui (B)</SelectItem>
                                <SelectItem value="C">Diakui (C)</SelectItem>
                                <SelectItem value="T">Tidak Diakui</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              value={catatanPleno[mk.kode] || ""}
                              onChange={(e) => setCatatanPleno(prev => ({...prev, [mk.kode]: e.target.value}))}
                              placeholder="Catatan pleno wajib diisi..."
                              className={`min-h-[50px] text-[11px] resize-y w-[180px] mx-auto ${
                                !catatanPleno[mk.kode]?.trim() ? "border-red-300 dark:border-red-800" : "border-emerald-300 dark:border-emerald-800"
                              }`}
                            />
                          </div>
                        ) : (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-none font-bold px-3">
                            {mk.finalNilai}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-muted/10 border-t text-xs text-muted-foreground space-y-2">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Selisih Mayor: Beda bobot lebih dari 1.0</span>
                <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Konflik: Satu mengakui, satu tidak</span>
              </div>
              {!allConflictsResolved && conflictRows.length > 0 && (
                <p className="text-red-600 dark:text-red-400 font-medium">⚠ Selesaikan semua konflik dan isi catatan pleno sebelum mengesahkan.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
