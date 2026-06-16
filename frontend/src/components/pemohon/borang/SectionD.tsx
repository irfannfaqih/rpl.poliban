"use client";

import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useBorangStore } from "@/store/useBorangStore";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpen, ChevronDown, ChevronUp, FileCheck, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Profisiensi = 1 | 2 | 4 | 5 | null;

interface CpmkEval {
  profisiensi: Profisiensi;
  dokumenPendukung: string[];
}

interface CpmkItem {
  id: string;
  deskripsi: string;
}

interface MataKuliahItem {
  kode: string;
  nama: string;
  sks: number;
  deskripsi: string;
  cpmk: CpmkItem[];
}

// Skala profisiensi sesuai master formulir F03 Asesmen Mandiri
// 1 = tidak mampu, 2 = kurang mampu, 4 = mampu, 5 = sangat mampu
const PROFISIENSI_OPTIONS = [
  {
    value: 1 as Profisiensi,
    label: "1",
    desc: "Tidak mampu melakukan unjuk kerja",
    activeClass: "border-red-500 bg-red-50 text-red-700 shadow-sm ring-1 ring-red-500/20",
    hoverClass: "hover:border-red-300 hover:bg-red-50/50",
  },
  {
    value: 2 as Profisiensi,
    label: "2",
    desc: "Kurang mampu melakukan unjuk kerja",
    activeClass: "border-amber-500 bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-500/20",
    hoverClass: "hover:border-amber-300 hover:bg-amber-50/50",
  },
  {
    value: 4 as Profisiensi,
    label: "4",
    desc: "Mampu melakukan unjuk kerja",
    activeClass: "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20",
    hoverClass: "hover:border-blue-300 hover:bg-blue-50/50",
  },
  {
    value: 5 as Profisiensi,
    label: "5",
    desc: "Sangat mampu melakukan unjuk kerja",
    activeClass: "border-green-500 bg-green-50 text-green-700 shadow-sm ring-1 ring-green-500/20",
    hoverClass: "hover:border-green-300 hover:bg-green-50/50",
  },
];

