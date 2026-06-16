"use client";

import { SearchableSelect } from "@/components/SearchableSelect";
import { At2Countdown } from "@/components/at2/At2Countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Key,
  Loader2,
  MapPin,
  Mic,
  PenLine,
  PhoneCall,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Timer,
  Trash2,
  UserX,
  Wrench,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type FaseUjian = "buat_soal" | "menunggu_jawaban" | "koreksi" | "selesai" | "tidak_hadir";

interface MataKuliah { id: number; kode: string; nama: string; }
interface Soal {
  id?: number;
  pertanyaan_instruksi: string;
  kunci_jawaban: string;
  jawaban_pemohon?: string | null;
  submitted_at?: string | null;
  skor_saya?: number | null;
  penilaian?: { asesor_id: number; skor: number }[];
}
interface MkInstrumen {
  _key: string;
  mata_kuliah_id: number;
  tipe: string;
  tipe_label: string;
  soal: Soal[];
}

const AT2_METODE = [
  { id: "c1", label: "C1 - Uji Lisan / Wawancara", needsKey: false, icon: Mic, desc: "Pertanyaan diajukan saat tatap muka" },
  { id: "c2", label: "C2 - Klarifikasi ke Atasan", needsKey: false, icon: PhoneCall, desc: "Klarifikasi kebenaran dokumen dengan atasan" },
  { id: "c3", label: "C3 - Uji Tertulis", needsKey: true, icon: PenLine, desc: "Soal jawaban singkat dikerjakan online" },
  { id: "c4", label: "C4 - Demonstrasi / Peragaan", needsKey: false, icon: Wrench, desc: "Instruksi demonstrasi kemampuan" },
  { id: "cn", label: "Metode Lain...", needsKey: false, icon: PenLine, desc: "Metode asesmen lainnya" },
];

const SKOR_LABELS = ["", "<20%", "21-40%", "41-60%", "61-80%", "81-100%"];

function itemsToMkGroups(items: any[]): MkInstrumen[] {
  const map = new Map<string, MkInstrumen>();
  items.forEach((item) => {
    const tipe = item.tipe?.startsWith("cn_") ? "cn" : item.tipe;
    const tipe_label = item.tipe?.startsWith("cn_") ? (item.tipe_label || "") : "";
    const mkId = item.mata_kuliah_id ?? 0;
    const key = `${mkId}_${tipe}_${tipe_label}`;
    if (!map.has(key)) map.set(key, { _key: key, mata_kuliah_id: mkId, tipe, tipe_label, soal: [] });
    map.get(key)!.soal.push({
      id: item.id,
      pertanyaan_instruksi: item.pertanyaan_instruksi || "",
      kunci_jawaban: item.kunci_jawaban || "",
      jawaban_pemohon: item.jawaban_pemohon,
      submitted_at: item.submitted_at,
      skor_saya: item.penilaian?.[0]?.skor ?? null,
    });
  });
  return Array.from(map.values());
}

function groupsToItems(groups: MkInstrumen[]) {
  return groups.flatMap((g) =>
    g.soal.map((s) => ({
      id: s.id,
      tipe: g.tipe === "cn" ? `cn_${g.tipe_label || "lain"}` : g.tipe,
      tipe_label: g.tipe === "cn" ? g.tipe_label : undefined,
      mata_kuliah_id: g.mata_kuliah_id || null,
      pertanyaan_instruksi: s.pertanyaan_instruksi,
      kunci_jawaban: s.kunci_jawaban || null,
    }))
  );
}

function SkorButtons({ value, onChange, disabled }: { value: number | null | undefined; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-lg text-sm font-bold border transition-all
              ${value === n ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            {n}
          </button>
        ))}
        {value != null && <span className="text-xs text-muted-foreground self-center">Ketepatan {SKOR_LABELS[value]}</span>}
      </div>
      <p className="text-[10px] text-muted-foreground">1 = &lt;20% · 2 = 21-40% · 3 = 41-60% · 4 = 61-80% · 5 = 81-100%</p>
    </div>
  );
}

