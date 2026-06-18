"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { openPrivateFile, privateAppealPath } from "@/lib/private-files";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Info,
  Loader2,
  Scale,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function HasilSanggahPage() {
  const queryClient = useQueryClient();
  // PRD Bab 3.4: Pemohon wajib klik "Saya Mengerti" sebelum form sanggah terbuka
  const [briefingAcknowledged, setBriefingAcknowledged] = useState(false);
  const [showSanggahForm, setShowSanggahForm] = useState(false);
  const [sanggahData, setSanggahData] = useState({ mkId: "", alasan: "" });
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pahamProsedur, setPahamProsedur] = useState(false);

  const { data: pendaftaran, isLoading } = useQuery({
    queryKey: ["hasil-pemohon"],
    queryFn: async () => {
      const { data: res } = await api.get("/pemohon/hasil");
      return res.data;
    },
  });

  const statusAlur = pendaftaran?.status_alur || "pre_submit";
  const skStatus = pendaftaran?.sk_keputusan?.status;
  const canShowFinalResult =
    statusAlur === "finished" &&
    (skStatus === "menunggu_sk" || skStatus === "sk_terbit");

  const results = useMemo(() => {
    if (!canShowFinalResult || !pendaftaran?.pleno_mk) return [];
    return pendaftaran.pleno_mk.map((pmk: any) => ({
      id: pmk.mata_kuliah?.kode,
      mk_id: pmk.mata_kuliah?.id,
      nama: pmk.mata_kuliah?.nama,
      sks: pmk.mata_kuliah?.sks,
      status:
        pmk.keputusan_final && pmk.keputusan_final !== "T"
          ? "Diterima"
          : "Ditolak",
      catatan: pmk.catatan_pleno || "-",
      skSKS:
        pmk.keputusan_final && pmk.keputusan_final !== "T"
          ? pmk.mata_kuliah?.sks || 0
          : 0,
    }));
  }, [canShowFinalResult, pendaftaran]);

  const handleSubmitSanggah = async () => {
    if (!sanggahData.mkId || !sanggahData.alasan) {
      toast.error("Pilih mata kuliah dan isi alasan sanggahan");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("pendaftaran_id", pendaftaran.id.toString());
      formData.append("mata_kuliah_id", sanggahData.mkId);
      formData.append("alasan", sanggahData.alasan);
      formData.append("paham_prosedur", "1"); // pemohon sudah centang checkbox persetujuan
      if (buktiFile) {
        formData.append("bukti_file", buktiFile);
      }

      await api.post("/pemohon/sanggah", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Sanggahan berhasil diajukan");
      setShowSanggahForm(false);
      setSanggahData({ mkId: "", alasan: "" });
      setBuktiFile(null);
      setBriefingAcknowledged(false);
      setPahamProsedur(false);
      queryClient.invalidateQueries({ queryKey: ["hasil-pemohon"] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengajukan sanggahan");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSKSApplied = results.reduce(
    (acc: number, curr: any) => acc + (curr.sks || 0),
    0,
  );
  const totalSKSAccepted = results.reduce(
    (acc: number, curr: any) => acc + curr.skSKS,
    0,
  );

  // Deklarasikan hasResults DULU sebelum canSanggah menggunakannya
  const hasResults = canShowFinalResult && results.length > 0;

  // Deadline sanggah dari gelombang
  const deadlineSanggah = pendaftaran?.gelombang?.tgl_sanggah
    ? new Date(pendaftaran.gelombang.tgl_sanggah)
    : null;
  const isDeadlinePassed = deadlineSanggah
    ? new Date() > deadlineSanggah
    : false;
  const canSanggah = hasResults && skStatus === "menunggu_sk" && !isDeadlinePassed;

  const sanggahStatusText = useMemo(() => {
    if (!pendaftaran?.sanggah || pendaftaran.sanggah.length === 0) {
      return "Belum Ada Sanggahan";
    }
    const statuses = pendaftaran.sanggah.map((s: any) => s.status);
    if (statuses.includes("diajukan")) return "Menunggu Review";
    if (statuses.includes("diterima")) return "Sanggahan Diterima";
    return "Sanggahan Ditolak";
  }, [pendaftaran]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Memuat hasil keputusan asesmen...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Hasil Asesmen & Sanggah
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Lihat hasil keputusan sidang pleno program Rekognisi Pembelajaran
            Lampau (RPL).
          </p>
        </div>
        {hasResults && (
          <div className="flex flex-col items-end gap-2">
            {/* Countdown / Deadline */}
            {deadlineSanggah && (
              <p
                className={`text-xs font-medium ${isDeadlinePassed ? "text-red-500" : "text-muted-foreground"
                  }`}
              >
                {isDeadlinePassed
                  ? `Masa sanggahan telah berakhir (${deadlineSanggah.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })})`
                  : `Deadline sanggah: ${deadlineSanggah.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            )}
            {canSanggah && (
              results.some((r: any) => r.status === "Ditolak") ? (
                <Button
                  onClick={() => setShowSanggahForm(true)}
                  className="gap-2 rounded-xl h-11 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 font-bold"
                >
                  <AlertCircle className="h-4 w-4" /> Ajukan Sanggah
                </Button>
              ) : (
                <Button
                  disabled
                  className="gap-2 rounded-xl h-11 bg-muted text-muted-foreground font-bold cursor-not-allowed"
                >
                  <CheckCircle2 className="h-4 w-4" /> Semua SKS Diakui
                </Button>
              )
            )}
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
                <span className="text-xs font-bold uppercase tracking-widest">
                  SKS Diajukan
                </span>
              </div>
              <p className="text-3xl font-bold">{totalSKSApplied}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Berdasarkan Evaluasi Diri Anda
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  SKS Diakui
                </span>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {totalSKSAccepted}
              </p>
              <p className="text-[11px] text-green-600/70 dark:text-green-400/70 mt-1">
                Ditetapkan oleh Tim Asesor
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3 text-amber-600 dark:text-amber-400">
                <Scale className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Status Sanggah
                </span>
              </div>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                {sanggahStatusText}
              </p>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1">
                Maks. 3 hari setelah pengumuman
              </p>
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
              <h2 className="font-bold">
                Rincian Keputusan Asesmen Mandiri
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
                        <div className="font-bold text-foreground text-sm">
                          {mk.nama}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-1 uppercase opacity-60">
                          {mk.id}
                        </div>
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
                        <p className="text-xs text-muted-foreground italic leading-relaxed max-w-xs">
                          &quot;{mk.catatan}&quot;
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* RIWAYAT SANGGAHAN */}
          {pendaftaran?.sanggah && pendaftaran.sanggah.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border bg-card overflow-hidden shadow-sm p-6 space-y-4"
            >
              <h2 className="font-bold border-b pb-3 text-foreground">
                Riwayat Sanggahan Anda
              </h2>
              <div className="space-y-4">
                {pendaftaran.sanggah.map((s: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border bg-muted/10 space-y-2"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                          {s.mata_kuliah?.kode}
                        </span>
                        <h4 className="font-bold text-sm text-foreground mt-1">
                          {s.mata_kuliah?.nama}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${s.status === "diterima"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                          : s.status === "ditolak"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          }`}
                      >
                        {s.status === "diajukan" ? "Menunggu Review" : s.status}
                      </span>
                    </div>
                    <div className="text-xs text-foreground/80 leading-relaxed bg-background p-3 rounded-lg border">
                      <strong className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider mb-1">
                        Alasan Sanggah:
                      </strong>
                      &quot;{s.alasan}&quot;
                    </div>
                    {s.bukti_path && (
                      <div className="text-xs pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            openPrivateFile(privateAppealPath(s.id))
                          }
                          className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-bold"
                        >
                          <FileText className="w-3.5 h-3.5" /> Lihat Lampiran
                          Bukti Sanggah
                        </button>
                      </div>
                    )}
                    {s.respon_asesor && (
                      <div className="text-xs text-foreground/80 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-lg">
                        <strong className="text-amber-700 dark:text-amber-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                          Respon Asesor:
                        </strong>
                        &quot;{s.respon_asesor}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="rounded-2xl bg-primary/5 p-6 border border-primary/10 flex items-start gap-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-primary mb-1">
                Informasi Pengambilan Sertifikat
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Jika Anda menerima hasil ini, silakan datang ke Bagian Akademik
                POLIBAN untuk pengambilan Sertifikat Pengakuan SKS asli dengan
                membawa bukti fisik dokumen yang telah diunggah.
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
            Data hasil asesmen akan muncul di sini setelah status pendaftaran
            Anda mencapai tahap{" "}
            <strong className="font-bold text-foreground">
              Selesai / Pleno
            </strong>
            .
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

      {/* BRIEFING MODAL — PRD Bab 3.4: Pemohon wajib klik "Saya Mengerti" sebelum form aktif */}
      <AnimatePresence>
        {showSanggahForm && !briefingAcknowledged && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background rounded-3xl p-8 w-full max-w-lg border shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Info className="h-7 w-7 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-xl tracking-tight">
                    Prosedur Sanggahan
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Baca sebelum mengajukan sanggah
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-sm text-foreground/80 leading-relaxed bg-muted/30 p-5 rounded-2xl border">
                <p>
                  <strong className="text-foreground">
                    Jalur 1 - Sanggahan ke Asesor:
                  </strong>{" "}
                  Pemohon mengajukan keberatan langsung ke asesor yang menilai.
                  Asesor akan mempertimbangkan dan memberikan keputusan final
                  yang tidak dapat diganggu gugat.
                </p>
                <p>
                  <strong className="text-foreground">Batas Waktu:</strong>{" "}
                  Sanggahan hanya dapat diajukan dalam masa sanggah yang
                  ditetapkan oleh program studi.
                </p>
                <p>
                  <strong className="text-foreground">
                    Dokumen Pendukung:
                  </strong>{" "}
                  Sertakan bukti konkret yang relevan dengan CP Mata Kuliah yang
                  disanggah.
                </p>
                <p>
                  <strong className="text-foreground">Keputusan Mutlak:</strong>{" "}
                  Keputusan asesor bersifat final dan tidak dapat diajukan
                  sanggah ulang.
                </p>
              </div>
              {/* Checkbox Persetujuan */}
              <label className="flex items-start gap-3 cursor-pointer mt-2 p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                <input
                  id="cb-paham-prosedur"
                  type="checkbox"
                  checked={pahamProsedur}
                  onChange={(e) => setPahamProsedur(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-400 accent-amber-600 shrink-0"
                />
                <span className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Saya menyatakan telah membaca, memahami, dan menyetujui prosedur sanggah/banding di atas, serta memahami bahwa keputusan asesor bersifat final.
                </span>
              </label>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="ghost"
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setShowSanggahForm(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                  disabled={!pahamProsedur}
                  onClick={() => setBriefingAcknowledged(true)}
                >
                  Lanjutkan →
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SANGGAH FORM MODAL */}
      <AnimatePresence>
        {showSanggahForm && briefingAcknowledged && (
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
                  <h3 className="font-bold text-2xl tracking-tight">
                    Formulir Sanggah
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ajukan keberatan atas hasil asesmen untuk ditinjau kembali.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mata Kuliah Disanggah
                  </Label>
                  <select
                    value={sanggahData.mkId}
                    onChange={(e) =>
                      setSanggahData({ ...sanggahData, mkId: e.target.value })
                    }
                    className="w-full flex h-12 items-center justify-between rounded-xl border border-border bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  >
                    <option value="">-- Pilih Mata Kuliah --</option>
                    {results
                      .filter((r: any) => r.status === "Ditolak")
                      .map((r: any, i: number) => (
                        <option key={i} value={r.mk_id}>
                          {r.id} - {r.nama}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Alasan & Referensi Bukti Baru
                  </Label>
                  <textarea
                    value={sanggahData.alasan}
                    onChange={(e) =>
                      setSanggahData({ ...sanggahData, alasan: e.target.value })
                    }
                    className="w-full min-h-[160px] rounded-2xl border border-border bg-background px-4 py-4 text-sm transition-all focus:ring-2 focus:ring-primary/20 shadow-sm resize-none text-foreground"
                    placeholder="Jelaskan secara rinci mengapa Anda menyanggah keputusan ini dan sebutkan bukti tambahan yang mendukung..."
                  />
                </div>

                <div className="p-5 rounded-2xl bg-muted/50 border border-dashed border-border flex items-center gap-4 group hover:bg-muted transition-colors cursor-pointer relative">
                  <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm text-muted-foreground group-hover:text-primary transition-colors">
                    <Download className="h-5 w-5 rotate-180" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">
                      {buktiFile
                        ? buktiFile.name
                        : "Unggah Lampiran Bukti Baru"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                      {buktiFile
                        ? `${(buktiFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "Maksimal 10MB • Format PDF/JPG"}
                    </p>
                  </div>
                  <Input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBuktiFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowSanggahForm(false);
                    setBriefingAcknowledged(false);
                    setBuktiFile(null);
                    setSanggahData({ mkId: "", alasan: "" });
                  }}
                  className="px-8 h-12 rounded-xl text-sm font-semibold"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmitSanggah}
                  disabled={submitting}
                  className="px-10 h-12 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
                >
                  {submitting ? "Mengirim..." : "Kirim Sanggahan"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
