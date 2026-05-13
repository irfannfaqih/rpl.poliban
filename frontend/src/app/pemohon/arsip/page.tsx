"use client";

import { useBorangStore } from "@/store/useBorangStore";
import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import { 
  FileText, 
  ChevronDown, 
  GraduationCap, 
  Briefcase, 
  FileCheck, 
  FolderOpen, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Download,
  CalendarDays,
  File,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { dataProdi } from "@/data/prodi";
import { motion, AnimatePresence } from "framer-motion";

export default function ArsipPage() {
  const { data } = useBorangStore();
  const prodiId = usePendaftaranStore((s) => s.prodiId);
  const [openSection, setOpenSection] = useState<string>("sectionA");

  const toggle = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const selectedProdi = useMemo(() => dataProdi.find(p => p.id === prodiId), [prodiId]);

  /* ------------------------------------------------------------------ */
  /*  Renders                                                            */
  /* ------------------------------------------------------------------ */

  const renderSectionA = () => {
    const d = data.sectionA;
    return (
      <div className="p-6 bg-muted/10 space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="h-32 w-32 rounded-2xl bg-muted border-2 border-border overflow-hidden flex items-center justify-center shrink-0">
             {d.pasFoto ? (
               <div className="relative h-full w-full flex items-center justify-center bg-primary/5 text-primary text-2xl font-bold">
                 {d.namaLengkap?.charAt(0)}
               </div>
             ) : (
               <User className="h-12 w-12 text-muted-foreground/30" />
             )}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[
              { label: "Nama Lengkap", value: d.namaLengkap, icon: User },
              { label: "NIK", value: d.nik, icon: FileText },
              { label: "Tempat, Tgl Lahir", value: `${d.tempatLahir}, ${d.tanggalLahir}`, icon: CalendarDays },
              { label: "Jenis Kelamin", value: d.jenisKelamin === "L" ? "Laki-laki" : "Perempuan", icon: User },
              { label: "No. HP / WA", value: d.noHP, icon: Phone },
              { label: "Email", value: d.emailPribadi, icon: Mail },
            ].map((item, i) => (
              <div key={i} className="border-b border-border/50 pb-2 flex items-center justify-between gap-4">
                <span className="text-muted-foreground flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5" /> {item.label}
                </span>
                <span className="font-semibold text-foreground text-right">{item.value || "-"}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Alamat Lengkap</span>
          <p className="text-sm font-medium leading-relaxed p-3 rounded-xl bg-background border border-border/50">
            {d.alamat || "-"}
          </p>
        </div>
      </div>
    );
  };

  const renderSectionB = () => {
    const items = (data.sectionB.items || []) as any[];
    const transkrip = (data.sectionB.transkrip || []) as any[];
    return (
      <div className="divide-y border-t bg-muted/10">
        <div className="p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5" /> Riwayat Pendidikan Formal
          </h4>
          <div className="grid gap-4">
            {items.length > 0 ? items.map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-border/50 bg-background shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-base text-foreground">{item.institusi}</div>
                    <div className="text-sm text-muted-foreground">{item.jenjang} • {item.jurusan || "Semua Jurusan"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary">{item.tahunMasuk} — {item.tahunLulus}</div>
                    <div className="text-xs text-muted-foreground mt-1">IPK: {item.ipk || "-"}</div>
                  </div>
                </div>
              </div>
            )) : <div className="text-center py-6 italic text-muted-foreground text-sm">Data tidak tersedia</div>}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" /> Transkrip Mata Kuliah (Manual)
          </h4>
          {transkrip.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border/50 bg-background">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-center">Smt</th>
                    <th className="px-4 py-3">Nama Mata Kuliah</th>
                    <th className="px-4 py-3 text-center">SKS</th>
                    <th className="px-4 py-3 text-center">Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transkrip.map((mk, i) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{mk.semester}</td>
                      <td className="px-4 py-2.5 font-medium">{mk.namaMk}</td>
                      <td className="px-4 py-2.5 text-center">{mk.sks}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-primary">{mk.nilaiHuruf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="text-center py-6 italic text-muted-foreground text-sm">Data tidak tersedia</div>}
        </div>
      </div>
    );
  };

  const renderSectionC = () => {
    const items = (data.sectionC.items || []) as any[];
    return (
      <div className="p-6 bg-muted/10 space-y-4">
        <div className="grid gap-4">
          {items.length > 0 ? items.map((item, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 bg-background shadow-sm flex gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div className="font-bold text-foreground">{item.jabatan}</div>
                  <span className="text-xs font-bold text-muted-foreground">{item.tahunMulai} — {item.tahunSelesai || "Sekarang"}</span>
                </div>
                <div className="text-sm text-muted-foreground">{item.namaPerusahaan}</div>
                {item.deskripsi && <p className="text-xs mt-2 text-muted-foreground/80 leading-relaxed italic">"{item.deskripsi}"</p>}
              </div>
            </div>
          )) : <div className="text-center py-10 italic text-muted-foreground text-sm bg-background rounded-xl border border-dashed border-border">Belum ada riwayat pekerjaan</div>}
        </div>
      </div>
    );
  };

  const renderSectionE = () => {
    const wajib = data.sectionE.dokumenWajib || {};
    const tambahan = data.sectionE.dokumenTambahan || [];
    return (
      <div className="p-6 bg-muted/10 space-y-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Dokumen Wajib</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "Ijazah Terakhir", value: wajib.Ijazah },
              { label: "Transkrip Nilai", value: wajib.Transkrip },
            ].map((doc, i) => (
              <div key={i} className="p-3 rounded-xl border border-border/50 bg-background flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{doc.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{doc.value || "Not uploaded"}</div>
                  </div>
                </div>
                {doc.value && <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Download className="h-3.5 w-3.5" /></button>}
              </div>
            ))}
          </div>
        </div>
        
        {tambahan.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Dokumen Tambahan</h4>
            <div className="space-y-2">
              {tambahan.map((doc, i) => (
                <div key={i} className="p-3 rounded-xl border border-border/50 bg-background flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                      {doc.id}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{doc.deskripsi || doc.tipe}</div>
                      <div className="text-[10px] text-muted-foreground">{doc.tipe} • {doc.fileName}</div>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Download className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSectionD = () => {
    if (!selectedProdi) return null;
    const evaluasi = data.sectionD.evaluasi || {};
    return (
      <div className="p-6 bg-muted/10 space-y-6">
        <div className="space-y-4">
          {selectedProdi.kurikulum.map((mk, i) => {
            const filledCount = mk.cpmk.filter(c => !!evaluasi[c.id]?.profisiensi).length;
            const isFullyFilled = filledCount === mk.cpmk.length;
            
            return (
              <div key={i} className="rounded-xl border border-border/50 bg-background overflow-hidden">
                <div className="bg-muted/50 p-4 flex justify-between items-center border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${isFullyFilled ? 'bg-green-500' : 'bg-amber-500'}`} />
                    <span className="font-bold text-sm">{mk.nama}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{filledCount}/{mk.cpmk.length} CPMK</span>
                </div>
                <div className="p-4 space-y-3">
                  {mk.cpmk.map((c, j) => {
                    const evalData = evaluasi[c.id];
                    return (
                      <div key={j} className="text-xs flex gap-4 items-start pb-3 last:pb-0 border-b last:border-0 border-border/30">
                        <span className="text-primary font-mono font-bold pt-0.5">{c.id}</span>
                        <div className="flex-1 space-y-2">
                          <p className="text-foreground leading-relaxed">{c.deskripsi}</p>
                          {evalData && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                                Profisiensi: {
                                  evalData.profisiensi === 1 ? "1 (Tidak Mampu)" :
                                  evalData.profisiensi === 2 ? "2 (Kurang Mampu)" :
                                  evalData.profisiensi === 4 ? "4 (Mampu)" :
                                  evalData.profisiensi === 5 ? "5 (Sangat Mampu)" : "-"
                                }
                              </span>
                              {evalData.dokumenPendukung?.map(docId => (
                                <span key={docId} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50 flex items-center gap-1">
                                  <File className="h-2.5 w-2.5" /> {docId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Main Layout                                                        */
  /* ------------------------------------------------------------------ */

  const archiveSections = [
    { id: "sectionA", label: "A. Data Diri", icon: User, render: renderSectionA },
    { id: "sectionB", label: "B. Riwayat Pendidikan", icon: GraduationCap, render: renderSectionB },
    { id: "sectionC", label: "C. Pengalaman Kerja", icon: Briefcase, render: renderSectionC },
    { id: "sectionE", label: "D. Dokumen Pendukung", icon: FolderOpen, render: renderSectionE },
    { id: "sectionD", label: "E. Evaluasi Diri", icon: FileCheck, render: renderSectionD },
  ];

  return (
    <div className="p-6 pb-20 max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight">Arsip Borang RPL</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Akses cepat seluruh berkas digital dan bukti kompetensi yang telah Anda unggah.
          </p>
        </div>
        <Button variant="outline" className="gap-2 h-10 px-4 rounded-xl shadow-sm border-border">
          <Download className="h-4 w-4" /> Unduh Dokumen (PDF)
        </Button>
      </motion.div>

      <div className="space-y-4">
        {archiveSections.map((sec, i) => {
          const isOpen = openSection === sec.id;
          return (
            <motion.div 
              key={sec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <button 
                onClick={() => toggle(sec.id)}
                className={`flex w-full items-center justify-between p-5 text-left transition-colors ${isOpen ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isOpen ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                    <sec.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-base transition-colors ${isOpen ? 'text-primary' : 'text-foreground'}`}>
                      {sec.label}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold opacity-60">Terakhir diperbarui: Hari ini</p>
                  </div>
                </div>
                <div className={`p-1.5 rounded-full bg-muted transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary/10 text-primary' : ''}`}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="border-t border-border/50">
                      {sec.render()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-border p-8 text-center bg-muted/5">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Info className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <h4 className="font-bold text-sm mb-1">Catatan Keamanan</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Seluruh data yang Anda kirimkan telah dienkripsi dan disimpan dengan aman di server POLIBAN. Anda hanya dapat melihat data ini tetapi tidak dapat mengubahnya lagi setelah status pendaftaran melewati tahap 'Borang'.
        </p>
      </div>
    </div>
  );
}