export default function SectionD() {
  const data = useBorangStore((s) => s.data.sectionD);
  const updateSection = useBorangStore((s) => s.updateSection);
  const sectionEData = useBorangStore((s) => s.data.sectionE);

  const [expandedMk, setExpandedMk] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch kurikulum from API instead of hardcoded data
  const { data: kurikulum = [], isLoading: kurikulumLoading } = useQuery<MataKuliahItem[]>({
    queryKey: ["pemohon", "kurikulum"],
    queryFn: async () => {
      const { data: res } = await api.get("/pemohon/kurikulum");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Derive document list from Section E data (stable via useMemo)
  const dokumenList = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    const wajib = (sectionEData.dokumenWajib || {}) as any;

    if (wajib.KTP) list.push({ id: "KTP", label: "KTP" });
    if (wajib.Ijazah) list.push({ id: "Ijazah", label: "Ijazah Terakhir" });
    if (wajib.Transkrip) list.push({ id: "Transkrip", label: "Transkrip Nilai" });
    if (wajib.PasFoto) list.push({ id: "PasFoto", label: "Pas Foto" });

    const tambahan = sectionEData.dokumenTambahan || [];
    tambahan.forEach((dok) => {
      if (dok.fileName) {
        // Gunakan dbId jika tersedia (sudah di-upload dan ada di database)
        // fallback ke DOK-id sementara
        const key = dok.dbId || dok.id;
        list.push({ id: key, label: `${dok.deskripsi || dok.tipe}` });
      }
    });

    return list;
  }, [sectionEData]);

  const evaluasi: Record<string, CpmkEval> = data.evaluasi || {};

  const filteredKurikulum = useMemo(() => {
    if (!searchQuery.trim()) return kurikulum;
    const q = searchQuery.toLowerCase();
    return kurikulum.filter(
      (mk) =>
        mk.nama.toLowerCase().includes(q) ||
        mk.kode.toLowerCase().includes(q)
    );
  }, [kurikulum, searchQuery]);

  const updateCpmkEval = (
    cpmkId: string,
    field: keyof CpmkEval,
    value: Profisiensi | string[]
  ) => {
    const current: CpmkEval = evaluasi[cpmkId] || {
      profisiensi: null,
      dokumenPendukung: [],
    };
    updateSection("sectionD", {
      ...data,
      evaluasi: {
        ...evaluasi,
        [cpmkId]: { ...current, [field]: value },
      },
    });
  };

  const toggleDokumen = (cpmkId: string, dokId: string) => {
    const current: CpmkEval = evaluasi[cpmkId] || {
      profisiensi: null,
      dokumenPendukung: [],
    };
    const list = current.dokumenPendukung || [];
    const next = list.includes(dokId)
      ? list.filter((id) => id !== dokId)
      : [...list, dokId];
    updateCpmkEval(cpmkId, "dokumenPendukung", next);
  };

  const totalCpmk = useMemo(() => {
    return kurikulum.reduce((acc, mk) => acc + mk.cpmk.length, 0);
  }, [kurikulum]);

  const filledCount = useMemo(() => {
    return Object.values(evaluasi).filter((e) => e.profisiensi !== null).length;
  }, [evaluasi]);

  // Sync totalCpmk to store for validation
  useEffect(() => {
    if (totalCpmk > 0 && (data as any).totalCpmk !== totalCpmk) {
      updateSection("sectionD", { ...data, totalCpmk });
    }
  }, [totalCpmk, data, updateSection]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            D. Formulir Evaluasi Diri
          </h2>
          <p className="text-sm text-muted-foreground">
            Evaluasi diri terhadap Capaian Pembelajaran Mata Kuliah (CPMK).
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 p-4 text-sm">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-3 flex-1">
            <p className="font-semibold text-blue-700 dark:text-blue-300 text-base">Petunjuk Pengisian:</p>
            <ol className="list-decimal list-inside leading-relaxed text-foreground/80 space-y-2">
              <li>Pilih tingkat <strong>profisiensi</strong> (kemampuan) Anda untuk setiap CPMK, dengan nilai 1 (belum menguasai) hingga 5 (sangat ahli).</li>
              <li>Centang <strong>dokumen bukti</strong> yang memperkuat klaim Anda (diambil dari berkas Dokumen Pendukung).</li>
            </ol>
            <div className="pt-2 flex items-center gap-3 font-medium text-foreground">
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-full text-blue-800 dark:text-blue-300">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs">Progress: {filledCount} / {totalCpmk} CPMK Terisi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning jika belum ada dokumen */}
      {dokumenList.length === 0 && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm">
          <div className="flex gap-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">Belum Ada Dokumen Terunggah</p>
              <p className="text-foreground/80 mt-1">
                Anda belum mengunggah dokumen apapun di bagian Dokumen Pendukung.
                Sebaiknya lengkapi terlebih dahulu agar Anda bisa menghubungkan dokumen bukti ke setiap CPMK.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-md pb-4 pt-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Cari mata kuliah..."
            className="w-full h-11 rounded-xl shadow-sm border border-border/60 bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {kurikulumLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm font-medium">Memuat data kurikulum...</p>
        </div>
      )}

      {/* Empty state */}
      {!kurikulumLoading && kurikulum.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed bg-muted/20">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">Belum Ada Kurikulum</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Admin Program Studi belum memasukkan data mata kuliah dan CPMK untuk prodi Anda. Silakan hubungi admin prodi.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {filteredKurikulum.map((mk) => {
          const isExpanded = expandedMk === mk.kode;
          const mkCpmkIds = mk.cpmk.map(c => c.id);
          const filledInMk = mkCpmkIds.filter(id => evaluasi[id]?.profisiensi).length;
          const isComplete = filledInMk === mk.cpmk.length;

          return (
            <div
              key={mk.kode}
              className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded
                ? "border-primary shadow-lg ring-1 ring-primary/10"
                : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                }`}
            >
              <button
                onClick={() => setExpandedMk(isExpanded ? null : mk.kode)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isComplete ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                    }`}>
                    <span className="text-xs font-bold">{mk.sks} SKS</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors">
                      {mk.nama}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                      {mk.kode} • {filledInMk}/{mk.cpmk.length} CPMK Terisi
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-primary" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 bg-primary/5 border-t border-border/50">
                  <div className="rounded-xl bg-background border border-border p-4 mb-5 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1 italic">
                      Deskripsi Mata Kuliah:
                    </p>
                    {mk.deskripsi}
                  </div>

                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                    Capaian Pembelajaran Mata Kuliah (CPMK)
                  </h4>
                  <div className="space-y-4">
                    {mk.cpmk.map((cpmk, idx) => {
                      const val: CpmkEval = evaluasi[cpmk.id] || {
                        profisiensi: null,
                        dokumenPendukung: [],
                      };
                      return (
                        <div
                          key={cpmk.id}
                          className="rounded-xl bg-background p-4 border border-border shadow-sm"
                        >
                          <p className="font-medium text-sm mb-4 leading-relaxed">
                            <span className="text-primary font-bold mr-2">
                              CPMK-{idx + 1}
                            </span>
                            {cpmk.deskripsi}
                          </p>

                          {/* Profisiensi */}
                          <div className="mb-4">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                              Profisiensi Pengetahuan & Keterampilan
                            </Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {PROFISIENSI_OPTIONS.map((opt) => {
                                const isSelected = val.profisiensi === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => updateCpmkEval(cpmk.id, "profisiensi", opt.value)}
                                    className={`relative flex flex-col items-center justify-center py-3.5 rounded-xl border-2 text-xs font-bold transition-all duration-300 transform active:scale-95 ${isSelected
                                      ? opt.activeClass
                                      : `border-border bg-card text-muted-foreground ${opt.hoverClass}`
                                      }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Dokumen Pendukung — Checkbox */}
                          <div>
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                              Dokumen Bukti Pendukung
                            </Label>
                            {dokumenList.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {dokumenList.map((dok) => {
                                  const isChecked = (val.dokumenPendukung || []).includes(dok.id);
                                  return (
                                    <button
                                      key={dok.id}
                                      type="button"
                                      onClick={() => toggleDokumen(cpmk.id, dok.id)}
                                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 ${isChecked
                                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                                        }`}
                                    >
                                      <span className={`flex h-4 w-4 items-center justify-center rounded border-2 text-[10px] transition-colors ${isChecked
                                        ? "border-primary bg-primary text-white"
                                        : "border-muted-foreground/30"
                                        }`}>
                                        {isChecked && "✓"}
                                      </span>
                                      {dok.label}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic py-2 px-3 rounded-lg bg-muted/50">
                                Belum ada dokumen terunggah. Silakan lengkapi bagian Dokumen Pendukung terlebih dahulu.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
