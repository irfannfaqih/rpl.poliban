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

  // Automatically select the first item if none is selected
  const selectedSanggah = useMemo(() => {
    if (selectedId !== null) {
      return sanggahList.find((s: any) => s.id === selectedId) || null;
    }
    return sanggahList[0] || null;
  }, [sanggahList, selectedId]);

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
          {filteredSanggah.map((s: any) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedId(s.id);
                setReviewNote("");
                setNewGrade("");
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selectedSanggah?.id === s.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-background hover:bg-muted/50 hover:border-primary/30"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">SNG-{s.id}</span>
                <span className="text-[10px] text-muted-foreground">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>
              <p className="font-bold text-sm text-foreground">{s.pendaftaran?.user?.nama || "Pemohon"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.mata_kuliah?.nama}</p>

              <div className="mt-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${s.status === "diajukan" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                  s.status === "diterima" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
                    "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  }`}>
                  {s.status === "diajukan" ? "Menunggu Review" : s.status.toUpperCase()}
                </span>
              </div>
            </button>
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
        {selectedSanggah ? (
          <>
            <div className="p-6 border-b flex justify-between items-center bg-muted/10">
              <div>
                <h2 className="text-xl font-bold">{selectedSanggah.pendaftaran?.user?.nama || "Pemohon"}</h2>
                <p className="text-sm text-muted-foreground mt-1">Mengajukan sanggah untuk MK: <strong className="text-foreground">{selectedSanggah.mata_kuliah?.nama}</strong></p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${selectedSanggah.status === "diajukan" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400" :
                selectedSanggah.status === "diterima" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400" :
                  "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400"
                }`}>
                Status: {selectedSanggah.status === "diajukan" ? "Menunggu Review" : selectedSanggah.status.toUpperCase()}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Alasan & Bukti */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold border-b pb-2 mb-3 text-foreground">Alasan Sanggahan</h3>
                  <div className="bg-muted/30 p-4 rounded-xl border text-sm leading-relaxed text-foreground/80 font-medium">
                    "{selectedSanggah.alasan}"
                  </div>
                </div>

                {selectedSanggah.bukti_path && (
                  <div>
                    <h3 className="text-sm font-bold border-b pb-2 mb-3 text-foreground">Lampiran Bukti Baru</h3>
                    <button
                      type="button"
                      onClick={() =>
                        openPrivateFile(privateAppealPath(selectedSanggah.id))
                      }
                      className="flex items-center gap-3 p-3 border rounded-xl bg-background w-fit hover:border-primary/50 cursor-pointer group transition-colors"
                    >
                      <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold group-hover:text-primary transition-colors">Lihat Berkas Lampiran</p>
                        <p className="text-[10px] text-muted-foreground">PDF / JPG Document</p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground ml-4 group-hover:text-primary transition-colors" />
                    </button>
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
