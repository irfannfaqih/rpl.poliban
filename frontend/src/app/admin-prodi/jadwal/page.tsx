"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Loader2,
  Save,
  Search,
  Trash2,
  Video
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTanggal(tgl: string) {
  try {
    // Ambil hanya bagian tanggal (YYYY-MM-DD) apapun formatnya
    const datePart = tgl.slice(0, 10);
    const d = new Date(datePart + "T00:00:00");
    if (isNaN(d.getTime())) return datePart;
    return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  } catch { return tgl.slice(0, 10); }
}

function getDefaultRange() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    dari: firstDay.toISOString().slice(0, 10),
    sampai: lastDay.toISOString().slice(0, 10),
  };
}

function StatusBadge({ tipe, statusAlur, faseTulis }: { tipe: string; statusAlur?: string; faseTulis?: string }) {
  if (tipe === "at2") {
    switch (faseTulis) {
      case "selesai": return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 text-[10px]">AT2 Selesai</Badge>;
      case "tidak_hadir": return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">Tidak Hadir</Badge>;
      case "koreksi": return <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-[10px]">Penilaian</Badge>;
      case "menunggu_jawaban": return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Menunggu Mulai</Badge>;
      default: return <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[10px]">Persiapan</Badge>;
    }
  }
  const selesai = ["pleno", "finished", "selesai"].includes(statusAlur || "");
  return selesai
    ? <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 text-[10px] gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Selesai</Badge>
    : <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Terjadwal</Badge>;
}

