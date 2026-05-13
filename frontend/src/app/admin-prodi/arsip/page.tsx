"use client";

import { useState } from "react";
import { 
  Archive,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Megaphone,
  Check
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

const mockPemohon = [
  { id: "P01", nama: "Ahmad Fauzi", nim: "RPL-2024-001", status: "pleno_selesai" },
  { id: "P02", nama: "Budi Santoso", nim: "RPL-2024-002", status: "assessment_in_progress" },
];

// Definition of 19 forms
const dokumenMaster = [
  { id: "F01", nama: "Formulir Identitas Diri", isAuto: true, isRequired: true },
  { id: "F02", nama: "Daftar Cek Pra Asesmen", isAuto: true, isRequired: true },
  { id: "F03", nama: "Formulir Evaluasi Diri", isAuto: true, isRequired: true },
  { id: "F04", nama: "Formulir Evaluasi Portofolio", isAuto: true, isRequired: true },
  { id: "F05", nama: "Formulir Penilaian CP 3 Dimensi", isAuto: true, isRequired: true },
  { id: "F06", nama: "Tanda Terima Dokumen Portofolio", isAuto: true, isRequired: true },
  { id: "F07", nama: "Daftar Riwayat Hidup Asesor", isAuto: true, isRequired: true },
  { id: "F08", nama: "Jadwal Asesmen Tahap 2", isAuto: false, isRequired: true },
  { id: "F09", nama: "Perangkat Asesmen Tertulis", isAuto: true, isRequired: true },
  { id: "F10", nama: "Lembar Jawaban Ujian Tulis", isAuto: true, isRequired: true },
  { id: "F11", nama: "Daftar Pertanyaan Lisan", isAuto: true, isRequired: true },
  { id: "F12", nama: "Matriks Alih Kredit", isAuto: false, isRequired: true },
  { id: "F13", nama: "Matriks Asesmen MK", isAuto: true, isRequired: true },
  { id: "F14", nama: "Rekapitulasi Asesmen Prodi", isAuto: false, isRequired: true },
  { id: "F15", nama: "Rekapitulasi Asesmen Pemohon", isAuto: false, isRequired: true },
  { id: "F16", nama: "Daftar Riwayat Hidup Pemohon", isAuto: true, isRequired: true },
  { id: "F17", nama: "Surat Sanggahan", isAuto: true, isRequired: false },
  { id: "F18", nama: "Rekapitulasi Calon Mahasiswa RPL", isAuto: false, isRequired: true },
  { id: "F19", nama: "Berita Acara Asesmen", isAuto: false, isRequired: true },
];

export default function LokerArsipPage() {
  const [selectedPemohon, setSelectedPemohon] = useState("");
  // Mock state for uploaded manual forms (F08, F12, F14 is uploaded)
  const [uploadedForms, setUploadedForms] = useState<string[]>(["F08", "F12", "F14"]);

  const handleUpload = (id: string) => {
    // Simulate upload
    if (!uploadedForms.includes(id)) {
      setUploadedForms([...uploadedForms, id]);
    }
  };

  const requiredCount = dokumenMaster.filter(d => d.isRequired).length;
  const completedCount = dokumenMaster.filter(d => {
    if (!d.isRequired) return true;
    if (d.isAuto) return true;
    return uploadedForms.includes(d.id);
  }).length;

  const progressPercentage = Math.round((completedCount / requiredCount) * 100);
  const isAllComplete = progressPercentage === 100;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Loker Arsip Dokumen</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola 19 dokumen fisik/digital untuk setiap pemohon. Upload scan dokumen yang membutuhkan tanda tangan basah.
        </p>
      </div>

      {/* Select Pemohon */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
          Pilih Pendaftar
        </label>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <Select value={selectedPemohon} onValueChange={setSelectedPemohon}>
              <SelectTrigger className="w-full bg-background h-10">
                <SelectValue placeholder="Pilih mahasiswa untuk melihat arsip...">
                  {selectedPemohon ? (() => {
                    const p = mockPemohon.find(x => x.id === selectedPemohon);
                    return p ? `${p.nama} — ${p.nim}` : null;
                  })() : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {mockPemohon.filter(p => p.status === "pleno_selesai").map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nama} — {p.nim}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        
        
        {selectedPemohon && (
          <div className="flex-1 w-full max-w-md self-center mt-2 sm:mt-0">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Kelengkapan Dokumen Wajib</span>
              <span className="text-xs font-bold text-slate-900">{completedCount} / {requiredCount} ({progressPercentage}%)</span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border">
              <div 
                className={`h-full transition-all duration-1000 ${isAllComplete ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
        </div>
      </div>

      {selectedPemohon && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-700" />
              <div>
                <h3 className="font-bold text-sm">Daftar Formulir Master</h3>
                <p className="text-xs text-muted-foreground">🟢 Auto-generate • 🟡 Perlu Cetak & Upload TTD Basah</p>
              </div>
            </div>
            
            <Button 
              className={`gap-2 ${isAllComplete ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              disabled={!isAllComplete}
            >
              <Megaphone className="h-4 w-4" />
              Publikasi Hasil Akhir
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-muted-foreground bg-muted/10 border-b uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold w-24 text-center">Kode</th>
                  <th className="px-6 py-3 font-semibold">Nama Dokumen</th>
                  <th className="px-6 py-3 font-semibold">Tipe Arsip</th>
                  <th className="px-6 py-3 font-semibold w-40">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dokumenMaster.map((doc) => {
                  const isUploaded = uploadedForms.includes(doc.id);
                  const isComplete = doc.isAuto || isUploaded;
                  
                  return (
                    <tr key={doc.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-3 text-center">
                        <Badge variant="outline" className="bg-background font-mono">{doc.id}</Badge>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-foreground">{doc.nama}</div>
                        {!doc.isRequired && <span className="text-[10px] text-muted-foreground block">Opsional (Jika ada)</span>}
                      </td>
                      <td className="px-6 py-3">
                        {doc.isAuto ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            Auto-generated
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-500 flex items-center gap-1.5">
                            TTD Basah
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {isComplete ? (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1.5 justify-center w-28">
                            <CheckCircle2 className="h-3 w-3" />
                            Lengkap
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1.5 justify-center w-28">
                            <Clock className="h-3 w-3" />
                            Menunggu TTD
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/40">
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                          </Button>
                          
                          {!doc.isAuto && (
                            <Button 
                              variant={isUploaded ? "outline" : "default"} 
                              size="sm" 
                              className={`h-8 gap-2 w-28 ${isUploaded ? 'bg-background border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40' : 'bg-primary text-primary-foreground'}`}
                              onClick={() => handleUpload(doc.id)}
                            >
                              {isUploaded ? (
                                <>
                                  <Check className="h-3.5 w-3.5" /> Re-upload
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3.5 w-3.5" /> Upload Scan
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
