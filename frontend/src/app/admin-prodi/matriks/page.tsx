"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  ChevronDown,
  Download,
  Eye,
  Info,
  Loader2,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface PendaftaranItem {
  id: number;
  nomor_pendaftaran: string;
  status_alur: string;
  user?: {
    nama: string;
  };
}

interface PemetaanItem {
  id: number;
  mk_asal_kode: string;
  mk_asal_nama: string;
  kesenjangan: string;
  keputusan: string;
  catatan?: string;
  mk_poliban?: {
    kode: string;
    nama: string;
    sks: number;
  };
  asesorNama: string;
}

export default function MatriksAlihKreditPage() {
  const [selectedPemohon, setSelectedPemohon] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownloadF12 = async () => {
    if (!selectedPemohon) return;
    setIsDownloading(true);
    const toastId = toast.loading("Membuat PDF Formulir F12...");
    try {
      const response = await api.get(
        `/admin-prodi/pendaftaran/${selectedPemohon}/pdf/F12`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const pemohon = pemohonList.find((p) => p.id.toString() === selectedPemohon);
      const nama = pemohon?.user?.nama?.replace(/\s+/g, "_") || selectedPemohon;
      link.setAttribute("download", `F12_Matriks_Alih_Kredit_${nama}.pdf`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.parentNode?.removeChild(link);
      toast.success("PDF berhasil diunduh", { id: toastId });
    } catch {
      toast.error("Gagal membuat PDF. Pastikan data pemetaan sudah lengkap.", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  // Fetch list of applicants in the program study
  const { data: pemohonList = [], isLoading: listLoading } = useQuery<PendaftaranItem[]>({
    queryKey: ["admin-prodi-pendaftaran-list-matriks"],
    queryFn: async () => {
      const { data } = await api.get("/admin-prodi/pendaftaran");
      return data.data;
    }
  });

  // Fetch detailed information of the selected applicant, including matrix mappings
  const { data: pendaftaranDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-prodi-pendaftaran-detail-matriks", selectedPemohon],
    queryFn: async () => {
      if (!selectedPemohon) return null;
      const { data } = await api.get(`/admin-prodi/pendaftaran/${selectedPemohon}`);
      return data.data;
    },
    enabled: !!selectedPemohon,
  });

  const getKesenjangan = (k: string) => {
    const value = k.toLowerCase();
    if (value.includes("sesuai") && !value.includes("sebagian")) return "Sesuai";
    if (value.includes("sebagian")) return "Sebagian Sesuai";
    return "Tidak Sesuai";
  };

  const getKeputusanText = (k: string) => {
    const value = k.toLowerCase();
    if (value.includes("penuh")) return "Diakui Penuh";
    if (value.includes("sebagian")) return "Diakui Sebagian";
    return "Tidak Diakui";
  };

  // Flatten and structure pemetaan MK from all assigned advisors
  const mappings: PemetaanItem[] = pendaftaranDetail?.penugasan_asesor?.flatMap((penugasan: any) =>
    (penugasan.pemetaan_mk || []).map((m: any) => ({
      ...m,
      asesorNama: penugasan.asesor?.nama || `Asesor (ID: ${penugasan.asesor_id})`,
    }))
  ) || [];

  const diakuiCount = mappings.filter(m => m.keputusan.toLowerCase().includes("penuh")).length;
  const sebagianCount = mappings.filter(m => m.keputusan.toLowerCase().includes("sebagian")).length;
  const tidakCount = mappings.filter(m => m.keputusan.toLowerCase().includes("tidak")).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Review Matriks Alih Kredit</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Tinjau hasil pemetaan Mata Kuliah dan pengakuan sks yang telah dikerjakan oleh Asesor Program Studi.
        </p>
      </div>

      {/* Select Pemohon */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-2">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          Pilih Berkas Pendaftar
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            {listLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/20">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Memuat antrean pendaftar...</span>
              </div>
            ) : (
              <div ref={dropdownRef} className="relative">
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => { setDropdownOpen(!dropdownOpen); setSearchQuery(""); }}
                  className="w-full h-10 flex items-center justify-between px-3 border rounded-lg bg-background text-sm hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                >
                  {selectedPemohon ? (() => {
                    const p = pemohonList.find((x) => x.id.toString() === selectedPemohon);
                    return p ? (
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate">{p.user?.nama || "Tanpa Nama"}</span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">{p.nomor_pendaftaran}</span>
                      </span>
                    ) : <span className="text-muted-foreground">Pilih pendaftar...</span>;
                  })() : (
                    <span className="text-muted-foreground">Pilih berkas pendaftar untuk ditinjau...</span>
                  )}
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {selectedPemohon && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setSelectedPemohon(""); }}
                        onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), setSelectedPemohon(""))}
                        className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-background border rounded-xl shadow-lg overflow-hidden">
                    {/* Search box */}
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          autoFocus
                          placeholder="Cari nama atau nomor pendaftaran..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-8 text-sm bg-muted/30 border-0 focus-visible:ring-1"
                        />
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-56 overflow-y-auto">
                      {(() => {
                        const filtered = pemohonList.filter((p) => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            (p.user?.nama || "").toLowerCase().includes(q) ||
                            (p.nomor_pendaftaran || "").toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) return (
                          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                            Tidak ada hasil untuk "{searchQuery}"
                          </div>
                        );

                        return filtered.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedPemohon(p.id.toString()); setDropdownOpen(false); setSearchQuery(""); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors ${selectedPemohon === p.id.toString() ? "bg-primary/5" : ""}`}
                          >
                            <span>
                              <span className={`font-semibold block ${selectedPemohon === p.id.toString() ? "text-primary" : "text-foreground"}`}>
                                {p.user?.nama || "Tanpa Nama"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">{p.nomor_pendaftaran || `RPL-${p.id}`}</span>
                            </span>
                            {selectedPemohon === p.id.toString() && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 ml-2" />
                            )}
                          </button>
                        ));
                      })()}
                    </div>

                    {pemohonList.length > 0 && (
                      <div className="px-3 py-1.5 border-t bg-muted/20">
                        <span className="text-[10px] text-muted-foreground">
                          {searchQuery
                            ? `${pemohonList.filter(p => (p.user?.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.nomor_pendaftaran || "").toLowerCase().includes(searchQuery.toLowerCase())).length} dari ${pemohonList.length} pendaftar`
                            : `${pemohonList.length} pendaftar tersedia`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            className="gap-2 h-10 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 border-transparent shrink-0"
            disabled={!selectedPemohon || mappings.length === 0 || isDownloading}
            onClick={handleDownloadF12}
          >
            {isDownloading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Membuat PDF...</>
            ) : (
              <><Download className="h-4 w-4" /> Cetak Formulir F12</>
            )}
          </Button>
        </div>
      </div>

      {selectedPemohon && (
        <>
          {detailLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs text-muted-foreground">Mengambil data pemetaan...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {pendaftaranDetail?.user?.nama || "Tanpa Nama"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {pendaftaranDetail?.nomor_pendaftaran || `RPL-${pendaftaranDetail?.id}`} • {pendaftaranDetail?.user?.email}
                  </p>
                </div>
              </div>

              {mappings.length === 0 ? (
                <div className="bg-card rounded-2xl border shadow-sm p-12 text-center text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <Info className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3" />
                  <h3 className="font-semibold text-sm">Belum Ada Hasil Pemetaan</h3>
                  <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm mx-auto">
                    Tim Asesor yang ditugaskan belum mengisi atau menyerahkan draf hasil pemetaan alih kredit di workspace mereka.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Info Banner */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-200 dark:border-indigo-900 rounded-xl p-4 flex gap-4">
                    <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Mode Review Dokumen</h3>
                      <p className="text-xs text-indigo-800 dark:text-indigo-400/90 leading-relaxed">
                        Menampilkan hasil pemetaan formal alih kredit dari perguruan tinggi asal ke prodi Anda yang diunggah oleh Tim Asesor.
                        Keputusan final pengakuan alih kredit dan nilai penyetaraan akan ditetapkan secara resmi pada menu <strong>Sidang Pleno</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Summary Mappings Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl border p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{diakuiCount}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase font-bold tracking-wider">Diakui Penuh</div>
                    </div>
                    <div className="bg-card rounded-xl border p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{sebagianCount}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase font-bold tracking-wider">Diakui Sebagian</div>
                    </div>
                    <div className="bg-card rounded-xl border p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-500">{tidakCount}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase font-bold tracking-wider">Tidak Diakui</div>
                    </div>
                  </div>

                  {/* Mapping Table */}
                  <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">Matriks Pemetaan Alih Kredit Asesor</h3>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 font-semibold border-r w-12 text-center">No</th>
                            <th className="px-4 py-3 font-semibold border-r">Mata Kuliah Asal (PT Asal)</th>
                            <th className="px-4 py-3 font-semibold border-r text-center w-12">→</th>
                            <th className="px-4 py-3 font-semibold border-r">Mata Kuliah Poliban (Tujuan)</th>
                            <th className="px-4 py-3 font-semibold border-r text-center">Kesenjangan</th>
                            <th className="px-4 py-3 font-semibold border-r text-center">Keputusan</th>
                            <th className="px-4 py-3 font-semibold border-r">Catatan / Asesor Penilai</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {mappings.map((row, idx) => (
                            <tr key={`${row.id}-${idx}`} className="group hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-4 text-center text-muted-foreground border-r font-mono">{idx + 1}</td>
                              <td className="px-4 py-4 border-r">
                                <div className="font-semibold text-foreground text-xs sm:text-sm">{row.mk_asal_nama}</div>
                                <div className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-0.5">{row.mk_asal_kode}</div>
                              </td>
                              <td className="px-4 py-4 text-center border-r">
                                <ArrowRightLeft className="h-4 w-4 text-indigo-400 mx-auto shrink-0" />
                              </td>
                              <td className="px-4 py-4 border-r">
                                {row.mk_poliban ? (
                                  <>
                                    <div className="font-semibold text-foreground text-xs sm:text-sm">{row.mk_poliban.nama}</div>
                                    <div className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-0.5">{row.mk_poliban.kode} • {row.mk_poliban.sks} SKS</div>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">-</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center border-r">
                                {getKesenjangan(row.kesenjangan)}
                              </td>
                              <td className="px-4 py-4 text-center border-r">
                                {getKeputusanText(row.keputusan)}
                              </td>
                              <td className="px-4 py-4 space-y-1">
                                <p className="text-xs text-foreground/80 leading-relaxed italic">"{row.catatan || "Tidak ada catatan."}"</p>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                                  <UserCheck className="h-3 w-3 text-indigo-500 shrink-0" />
                                  <span>{row.asesorNama}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
