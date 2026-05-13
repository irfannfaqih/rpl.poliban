"use client";

import { useState } from "react";
import { Scale, Search, CheckCircle2, XCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MOCK_SANGGAHAN = [
  {
    id: "SNG-001",
    pemohonId: "PMH-001",
    namaPemohon: "Pemohon Demo",
    mkId: "MK01",
    mkNama: "Rekayasa Perangkat Lunak",
    tanggal: "2026-05-20",
    alasan: "Saya telah melampirkan bukti tambahan berupa surat keputusan pengangkatan saya sebagai System Analyst yang sebelumnya terlewat, yang menguatkan bukti bahwa saya melakukan desain perangkat lunak secara profesional.",
    fileBukti: "SK_System_Analyst.pdf",
    status: "Menunggu Review" // Menunggu Review, Diterima, Ditolak
  }
];

export default function SanggahanDashboard() {
  const [sanggahanList, setSanggahanList] = useState(MOCK_SANGGAHAN);
  const [selected, setSelected] = useState(MOCK_SANGGAHAN[0]);
  const [reviewNote, setReviewNote] = useState("");

  const handleDecision = (status: "Diterima" | "Ditolak") => {
    if (!reviewNote) {
      alert("Catatan keputusan wajib diisi!");
      return;
    }
    
    setSanggahanList(prev => prev.map(s => 
      s.id === selected.id ? { ...s, status } : s
    ));
    setSelected({ ...selected, status });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8 h-[calc(100vh-3.5rem)] overflow-hidden">
      
      {/* Left List */}
      <div className="w-1/3 flex flex-col bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b space-y-4 bg-muted/20">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Daftar Sanggahan
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Tinjau keberatan pemohon</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari ID atau nama..."
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {sanggahanList.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === s.id 
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                  : "border-border bg-background hover:bg-muted/50 hover:border-primary/30"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">{s.id}</span>
                <span className="text-[10px] text-muted-foreground">{s.tanggal}</span>
              </div>
              <p className="font-bold text-sm text-foreground">{s.namaPemohon}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.mkNama}</p>
              
              <div className="mt-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                  s.status === "Menunggu Review" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                  s.status === "Diterima" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                  "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                }`}>
                  {s.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="flex-1 flex flex-col bg-card rounded-2xl border shadow-sm overflow-hidden">
        {selected ? (
          <>
            <div className="p-6 border-b flex justify-between items-center bg-muted/10">
              <div>
                <h2 className="text-xl font-bold">{selected.namaPemohon}</h2>
                <p className="text-sm text-muted-foreground mt-1">Mengajukan sanggah untuk MK: <strong className="text-foreground">{selected.mkNama}</strong></p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  selected.status === "Menunggu Review" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400" :
                  selected.status === "Diterima" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400" :
                  "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400"
                }`}>
                  Status: {selected.status}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Alasan & Bukti */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold border-b pb-2 mb-3 text-foreground">Alasan Sanggahan</h3>
                  <div className="bg-muted/30 p-4 rounded-xl border text-sm leading-relaxed text-foreground/80">
                    "{selected.alasan}"
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold border-b pb-2 mb-3 text-foreground">Lampiran Bukti Baru</h3>
                  <div className="flex items-center gap-3 p-3 border rounded-xl bg-background w-fit hover:border-primary/50 cursor-pointer group transition-colors">
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{selected.fileBukti}</p>
                      <p className="text-[10px] text-muted-foreground">PDF Document</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground ml-4 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>

              {/* Checklist Verifikasi (Form 17) */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold border-b pb-2 text-foreground">Checklist Verifikasi Banding</h3>
                <div className="bg-muted/20 border rounded-xl p-4 space-y-3">
                  {[
                    "Apakah proses banding telah dijelaskan kepada pemohon?",
                    "Apakah pemohon telah mendiskusikan banding dengan Asesor RPL?",
                    "Apakah pemohon akan melibatkan pihak lain untuk membantu dalam proses banding?",
                  ].map((q, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                      <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0 w-5">{i + 1}.</span>
                      <p className="flex-1 text-sm text-foreground">{q}</p>
                      <div className="flex gap-2 shrink-0">
                        <button className="px-3 py-1 text-xs font-bold rounded-md border bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                          Ya
                        </button>
                        <button className="px-3 py-1 text-xs font-bold rounded-md border text-muted-foreground hover:bg-muted">
                          Tidak
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-3 bg-background rounded-lg border">
                    <Label className="text-xs font-bold text-muted-foreground block mb-2">Sanggah diajukan kepada:</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="diajukan" className="w-4 h-4" defaultChecked />
                        <span className="text-sm">Pemimpin Perguruan Tinggi</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="diajukan" className="w-4 h-4" />
                        <span className="text-sm">Kementerian Pendidikan Tinggi</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Keputusan Asesor */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Keputusan Tinjauan Asesor</h3>
                <div className="bg-background border p-5 rounded-2xl space-y-4">
                  <div>
                    <Label className="text-xs font-bold text-muted-foreground block mb-2">Catatan Tinjauan Asesor</Label>
                    <textarea 
                      className="w-full min-h-[100px] p-3 text-sm rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Jelaskan dasar pertimbangan Anda setelah melihat bukti baru ini..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      disabled={selected.status !== "Menunggu Review"}
                    />
                  </div>

                  {selected.status === "Menunggu Review" && (
                    <div className="flex gap-4 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 gap-2"
                        onClick={() => handleDecision("Ditolak")}
                      >
                        <XCircle className="h-4 w-4" /> Tolak Sanggahan
                      </Button>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                        onClick={() => handleDecision("Diterima")}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Terima Sanggahan
                      </Button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Scale className="h-12 w-12 opacity-20 mb-4" />
            <p>Pilih sanggahan di daftar sebelah kiri untuk meninjau.</p>
          </div>
        )}
      </div>

    </div>
  );
}
