"use client";

import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import { useBorangStore } from "@/store/useBorangStore";
import { CheckCircle2, XCircle, AlertCircle, Scale, Download, MessageSquare, Info, ChevronRight, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataProdi } from "@/data/prodi";

export default function HasilSanggahPage() {
  const { prodiId, statusAlur } = usePendaftaranStore();
  const { data } = useBorangStore();
  const [showSanggahForm, setShowSanggahForm] = useState(false);

  const selectedProdi = useMemo(() => dataProdi.find(p => p.id === prodiId), [prodiId]);
  
  // Get all MKs that have at least one CPMK proficiency filled
  const evaluasi = data.sectionD.evaluasi || {};
  
  const results = useMemo(() => {
    if (!selectedProdi) return [];
    
    return selectedProdi.kurikulum.map((mk, index) => {
      // Check if this MK was evaluated by user
      const isEvaluated = mk.cpmk.some(c => !!evaluasi[c.id]?.profisiensi);
      
      if (!isEvaluated) return null;

      // Mock decision logic for demo: 
      // index % 4 === 0 -> Rejected, others -> Accepted
      const status = index % 4 === 0 ? "Ditolak" : "Diterima";
      
      return {
        id: mk.id,
        nama: mk.nama,
        sks: 3, // Default SKS
        status: status,
        catatan: status === "Ditolak" 
          ? "Bukti kompetensi yang dilampirkan belum memenuhi standar kedalaman materi (CPMK 2 & 3)." 
          : "Lulus verifikasi portofolio dan wawancara.",
        skSKS: status === "Diterima" ? 3 : 0
      };
    }).filter(Boolean);
  }, [selectedProdi, evaluasi]);

  const totalSKSApplied = results.length * 3;
  const totalSKSAccepted = results.reduce((acc, curr: any) => acc + curr.skSKS, 0);

  const hasResults = results.length > 0 && statusAlur !== 'borang';

  return (
    <div className="p-6 pb-20 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">Hasil Asesmen & Sanggah</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Lihat hasil evaluasi Asesor dan ajukan sanggahan jika diperlukan.
          </p>
        </div>
        {hasResults && (
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 rounded-xl h-11 border-border shadow-sm">
              <Download className="h-4 w-4" /> RP-11
            </Button>
            <Button 
              onClick={() => setShowSanggahForm(true)} 
              className="gap-2 rounded-xl h-11 bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
            >
              <AlertCircle className="h-4 w-4" /> Ajukan Sanggah
            </Button>
          </div>
        )}
      </div>

      {hasResults ? (
        <div className="space-y-8">
          {/* SUMMARY CARDS */}
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">SKS Diajukan</span>
              </div>
              <p className="text-3xl font-bold">{totalSKSApplied}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Berdasarkan Evaluasi Diri Anda</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">SKS Diakui</span>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{totalSKSAccepted}</p>
              <p className="text-[11px] text-green-600/70 dark:text-green-400/70 mt-1">Ditetapkan oleh Tim Asesor</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3 text-amber-600 dark:text-amber-400">
                <Scale className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Status Sanggah</span>
              </div>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">Belum Ada Sanggahan</p>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1">Maks. 3 hari setelah pengumuman</p>
            </motion.div>
          </div>

          {/* RESULTS TABLE */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border bg-card overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b bg-muted/20">
              <h2 className="font-bold flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" /> Rincian Keputusan Asesmen Mandiri
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Mata Kuliah</th>
                    <th className="px-6 py-4">Keputusan</th>
                    <th className="px-6 py-4 text-center">SKS</th>
                    <th className="px-6 py-4">Catatan Verifikasi Asesor</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-t border-border/50">
                  {results.map((mk: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-bold text-foreground text-sm">{mk.nama}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1 uppercase opacity-60">{mk.id}</div>
                      </td>
                      <td className="px-6 py-5">
                        {mk.status === "Diterima" ? (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-bold text-green-700 dark:text-green-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> DITERIMA
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-400">
                            <XCircle className="h-3.5 w-3.5" /> DITOLAK
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-base">
                        {mk.skSKS}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-xs">"{mk.catatan}"</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          
          <div className="rounded-2xl bg-primary/5 p-6 border border-primary/10 flex items-start gap-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-primary mb-1">Informasi Pengambilan Sertifikat</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Jika Anda menerima hasil ini, silakan datang ke Bagian Akademik POLIBAN untuk pengambilan Sertifikat Pengakuan SKS asli dengan membawa bukti fisik dokumen yang telah diunggah.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-20 text-center bg-muted/5">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Scale className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold">Hasil Belum Tersedia</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2 text-sm leading-relaxed">
            Data hasil asesmen akan muncul di sini setelah status pendaftaran Anda mencapai tahap <strong className="font-bold text-foreground">Selesai / Pleno</strong>.
          </p>
          <div className="mt-8 flex justify-center gap-4">
             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
               <div className="h-2 w-2 rounded-full bg-border" />
               Verifikasi Berkas
             </div>
             <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
             <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
               <div className="h-2 w-2 rounded-full bg-border" />
               Asesmen Tahap 2
             </div>
             <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
             <div className="flex items-center gap-2 text-xs font-bold text-primary">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               Hasil & Sanggah
             </div>
          </div>
        </div>
      )}

      {/* SANGGAH FORM MODAL */}
      <AnimatePresence>
        {showSanggahForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background rounded-3xl p-8 w-full max-w-2xl border shadow-2xl my-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner">
                  <Scale className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl tracking-tight">Formulir Sanggah</h3>
                  <p className="text-sm text-muted-foreground">Ajukan keberatan atas hasil asesmen untuk ditinjau kembali.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mata Kuliah Disanggah</Label>
                  <select className="w-full flex h-12 items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>-- Pilih Mata Kuliah --</option>
                    {results.filter((r: any) => r.status === "Ditolak").map((r: any, i: number) => (
                      <option key={i}>{r.id} - {r.nama}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alasan & Referensi Bukti Baru</Label>
                  <textarea 
                    className="w-full min-h-[160px] rounded-2xl border border-border bg-background px-4 py-4 text-sm transition-all focus:ring-2 focus:ring-primary/20 shadow-sm resize-none"
                    placeholder="Jelaskan secara rinci mengapa Anda menyanggah keputusan ini dan sebutkan bukti tambahan yang mendukung..."
                  />
                </div>

                <div className="p-5 rounded-2xl bg-muted/50 border border-dashed border-border flex items-center gap-4 group hover:bg-muted transition-colors cursor-pointer relative">
                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <Download className="h-5 w-5 rotate-180" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">Unggah Lampiran Bukti Baru</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">Maksimal 10MB • Format PDF/JPG</p>
                  </div>
                  <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSanggahForm(false)} 
                  className="px-8 h-12 rounded-xl text-sm font-semibold"
                >
                  Batal
                </Button>
                <Button 
                  onClick={() => setShowSanggahForm(false)} 
                  className="px-10 h-12 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/20"
                >
                  Kirim Sanggahan
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