function isPraScheduleCompleted(jadwal: { tipe: string; statusAlur?: string }) {
  return jadwal.tipe === "pra_asesmen" && ["pleno", "finished", "selesai"].includes(jadwal.statusAlur || "");
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KalenderJadwalPage() {
  const queryClient = useQueryClient();
  const defaultRange = getDefaultRange();
  const [dari, setDari] = useState(defaultRange.dari);
  const [sampai, setSampai] = useState(defaultRange.sampai);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"semua" | "pra_asesmen" | "at2">("semua");
  const [applied, setApplied] = useState({ dari: defaultRange.dari, sampai: defaultRange.sampai });
  const [editingJadwal, setEditingJadwal] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    tanggal: "",
    waktu: "",
    tempat: "",
    link_meeting: "",
    catatan: "",
  });

  // Preset filter periode
  const setPreset = (preset: "bulan_ini" | "minggu_ini" | "semua_waktu") => {
    const today = new Date();
    if (preset === "bulan_ini") {
      const dari = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const sampai = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
      setDari(dari); setSampai(sampai); setApplied({ dari, sampai });
    } else if (preset === "minggu_ini") {
      const day = today.getDay();
      const mon = new Date(today); mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      const dari = mon.toISOString().slice(0, 10);
      const sampai = sun.toISOString().slice(0, 10);
      setDari(dari); setSampai(sampai); setApplied({ dari, sampai });
    } else {
      setDari(""); setSampai(""); setApplied({ dari: "", sampai: "" });
    }
  };

  // Fetch Pra Asesmen dengan range
  const { data: praData = [], isLoading: loadPra } = useQuery({
    queryKey: ["admin-prodi-jadwal-range", applied],
    queryFn: async () => {
      const params: any = { per_page: 500 };
      if (applied.dari) params.dari = applied.dari;
      if (applied.sampai) params.sampai = applied.sampai;
      const { data } = await api.get("/admin-prodi/jadwal", { params });
      return data.data || [];
    },
  });

  // Fetch AT2 - ambil semua pendaftaran yang relevan
  const { data: allPendaftaran = [], isLoading: loadAt2 } = useQuery({
    queryKey: ["admin-prodi-pendaftaran-at2-kalender"],
    queryFn: async () => {
      const { data } = await api.get("/admin-prodi/pendaftaran", { params: { per_page: 500 } });
      return (data.data || []).filter((p: any) =>
        ["asesmen_tahap2", "pleno", "finished"].includes(p.status_alur) &&
        p.uji_lanjutan?.tanggal_ujian
      );
    },
    staleTime: 60_000,
  });

  const isLoading = loadPra || loadAt2;

  const refreshJadwal = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-prodi-jadwal-range"] });
    queryClient.invalidateQueries({ queryKey: ["admin-prodi", "jadwal-per-tanggal"] });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingJadwal) return;
      return api.put(`/admin-prodi/jadwal/${editingJadwal.id}`, {
        tanggal: editForm.tanggal,
        waktu: editForm.waktu,
        tempat: editForm.tempat,
        link_meeting: editForm.link_meeting || null,
        catatan: editForm.catatan || null,
      });
    },
    onSuccess: () => {
      toast.success("Jadwal pra asesmen berhasil diperbarui");
      setEditingJadwal(null);
      refreshJadwal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui jadwal");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin-prodi/jadwal/${id}`),
    onSuccess: () => {
      toast.success("Jadwal pra asesmen berhasil dibatalkan");
      setEditingJadwal(null);
      refreshJadwal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal membatalkan jadwal");
    },
  });

  const startEdit = (jadwal: any) => {
    if (isPraScheduleCompleted(jadwal)) {
      toast.error("Jadwal pra asesmen yang sudah selesai tidak dapat diubah");
      return;
    }

    setEditingJadwal(jadwal);
    setEditForm({
      tanggal: jadwal.tanggal?.slice(0, 10) || "",
      waktu: jadwal.waktu || "",
      tempat: jadwal.tempat || "",
      link_meeting: jadwal.link || "",
      catatan: jadwal.catatan || "",
    });
  };

  const cancelSchedule = (jadwal: any) => {
    if (isPraScheduleCompleted(jadwal)) {
      toast.error("Jadwal pra asesmen yang sudah selesai tidak dapat dibatalkan");
      return;
    }

    const ok = window.confirm(`Batalkan jadwal pra asesmen untuk ${jadwal.pemohon}?`);
    if (ok) deleteMutation.mutate(jadwal.id);
  };

  // Normalisasi dan gabungkan
  const allJadwal = useMemo(() => {
    const praList = praData.map((j: any) => ({
      key: `pra-${j.id}`,
      id: j.id,
      tipe: "pra_asesmen" as const,
      tanggal: j.tanggal,
      waktu: j.waktu,
      durasi: null as number | null,
      tempat: j.tempat,
      link: j.link_meeting,
      catatan: j.catatan,
      pemohon: j.pendaftaran?.user?.nama || "-",
      nomor: j.pendaftaran?.nomor_pendaftaran || "-",
      asesor1: j.pendaftaran?.penugasan_asesor?.find((p: any) => p.urutan === "asesor_1")?.asesor?.nama,
      asesor2: j.pendaftaran?.penugasan_asesor?.find((p: any) => p.urutan === "asesor_2")?.asesor?.nama,
      statusAlur: j.pendaftaran?.status_alur,
      faseTulis: null as string | null,
    }));

    const at2List = allPendaftaran
      .filter((p: any) => {
        const tgl = p.uji_lanjutan?.tanggal_ujian?.slice(0, 10);
        if (!tgl) return false;
        if (applied.dari && tgl < applied.dari) return false;
        if (applied.sampai && tgl > applied.sampai) return false;
        return true;
      })
      .map((p: any) => ({
        key: `at2-${p.id}`,
        id: p.id,
        tipe: "at2" as const,
        tanggal: p.uji_lanjutan.tanggal_ujian?.slice(0, 10),
        waktu: p.uji_lanjutan.waktu_ujian,
        durasi: p.uji_lanjutan.durasi_menit as number | null,
        tempat: p.uji_lanjutan.tempat,
        link: p.uji_lanjutan.link_meeting,
        catatan: null as string | null,
        pemohon: p.user?.nama || "-",
        nomor: p.nomor_pendaftaran || "-",
        asesor1: p.penugasan_asesor?.find((a: any) => a.urutan === "asesor_1")?.asesor?.nama,
        asesor2: p.penugasan_asesor?.find((a: any) => a.urutan === "asesor_2")?.asesor?.nama,
        statusAlur: p.status_alur,
        faseTulis: p.uji_lanjutan.fase_tulis,
      }));

    return [...praList, ...at2List].sort((a, b) => {
      const tgl = a.tanggal.localeCompare(b.tanggal);
      if (tgl !== 0) return tgl;
      return (a.waktu || "").localeCompare(b.waktu || "");
    });
  }, [praData, allPendaftaran, applied]);

  // Filter lokal (cari + tipe)
  const filtered = useMemo(() => {
    return allJadwal.filter((j) => {
      if (filter !== "semua" && j.tipe !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          j.pemohon.toLowerCase().includes(q) ||
          j.nomor.toLowerCase().includes(q) ||
          (j.asesor1 || "").toLowerCase().includes(q) ||
          (j.asesor2 || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allJadwal, filter, search]);

  // Stats
  const totalPra = allJadwal.filter((j) => j.tipe === "pra_asesmen").length;
  const totalAt2 = allJadwal.filter((j) => j.tipe === "at2").length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 pb-20">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Kalender Jadwal Asesmen</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Jadwal Pra Asesmen dan Asesmen Tahap 2 dalam satu tampilan.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
        {/* Preset + Filter Tipe */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Periode:</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreset("minggu_ini")}>Minggu Ini</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreset("bulan_ini")}>Bulan Ini</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreset("semua_waktu")}>Semua</Button>

          <div className="flex-1" />

          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            {(["semua", "pra_asesmen", "at2"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                {f === "semua" ? "Semua" : f === "pra_asesmen" ? "Pra Asesmen" : "AT2"}
              </button>
            ))}
          </div>
        </div>

        {/* Range tanggal + Search */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Dari</label>
            <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="h-9 bg-background text-sm" />
          </div>
          <div className="space-y-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Sampai</label>
            <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="h-9 bg-background text-sm" />
          </div>
          <Button size="sm" className="h-9 gap-2" onClick={() => setApplied({ dari, sampai })}>
            <CalendarDays className="h-3.5 w-3.5" /> Terapkan
          </Button>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Cari nama pemohon atau asesor..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background text-sm" />
          </div>
        </div>

        {/* Stats mini */}
        <div className="flex items-center gap-4 pt-1 border-t text-xs text-muted-foreground">
          <span>Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari {allJadwal.length} jadwal</span>
          <span className="text-border">|</span>
          <span><strong className="text-blue-600 dark:text-blue-400">{totalPra}</strong> Pra Asesmen</span>
          <span className="text-border">|</span>
          <span><strong className="text-purple-600 dark:text-purple-400">{totalAt2}</strong> AT2</span>
        </div>
      </div>

      {/* Tabel Jadwal */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat jadwal...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-semibold text-sm">Tidak ada jadwal ditemukan</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {search ? `Tidak ada hasil untuk pencarian "${search}"` : "Tidak ada jadwal pada periode yang dipilih. Coba ubah filter tanggal."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase font-bold tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold w-24">Waktu</th>
                  <th className="px-4 py-3 font-semibold w-24">Tipe</th>
                  <th className="px-4 py-3 font-semibold">Pemohon</th>
                  <th className="px-4 py-3 font-semibold">Asesor</th>
                  <th className="px-4 py-3 font-semibold">Tempat</th>
                  <th className="px-4 py-3 font-semibold w-28">Status</th>
                  <th className="px-4 py-3 font-semibold w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((j) => (
                  <tr key={j.key} className="hover:bg-muted/20 transition-colors">
                    {/* Tanggal */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground whitespace-nowrap">{formatTanggal(j.tanggal)}</span>
                    </td>

                    {/* Waktu */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-semibold text-foreground whitespace-nowrap">
                        {j.waktu}{/wita|wib/i.test(j.waktu || "") ? "" : " WITA"}
                      </span>
                      {j.tipe === "at2" && j.durasi && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{j.durasi} mnt</p>
                      )}
                      {j.link && (
                        <a href={j.link} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-0.5 whitespace-nowrap">
                          <Video className="h-3 w-3" /> Link Online
                        </a>
                      )}
                    </td>

                    {/* Tipe */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${j.tipe === "at2"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}>
                        {j.tipe === "at2" ? "AT2" : "Pra Asesmen"}
                      </span>
                    </td>

                    {/* Pemohon */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm text-foreground">{j.pemohon}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{j.nomor}</p>
                    </td>

                    {/* Asesor */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {j.asesor1 && (
                          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                            <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded px-1.5 py-0.5 font-bold shrink-0">A1</span>
                            <span className="text-foreground/85">{j.asesor1}</span>
                          </div>
                        )}
                        {j.asesor2 && (
                          <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                            <span className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded px-1.5 py-0.5 font-bold shrink-0">A2</span>
                            <span className="text-foreground/85">{j.asesor2}</span>
                          </div>
                        )}
                        {!j.asesor1 && !j.asesor2 && <span className="text-xs text-muted-foreground">-</span>}
                      </div>
                    </td>

                    {/* Tempat */}
                    <td className="px-4 py-3">
                      {j.tempat ? (
                        <span className="text-xs text-foreground/80 line-clamp-2">{j.tempat}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge tipe={j.tipe} statusAlur={j.statusAlur} faseTulis={j.faseTulis || undefined} />
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      {j.tipe === "pra_asesmen" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => startEdit(j)}
                            disabled={updateMutation.isPending || deleteMutation.isPending || isPraScheduleCompleted(j)}
                            title={isPraScheduleCompleted(j) ? "Jadwal selesai tidak dapat diubah" : "Edit jadwal pra asesmen"}
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => cancelSchedule(j)}
                            disabled={updateMutation.isPending || deleteMutation.isPending || isPraScheduleCompleted(j)}
                            title={isPraScheduleCompleted(j) ? "Jadwal selesai tidak dapat dibatalkan" : "Batalkan jadwal pra asesmen"}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Batal
                          </Button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingJadwal && (
        <div className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Edit Jadwal Pra Asesmen</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Memperbarui jadwal untuk {editingJadwal.pemohon} ({editingJadwal.nomor}).
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingJadwal(null)}>
              Tutup
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tanggal</label>
              <Input
                type="date"
                value={editForm.tanggal}
                onChange={(e) => setEditForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                className="h-9 bg-background text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Waktu</label>
              <Input
                type="time"
                value={editForm.waktu}
                onChange={(e) => setEditForm((prev) => ({ ...prev, waktu: e.target.value }))}
                className="h-9 bg-background text-sm"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tempat</label>
              <Input
                value={editForm.tempat}
                onChange={(e) => setEditForm((prev) => ({ ...prev, tempat: e.target.value }))}
                className="h-9 bg-background text-sm"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Link Meeting</label>
              <Input
                value={editForm.link_meeting}
                onChange={(e) => setEditForm((prev) => ({ ...prev, link_meeting: e.target.value }))}
                className="h-9 bg-background text-sm"
                placeholder="Opsional"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Catatan</label>
              <Textarea
                value={editForm.catatan}
                onChange={(e) => setEditForm((prev) => ({ ...prev, catatan: e.target.value }))}
                className="min-h-20 bg-background text-sm"
                placeholder="Opsional"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingJadwal(null)}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !editForm.tanggal || !editForm.waktu || !editForm.tempat}
              className="gap-2"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