function FaseProgress({ fase }: { fase: FaseUjian }) {
  const steps = [
    { key: "buat_soal", label: "Buat Instrumen" },
    { key: "menunggu_jawaban", label: "Menunggu Mulai" },
    { key: "koreksi", label: "Penilaian" },
  ];
  const order = ["buat_soal", "menunggu_jawaban", "koreksi", "selesai", "tidak_hadir"];
  const ci = order.indexOf(fase);
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {steps.map((step, i) => {
        const isDone = order.indexOf(step.key) < ci;
        const isActive = step.key === fase || (step.key === "koreksi" && (fase === "selesai" || fase === "tidak_hadir"));
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
              ${isDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : isActive ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"}`}>
              {isDone && <CheckCircle2 className="h-3 w-3 shrink-0" />}
              {step.label}
            </div>
            {i < steps.length - 1 && <div className={`h-0.5 w-4 rounded-full ${isDone ? "bg-emerald-300" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Countdown sisa waktu (untuk asesor saat ujian aktif) ─────────────────────
// ─── Main ─────────────────────────────────────────────────────────────────────
function UjiLanjutanFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendaftaranId = searchParams.get("pendaftaranId");
  const queryClient = useQueryClient();

  const [mkGroups, setMkGroups] = useState<MkInstrumen[]>([]);
  const [catatan, setCatatan] = useState("");
  const [showAddMk, setShowAddMk] = useState(false);
  const [newMk, setNewMk] = useState({ mata_kuliah_id: "" as number | "", tipe: "c3", tipe_label: "" });
  const [expandedMk, setExpandedMk] = useState<string | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showMulaiConfirm, setShowMulaiConfirm] = useState(false);
  const [showTidakHadirConfirm, setShowTidakHadirConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showEditInstrumen, setShowEditInstrumen] = useState(false);

  const { data: ujiLanjutan, isLoading, refetch } = useQuery({
    queryKey: ["asesor", "at2-form", pendaftaranId],
    queryFn: async () => {
      const res = await api.get(`/asesor/uji-lanjutan/${pendaftaranId}`);
      return res.data?.data;
    },
    enabled: !!pendaftaranId,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      const fase = data?.fase_tulis;
      if (fase === "menunggu_jawaban") return 15_000;
      return false;
    },
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  const faseTulis: FaseUjian = ujiLanjutan?.fase_tulis || "buat_soal";
  const isLocked = !["buat_soal", "menunggu_jawaban"].includes(faseTulis);
  const isSelesai = faseTulis === "selesai";
  const isTidakHadir = faseTulis === "tidak_hadir";
  const mkPolibanList: MataKuliah[] = ujiLanjutan?.pendaftaran?.prodi?.mata_kuliah || [];

  // Info jadwal (set oleh Admin Prodi)
  const jadwalAdmin = {
    tanggal: ujiLanjutan?.tanggal_ujian || null,
    waktu: ujiLanjutan?.waktu_ujian || null,
    durasi: ujiLanjutan?.durasi_menit || null,
    tempat: ujiLanjutan?.tempat || null,
    link: ujiLanjutan?.link_meeting || null,
    dijadwalkanOleh: ujiLanjutan?.dijadwalkan_oleh?.nama || null,
  };
  const hasJadwalAdmin = !!(jadwalAdmin.tanggal && jadwalAdmin.waktu);

  // Ujian dimulai info
  const ujianDimulaiAt = ujiLanjutan?.ujian_dimulai_at || null;
  const windowSelesaiAt = ujianDimulaiAt && jadwalAdmin.durasi
    ? new Date(new Date(ujianDimulaiAt).getTime() + (jadwalAdmin.durasi * 60000)).toISOString()
    : null;

  useEffect(() => {
    if (ujiLanjutan) {
      setMkGroups(itemsToMkGroups(ujiLanjutan.items || []));
      setCatatan(ujiLanjutan.catatan_asesor_saya?.catatan_akhir || "");
    }
  }, [ujiLanjutan]);

  const hasInstrumen = mkGroups.some((g) => g.soal.some((s) => s.pertanyaan_instruksi.trim()));
  const hasC3 = mkGroups.some((g) => g.tipe === "c3");
  const totalSoal = mkGroups.reduce((acc, g) => acc + g.soal.length, 0);
  const canPublish = hasJadwalAdmin && hasInstrumen;
  const canMulai = faseTulis === "menunggu_jawaban" && !ujianDimulaiAt && hasC3;

  const allSoalFlat = mkGroups.flatMap((g) => g.soal);
  const skorList = allSoalFlat.filter((s) => s.skor_saya != null);
  const allScored = allSoalFlat.length > 0 && skorList.length === allSoalFlat.length;
  const nilaiPreview = skorList.length > 0
    ? Math.round((skorList.reduce((acc, s) => acc + (s.skor_saya || 0), 0) / allSoalFlat.length) * 20)
    : null;

  const pemohonNama = ujiLanjutan?.pendaftaran?.user?.nama || "Pemohon";
  const nomorPendaftaran = ujiLanjutan?.pendaftaran?.nomor_pendaftaran;
  const prodiNama = ujiLanjutan?.pendaftaran?.prodi?.nama;

  // Mutations
  const saveItemsMutation = useMutation({
    mutationFn: (p: { items: ReturnType<typeof groupsToItems> }) =>
      api.post(`/asesor/uji-lanjutan/${pendaftaranId}/soal`, p),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["asesor", "at2-form"] }); toast.success("Instrumen berhasil disimpan"); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal menyimpan instrumen"),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/asesor/uji-lanjutan/${pendaftaranId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asesor", "at2-form"] });
      setShowPublishConfirm(false);
      toast.success("Instrumen diterbitkan. Pemohon telah mendapat notifikasi.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal menerbitkan"),
  });

  const mulaiMutation = useMutation({
    mutationFn: () => api.post(`/asesor/uji-lanjutan/${pendaftaranId}/mulai`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asesor", "at2-form"] });
      setShowMulaiConfirm(false);
      toast.success("Ujian dimulai! Pemohon sudah dapat mengerjakan soal.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal memulai ujian"),
  });

  const tidakHadirMutation = useMutation({
    mutationFn: () => api.post(`/asesor/uji-lanjutan/${pendaftaranId}/tidak-hadir`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asesor", "at2-form"] });
      setShowTidakHadirConfirm(false);
      toast.success("Pemohon ditandai tidak hadir.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal menandai tidak hadir"),
  });

  const submitNilaiMutation = useMutation({
    mutationFn: (p: any) => api.post(`/asesor/uji-lanjutan/${pendaftaranId}/nilai`, p),
    onSuccess: (d: any) => {
      queryClient.invalidateQueries({ queryKey: ["asesor", "at2-form"] });
      setShowSubmitConfirm(false);
      if (d.data?.semua_selesai) toast.success(`Semua asesor selesai. Nilai AT2 final: ${d.data.nilai_at2_final}`);
      else toast.success("Penilaian tersimpan. Menunggu asesor lain.");
      router.push("/asesor/asesmen-tahap-2");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Gagal submit penilaian"),
  });

  // MK/Soal handlers
  const handleTambahMk = () => {
    if (!newMk.mata_kuliah_id) { toast.error("Pilih mata kuliah terlebih dahulu"); return; }
    if (newMk.tipe === "cn" && !newMk.tipe_label.trim()) { toast.error("Nama metode wajib diisi"); return; }
    const key = `${newMk.mata_kuliah_id}_${newMk.tipe}_${newMk.tipe_label}_${Date.now()}`;
    setMkGroups((p) => [...p, { _key: key, mata_kuliah_id: newMk.mata_kuliah_id as number, tipe: newMk.tipe, tipe_label: newMk.tipe_label, soal: [{ pertanyaan_instruksi: "", kunci_jawaban: "" }] }]);
    setExpandedMk(key);
    setNewMk({ mata_kuliah_id: "", tipe: "c3", tipe_label: "" });
    setShowAddMk(false);
  };
  const tambahSoal = (gi: number) => setMkGroups((p) => p.map((g, i) => i === gi ? { ...g, soal: [...g.soal, { pertanyaan_instruksi: "", kunci_jawaban: "" }] } : g));
  const hapusSoal = (gi: number, si: number) => setMkGroups((p) => p.map((g, i) => i === gi ? { ...g, soal: g.soal.filter((_, j) => j !== si) } : g).filter((g) => g.soal.length > 0));
  const hapusMk = (gi: number) => setMkGroups((p) => p.filter((_, i) => i !== gi));
  const updateSoal = (gi: number, si: number, f: keyof Soal, v: string) => setMkGroups((p) => p.map((g, i) => i === gi ? { ...g, soal: g.soal.map((s, j) => j === si ? { ...s, [f]: v } : s) } : g));
  const setSkor = (gi: number, si: number, n: number) => setMkGroups((p) => p.map((g, i) => i === gi ? { ...g, soal: g.soal.map((s, j) => j === si ? { ...s, skor_saya: n } : s) } : g));

  if (!pendaftaranId) return null;
  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
      {/* Modal Terbitkan */}
      <AnimatePresence>
        {showPublishConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"><Send className="h-6 w-6 text-blue-600" /></div>
                <div>
                  <h3 className="text-lg font-bold">Terbitkan ke Pemohon?</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {totalSoal} instrumen untuk {mkGroups.length} MK akan dikirim ke <strong>{pemohonNama}</strong>.
                    Setelah diterbitkan, instrumen tidak bisa diubah lagi setelah ujian dimulai.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowPublishConfirm(false)} disabled={publishMutation.isPending}>Batal</Button>
                <Button onClick={() => saveItemsMutation.mutateAsync({ items: groupsToItems(mkGroups) }).then(() => publishMutation.mutate())}
                  disabled={publishMutation.isPending || saveItemsMutation.isPending}
                  className="gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground">
                  {(publishMutation.isPending || saveItemsMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Ya, Terbitkan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Mulai Ujian */}
      <AnimatePresence>
        {showMulaiConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"><Play className="h-6 w-6 text-emerald-600" /></div>
                <div>
                  <h3 className="text-lg font-bold">Mulai Ujian Sekarang?</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Soal tertulis akan langsung muncul di halaman <strong>{pemohonNama}</strong>.
                    Timer {jadwalAdmin.durasi} menit dimulai dari sekarang.
                    Tindakan ini tidak bisa dibatalkan.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowMulaiConfirm(false)} disabled={mulaiMutation.isPending}>Batal</Button>
                <Button onClick={() => mulaiMutation.mutate()} disabled={mulaiMutation.isPending}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  {mulaiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Ya, Mulai Ujian
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Tidak Hadir */}
      <AnimatePresence>
        {showTidakHadirConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0"><UserX className="h-6 w-6 text-red-600" /></div>
                <div>
                  <h3 className="text-lg font-bold">Tandai Tidak Hadir?</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    <strong>{pemohonNama}</strong> akan dicatat tidak hadir pada AT2. Nilai AT2 = 0.
                    Pemohon akan mendapat notifikasi.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowTidakHadirConfirm(false)} disabled={tidakHadirMutation.isPending}>Batal</Button>
                <Button onClick={() => tidakHadirMutation.mutate()} disabled={tidakHadirMutation.isPending}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                  {tidakHadirMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                  Ya, Tandai Tidak Hadir
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Submit Nilai */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0"><AlertTriangle className="h-6 w-6 text-amber-600" /></div>
                <div>
                  <h3 className="text-lg font-bold">Submit Penilaian?</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Pastikan semua skor telah sesuai. Penilaian yang sudah dikirim akan dikunci dan <strong>tidak dapat diubah lagi</strong>.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowSubmitConfirm(false)} disabled={submitNilaiMutation.isPending}>Batal</Button>
                <Button onClick={() => submitNilaiMutation.mutate({ items: allSoalFlat.filter((s) => s.id !== undefined).map((s) => ({ id: s.id, skor: s.skor_saya })), catatan_akhir: catatan })}
                  disabled={submitNilaiMutation.isPending} className="gap-2">
                  {submitNilaiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Ya, Submit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 max-w-4xl mx-auto space-y-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/asesor/asesmen-tahap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isLocked && !["menunggu_jawaban"].includes(faseTulis) ? "Penilaian" : "Persiapan"} Asesmen Tahap 2
            </h1>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {pemohonNama}{prodiNama ? ` · ${prodiNama}` : ""}{nomorPendaftaran ? ` · ${nomorPendaftaran}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FaseProgress fase={faseTulis} />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {/* ═══ Jadwal AT2 (info dari Admin Prodi — read-only untuk asesor) ═══ */}
        {faseTulis !== "buat_soal" && (
          <div className="bg-card rounded-2xl border shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 pb-3 mb-4 border-b">
              <div>
                <h2 className="font-bold text-sm text-foreground">Jadwal AT2</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {jadwalAdmin.dijadwalkanOleh ? `Ditetapkan oleh ${jadwalAdmin.dijadwalkanOleh}` : "Ditetapkan oleh Admin Prodi"}
                </p>
              </div>
              {ujianDimulaiAt && (
                <At2Countdown targetIso={windowSelesaiAt} />
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tanggal</p>
                <p className="font-semibold flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {jadwalAdmin.tanggal ? new Date(jadwalAdmin.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : <span className="text-amber-600 text-xs">Belum diset</span>}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Waktu</p>
                <p className="font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {jadwalAdmin.waktu ? `${jadwalAdmin.waktu}${/wita|wib/i.test(jadwalAdmin.waktu) ? "" : " WITA"}` : <span className="text-amber-600 text-xs">Belum diset</span>}
                </p>
              </div>
              {jadwalAdmin.durasi && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Durasi C3</p>
                  <p className="font-semibold flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                    {jadwalAdmin.durasi} menit
                  </p>
                </div>
              )}
              {jadwalAdmin.tempat && (
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tempat</p>
                  <p className="font-semibold flex items-center gap-1.5 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {jadwalAdmin.tempat}
                  </p>
                </div>
              )}
            </div>
            {!hasJadwalAdmin && (
              <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-xs text-amber-800 dark:text-amber-300">Jadwal belum ditetapkan oleh Admin Prodi. Instrumen belum bisa diterbitkan.</span>
              </div>
            )}
          </div>
        )}

        {/* ═══ FASE: buat_soal — Instrumen ═══ */}
        {faseTulis === "buat_soal" && (
          <div className="space-y-4">
            {/* Info jadwal dari Admin Prodi */}
            {hasJadwalAdmin ? (
              <div className="bg-card rounded-2xl border shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 pb-3 mb-4 border-b">
                  <div>
                    <h2 className="font-bold text-sm text-foreground">Jadwal AT2</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Ditetapkan oleh Admin Prodi{jadwalAdmin.dijadwalkanOleh ? ` (${jadwalAdmin.dijadwalkanOleh})` : ""}</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3" /> Terjadwal
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(jadwalAdmin.tanggal!).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {jadwalAdmin.waktu}{/wita|wib/i.test(jadwalAdmin.waktu || "") ? "" : " WITA"}
                  </span>
                  {jadwalAdmin.durasi && (
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                      {jadwalAdmin.durasi} menit
                    </span>
                  )}
                  {jadwalAdmin.tempat && (
                    <span className="flex items-center gap-1.5 text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {jadwalAdmin.tempat}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">Jadwal belum ditetapkan</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Admin Prodi perlu menetapkan jadwal AT2 terlebih dahulu. Anda tetap bisa menyiapkan instrumen, namun instrumen belum bisa diterbitkan ke pemohon.</p>
                </div>
              </div>
            )}

            {/* Section Instrumen */}
            <div className="bg-card rounded-2xl border shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 pb-3 mb-5 border-b">
                <div>
                  <h2 className="font-bold text-sm text-foreground">Instrumen Penilaian</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Tambahkan soal atau pertanyaan per mata kuliah</p>
                </div>
                {ujiLanjutan?.instrumen_updated_at && (
                  <span className="text-[11px] text-muted-foreground hidden sm:block shrink-0">
                    Disimpan: {new Date(ujiLanjutan.instrumen_updated_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              <div className="mb-4 rounded-xl bg-muted/30 border p-3 text-xs text-muted-foreground space-y-1">
                <p><strong className="text-foreground">C1 Lisan:</strong> Pertanyaan wawancara tatap muka, tidak perlu kunci jawaban</p>
                <p><strong className="text-foreground">C2 Klarifikasi:</strong> Klarifikasi kebenaran dokumen bukti dengan atasan pemohon</p>
                <p><strong className="text-foreground">C3 Tertulis:</strong> Soal jawaban singkat dikerjakan pemohon secara online, sertakan kunci jawaban</p>
                <p><strong className="text-foreground">C4 Demonstrasi:</strong> Instruksi peragaan kemampuan secara langsung</p>
              </div>

              {/* Daftar MK */}
              <div className="space-y-3">
                {mkGroups.length === 0 && (
                  <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground text-sm">
                    Belum ada instrumen. Klik tombol di bawah untuk mulai menambahkan.
                  </div>
                )}
                {mkGroups.map((group, gi) => {
                  const mk = mkPolibanList.find((m) => m.id === group.mata_kuliah_id);
                  const isExp = expandedMk === group._key;
                  const needsKey = group.tipe === "c3";
                  return (
                    <div key={group._key} className="border rounded-xl overflow-hidden">
                      <div role="button" tabIndex={0}
                        onClick={() => setExpandedMk(isExp ? null : group._key)}
                        onKeyDown={(e) => e.key === "Enter" && setExpandedMk(isExp ? null : group._key)}
                        className="flex items-center gap-3 px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold bg-background border rounded px-1.5 py-0.5 shrink-0 text-muted-foreground">{mk?.kode || "MK"}</span>
                          <span className="text-sm font-semibold text-foreground truncate">{mk?.nama || "Mata Kuliah"}</span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${group.tipe === "c3" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300" : group.tipe === "c1" ? "bg-violet-50 text-violet-700 border-violet-200" : group.tipe === "c2" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "text-muted-foreground"}`}>
                            {group.tipe === "cn" ? group.tipe_label : group.tipe.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground shrink-0">{group.soal.length} soal</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" onClick={() => hapusMk(gi)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExp ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                      <AnimatePresence initial={false}>
                        {isExp && (
                          <motion.div key="soal" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                            <div className="p-4 space-y-3 bg-background">
                              {group.soal.map((soal, si) => (
                                <div key={si} className="border rounded-lg p-3 space-y-2.5 bg-muted/10">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                      {group.tipe === "c3" ? `Soal ${si + 1}` : group.tipe === "c1" ? `Pertanyaan ${si + 1}` : group.tipe === "c2" ? `Poin Klarifikasi ${si + 1}` : `Instruksi ${si + 1}`}
                                    </span>
                                    {group.soal.length > 1 && (
                                      <button type="button" className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 transition-colors" onClick={() => hapusSoal(gi, si)}>
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                  <Textarea className="min-h-[70px] resize-y bg-background text-sm"
                                    placeholder={group.tipe === "c3" ? "Tuliskan pertanyaan (jawaban singkat)..." : group.tipe === "c1" ? "Tuliskan pertanyaan wawancara/lisan..." : group.tipe === "c2" ? "Tuliskan poin yang ingin diklarifikasi kepada atasan..." : "Tuliskan instruksi demonstrasi..."}
                                    value={soal.pertanyaan_instruksi}
                                    onChange={(e) => updateSoal(gi, si, "pertanyaan_instruksi", e.target.value)} />
                                  {needsKey && (
                                    <div className="space-y-1.5">
                                      <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><Key className="h-3 w-3" /> Kunci Jawaban</Label>
                                      <Textarea className="min-h-[50px] resize-y bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-sm"
                                        placeholder="Kunci jawaban singkat..."
                                        value={soal.kunci_jawaban}
                                        onChange={(e) => updateSoal(gi, si, "kunci_jawaban", e.target.value)} />
                                    </div>
                                  )}
                                </div>
                              ))}
                              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8" onClick={() => tambahSoal(gi)}>
                                <Plus className="h-3.5 w-3.5" />
                                {group.tipe === "c3" ? "Tambah Soal" : group.tipe === "c1" ? "Tambah Pertanyaan" : group.tipe === "c2" ? "Tambah Poin Klarifikasi" : "Tambah Instruksi"}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <AnimatePresence>
                {showAddMk ? (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="mt-3 border-2 border-dashed border-primary/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">Tambah Mata Kuliah</p>
                      <button type="button" onClick={() => setShowAddMk(false)} className="text-xs text-muted-foreground hover:text-foreground">Batal</button>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">Mata Kuliah</Label>
                        <SearchableSelect
                          options={mkPolibanList.map((mk) => ({
                            value: mk.id.toString(),
                            label: mk.nama,
                            sublabel: mk.kode,
                          }))}
                          value={newMk.mata_kuliah_id ? newMk.mata_kuliah_id.toString() : ""}
                          onChange={(v) => setNewMk((p) => ({ ...p, mata_kuliah_id: v ? parseInt(v) : "" }))}
                          placeholder="Pilih mata kuliah..."
                          searchPlaceholder="Cari kode atau nama mata kuliah..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground">Metode Asesmen</Label>
                        <Select value={newMk.tipe} onValueChange={(v) => setNewMk((p) => ({ ...p, tipe: v ?? "c3", tipe_label: "" }))}>
                          <SelectTrigger className="bg-background h-9 text-sm">
                            <SelectValue placeholder="Pilih metode...">
                              {AT2_METODE.find((m) => m.id === newMk.tipe)?.label ?? null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {AT2_METODE.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                <div className="flex flex-col py-0.5"><span className="font-medium">{m.label}</span><span className="text-xs text-muted-foreground">{m.desc}</span></div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {newMk.tipe === "cn" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-muted-foreground">Nama Metode</Label>
                          <Input placeholder="cth: Portofolio Review" value={newMk.tipe_label} onChange={(e) => setNewMk((p) => ({ ...p, tipe_label: e.target.value }))} className="bg-background h-9 text-sm" />
                        </div>
                      )}
                    </div>
                    <Button size="sm" className="w-full gap-2 h-9" onClick={handleTambahMk}><Plus className="h-3.5 w-3.5" /> Tambah Mata Kuliah</Button>
                  </motion.div>
                ) : (
                  <Button variant="outline" className="w-full gap-2 h-9 mt-3 text-sm" onClick={() => setShowAddMk(true)}><Plus className="h-4 w-4" /> Tambah Mata Kuliah</Button>
                )}
              </AnimatePresence>
            </div>

            {/* Section Terbitkan */}
            <div className="bg-card rounded-2xl border shadow-sm p-6">
              <div className="pb-3 mb-5 border-b">
                <h2 className="font-bold text-sm text-foreground">Terbitkan ke Pemohon</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Periksa kembali semua syarat sebelum mengirimkan instrumen</p>
              </div>

              <div className="space-y-2.5 mb-5">
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${hasJadwalAdmin ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-muted/30 border-border"}`}>
                  {hasJadwalAdmin ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className={`text-sm font-medium ${hasJadwalAdmin ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
                    {hasJadwalAdmin ? `Jadwal: ${new Date(jadwalAdmin.tanggal!).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · ${jadwalAdmin.waktu}${/wita|wib/i.test(jadwalAdmin.waktu || "") ? "" : " WITA"}` : "Jadwal belum ditetapkan oleh Admin Prodi"}
                  </span>
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${hasInstrumen ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-muted/30 border-border"}`}>
                  {hasInstrumen ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className={`text-sm font-medium ${hasInstrumen ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
                    {hasInstrumen ? `Instrumen: ${mkGroups.length} MK · ${totalSoal} soal` : "Belum ada instrumen yang ditambahkan"}
                  </span>
                </div>
              </div>

              <Button className="w-full gap-2 h-10 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
                disabled={!canPublish} onClick={() => setShowPublishConfirm(true)}>
                <Send className="h-4 w-4" /> Terbitkan ke Pemohon
              </Button>
              {!canPublish && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {!hasJadwalAdmin ? "Tunggu Admin Prodi menetapkan jadwal AT2" : "Tambahkan instrumen terlebih dahulu"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ═══ FASE: menunggu_jawaban — Tombol Mulai / Tidak Hadir ═══ */}
        {faseTulis === "menunggu_jawaban" && (
          <div className="space-y-4">
            {/* Status ujian */}
            {!ujianDimulaiAt ? (
              <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
                <div>
                  <h2 className="font-bold">Siap Memulai Ujian?</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Instrumen sudah diterbitkan ke {pemohonNama}. Klik "Mulai Ujian" saat semua peserta siap di tempat.
                  </p>
                </div>

                {hasC3 && (
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
                    Ada soal tertulis (C3). Saat Anda klik Mulai, soal akan langsung muncul di halaman pemohon dan timer <strong>{jadwalAdmin.durasi} menit</strong> dimulai.
                  </div>
                )}

                <div className="flex gap-3">
                  {hasC3 && (
                    <Button className="gap-2 flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowMulaiConfirm(true)}>
                      <Play className="h-4 w-4" /> Mulai Ujian Sekarang
                    </Button>
                  )}
                  <Button variant="outline" className="gap-2 h-11 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => setShowTidakHadirConfirm(true)}>
                    <UserX className="h-4 w-4" /> Tidak Hadir
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                  </div>
                  <div>
                    <h2 className="font-bold text-emerald-700 dark:text-emerald-400">Ujian Sedang Berlangsung</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Dimulai: {new Date(ujianDimulaiAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WITA
                    </p>
                  </div>
                  <At2Countdown
                    targetIso={windowSelesaiAt}
                    variant="large"
                  />
                </div>
                <At2Countdown
                  targetIso={windowSelesaiAt}
                  variant="expired"
                />
              </div>
            )}

            {/* Instrumen Diterbitkan + Edit (hanya sebelum ujian dimulai) */}
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-muted/20 border-b flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instrumen Diterbitkan</p>
                  {!ujianDimulaiAt && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                      Masih bisa direvisi hingga Anda mengklik "Mulai Ujian"
                    </p>
                  )}
                </div>
                {!ujianDimulaiAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-7 text-xs"
                    onClick={() => setShowEditInstrumen((v) => !v)}
                  >
                    <PenLine className="h-3 w-3" />
                    {showEditInstrumen ? "Tutup Editor" : "Edit Instrumen"}
                  </Button>
                )}
              </div>

              {/* Ringkasan instrumen */}
              {!showEditInstrumen && (
                <div className="p-5 space-y-2">
                  {mkGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Belum ada instrumen.</p>
                  ) : mkGroups.map((g) => {
                    const mk = mkPolibanList.find((m) => m.id === g.mata_kuliah_id);
                    return (
                      <div key={g._key} className="flex items-center gap-3 px-4 py-2.5 border rounded-xl">
                        <span className="text-[10px] font-mono font-bold bg-background border rounded px-1.5 py-0.5 text-muted-foreground">{mk?.kode}</span>
                        <span className="text-sm font-medium flex-1">{mk?.nama}</span>
                        <Badge variant="outline" className="text-[10px]">{g.tipe === "cn" ? g.tipe_label : g.tipe.toUpperCase()} · {g.soal.length} soal</Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Editor instrumen (inline) */}
              <AnimatePresence>
                {showEditInstrumen && !ujianDimulaiAt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="p-5 space-y-4 border-t">
                      {/* Info revisi */}
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                          Revisi instrumen diperbolehkan selama ujian belum dimulai. Setelah Anda mengklik <strong>Mulai Ujian</strong>, instrumen akan terkunci permanen.
                        </p>
                      </div>

                      {/* Daftar MK editor */}
                      <div className="space-y-3">
                        {mkGroups.map((group, gi) => {
                          const mk = mkPolibanList.find((m) => m.id === group.mata_kuliah_id);
                          const isExp = expandedMk === group._key;
                          const needsKey = group.tipe === "c3";
                          return (
                            <div key={group._key} className="border rounded-xl overflow-hidden">
                              <div role="button" tabIndex={0}
                                onClick={() => setExpandedMk(isExp ? null : group._key)}
                                onKeyDown={(e) => e.key === "Enter" && setExpandedMk(isExp ? null : group._key)}
                                className="flex items-center gap-3 px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-mono font-bold bg-background border rounded px-1.5 py-0.5 shrink-0 text-muted-foreground">{mk?.kode || "MK"}</span>
                                  <span className="text-sm font-semibold text-foreground truncate">{mk?.nama || "Mata Kuliah"}</span>
                                  <Badge variant="outline" className={`text-[10px] shrink-0 ${group.tipe === "c3" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300" : group.tipe === "c1" ? "bg-violet-50 text-violet-700 border-violet-200" : group.tipe === "c2" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "text-muted-foreground"}`}>
                                    {group.tipe === "cn" ? group.tipe_label : group.tipe.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground shrink-0">{group.soal.length} soal</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button type="button" className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors" onClick={() => hapusMk(gi)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExp ? "rotate-180" : ""}`} />
                                </div>
                              </div>
                              <AnimatePresence initial={false}>
                                {isExp && (
                                  <motion.div key="soal" initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                                    <div className="p-4 space-y-3 bg-background">
                                      {group.soal.map((soal, si) => (
                                        <div key={si} className="border rounded-lg p-3 space-y-2.5 bg-muted/10">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                              {group.tipe === "c3" ? `Soal ${si + 1}` : group.tipe === "c1" ? `Pertanyaan ${si + 1}` : group.tipe === "c2" ? `Poin Klarifikasi ${si + 1}` : `Instruksi ${si + 1}`}
                                            </span>
                                            {group.soal.length > 1 && (
                                              <button type="button" className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 transition-colors" onClick={() => hapusSoal(gi, si)}>
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            )}
                                          </div>
                                          <Textarea className="min-h-[70px] resize-y bg-background text-sm"
                                            placeholder={group.tipe === "c3" ? "Tuliskan pertanyaan (jawaban singkat)..." : group.tipe === "c1" ? "Tuliskan pertanyaan wawancara/lisan..." : group.tipe === "c2" ? "Tuliskan poin yang ingin diklarifikasi kepada atasan..." : "Tuliskan instruksi demonstrasi..."}
                                            value={soal.pertanyaan_instruksi}
                                            onChange={(e) => updateSoal(gi, si, "pertanyaan_instruksi", e.target.value)} />
                                          {needsKey && (
                                            <div className="space-y-1.5">
                                              <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><Key className="h-3 w-3" /> Kunci Jawaban</Label>
                                              <Textarea className="min-h-[50px] resize-y bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-sm"
                                                placeholder="Kunci jawaban singkat..."
                                                value={soal.kunci_jawaban}
                                                onChange={(e) => updateSoal(gi, si, "kunci_jawaban", e.target.value)} />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8" onClick={() => tambahSoal(gi)}>
                                        <Plus className="h-3.5 w-3.5" />
                                        {group.tipe === "c3" ? "Tambah Soal" : group.tipe === "c1" ? "Tambah Pertanyaan" : group.tipe === "c2" ? "Tambah Poin Klarifikasi" : "Tambah Instruksi"}
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}

                        {/* Tambah MK baru saat edit */}
                        <AnimatePresence>
                          {showAddMk ? (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              className="border-2 border-dashed border-primary/30 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-foreground">Tambah Mata Kuliah</p>
                                <button type="button" onClick={() => setShowAddMk(false)} className="text-xs text-muted-foreground hover:text-foreground">Batal</button>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-muted-foreground">Mata Kuliah</Label>
                                  <SearchableSelect
                                    options={mkPolibanList.map((mk) => ({ value: mk.id.toString(), label: mk.nama, sublabel: mk.kode }))}
                                    value={newMk.mata_kuliah_id ? newMk.mata_kuliah_id.toString() : ""}
                                    onChange={(v) => setNewMk((p) => ({ ...p, mata_kuliah_id: v ? parseInt(v) : "" }))}
                                    placeholder="Pilih mata kuliah..."
                                    searchPlaceholder="Cari kode atau nama mata kuliah..."
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-bold text-muted-foreground">Metode Asesmen</Label>
                                  <Select value={newMk.tipe} onValueChange={(v) => setNewMk((p) => ({ ...p, tipe: v ?? "c3", tipe_label: "" }))}>
                                    <SelectTrigger className="bg-background h-9 text-sm">
                                      <SelectValue placeholder="Pilih metode...">{AT2_METODE.find((m) => m.id === newMk.tipe)?.label ?? null}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AT2_METODE.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                          <div className="flex flex-col py-0.5"><span className="font-medium">{m.label}</span><span className="text-xs text-muted-foreground">{m.desc}</span></div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {newMk.tipe === "cn" && (
                                  <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-muted-foreground">Nama Metode</Label>
                                    <Input placeholder="cth: Portofolio Review" value={newMk.tipe_label} onChange={(e) => setNewMk((p) => ({ ...p, tipe_label: e.target.value }))} className="bg-background h-9 text-sm" />
                                  </div>
                                )}
                              </div>
                              <Button size="sm" className="w-full gap-2 h-9" onClick={handleTambahMk}><Plus className="h-3.5 w-3.5" /> Tambah Mata Kuliah</Button>
                            </motion.div>
                          ) : (
                            <Button variant="outline" className="w-full gap-2 h-9 text-sm" onClick={() => setShowAddMk(true)}><Plus className="h-4 w-4" /> Tambah Mata Kuliah</Button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Tombol Simpan Revisi */}
                      <div className="flex justify-end pt-2">
                        <Button
                          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
                          onClick={() => saveItemsMutation.mutate({ items: groupsToItems(mkGroups) }, {
                            onSuccess: () => { setShowEditInstrumen(false); }
                          })}
                          disabled={saveItemsMutation.isPending}
                        >
                          {saveItemsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {saveItemsMutation.isPending ? "Menyimpan..." : "Simpan Revisi"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ═══ FASE: tidak_hadir ═══ */}
        {isTidakHadir && (
          <div className="bg-card rounded-2xl border border-red-200 dark:border-red-900/50 p-6 space-y-2">
            <div className="flex items-center gap-3">
              <UserX className="h-6 w-6 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-red-700 dark:text-red-400">{pemohonNama} - Tidak Hadir</p>
                <p className="text-xs text-muted-foreground mt-0.5">Nilai AT2 = 0. Proses dilanjutkan ke tahap Pleno.</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FASE: koreksi / selesai — Penilaian ═══ */}
        {(faseTulis === "koreksi" || isSelesai) && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold">Penilaian Instrumen AT2</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Beri skor 1-5 per soal · Nilai = rata-rata skor × 20</p>
                </div>
                {nilaiPreview !== null && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Nilai Anda</p>
                    <p className="text-3xl font-bold text-primary">{nilaiPreview}</p>
                    <p className="text-[10px] text-muted-foreground">{skorList.length}/{allSoalFlat.length} dinilai</p>
                  </div>
                )}
              </div>
              {!isSelesai && allSoalFlat.length > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{skorList.length}/{allSoalFlat.length}</span></div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${allSoalFlat.length > 0 ? (skorList.length / allSoalFlat.length) * 100 : 0}%` }} transition={{ duration: 0.3 }} />
                  </div>
                </div>
              )}
            </div>

            {mkGroups.map((group, gi) => {
              const mk = mkPolibanList.find((m) => m.id === group.mata_kuliah_id);
              const dinilai = group.soal.filter((s) => s.skor_saya != null).length;
              return (
                <div key={group._key} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{mk?.nama}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{mk?.kode}</Badge>
                      <Badge variant="outline" className="text-[10px]">{group.tipe === "c3" ? "C3 Tertulis" : group.tipe === "c1" ? "C1 Lisan" : group.tipe === "c2" ? "C2 Klarifikasi" : group.tipe === "c4" ? "C4 Demo" : group.tipe_label}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{dinilai}/{group.soal.length} dinilai</span>
                  </div>
                  <div className="p-6 space-y-5">
                    {group.soal.map((soal, si) => (
                      <div key={si} className={`border rounded-xl p-4 space-y-3 transition-all ${soal.skor_saya != null ? "border-primary/20 bg-primary/[0.02]" : "bg-background"}`}>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{group.tipe === "c3" ? `Soal ${si + 1}` : group.tipe === "c2" ? `Poin Klarifikasi ${si + 1}` : `Pertanyaan/Instruksi ${si + 1}`}</p>
                          <p className="text-sm font-medium text-foreground">{soal.pertanyaan_instruksi}</p>
                        </div>
                        {group.tipe === "c3" && soal.jawaban_pemohon && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Jawaban Pemohon</p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-foreground leading-relaxed">{soal.jawaban_pemohon}</div>
                          </div>
                        )}
                        {group.tipe === "c3" && soal.kunci_jawaban && (
                          <details>
                            <summary className="cursor-pointer text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 select-none"><Key className="h-3 w-3" /> Lihat Kunci Jawaban</summary>
                            <div className="mt-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm text-foreground">{soal.kunci_jawaban}</div>
                          </details>
                        )}
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nilai (1-5) {!isSelesai && soal.skor_saya == null && <span className="text-red-500">*</span>}</p>
                          <SkorButtons value={soal.skor_saya} onChange={(n) => setSkor(gi, si, n)} disabled={isSelesai} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {!isSelesai && (
              <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catatan Akhir <span className="font-normal normal-case">(opsional)</span></Label>
                  <Textarea className="min-h-[80px] resize-y bg-background" placeholder="Observasi umum mengenai performa pemohon..." value={catatan} onChange={(e) => setCatatan(e.target.value)} />
                </div>
                {!allScored && <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />Berikan skor untuk semua soal/instrumen sebelum submit.</div>}
                <Button className="w-full gap-2 h-10 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground" disabled={!allScored} onClick={() => setShowSubmitConfirm(true)}>
                  <BookOpenCheck className="h-4 w-4" /> Submit Penilaian Saya{nilaiPreview !== null ? ` · Nilai: ${nilaiPreview}` : ""}
                </Button>
              </div>
            )}

            {isSelesai && (
              <div className="bg-card rounded-2xl border border-emerald-500/30 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Semua penilaian telah dikunci</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Nilai AT2 final diteruskan ke proses Pleno.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function UjiLanjutanFormPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UjiLanjutanFormContent />
    </Suspense>
  );
}
