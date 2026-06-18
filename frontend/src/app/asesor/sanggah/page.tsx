"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { openPrivateFile, privateAppealPath } from "@/lib/private-files";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, Scale, Search, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function SanggahanDashboard() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [newGrade, setNewGrade] = useState("");

  const { data: sanggahList = [], isLoading, error } = useQuery({
    queryKey: ["asesor-sanggah-list"],
    queryFn: async () => {
      const { data } = await api.get("/asesor/sanggah");
      return data.data || [];
    }
  });

  const filteredSanggah = useMemo(() => {
    return sanggahList.filter((s: any) => {
      const nama = s.pendaftaran?.user?.nama || "";
      const mkName = s.mata_kuliah?.nama || "";
      return nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mkName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [sanggahList, searchTerm]);

  const groupedSanggah = useMemo(() => {
    const groups = new Map<string, any[]>();
    filteredSanggah.forEach((s: any) => {
      const created = s.created_at ? new Date(s.created_at) : new Date(0);
      created.setSeconds(0, 0);
      const key = `${s.pendaftaran_id || s.pendaftaran?.id || "unknown"}-${created.toISOString()}`;
      groups.set(key, [...(groups.get(key) || []), s]);
    });

    return Array.from(groups.entries()).map(([key, items]) => {
      const pending = items.filter((s: any) => s.status === "diajukan").length;
      const accepted = items.filter((s: any) => s.status === "diterima").length;
      const rejected = items.filter((s: any) => s.status === "ditolak").length;
      return {
        key,
        items,
        pemohon: items[0]?.pendaftaran?.user?.nama || "Pemohon",
        createdAt: items[0]?.created_at,
        pending,
        accepted,
        rejected,
      };
    });
  }, [filteredSanggah]);

  const selectedGroup = useMemo(() => {
    if (selectedId !== null) {
      return groupedSanggah.find((group: any) =>
        group.items.some((s: any) => s.id === selectedId),
      ) || null;
    }
    return groupedSanggah[0] || null;
  }, [groupedSanggah, selectedId]);

  const selectedSanggah = useMemo(() => {
    if (!selectedGroup) return null;
    if (selectedId !== null) {
      return selectedGroup.items.find((s: any) => s.id === selectedId) || selectedGroup.items[0] || null;
    }
    return selectedGroup.items[0] || null;
  }, [selectedGroup, selectedId]);

  const decideMutation = useMutation({
    mutationFn: async ({ status, respon_asesor, nilai_mutu_baru }: { status: "diterima" | "ditolak", respon_asesor: string, nilai_mutu_baru?: string }) => {
      const { data } = await api.put(`/asesor/sanggah/${selectedSanggah.id}`, {
        status,
        respon_asesor,
        nilai_mutu_baru,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success("Keputusan sanggah berhasil dikirim!");
      setReviewNote("");
      setNewGrade("");
      queryClient.invalidateQueries({ queryKey: ["asesor-sanggah-list"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memproses keputusan sanggah.");
    }
  });

  const handleDecision = (status: "diterima" | "ditolak") => {
    if (!reviewNote.trim()) {
      toast.error("Catatan keputusan wajib diisi!");
      return;
    }

    if (status === "diterima" && !newGrade) {
      toast.error("Nilai Mutu Baru wajib dipilih jika sanggahan diterima!");
      return;
    }

    decideMutation.mutate({
      status,
      respon_asesor: reviewNote,
      nilai_mutu_baru: status === "diterima" ? newGrade : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground animate-pulse">Memuat daftar sanggahan masuk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold">Gagal Memuat Data</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Terjadi kesalahan saat mengambil data sanggahan dari server. Silakan coba kembali.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto flex gap-8 h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* Left List */}
      <div className="w-1/3 flex flex-col bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b space-y-4 bg-muted/20">
          <div>
            <h2 className="font-bold text-lg">
              Daftar Sanggahan
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Tinjau keberatan pemohon</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari pemohon atau MK..."
              className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {groupedSanggah.map((group: any) => (
            <div key={group.key} className="rounded-xl border bg-background p-3 space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-bold text-sm text-foreground">{group.pemohon}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Pengajuan Sanggah - {group.items.length} MK
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {group.createdAt ? new Date(group.createdAt).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {group.pending > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{group.pending} pending</span>}
                {group.accepted > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">{group.accepted} diterima</span>}
                {group.rejected > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">{group.rejected} ditolak</span>}
              </div>

              <div className="space-y-1.5">
                {group.items.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedId(s.id);
                      setReviewNote("");
                      setNewGrade("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${selectedSanggah?.id === s.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-muted/20 hover:bg-muted/50 hover:border-primary/30"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">{s.mata_kuliah?.nama}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${s.status === "diajukan" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                        s.status === "diterima" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                          "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                        }`}>
                        {s.status === "diajukan" ? "Pending" : s.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">SNG-{s.id}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {filteredSanggah.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Tidak ada sanggahan yang masuk.
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="flex-1 flex flex-col bg-card rounded-2xl border shadow-sm overflow-hidden">
        {selectedGroup ? (
          <>
            <div className="p-6 border-b flex justify-between items-center bg-muted/10">
              <div>
                <h2 className="text-xl font-bold">{selectedGroup.pemohon}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Pengajuan sanggah berisi <strong className="text-foreground">{selectedGroup.items.length} mata kuliah</strong>
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {selectedGroup.pending > 0 && <span className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400">{selectedGroup.pending} Pending</span>}
                {selectedGroup.accepted > 0 && <span className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400">{selectedGroup.accepted} Diterima</span>}
                {selectedGroup.rejected > 0 && <span className="px-3 py-1.5 rounded-lg text-xs font-bold border bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400">{selectedGroup.rejected} Ditolak</span>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="space-y-3">
                <h3 className="text-sm font-bold border-b pb-2 text-foreground">Mata Kuliah dalam Pengajuan</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedGroup.items.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(s.id);
                        setReviewNote("");
                        setNewGrade("");
                      }}
                      className={`text-left rounded-xl border p-4 transition-all ${selectedSanggah?.id === s.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-background hover:border-primary/40"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-sm text-foreground">{s.mata_kuliah?.nama}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">SNG-{s.id}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${s.status === "diajukan" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                          s.status === "diterima" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                            "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                          }`}>
                          {s.status === "diajukan" ? "Pending" : s.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alasan & Bukti */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold border-b pb-2 mb-3 text-foreground">Alasan Sanggahan MK Terpilih</h3>
                  <div className="bg-muted/30 p-4 rounded-xl border text-sm leading-relaxed text-foreground/80 font-medium">
                    "{selectedSanggah.alasan}"
                  </div>
                </div>

                {selectedSanggah?.bukti_files?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold border-b pb-2 mb-3 text-foreground">Lampiran Bukti Baru</h3>
                    <div className="flex gap-2 flex-wrap">
                      {selectedSanggah.bukti_files.map((file: any) => (
                        <button
                          key={file.index}
                          type="button"
                          onClick={() =>
                            openPrivateFile(privateAppealPath(selectedSanggah.id, file.index))
                          }
                          className="flex items-center gap-3 p-3 border rounded-xl bg-background w-fit hover:border-primary/50 cursor-pointer group transition-colors"
                        >
                          <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold group-hover:text-primary transition-colors max-w-[180px] truncate">{file.name || `Bukti ${file.index + 1}`}</p>
                            <p className="text-[10px] text-muted-foreground">{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Dokumen bukti"}</p>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                        <span className="px-3 py-1 text-xs font-bold rounded-md border bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                          Ya
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 bg-background rounded-lg border">
                    <Label className="text-xs font-bold text-muted-foreground block mb-2">Sanggah diajukan kepada:</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="diajukan" className="w-4 h-4" defaultChecked disabled />
                        <span className="text-sm text-foreground">Pemimpin Perguruan Tinggi (POLIBAN)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Keputusan Asesor */}
              <div className="border-t pt-6 space-y-4 pb-10">
                <h3 className="text-sm font-bold text-foreground">Keputusan Tinjauan Asesor</h3>
                <div className="bg-background border p-5 rounded-2xl space-y-4">
                  {selectedSanggah.status === "diajukan" ? (
                    <>
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground block mb-2">Nilai Mutu Baru</Label>
                        <select
                          value={newGrade}
                          onChange={(e) => setNewGrade(e.target.value)}
                          className="w-full flex h-11 items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">-- Pilih Nilai Baru --</option>
                          <option value="A">A (4.00) - Sangat Memuaskan</option>
                          <option value="AB">AB (3.50) - Memuaskan</option>
                          <option value="B">B (3.00) - Baik</option>
                          <option value="BC">BC (2.50) - Cukup Baik</option>
                          <option value="C">C (2.00) - Cukup</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-muted-foreground block mb-2">Catatan Tinjauan Asesor</Label>
                        <textarea
                          className="w-full min-h-[100px] p-3 text-sm rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                          placeholder="Jelaskan dasar pertimbangan Anda setelah melihat bukti baru ini..."
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-4 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 gap-2 h-11 font-bold"
                          onClick={() => handleDecision("ditolak")}
                          disabled={decideMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" /> Tolak Sanggahan
                        </Button>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2 h-11 font-bold"
                          onClick={() => handleDecision("diterima")}
                          disabled={decideMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Terima Sanggahan
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground block">Catatan Tinjauan Asesor</Label>
                        <p className="text-sm bg-muted/40 p-4 rounded-xl border italic mt-1 text-foreground">
                          "{selectedSanggah.respon_asesor || "-"}"
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sanggahan ini telah diputus final dan tidak dapat diubah kembali.
                      </div>
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
