"use client";

import { SearchableSelect } from "@/components/SearchableSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Save,
  ClipboardList
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardPlenoPage() {
  const queryClient = useQueryClient();
  const [selectedPemohon, setSelectedPemohon] = useState<string>("");
  const [isSahkanOpen, setIsSahkanOpen] = useState(false);
  const [keputusanFinal, setKeputusanFinal] = useState<Record<string, string>>({});
  const [catatanPleno, setCatatanPleno] = useState<Record<string, string>>({});

  // 1. Fetch daftar pemohon waiting pleno
  const { data: pendaftaranList = [], isLoading: loadingList } = useQuery({
    queryKey: ['pleno-list'],
    queryFn: async () => {
      const { data } = await api.get('/admin-prodi/pleno');
      return data.data;
    }
  });

  // 2. Jika ada pemohon terpilih, fetch detail pleno-nya (komparasi MK)
  const { data: detailData, isLoading: loadingDetail } = useQuery({
    queryKey: ['pleno-detail', selectedPemohon],
    queryFn: async () => {
      if (!selectedPemohon) return null;
      const { data } = await api.get(`/admin-prodi/pleno/${selectedPemohon}`);
      return data.data;
    },
    enabled: !!selectedPemohon
  });

  const plenoMkList = detailData?.pleno_mk || [];

  // Sinkronisasi data awal
  useEffect(() => {
    if (plenoMkList.length > 0) {
      const initKep: Record<string, string> = {};
      const initCat: Record<string, string> = {};
      plenoMkList.forEach((mk: any) => {
        if (mk.keputusan_final) initKep[mk.mata_kuliah_id] = mk.keputusan_final;
        if (mk.catatan_pleno) initCat[mk.mata_kuliah_id] = mk.catatan_pleno;
      });
      setKeputusanFinal(initKep);
      setCatatanPleno(initCat);
    }
  }, [detailData, plenoMkList]);

  // Mutations
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const payload = plenoMkList
        .filter((mk: any) => keputusanFinal[mk.mata_kuliah_id] !== undefined || catatanPleno[mk.mata_kuliah_id] !== undefined)
        .map((mk: any) => ({
          mata_kuliah_id: mk.mata_kuliah_id,
          keputusan_final: keputusanFinal[mk.mata_kuliah_id] || mk.keputusan_final,
          catatan_pleno: catatanPleno[mk.mata_kuliah_id] || mk.catatan_pleno || ""
        }));

      if (payload.length > 0) {
        await api.post(`/admin-prodi/pleno/${selectedPemohon}/keputusan`, { items: payload });
      }
    },
    onSuccess: () => {
      toast.success("Draft keputusan pleno berhasil disimpan!");
      queryClient.invalidateQueries({ queryKey: ['pleno-detail', selectedPemohon] });
    },
    onError: () => {
      toast.error("Gagal menyimpan draft keputusan pleno.");
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = plenoMkList
        .filter((mk: any) => keputusanFinal[mk.mata_kuliah_id] !== undefined || catatanPleno[mk.mata_kuliah_id] !== undefined)
        .map((mk: any) => ({
          mata_kuliah_id: mk.mata_kuliah_id,
          keputusan_final: keputusanFinal[mk.mata_kuliah_id] || mk.keputusan_final,
          catatan_pleno: catatanPleno[mk.mata_kuliah_id] || mk.catatan_pleno || ""
        }));

      if (payload.length > 0) {
        await api.post(`/admin-prodi/pleno/${selectedPemohon}/keputusan`, { items: payload });
      }
      return api.post(`/admin-prodi/pleno/${selectedPemohon}/finalize`);
    },
    onSuccess: () => {
      toast.success("Sidang Pleno berhasil disahkan!");
      setIsSahkanOpen(false);
      setSelectedPemohon("");
      queryClient.invalidateQueries({ queryKey: ['pleno-list'] });
    },
    onError: () => {
      toast.error("Gagal mengesahkan sidang pleno.");
    }
  });

  const conflictRows = plenoMkList.filter((mk: any) => mk.status === "konflik" || mk.status === "selisih_mayor");
  const allConflictsResolved = conflictRows.every((mk: any) => {
    const hasDecision = keputusanFinal[mk.mata_kuliah_id] && keputusanFinal[mk.mata_kuliah_id] !== "konflik";
    const hasNote = catatanPleno[mk.mata_kuliah_id]?.trim();
    return hasDecision && hasNote;
  });
  const isAlreadyFinished = detailData?.status_alur === 'finished';
  const canSahkan = selectedPemohon && allConflictsResolved && !isAlreadyFinished;

  const getStatusRowClass = (status: string) => {
    switch (status) {
      case "selisih_mayor": return "bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20";
      case "konflik": return "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20";
      default: return "hover:bg-muted/5";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "selisih_mayor": return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
      case "konflik": return <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />;
      default: return null;
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/admin-prodi/pleno/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Data_Pleno_Asesmen.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Gagal export excel pleno", error);
      toast.error("Gagal mendownload Excel");
    }
  };

  // Download F15 dan F19 menggunakan backend DomPDF (konsisten dengan arsip)
  const handleDownloadPdf = async (kode: string, namaFile: string) => {
    if (!detailData?.id) return;
    const toastId = toast.loading(`Membuat PDF ${kode}...`);
    try {
      const response = await api.get(
        `/admin-prodi/arsip/${detailData.id}/pdf/${kode}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", namaFile);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.parentNode?.removeChild(link);
      toast.success(`PDF ${kode} berhasil diunduh`, { id: toastId });
    } catch {
      toast.error(`Gagal membuat PDF ${kode}`, { id: toastId });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Dashboard Pleno
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Bandingkan hasil penilaian dua asesor, evaluasi selisih nilai, dan sahkan Rekapitulasi Penilaian.
        </p>
      </div>

      {/* Select Pemohon */}
      <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-4">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          Pilih Pendaftar (Status: Menunggu Pleno)
        </label>

        {/* Row 1: Select */}
        <SearchableSelect
          options={pendaftaranList.map((p: any) => ({
            value: p.id.toString(),
            label: p.user?.nama || "Tanpa Nama",
            sublabel: `${p.nomor_pendaftaran}${p.status_alur === 'finished' ? ' - Sudah Disahkan' : ''}`,
          }))}
          value={selectedPemohon}
          onChange={(val) => setSelectedPemohon(val || "")}
          placeholder={loadingList ? "Memuat pemohon..." : "Pilih mahasiswa untuk di-plenokan..."}
          searchPlaceholder="Cari nama atau nomor pendaftaran..."
          loading={loadingList}
        />

        {/* Row 2: Tombol Unduh */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 h-9 text-xs bg-background text-green-700 hover:text-green-800 border-green-200 hover:bg-green-50"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export Rekap (Excel)
          </Button>
          <Button
            size="sm"
            className="gap-2 h-9 text-xs bg-blue-600 text-white hover:bg-blue-700 border-transparent cursor-pointer"
            disabled={!selectedPemohon}
            onClick={() => {
              const nama = detailData?.user?.nama?.replace(/\s+/g, "_") || selectedPemohon;
              handleDownloadPdf("F14", `F14_Rekap_Asesmen_Prodi_${nama}.pdf`);
            }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Rekap Asesmen Prodi (F14)
          </Button>
          <Button
            size="sm"
            className="gap-2 h-9 text-xs bg-emerald-600 text-white hover:bg-emerald-700 border-transparent cursor-pointer"
            disabled={!selectedPemohon}
            onClick={() => {
              const nama = detailData?.user?.nama?.replace(/\s+/g, "_") || selectedPemohon;
              handleDownloadPdf("F15", `F15_Rekap_Asesmen_Pemohon_${nama}.pdf`);
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Rekap Asesmen Pemohon (F15)
          </Button>
        </div>
      </div>

      {selectedPemohon && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mata Kuliah Diakui</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
                {plenoMkList.filter((m: any) => keputusanFinal[m.mata_kuliah_id] ? keputusanFinal[m.mata_kuliah_id] !== "T" : (m.keputusan_final && m.keputusan_final !== "T")).length || 0}
                <span className="text-sm font-medium text-muted-foreground"> MK</span>
              </p>
            </div>
            <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mata Kuliah Ditolak</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                {plenoMkList.filter((m: any) => keputusanFinal[m.mata_kuliah_id] ? keputusanFinal[m.mata_kuliah_id] === "T" : m.keputusan_final === "T").length || 0}
                <span className="text-sm font-medium text-muted-foreground"> MK</span>
              </p>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col justify-center items-center text-center ${conflictRows.length > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200" : "bg-card shadow-sm"}`}>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">Isu Pleno</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-500">
                {conflictRows.length} <span className="text-sm font-medium text-amber-700/80 dark:text-amber-500/80">Perlu Diskusi</span>
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Komparasi Nilai Asesor</h3>
                {isAlreadyFinished && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Pleno telah disahkan - hanya bisa download dokumen
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveDraftMutation.mutate()}
                  disabled={saveDraftMutation.isPending || !selectedPemohon}
                  className="h-9 text-xs gap-1.5 cursor-pointer"
                >
                  {saveDraftMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saveDraftMutation.isPending ? "Menyimpan..." : "Simpan Draft"}
                </Button>

                <Dialog open={isSahkanOpen} onOpenChange={setIsSahkanOpen}>
                  <Button
                    className="h-9 text-xs bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 border-transparent cursor-pointer gap-1.5"
                    disabled={!canSahkan || saveMutation.isPending}
                    onClick={() => setIsSahkanOpen(true)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Sahkan Pleno
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sahkan Nilai Pleno?</DialogTitle>
                      <DialogDescription>
                        Dengan mengesahkan, Anda menyatakan bahwa proses diskusi pleno telah selesai dan nilai akhir disetujui oleh kedua Asesor dan Prodi.
                      </DialogDescription>
                    </DialogHeader>
                    {conflictRows.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-900/50 my-2">
                        <div className="flex gap-2 text-amber-800 dark:text-amber-400">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <p className="text-sm leading-relaxed">
                            Terdapat <strong>{conflictRows.length} MK</strong> dengan isu konflik atau selisih mayor. Pastikan Anda telah mengedit keputusan akhir dan memberikan catatan sebelum mengesahkan.
                          </p>
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsSahkanOpen(false)} disabled={saveMutation.isPending}>Batal</Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        ) : null}
                        {saveMutation.isPending ? "Menyimpan..." : "Ya, Sahkan Pleno"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
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
                  {loadingDetail ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-muted-foreground text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                          <span className="text-xs">Memuat data komparasi Asesor...</span>
                        </div>
                      </td>
                    </tr>
                  ) : plenoMkList.length === 0 ? (
                    <tr><td colSpan={9} className="py-8 text-muted-foreground text-center">Belum ada data Pleno MK yang dihasilkan dari Asesor.</td></tr>
                  ) : plenoMkList.map((mk: any) => (
                    <tr key={mk.id} className={`transition-colors ${getStatusRowClass(mk.status)}`}>
                      <td className="px-4 py-3 text-left border-r bg-muted/30">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(mk.status)}
                          <div>
                            <div className="font-medium text-foreground">{mk.mata_kuliah?.nama}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{mk.mata_kuliah?.kode} • {mk.mata_kuliah?.sks} SKS</div>
                          </div>
                        </div>
                      </td>

                      {/* Asesor 1 */}
                      <td className="px-2 py-3 border-r text-xs">
                        {mk.keputusan_a1 === "diakui" || mk.keputusan_a1 === "diakui_penuh" || mk.keputusan_a1 === "diakui_sebagian" ? (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-none font-medium">Diakui</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-none font-medium">Tidak</Badge>
                        )}
                      </td>
                      <td className="px-2 py-3 border-r font-medium">{mk.nilai_a1 || "-"}</td>
                      <td className="px-2 py-3 border-r text-muted-foreground">{mk.bobot_a1 !== null ? Number(mk.bobot_a1).toFixed(1) : "-"}</td>

                      {/* Asesor 2 */}
                      <td className="px-2 py-3 border-r text-xs">
                        {mk.keputusan_a2 === "diakui" || mk.keputusan_a2 === "diakui_penuh" || mk.keputusan_a2 === "diakui_sebagian" ? (
                          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 border-none font-medium">Diakui</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-none font-medium">Tidak</Badge>
                        )}
                      </td>
                      <td className="px-2 py-3 border-r font-medium">{mk.nilai_a2 || "-"}</td>
                      <td className="px-2 py-3 border-r text-muted-foreground">{mk.bobot_a2 !== null ? Number(mk.bobot_a2).toFixed(1) : "-"}</td>

                      {/* Final */}
                      <td className="px-2 py-3 border-r font-bold text-slate-700 dark:text-slate-300">{mk.rata_rata !== null ? Number(mk.rata_rata).toFixed(1) : "-"}</td>
                      <td className="px-2 py-3">
                        {(mk.status === "konflik" || mk.status === "selisih_mayor") ? (
                          <div className="space-y-2 py-1">
                            <Select
                              value={keputusanFinal[mk.mata_kuliah_id] || ""}
                              onValueChange={(val) => setKeputusanFinal(prev => ({ ...prev, [mk.mata_kuliah_id]: val }))}
                            >
                              <SelectTrigger className={`h-8 text-xs font-semibold w-[130px] mx-auto ${!keputusanFinal[mk.mata_kuliah_id] || keputusanFinal[mk.mata_kuliah_id] === "konflik"
                                ? mk.status === "konflik"
                                  ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                                  : "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                                : "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                                }`}>
                                <SelectValue placeholder="Pilih..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Diakui (A)</SelectItem>
                                <SelectItem value="AB">Diakui (AB)</SelectItem>
                                <SelectItem value="B">Diakui (B)</SelectItem>
                                <SelectItem value="BC">Diakui (BC)</SelectItem>
                                <SelectItem value="C">Diakui (C)</SelectItem>
                                <SelectItem value="T">Tidak Diakui (T)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              value={catatanPleno[mk.mata_kuliah_id] || ""}
                              onChange={(e) => setCatatanPleno(prev => ({ ...prev, [mk.mata_kuliah_id]: e.target.value }))}
                              placeholder="Catatan pleno wajib..."
                              className={`min-h-[50px] text-[11px] resize-y w-[180px] mx-auto ${!catatanPleno[mk.mata_kuliah_id]?.trim() ? "border-red-300 dark:border-red-800" : "border-emerald-500"
                                }`}
                            />
                          </div>
                        ) : (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-none font-bold px-3">
                            {keputusanFinal[mk.mata_kuliah_id] || mk.keputusan_final || mk.rata_rata || "-"}
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
                <p className="text-red-600 dark:text-red-400 font-semibold animate-pulse">⚠ Selesaikan semua konflik dan isi catatan pleno sebelum mengesahkan.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
