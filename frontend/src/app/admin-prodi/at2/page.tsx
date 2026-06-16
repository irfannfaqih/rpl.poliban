"use client";

import { SearchableSelect } from "@/components/SearchableSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock,
    Loader2,
    MapPin,
    Save,
    Timer,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Komponen Timeline Preview ────────────────────────────────────────────────
function TimelinePreview({ tanggal, excludePendaftaranId }: { tanggal: string; excludePendaftaranId?: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ["admin-prodi", "jadwal-per-tanggal", tanggal],
        queryFn: async () => {
            const { data } = await api.get("/admin-prodi/jadwal-per-tanggal", { params: { tanggal } });
            return data.data as any[];
        },
        enabled: !!tanggal,
    });

    if (!tanggal) return null;

    const jadwalList = (data || []).filter((j: any) =>
        // Exclude pendaftaran yang sedang diedit (untuk avoid false conflict)
        true
    );

    return (
        <div className="rounded-xl bg-muted/30 border p-3 space-y-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                Jadwal {new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {isLoading && (
                <div className="flex items-center gap-2 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Memuat jadwal hari ini...</span>
                </div>
            )}
            {!isLoading && jadwalList.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Tidak ada jadwal asesmen di hari ini. Hari yang aman.</p>
            )}
            {!isLoading && jadwalList.map((j: any, i: number) => (
                <div key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border text-xs ${j.tipe === "at2" ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"}`}>
                    <div className={`flex items-center gap-1 shrink-0 font-mono font-bold ${j.tipe === "at2" ? "text-purple-700 dark:text-purple-300" : "text-blue-700 dark:text-blue-300"}`}>
                        <Clock className="h-3 w-3" /> {j.waktu}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={`font-semibold ${j.tipe === "at2" ? "text-purple-800 dark:text-purple-300" : "text-blue-800 dark:text-blue-300"}`}>
                            {j.tipe === "at2" ? "AT2" : "Pra Asesmen"}
                        </span>
                        <span className="text-muted-foreground ml-1.5">{j.pemohon}</span>
                        {j.asesor?.length > 0 && (
                            <p className="text-muted-foreground mt-0.5 truncate">Asesor: {j.asesor.join(", ")}</p>
                        )}
                    </div>
                    {j.durasi && (
                        <span className="text-muted-foreground shrink-0">{j.durasi}m</span>
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Komponen Conflict Warning ────────────────────────────────────────────────
function ConflictWarning({ tanggal, waktu, durasi, pendaftaranId, tipe }: {
    tanggal: string; waktu: string; durasi?: number | ""; pendaftaranId?: string; tipe: string;
}) {
    const { data, isFetching } = useQuery({
        queryKey: ["admin-prodi", "cek-konflik", tanggal, waktu, durasi, pendaftaranId],
        queryFn: async () => {
            const { data } = await api.get("/admin-prodi/cek-konflik-jadwal", {
                params: { tanggal, waktu, durasi_menit: durasi || 90, pendaftaran_id: pendaftaranId, tipe },
            });
            return data;
        },
        enabled: !!(tanggal && waktu && waktu.match(/^\d{1,2}:\d{2}$/)),
        staleTime: 10_000,
    });

    if (!tanggal || !waktu || !waktu.match(/^\d{1,2}:\d{2}$/)) return null;
    if (isFetching) return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Memeriksa konflik jadwal...
        </div>
    );
    if (!data?.ada_konflik) return (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Tidak ada konflik jadwal pada waktu ini.
        </div>
    );

    return (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Potensi Konflik Asesor Terdeteksi
            </div>
            {data.konflik.map((k: any, i: number) => (
                <div key={i} className="text-xs text-amber-700 dark:text-amber-400 ml-6">
                    • <strong>{k.tipe === "at2" ? "AT2" : "Pra Asesmen"}</strong> {k.pemohon} ({k.waktu}{/wita|wib/i.test(k.waktu || "") ? "" : " WITA"})
                    {k.asesor?.length > 0 && `: Asesor ${k.asesor.join(", ")}`}
                </div>
            ))}
            <p className="text-xs text-amber-600 dark:text-amber-500 ml-6 italic">
                Anda tetap bisa menyimpan jadwal ini, namun pastikan ada koordinasi dengan asesor terkait.
            </p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProdiAT2Page() {
    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState<string>("");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [catatanTolak, setCatatanTolak] = useState("");

    const [jadwalForm, setJadwalForm] = useState({
        tanggal_ujian: "", waktu_ujian: "", durasi_menit: "" as number | "", tempat: "", link_meeting: "",
    });

    const [rescheduleForm, setRescheduleForm] = useState({
        tanggal_ujian: "", waktu_ujian: "", durasi_menit: "" as number | "", tempat: "", link_meeting: "", catatan: "",
    });

    const { data: pendaftaranList = [], isLoading: listLoading } = useQuery({
        queryKey: ["admin-prodi", "at2-list"],
        queryFn: async () => {
            const { data } = await api.get("/admin-prodi/pendaftaran");
            return (data.data || []).filter((p: any) => p.status_alur === "asesmen_tahap2");
        },
    });

    const { data: at2Data, isLoading: at2Loading } = useQuery({
        queryKey: ["admin-prodi", "at2-detail", selectedId],
        queryFn: async () => {
            if (!selectedId) return null;
            const { data } = await api.get(`/admin-prodi/pendaftaran/${selectedId}/at2`);
            return data.data;
        },
        enabled: !!selectedId,
    });

    // Sync form saat at2Data berubah
    useEffect(() => {
        if (at2Data) {
            const formatTanggal = (tgl: string) => tgl ? tgl.split('T')[0].split(' ')[0] : "";
            
            setJadwalForm({
                tanggal_ujian: formatTanggal(at2Data.tanggal_ujian),
                waktu_ujian: at2Data.waktu_ujian || "",
                durasi_menit: at2Data.durasi_menit || "",
                tempat: at2Data.tempat || "",
                link_meeting: at2Data.link_meeting || "",
            });
            setRescheduleForm({
                tanggal_ujian: formatTanggal(at2Data.tanggal_ujian),
                waktu_ujian: at2Data.waktu_ujian || "",
                durasi_menit: at2Data.durasi_menit || "",
                tempat: at2Data.tempat || "",
                link_meeting: at2Data.link_meeting || "",
                catatan: "",
            });
        }
    }, [at2Data]);

    const hasReschedule = at2Data?.reschedule_status === "diajukan";
    const jadwalSudahAda = !!(at2Data?.tanggal_ujian && at2Data?.waktu_ujian);
    const ujianSudahMulai = !!at2Data?.ujian_dimulai_at;

    const selectedPendaftaran = pendaftaranList.find((p: any) => p.id.toString() === selectedId);

    const setJadwalMutation = useMutation({
        mutationFn: () => api.post(`/admin-prodi/pendaftaran/${selectedId}/at2/jadwal`, {
            ...jadwalForm,
            durasi_menit: jadwalForm.durasi_menit ? Number(jadwalForm.durasi_menit) : undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-prodi", "at2-detail", selectedId] });
            queryClient.invalidateQueries({ queryKey: ["admin-prodi", "jadwal-per-tanggal"] });
            toast.success("Jadwal AT2 berhasil ditetapkan. Asesor dan Pemohon telah diberitahu.");
        },
        onError: (e: any) => toast.error(e.response?.data?.message || "Gagal menetapkan jadwal"),
    });

    const approveMutation = useMutation({
        mutationFn: () => api.post(`/admin-prodi/pendaftaran/${selectedId}/at2/reschedule/approve`, {
            ...rescheduleForm,
            durasi_menit: rescheduleForm.durasi_menit ? Number(rescheduleForm.durasi_menit) : undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-prodi", "at2-detail", selectedId] });
            queryClient.invalidateQueries({ queryKey: ["admin-prodi", "jadwal-per-tanggal"] });
            toast.success("Reschedule disetujui. Jadwal baru telah ditetapkan.");
        },
        onError: (e: any) => toast.error(e.response?.data?.message || "Gagal approve reschedule"),
    });

    const rejectMutation = useMutation({
        mutationFn: () => api.post(`/admin-prodi/pendaftaran/${selectedId}/at2/reschedule/reject`, { catatan: catatanTolak }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-prodi", "at2-detail", selectedId] });
            setShowRejectModal(false);
            setCatatanTolak("");
            toast.success("Reschedule ditolak. Pemohon telah diberitahu.");
        },
        onError: (e: any) => toast.error(e.response?.data?.message || "Gagal reject reschedule"),
    });

    return (
        <>
            {/* Modal Tolak Reschedule */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0"><XCircle className="h-6 w-6 text-red-600" /></div>
                                <div><h3 className="text-lg font-bold">Tolak Reschedule?</h3><p className="text-sm text-muted-foreground mt-1">Berikan catatan alasan penolakan untuk pemohon.</p></div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catatan Penolakan <span className="text-red-500">*</span></Label>
                                <Textarea className="min-h-[80px] bg-background" placeholder="Jelaskan alasan penolakan..." value={catatanTolak} onChange={(e) => setCatatanTolak(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={rejectMutation.isPending}>Batal</Button>
                                <Button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || !catatanTolak.trim()}
                                    className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}Ya, Tolak
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Pengaturan Asesmen Tahap 2</h1>
                    <p className="mt-1 text-xs text-muted-foreground">Tetapkan jadwal AT2, tinjau reschedule, dan pantau status ujian pemohon.</p>
                </div>

                {/* Pilih Pemohon */}
                <div className="bg-card rounded-2xl border shadow-sm p-6">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Pilih Pendaftar (Status: Asesmen Tahap 2)
                    </label>
                    {listLoading ? (
                        <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/20">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Memuat data...</span>
                        </div>
                    ) : (
                        <SearchableSelect
                            options={pendaftaranList.map((p: any) => ({
                                value: p.id.toString(),
                                label: p.user?.nama || "Tanpa Nama",
                                sublabel: p.nomor_pendaftaran,
                            }))}
                            value={selectedId}
                            onChange={(val) => setSelectedId(val || "")}
                            placeholder="Pilih pendaftar untuk dikelola..."
                            searchPlaceholder="Cari nama atau nomor pendaftaran..."
                        />
                    )}
                    {pendaftaranList.length === 0 && !listLoading && (
                        <p className="text-xs text-muted-foreground mt-2">Tidak ada pendaftar dalam fase Asesmen Tahap 2.</p>
                    )}
                </div>

                {selectedId && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {at2Loading ? (
                            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : (
                            <>
                                {/* Status AT2 */}
                                {at2Data && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-card rounded-xl border shadow-sm p-4 space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status Instrumen</p>
                                            <div>
                                                {at2Data.fase_tulis === "buat_soal" && <Badge variant="outline" className="bg-slate-50 text-slate-600">Asesor Menyiapkan</Badge>}
                                                {at2Data.fase_tulis === "menunggu_jawaban" && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Menunggu Mulai</Badge>}
                                                {at2Data.fase_tulis === "koreksi" && <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">Penilaian</Badge>}
                                                {at2Data.fase_tulis === "selesai" && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Selesai</Badge>}
                                                {at2Data.fase_tulis === "tidak_hadir" && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Tidak Hadir</Badge>}
                                                {!at2Data.fase_tulis && <Badge variant="outline" className="text-muted-foreground">Belum ada instrumen</Badge>}
                                            </div>
                                        </div>
                                        <div className="bg-card rounded-xl border shadow-sm p-4 space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jadwal</p>
                                            <p className="text-sm font-semibold">
                                                {at2Data?.tanggal_ujian
                                                    ? `${new Date(at2Data.tanggal_ujian).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · ${at2Data.waktu_ujian}${/wita|wib/i.test(at2Data.waktu_ujian || "") ? "" : " WITA"}`
                                                    : <span className="text-amber-600 font-normal text-xs">Belum ditetapkan</span>}
                                            </p>
                                        </div>
                                        <div className="bg-card rounded-xl border shadow-sm p-4 space-y-1">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reschedule</p>
                                            <div>
                                                {!at2Data?.reschedule_status && <span className="text-xs text-muted-foreground">Tidak ada permintaan</span>}
                                                {at2Data?.reschedule_status === "diajukan" && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">Menunggu Review</Badge>}
                                                {at2Data?.reschedule_status === "disetujui" && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Disetujui</Badge>}
                                                {at2Data?.reschedule_status === "ditolak" && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Ditolak</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Alert Reschedule */}
                                {hasReschedule && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                                                    {selectedPendaftaran?.user?.nama} mengajukan perubahan jadwal AT2
                                                </p>
                                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                                                    <strong>Alasan:</strong> {at2Data?.reschedule_alasan}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-background rounded-xl border p-4 space-y-4">
                                            <p className="text-xs font-bold text-foreground uppercase tracking-wider">Jadwal Baru (jika disetujui)</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal <span className="text-red-500">*</span></Label>
                                                    <Input type="date" value={rescheduleForm.tanggal_ujian}
                                                        onChange={(e) => setRescheduleForm((p) => ({ ...p, tanggal_ujian: e.target.value }))}
                                                        className="bg-background" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Waktu Mulai <span className="text-red-500">*</span></Label>
                                                    <Input type="time" value={rescheduleForm.waktu_ujian}
                                                        onChange={(e) => setRescheduleForm((p) => ({ ...p, waktu_ujian: e.target.value }))}
                                                        className="bg-background" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Timer className="h-3 w-3" />Durasi C3 (menit)</Label>
                                                    <Input type="number" min={1} max={480} placeholder="cth: 90" value={rescheduleForm.durasi_menit}
                                                        onChange={(e) => setRescheduleForm((p) => ({ ...p, durasi_menit: e.target.value ? parseInt(e.target.value) : "" }))}
                                                        className="bg-background" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempat</Label>
                                                    <Input placeholder="Ruang sidang..." value={rescheduleForm.tempat}
                                                        onChange={(e) => setRescheduleForm((p) => ({ ...p, tempat: e.target.value }))}
                                                        className="bg-background" />
                                                </div>
                                            </div>
                                            {/* Timeline & Conflict untuk reschedule */}
                                            {rescheduleForm.tanggal_ujian && (
                                                <div className="space-y-2 pt-1">
                                                    <TimelinePreview tanggal={rescheduleForm.tanggal_ujian} excludePendaftaranId={selectedId} />
                                                    <ConflictWarning tanggal={rescheduleForm.tanggal_ujian} waktu={rescheduleForm.waktu_ujian}
                                                        durasi={rescheduleForm.durasi_menit} pendaftaranId={selectedId} tipe="at2" />
                                                </div>
                                            )}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catatan (opsional)</Label>
                                                <Input placeholder="Pesan untuk pemohon..." value={rescheduleForm.catatan}
                                                    onChange={(e) => setRescheduleForm((p) => ({ ...p, catatan: e.target.value }))}
                                                    className="bg-background" />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                                                onClick={() => setShowRejectModal(true)} disabled={rejectMutation.isPending}>
                                                <XCircle className="h-4 w-4" /> Tolak
                                            </Button>
                                            <Button className="gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => approveMutation.mutate()}
                                                disabled={approveMutation.isPending || !rescheduleForm.tanggal_ujian || !rescheduleForm.waktu_ujian}>
                                                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                Setujui & Tetapkan Jadwal Baru
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Form Jadwal AT2 */}
                                {!ujianSudahMulai && (
                                    <div className="bg-card rounded-2xl border shadow-sm p-6">
                                        <div className="pb-3 mb-5 border-b flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className="font-bold text-sm text-foreground">
                                                    {jadwalSudahAda ? "Perbarui Jadwal AT2" : "Tetapkan Jadwal AT2"}
                                                </h2>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {jadwalSudahAda ? "Jadwal sudah ditetapkan. Bisa diperbarui selama ujian belum dimulai."
                                                        : "Asesor akan mendapat notifikasi setelah jadwal ditetapkan."}
                                                </p>
                                            </div>
                                            {jadwalSudahAda && (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 gap-1 shrink-0">
                                                    <CheckCircle2 className="h-3 w-3" /> Terjadwal
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal <span className="text-red-500">*</span></Label>
                                                    <div className="relative">
                                                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                                        <Input type="date" value={jadwalForm.tanggal_ujian}
                                                            onChange={(e) => setJadwalForm((p) => ({ ...p, tanggal_ujian: e.target.value }))}
                                                            className="pl-9 bg-background" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Waktu Mulai <span className="text-red-500">*</span></Label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                                        <Input type="time" value={jadwalForm.waktu_ujian}
                                                            onChange={(e) => setJadwalForm((p) => ({ ...p, waktu_ujian: e.target.value }))}
                                                            className="pl-9 bg-background" />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">Waktu selesai = waktu mulai + durasi</p>
                                                </div>
                                            </div>

                                            {/* Timeline preview muncul saat tanggal dipilih */}
                                            {jadwalForm.tanggal_ujian && (
                                                <TimelinePreview tanggal={jadwalForm.tanggal_ujian} excludePendaftaranId={selectedId} />
                                            )}

                                            {/* Conflict warning muncul saat tanggal + waktu terisi */}
                                            {jadwalForm.tanggal_ujian && jadwalForm.waktu_ujian && (
                                                <ConflictWarning tanggal={jadwalForm.tanggal_ujian} waktu={jadwalForm.waktu_ujian}
                                                    durasi={jadwalForm.durasi_menit} pendaftaranId={selectedId} tipe="at2" />
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                        <Timer className="h-3 w-3" /> Durasi Soal Tertulis (menit)
                                                    </Label>
                                                    <Input type="number" min={1} max={480} placeholder="cth: 90 (jika ada soal C3)"
                                                        value={jadwalForm.durasi_menit}
                                                        onChange={(e) => setJadwalForm((p) => ({ ...p, durasi_menit: e.target.value ? parseInt(e.target.value) : "" }))}
                                                        className="bg-background" />
                                                    <p className="text-[10px] text-muted-foreground">Wajib diisi jika ada soal tertulis (C3)</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempat / Lokasi</Label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                                        <Input placeholder="Ruang Sidang Lt. 3, Gedung Kantor Pusat"
                                                            value={jadwalForm.tempat}
                                                            onChange={(e) => setJadwalForm((p) => ({ ...p, tempat: e.target.value }))}
                                                            className="pl-9 bg-background" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                    Link Meeting <span className="font-normal normal-case text-muted-foreground/60">(opsional, jika online)</span>
                                                </Label>
                                                <Input placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                                    value={jadwalForm.link_meeting}
                                                    onChange={(e) => setJadwalForm((p) => ({ ...p, link_meeting: e.target.value }))}
                                                    className="bg-background" />
                                            </div>

                                            <div className="flex justify-end pt-1">
                                                <Button className="gap-2 h-9 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
                                                    onClick={() => setJadwalMutation.mutate()}
                                                    disabled={setJadwalMutation.isPending || !jadwalForm.tanggal_ujian || !jadwalForm.waktu_ujian}>
                                                    {setJadwalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    {setJadwalMutation.isPending ? "Menyimpan..." : jadwalSudahAda ? "Perbarui Jadwal" : "Tetapkan Jadwal"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {ujianSudahMulai && (
                                    <div className="bg-card rounded-2xl border border-emerald-500/30 p-5">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">Ujian Sudah Dimulai</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Dimulai oleh asesor pada {new Date(at2Data.ujian_dimulai_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WITA. Jadwal tidak bisa diubah lagi.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
