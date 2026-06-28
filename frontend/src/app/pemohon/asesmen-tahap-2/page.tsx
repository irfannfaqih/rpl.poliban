"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { At2Countdown } from "@/components/at2/At2Countdown";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  PenLine,
  Send,
  UserCheck,
  UserX,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Countdown hook ───────────────────────────────────────────────────────────
// ─── Format waktu dari "HH:MM" + durasi ──────────────────────────────────────
function formatWaktu(waktu: string | null, durasi?: number | null) {
  if (!waktu) return "-";
  // Format lama dengan tanda strip atau WITA — tampilkan langsung
  if (waktu.includes("-") || /wita|wib/i.test(waktu)) return waktu;
  const parts = waktu.split(":").map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return waktu;
  const [jam, menit] = parts;
  const mulaiStr = `${String(jam).padStart(2, "0")}:${String(menit).padStart(2, "0")}`;
  if (!durasi) return `${mulaiStr} WITA`;
  const selesaiTotal = jam * 60 + menit + durasi;
  return `${mulaiStr} - ${String(Math.floor(selesaiTotal / 60) % 24).padStart(2, "0")}:${String(selesaiTotal % 60).padStart(2, "0")} WITA`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function UjianTulisPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const ujiLanjutanQueryKey = ["pemohon", userId, "uji-lanjutan"] as const;
  const [jawaban, setJawaban] = useState<Record<number, string>>({});
  const [isMengerjakan, setIsMengerjakan] = useState(false);
  const [showKonfirmasiModal, setShowKonfirmasiModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [alasanReschedule, setAlasanReschedule] = useState("");
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);
  const [waktuHabis, setWaktuHabis] = useState(false);
  const jawabanRef = useRef<Record<number, string>>({});
  const dirtyIdsRef = useRef<Set<number>>(new Set());
  const autosaveInFlightRef = useRef(false);

  const { data: ujian, isLoading, isError, refetch } = useQuery({
    queryKey: ujiLanjutanQueryKey,
    queryFn: async () => {
      const res = await api.get("/pemohon/uji-lanjutan");
      return res.data?.data;
    },
    enabled: Boolean(userId),
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      const fase = data?.fase_tulis;
      if (fase === "menunggu_jawaban" && !data?.ujian_dimulai_at) return 15_000;
      return false;
    },
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  const fase = ujian?.fase_tulis;
  const soalList = ujian?.items || [];
  const adaC3 = soalList.length > 0;
  const sudahDikirim = fase === "koreksi" || fase === "selesai";
  const isTidakHadir = fase === "tidak_hadir";
  const ujianDimulai = !!ujian?.ujian_dimulai_at;
  const dalamWindow = ujian?.dalam_window;
  const windowSelesai = ujian?.window_selesai || null;

  // ─── localStorage key unik per ujian ─────────────────────────────────────
  const localKey = userId && ujian?.id ? `at2_draft_${userId}_${ujian.id}` : null;

  // Pulihkan jawaban dari localStorage saat ujian dimuat
  useEffect(() => {
    if (!localKey || !ujian?.items?.length) return;
    const stored = localStorage.getItem(localKey);
    if (!stored) return;
    try {
      const parsed: Record<number, string> = JSON.parse(stored);
      // Hanya pulihkan jika ujian masih aktif (belum submit)
      if (fase === "menunggu_jawaban") {
        setJawaban((prev) => {
          // Merge: data server lebih prioritas jika sudah ada
          const serverJawaban: Record<number, string> = {};
          (ujian.items || []).forEach((s: any) => {
            if (s.jawaban_pemohon) serverJawaban[s.id] = s.jawaban_pemohon;
          });
          return { ...parsed, ...serverJawaban };
        });
        toast.info("Jawaban draft dipulihkan dari sesi sebelumnya.", { duration: 3000 });
      }
    } catch {
      localStorage.removeItem(localKey);
    }
  }, [localKey, ujian?.id, ujian?.items?.length, fase]);

  // Simpan ke localStorage setiap kali jawaban berubah (instant, offline-safe)
  useEffect(() => {
    if (!localKey || Object.keys(jawaban).length === 0) return;
    localStorage.setItem(localKey, JSON.stringify(jawaban));
    jawabanRef.current = jawaban;
  }, [jawaban, localKey]);

  const saveDirtyDraft = useCallback(async () => {
    if (
      !ujian?.id ||
      fase !== "menunggu_jawaban" ||
      !dalamWindow ||
      autosaveInFlightRef.current ||
      dirtyIdsRef.current.size === 0
    ) {
      return;
    }

    const dirtyIds = Array.from(dirtyIdsRef.current);
    const snapshot = new Map(
      dirtyIds.map((id) => [id, jawabanRef.current[id] || ""]),
    );
    autosaveInFlightRef.current = true;
    try {
      const response = await api.patch(
        `/pemohon/uji-lanjutan/${ujian.id}/draft`,
        {
          jawaban: dirtyIds.map((id) => ({
            id,
            jawaban_pemohon: snapshot.get(id) || "",
          })),
        },
      );
      dirtyIds.forEach((id) => {
        if (jawabanRef.current[id] === snapshot.get(id)) {
          dirtyIdsRef.current.delete(id);
        }
      });
      setLastAutoSaved(response.data?.saved_at || new Date().toISOString());
    } catch {
      // Draft lokal tetap tersedia dan akan dicoba lagi.
    } finally {
      autosaveInFlightRef.current = false;
    }
  }, [dalamWindow, fase, ujian?.id]);

  useEffect(() => {
    if (!ujian?.id || fase !== "menunggu_jawaban" || !dalamWindow) return;
    const interval = window.setInterval(saveDirtyDraft, 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void saveDirtyDraft();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [dalamWindow, fase, saveDirtyDraft, ujian?.id]);

  // Bersihkan localStorage setelah submit berhasil
  const clearLocalDraft = () => {
    if (localKey) localStorage.removeItem(localKey);
  };

  useEffect(() => {
    setWaktuHabis(
      Boolean(windowSelesai && Date.now() >= new Date(windowSelesai).getTime()),
    );
  }, [windowSelesai]);

  const handleCountdownExpire = useCallback(() => {
    setWaktuHabis(true);
    void refetch();
  }, [refetch]);

  const handleJawabanChange = useCallback((id: number, value: string) => {
    dirtyIdsRef.current.add(id);
    setJawaban((previous) => ({ ...previous, [id]: value }));
  }, []);

  // Progress jawaban
  const dijawabCount = soalList.filter((s: any) => (jawaban[s.id] || "").trim()).length;
  const progressPersen = soalList.length > 0 ? Math.round((dijawabCount / soalList.length) * 100) : 0;

  // Boleh reschedule?
  const bisaReschedule = fase === "menunggu_jawaban"
    && !ujianDimulai
    && !ujian?.reschedule_count  // belum pernah reschedule
    && ujian?.reschedule_status !== "diajukan"
    && ujian?.tanggal_ujian
    && (() => {
      const hariIni = new Date(); hariIni.setHours(0, 0, 0, 0);
      const tglUjian = new Date(ujian.tanggal_ujian); tglUjian.setHours(0, 0, 0, 0);
      return tglUjian.getTime() - hariIni.getTime() >= 86400000; // >= 1 hari
    })();

  // Mutations
  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = soalList.map((s: any) => ({ id: s.id, jawaban_pemohon: jawaban[s.id] || "" }));
      return api.post(`/pemohon/uji-lanjutan/${ujian.id}/submit`, { jawaban: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ujiLanjutanQueryKey });
      setShowSubmitModal(false);
      clearLocalDraft();
      toast.success("Jawaban berhasil dikirim");
      router.push("/pemohon/dashboard");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal mengirim jawaban"),
  });

  const konfirmasiMutation = useMutation({
    mutationFn: async () => api.post(`/pemohon/uji-lanjutan/${ujian.id}/konfirmasi`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ujiLanjutanQueryKey }); setShowKonfirmasiModal(false); toast.success("Kehadiran berhasil dikonfirmasi"); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal konfirmasi kehadiran"),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async () => api.post(`/pemohon/uji-lanjutan/${ujian.id}/reschedule`, { alasan: alasanReschedule }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ujiLanjutanQueryKey });
      setShowRescheduleForm(false);
      setAlasanReschedule("");
      toast.success("Permohonan reschedule berhasil diajukan. Menunggu persetujuan Admin Prodi.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal mengajukan reschedule"),
  });

  const handleSubmit = () => {
    const belumDijawab = soalList.filter((s: any) => !(jawaban[s.id] || "").trim());
    if (belumDijawab.length > 0) { toast.error(`Masih ada ${belumDijawab.length} soal yang belum dijawab.`); return; }
    setShowSubmitModal(true);
  };

  // Loading
  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Instrumen belum diterbitkan
  if (isError || !ujian) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div><h1 className="text-xl font-bold tracking-tight">Asesmen Tahap 2</h1><p className="mt-1 text-xs text-muted-foreground">Instrumen asesmen akan tersedia setelah diterbitkan oleh Asesor.</p></div>
        <div className="rounded-2xl border bg-card p-10 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto"><Clock className="h-8 w-8 text-muted-foreground/40" /></div>
          <div>
            <h2 className="font-bold text-lg">Menunggu Instrumen dari Asesor</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">Asesor sedang mempersiapkan instrumen untuk Anda. Anda akan mendapat notifikasi saat instrumen sudah diterbitkan.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Menunggu penerbitan instrumen
          </div>
        </div>
      </div>
    );
  }

  // ═══ MODE FOKUS UJIAN ═══
  if (isMengerjakan && dalamWindow === true && !sudahDikirim && adaC3) {
    return (
      <>
        {/* Modal Finalisasi */}
        <AnimatePresence>
          {showSubmitModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0"><AlertTriangle className="h-6 w-6 text-amber-600" /></div>
                  <div>
                    <h3 className="font-bold text-lg">Finalisasi Semua Jawaban?</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Jawaban yang sudah dikirim <strong>tidak dapat diubah</strong>.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowSubmitModal(false)} disabled={submitMutation.isPending}>Periksa Lagi</Button>
                  <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="gap-2">
                    {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Ya, Submit
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Fixed Header Ujian ── */}
        <div className="fixed top-14 left-0 right-0 z-40 border-b bg-background/95 backdrop-blur-md shadow-sm md:left-64">
          <div className="w-full px-6 py-3 flex items-center justify-between gap-4">
            {/* Identitas */}
            <div className="min-w-0">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sedang Mengerjakan</p>
              <p className="text-sm font-bold text-foreground truncate">Asesmen Tahap 2 Uji Tertulis</p>
            </div>

            {/* Progress + Countdown */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Progress */}
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-xs text-muted-foreground">{dijawabCount}/{soalList.length} dijawab</p>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progressPersen}%` }} transition={{ duration: 0.3 }} />
                </div>
                {lastAutoSaved && (
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Tersimpan {new Date(lastAutoSaved).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                )}
              </div>

              {/* Countdown */}
              <At2Countdown
                targetIso={dalamWindow === true ? windowSelesai : null}
                variant="exam"
                onExpire={handleCountdownExpire}
              />
            </div>
          </div>
        </div>

        {/* ── Area Soal - tambah padding-top agar tidak tertutup fixed bar ── */}
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6 pb-32 pt-16">

          {/* Instruksi */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300">
            <strong>Instruksi:</strong> Jawab setiap pertanyaan dengan <strong>singkat dan jelas</strong>. Jawaban yang sudah dikirim tidak dapat diubah.
          </div>

          {/* Waktu habis banner */}
          {waktuHabis && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm font-bold text-red-700 dark:text-red-300">Waktu pengerjaan telah berakhir.</p>
            </div>
          )}

          {/* Soal per MK */}
          {(() => {
            const grouped = new Map<number, { mk: any; soal: any[] }>();
            soalList.forEach((soal: any) => { const mkId = soal.mata_kuliah?.id ?? 0; if (!grouped.has(mkId)) grouped.set(mkId, { mk: soal.mata_kuliah, soal: [] }); grouped.get(mkId)!.soal.push(soal); });
            let nomorGlobal = 0;
            return Array.from(grouped.values()).map(({ mk, soal: soalMk }, gIdx) => {
              const mkDijawab = soalMk.filter((s: any) => (jawaban[s.id] || s.jawaban_pemohon || "").trim()).length;
              return (
                <div key={mk?.id ?? gIdx} className="border rounded-xl overflow-hidden shadow-sm">
                  {mk && (
                    <div className="px-4 py-2.5 bg-muted/20 border-b flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-background border rounded px-2 py-0.5">{mk.kode}</span>
                        <span className="text-sm font-semibold">{mk.nama}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{mkDijawab}/{soalMk.length} dijawab</span>
                    </div>
                  )}
                  <div className="p-4 space-y-4 bg-background">
                    {soalMk.map((soal: any) => {
                      nomorGlobal++;
                      const nomor = nomorGlobal;
                      const isFormLocked = waktuHabis;
                      const sudahDiisi = (jawaban[soal.id] || "").trim().length > 0;
                      return (
                        <div key={soal.id} className="space-y-3">
                          <div className="flex items-start gap-3">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 transition-colors ${sudahDiisi ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"}`}>
                              {sudahDiisi ? <CheckCircle2 className="h-3.5 w-3.5" /> : nomor}
                            </span>
                            <p className="text-sm font-medium text-foreground leading-relaxed pt-1">{soal.pertanyaan_instruksi}</p>
                          </div>
                          <div className="pl-10">
                            <textarea
                              className={`w-full min-h-[100px] p-4 text-sm rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y ${isFormLocked ? "bg-muted/50 cursor-not-allowed opacity-70" : sudahDiisi ? "border-emerald-300 dark:border-emerald-700 bg-background" : "bg-background"}`}
                              placeholder="Tuliskan jawaban singkat Anda di sini..."
                              value={jawaban[soal.id] || ""}
                              onChange={(e) => handleJawabanChange(soal.id, e.target.value)}
                              disabled={isFormLocked}
                            />
                            {!isFormLocked && (jawaban[soal.id] || "").length > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-1">{(jawaban[soal.id] || "").length} karakter</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* ── Sticky Footer Submit ── */}
        {!waktuHabis && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="w-full px-6 py-3 flex items-center">
              <div className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{dijawabCount}</span>/{soalList.length} soal terjawab
                {dijawabCount < soalList.length && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">· {soalList.length - dijawabCount} belum dijawab</span>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="ml-auto gap-2 h-10 px-7"
              >
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ═══ MODE NORMAL (Pra-ujian / Sudah selesai) ═══
  return (
    <>
      {/* Modal Konfirmasi Kehadiran */}
      <AnimatePresence>
        {showKonfirmasiModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><UserCheck className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-bold text-lg">Konfirmasi Kehadiran</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">Anda akan mengkonfirmasi kehadiran untuk AT2 ini. Asesor akan mendapat notifikasi.</p></div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowKonfirmasiModal(false)} disabled={konfirmasiMutation.isPending}>Batal</Button>
                <Button onClick={() => konfirmasiMutation.mutate()} disabled={konfirmasiMutation.isPending} className="gap-2">
                  {konfirmasiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}Ya, Konfirmasi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Submit */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0"><AlertTriangle className="h-6 w-6 text-amber-600" /></div>
                <div>
                  <h3 className="font-bold text-lg">Submit Semua Jawaban?</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Jawaban yang sudah dikirim <strong>tidak dapat diubah</strong>.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowSubmitModal(false)} disabled={submitMutation.isPending}>Periksa Lagi</Button>
                <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="gap-2">
                  {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Ya, Submit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 max-w-2xl mx-auto space-y-6 pb-20">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight">Asesmen Tahap 2</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {isTidakHadir ? "Status: Tidak Hadir" : sudahDikirim ? "Jawaban sedang dalam proses penilaian." : "Ikuti instruksi dari Asesor RPL untuk menyelesaikan Asesmen Tahap 2 Anda."}
          </p>
        </div>

        {/* ═══ Tidak Hadir ═══ */}
        {isTidakHadir && (
          <div className="bg-card rounded-2xl border border-red-200 dark:border-red-900/50 p-6 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <UserX className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Anda Tercatat Tidak Hadir</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                Anda tidak hadir pada jadwal Asesmen Tahap 2. Jika ada kendala yang menghalangi kehadiran, segera hubungi Admin Prodi.
              </p>
            </div>
          </div>
        )}

        {/* ═══ Jadwal (hanya tampil saat belum/pra-ujian) ═══ */}
        {!isTidakHadir && ujian.tanggal_ujian && (
          <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
            <h2 className="font-bold text-sm border-b pb-3">Detail Jadwal AT2</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tanggal</p>
                  <p className="text-sm font-semibold mt-0.5">{new Date(ujian.tanggal_ujian).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
              {ujian.waktu_ujian && (
                <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Waktu</p>
                    <p className="text-sm font-semibold mt-0.5">{formatWaktu(ujian.waktu_ujian, ujian.durasi_menit)}</p>
                  </div>
                </div>
              )}
              {ujian.tempat && (
                <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tempat</p>
                    <p className="text-sm font-semibold mt-0.5">{ujian.tempat}</p>
                  </div>
                </div>
              )}
              {ujian.link_meeting && (
                <div className="sm:col-span-2">
                  <a href={ujian.link_meeting} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-100 transition-colors">
                    <Video className="h-4 w-4 shrink-0" /> Bergabung ke Meeting Online
                  </a>
                </div>
              )}
            </div>

            {/* Konfirmasi kehadiran */}
            {!sudahDikirim && (
              ujian.konfirmasi_kehadiran ? (
                <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
                  <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Kehadiran sudah dikonfirmasi</span>
                </div>
              ) : (
                <Button onClick={() => setShowKonfirmasiModal(true)} variant="outline"
                  className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold h-10">
                  <UserCheck className="h-4 w-4" /> Konfirmasi Kehadiran Saya
                </Button>
              )
            )}
          </div>
        )}

        {/* ═══ Reschedule status / tombol ═══ */}
        {!isTidakHadir && !ujianDimulai && !sudahDikirim && (
          <>
            {ujian.reschedule_status === "diajukan" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
                <Loader2 className="h-5 w-5 text-amber-600 shrink-0 animate-spin mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">Permohonan Perubahan Jadwal Sedang Ditinjau</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Admin Prodi sedang meninjau permohonan Anda. Anda akan mendapat notifikasi setelah diputuskan.</p>
                </div>
              </div>
            )}

            {ujian.reschedule_status === "ditolak" && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4 space-y-1">
                <p className="font-semibold text-sm text-red-700 dark:text-red-400">Permohonan Reschedule Ditolak</p>
                {ujian.reschedule_catatan && (
                  <p className="text-xs text-red-600 dark:text-red-500">Alasan: {ujian.reschedule_catatan}</p>
                )}
              </div>
            )}

            {bisaReschedule && (
              <AnimatePresence>
                {!showRescheduleForm ? (
                  <Button variant="outline" className="w-full gap-2 h-10 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400"
                    onClick={() => setShowRescheduleForm(true)}>
                    Ajukan Perubahan Jadwal
                  </Button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
                    <div className="pb-3 border-b flex items-center justify-between">
                      <h2 className="font-bold text-sm">Permohonan Perubahan Jadwal</h2>
                      <button type="button" onClick={() => setShowRescheduleForm(false)} className="text-xs text-muted-foreground hover:text-foreground">Batal</button>
                    </div>
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
                      Reschedule hanya bisa diajukan <strong>maksimal 1 kali</strong> dan minimal <strong>1 hari sebelum</strong> jadwal ujian. Keputusan ada di tangan Admin Prodi.
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Alasan Permohonan <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        className="min-h-[100px] bg-background resize-y"
                        placeholder="Jelaskan alasan Anda meminta perubahan jadwal AT2 (minimal 20 karakter)..."
                        value={alasanReschedule}
                        onChange={(e) => setAlasanReschedule(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground text-right">{alasanReschedule.length}/1000 karakter</p>
                    </div>
                    <Button className="w-full gap-2 h-10"
                      onClick={() => rescheduleMutation.mutate()}
                      disabled={rescheduleMutation.isPending || alasanReschedule.trim().length < 20}>
                      {rescheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Kirim Permohonan
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </>
        )}

        {/* ═══ Status / Tombol Mulai Kerjakan (C3) ═══ */}
        {fase === "menunggu_jawaban" && adaC3 && !sudahDikirim && (
          <div className="bg-card rounded-2xl border shadow-sm p-8 text-center space-y-5">
            {!ujianDimulai ? (
              <>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Menunggu Asesor Memulai Ujian</h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md mx-auto">
                    Tombol "Mulai Kerjakan" akan aktif secara otomatis setelah Asesor secara resmi menekan tombol "Mulai Ujian" dari sistem mereka.
                  </p>
                </div>
                <Button disabled className="w-full sm:w-auto mt-2 h-11 px-8">Mulai Kerjakan</Button>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Asesor Telah Memulai Ujian</h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md mx-auto">
                    Waktu ujian Anda telah berjalan. Pastikan Anda sudah siap dan klik tombol di bawah untuk membuka soal dan mulai mengerjakannya.
                  </p>
                </div>
                <Button
                  onClick={() => setIsMengerjakan(true)}
                  className="w-full sm:w-auto mt-2 h-11 px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                >
                  <PenLine className="h-4 w-4" /> Mulai Kerjakan
                </Button>
              </>
            )}
          </div>
        )}

        {/* ═══ Tatap muka (C1/C4) — tidak ada soal online ═══ */}
        {fase === "menunggu_jawaban" && !adaC3 && (
          <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-sm border-b pb-3">Instruksi Asesmen Tatap Muka</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Hadir tepat waktu sesuai jadwal yang telah ditetapkan",
                "Konfirmasi kehadiran menggunakan tombol di atas",
                "Siapkan diri untuk wawancara atau demonstrasi oleh Asesor RPL",
                "Bawa dokumen pendukung yang relevan"].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* ═══ Soal sudah dikirim — tampilkan readonly ═══ */}
        {sudahDikirim && adaC3 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{fase === "selesai" ? "Asesmen Selesai Dinilai" : "Jawaban Berhasil Terkirim"}</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                  {fase === "selesai"
                    ? "Asesor telah menyelesaikan penilaian untuk ujian Anda."
                    : "Terima kasih, jawaban ujian Anda telah berhasil kami terima dan saat ini sedang menunggu proses penilaian oleh Asesor."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
