"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { AsesorTask, resolveAsesorTaskAction } from "@/lib/asesor-flow";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, Clock, FileText, Info, MapPin, Search, Send, Video } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

const langkahList = [
  { key: "langkah1", label: "1. Pembukaan", desc: "Menjelaskan dan mendiskusikan tujuan konsultasi pra asesmen dengan pemohon." },
  { key: "langkah2", label: "2. Evaluasi Bukti & Asesmen Mandiri", desc: "Mengkaji kesesuaian dokumen bukti dan hasil asesmen mandiri terhadap standar kualifikasi." },
  { key: "langkah3", label: "3. Penjelasan Proses", desc: "Menjelaskan proses asesmen, metode Desk Evaluation, serta hak pemohon untuk mengajukan sanggah." },
  { key: "langkah4", label: "4. Konfirmasi Tujuan", desc: "Mengkonfirmasi tujuan utama pemohon mengikuti asesmen RPL ini." },
  { key: "langkah5", label: "5. Perencanaan & Pengorganisasian", desc: "Menjelaskan jenis bukti, metode asesmen, perangkat yang digunakan, serta sumber daya yang diperlukan." },
  { key: "langkah6", label: "6. Tata Tertib & Aturan", desc: "Menjelaskan tata tertib, aturan K3 (bila ada), penyesuaian yang wajar, serta kerahasiaan data." },
  { key: "langkah7", label: "7. Konfirmasi Jadwal", desc: "Menyepakati estimasi jadwal penyelesaian asesmen portofolio atau jadwal Asesmen Tahap 2 jika diperlukan." },
  { key: "langkah8", label: "8. Persetujuan Bersama", desc: "Pemohon telah menyetujui seluruh rencana asesmen dan proses akan dilanjutkan ke tahap Workspace Penilaian." },
];

function PraAsesmenList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: tugasList = [], isLoading } = useQuery({
    queryKey: ["tugas-asesor-list"],
    queryFn: async () => {
      const { data } = await api.get("/asesor/tugas");
      return data.data || [];
    },
  });

  const filtered = tugasList.filter((task: any) => {
    const nama = task.pendaftaran?.user?.nama || "";
    const nomor = task.pendaftaran?.nomor_pendaftaran || "";
    const query = searchQuery.toLowerCase();
    return nama.toLowerCase().includes(query) || nomor.toLowerCase().includes(query);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Pra-Asesmen</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Mulai Pra-Asesmen atau lihat kembali hasil yang sudah disubmit.
        </p>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari nama atau nomor pendaftaran..."
          className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Pemohon</th>
                <th className="px-6 py-4">Program Studi</th>
                <th className="px-6 py-4">Status Pra-Asesmen</th>
                <th className="px-6 py-4">Tanggal Submit</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Memuat tugas Pra-Asesmen...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((task: any) => {
                  const submitted = Boolean(task.pra_asesmen?.is_submitted);
                  const rejected = task.pra_asesmen?.rekomendasi === "tidak_memenuhi";
                  const action = resolveAsesorTaskAction(task as AsesorTask);
                  return (
                    <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{task.pendaftaran?.user?.nama || "Tanpa Nama"}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.pendaftaran?.nomor_pendaftaran || `Tugas #${task.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">{task.pendaftaran?.prodi?.nama || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                          rejected
                            ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            : submitted
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}>
                          {rejected ? "Tidak Memenuhi Syarat" : submitted ? "Sudah Disubmit" : "Belum Dimulai"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {task.pra_asesmen?.submitted_at
                          ? new Date(task.pra_asesmen.submitted_at).toLocaleDateString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant={submitted ? "outline" : "default"}
                          size="sm"
                          className="gap-2"
                          onClick={() => router.push(`/asesor/pra-asesmen?tugasId=${task.id}`)}
                        >
                          {submitted ? "Lihat Hasil Pra-Asesmen" : action.actionLabel}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Tidak ada tugas Pra-Asesmen yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PraAsesmenPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tugasId = searchParams.get("tugasId");

  const { data: task, isLoading } = useQuery({
    queryKey: ['tugas-asesor', tugasId, 'pra'],
    queryFn: async () => {
      if (!tugasId) return null;
      const { data } = await api.get(`/asesor/tugas/${tugasId}?view=pra`);
      return data.data;
    },
    enabled: !!tugasId
  });

  const [localData, setLocalData] = useState<any>({});

  // Sinkronisasi data awal dari backend
  useEffect(() => {
    if (task?.pra_asesmen) {
      setLocalData(task.pra_asesmen);
    }
  }, [task]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post(`/asesor/tugas/${tugasId}/pra-asesmen`, payload);
      return data;
    },
    onSuccess: (data) => {
      // Jika rekomendasi tidak memenuhi → kembali ke dashboard
      if (data?.rekomendasi === "tidak_memenuhi") {
        toast.success("Pra Asesmen berhasil disubmit. Pemohon direkomendasikan tidak memenuhi syarat.");
        router.push("/asesor/dashboard");
      } else {
        router.push(`/asesor/workspace?tugasId=${tugasId}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan Pra Asesmen.");
    }
  });

  if (!tugasId) return <PraAsesmenList />;
  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Memuat pra-asesmen...</div>;
  if (!task) return null;

  const isReadOnly = Boolean(task.pra_asesmen?.is_submitted);
  const isRejected = task.pra_asesmen?.rekomendasi === "tidak_memenuhi";
  const jadwalAsesmen = Array.isArray(task.pendaftaran?.jadwal_asesmen)
    ? task.pendaftaran.jadwal_asesmen[0]
    : task.pendaftaran?.jadwal_asesmen;
  const formatTanggal = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  const formatTanggalWaktu = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("id-ID");
  };

  const isAllChecked = langkahList.every((l) => localData[l.key] === true || localData[l.key.replace('langkah', 'langkah_')] === true);
  const hasRekomendasi = !!localData.rekomendasi;
  const hasCatatanRekomendasi = (localData.catatan_rekomendasi || '').trim().length >= 10;
  const isReadyToSubmit = isAllChecked && hasRekomendasi && hasCatatanRekomendasi;


  const handleToggle = (key: string) => {
    if (isReadOnly) return;
    const dbKey = key.replace('langkah', 'langkah_');
    setLocalData((prev: any) => ({ ...prev, [dbKey]: !prev[dbKey] }));
  };

  const handleTextChange = (key: string, value: string) => {
    if (isReadOnly) return;
    const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase(); // Camel to snake case
    setLocalData((prev: any) => ({ ...prev, [dbKey]: value }));
  };

  const handleSubmit = async () => {
    // Validasi frontend sebelum kirim
    const errors: string[] = [];

    langkahList.forEach((item) => {
      const dbKey = item.key.replace('langkah', 'langkah_');
      if (!localData[dbKey]) {
        errors.push(`${item.label} belum dicentang.`);
      }
    });

    if (!localData.rekomendasi) {
      errors.push('Rekomendasi tindak lanjut belum dipilih.');
    }

    if (!localData.catatan_rekomendasi || localData.catatan_rekomendasi.trim().length < 10) {
      errors.push('Catatan rekomendasi wajib diisi minimal 10 karakter.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(`Masih ada ${errors.length} item yang belum dilengkapi. Silakan periksa kembali.`);

      // Hanya scroll ke atas jika ada error selain catatan rekomendasi
      // karena pesan error catatan rekomendasi sekarang ada di bawah dekat tombol submit
      const topErrors = errors.filter(e => e !== 'Catatan rekomendasi wajib diisi minimal 10 karakter.');
      if (topErrors.length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setValidationErrors([]);

    const payload = {
      ...localData,
      is_submitted: true,
      rekomendasi: localData.rekomendasi === "Lanjut Penuh" ? "lanjut_penuh" :
        localData.rekomendasi === "Lanjut dengan Catatan" ? "lanjut_catatan" : "tidak_memenuhi"
    };

    saveMutation.mutate(payload);
  };

  const user = task.pendaftaran?.user;
  const prodi = task.pendaftaran?.prodi;
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-6">
        <Link href="/asesor/pra-asesmen" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Pra Asesmen</h1>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400">
              {task.id}
            </span>
            {isReadOnly && (
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                isRejected
                  ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              }`}>
                {isRejected ? "Tidak Memenuhi Syarat" : "Sudah Disubmit"}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isReadOnly
              ? "Hasil Pra-Asesmen yang telah disubmit. Data ditampilkan dalam mode baca saja."
              : "Konsultasi awal dengan pemohon sebelum membuka akses Workspace Penilaian Portofolio."}
          </p>
        </div>
      </div>


      {/* Jadwal Pertemuan Card */}
      {jadwalAsesmen && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm border-blue-200 dark:border-blue-900/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-0" />
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-700 dark:text-blue-400 border-b pb-2">
            <CalendarDays className="h-5 w-5" /> Jadwal Pertemuan Anda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Tanggal</p>
                <p className="font-semibold">{formatTanggal(jadwalAsesmen.tanggal)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Waktu</p>
                <p className="font-semibold">{jadwalAsesmen.waktu || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Tempat / Lokasi</p>
                <p className="font-semibold">{jadwalAsesmen.tempat || "-"}</p>
              </div>
            </div>

            {jadwalAsesmen.link_meeting && (
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Link Online Meeting</p>
                  <a
                    href={jadwalAsesmen.link_meeting}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Buka Link Meeting &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Identitas Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-500 uppercase">
            {user?.nama?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.nama || "Pemohon"}</h2>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">{task.pendaftaran?.nomor_pendaftaran || "-"}</p>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-sm text-muted-foreground">Program Studi Tujuan</p>
          <p className="font-semibold text-primary">{prodi?.nama}</p>
        </div>
      </div>

      {/* Info Checklist */}
      <div className={`rounded-2xl border p-5 flex gap-4 ${
        isReadOnly
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-blue-500/20 bg-blue-500/10"
      }`}>
        {isReadOnly
          ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          : <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        }
        <div className={`text-sm leading-relaxed ${
          isReadOnly
            ? "text-emerald-900 dark:text-emerald-200"
            : "text-blue-900 dark:text-blue-200"
        }`}>
          <p className="font-bold mb-1">{isReadOnly ? "Hasil Pra-Asesmen" : "Penting:"}</p>
          <p>
            {isReadOnly
              ? `Pra-Asesmen ini telah disubmit${formatTanggalWaktu(task.pra_asesmen?.submitted_at) ? ` pada ${formatTanggalWaktu(task.pra_asesmen?.submitted_at)}` : ""} dan tidak dapat diubah kembali.`
              : <>Lengkapi seluruh 8 langkah checklist konsultasi di bawah ini. Semua langkah, rekomendasi, dan catatan <strong>wajib diisi</strong> sebelum Anda dapat menyimpan dan membuka akses ke Workspace Penilaian Portofolio.</>}
          </p>
        </div>
      </div>

      {/* Validation Errors */}
      {!isReadOnly && validationErrors.filter(e => e !== 'Catatan rekomendasi wajib diisi minimal 10 karakter.').length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <p className="font-bold text-sm text-red-800 dark:text-red-300">Tidak dapat disubmit - {validationErrors.filter(e => e !== 'Catatan rekomendasi wajib diisi minimal 10 karakter.').length} item belum dilengkapi:</p>
          </div>
          <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-1 pl-7">
            {validationErrors.filter(e => e !== 'Catatan rekomendasi wajib diisi minimal 10 karakter.').map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Checklist 8 Langkah */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Checklist Kegiatan Pra Asesmen
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {langkahList.map((item) => {
            const dbKey = item.key.replace('langkah', 'langkah_');
            const isChecked = !!localData[dbKey];
            return (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key)}
                className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${isReadOnly ? "cursor-default" : "cursor-pointer"} ${isChecked
                  ? "border-green-500 bg-green-50/50 dark:bg-green-500/10"
                  : `border-border bg-card ${isReadOnly ? "" : "hover:border-primary/40"}`
                  }`}
              >
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isChecked ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground"
                  }`}>
                  {isChecked && <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div>
                  <p className={`font-bold text-sm ${isChecked ? "text-green-800 dark:text-green-400" : "text-foreground"}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catatan Khusus */}
      <div className="space-y-6 pt-4">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
          <FileText className="h-5 w-5 text-primary" />
          Catatan & Identifikasi Khusus
        </h3>

        <div className="space-y-3">
          <Label className="font-semibold text-sm">Catatan Observasi Kesesuaian Bukti (Opsional)</Label>
          <textarea
            disabled={isReadOnly}
            value={localData.catatan_observasi || ""}
            onChange={(e) => handleTextChange("catatanObservasi", e.target.value)}
            className="w-full min-h-[100px] rounded-xl border bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:cursor-default disabled:opacity-80"
            placeholder="Tuliskan catatan awal Anda saat meninjau dokumen pemohon..."
          />
        </div>

        <div className="space-y-3">
          <Label className="font-semibold text-sm">Kebutuhan Spesifik / Penyesuaian Wajar (Bila Ada)</Label>
          <textarea
            disabled={isReadOnly}
            value={localData.kebutuhan_khusus || ""}
            onChange={(e) => handleTextChange("kebutuhanKhusus", e.target.value)}
            className="w-full min-h-[80px] rounded-xl border bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:cursor-default disabled:opacity-80"
            placeholder="Karakteristik khusus pemohon, kendala bahasa, aksesibilitas, dll..."
          />
        </div>
      </div>

      {/* Rekomendasi Akhir */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-bold">Rekomendasi Tindak Lanjut</h3>
        <p className="text-sm text-muted-foreground mb-4">Pilih rekomendasi berdasarkan konsultasi pra asesmen ini.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {["Lanjut Penuh", "Lanjut dengan Catatan", "Tidak Memenuhi Syarat"].map((opt) => {
            const dbVal = opt === "Lanjut Penuh" ? "lanjut_penuh" : opt === "Lanjut dengan Catatan" ? "lanjut_catatan" : "tidak_memenuhi";
            const isSelected = localData.rekomendasi === opt || localData.rekomendasi === dbVal;
            const isTolak = opt === "Tidak Memenuhi Syarat";
            return (
              <button
                key={opt}
                type="button"
                disabled={isReadOnly}
                onClick={() => {
                  if (!isReadOnly) {
                    setLocalData((prev: any) => ({ ...prev, rekomendasi: opt }));
                  }
                }}
                className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${isSelected
                  ? isTolak
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Warning khusus jika pilih Tidak Memenuhi Syarat */}
        {(localData.rekomendasi === "Tidak Memenuhi Syarat" || localData.rekomendasi === "tidak_memenuhi") && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Perhatian: Pemohon Akan Ditolak</p>
            </div>
            <p className="text-xs text-red-600 dark:text-red-500 leading-relaxed ml-6">
              Dengan memilih <strong>Tidak Memenuhi Syarat</strong>, status pendaftaran pemohon akan berubah menjadi <strong>Ditolak</strong> dan proses RPL dihentikan. Admin Prodi akan mendapat notifikasi dan dapat melakukan peninjauan ulang jika diperlukan.
            </p>
          </div>
        )}

        {(localData.rekomendasi || localData.rekomendasi?.includes('_')) && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
            <Label className={`font-semibold text-sm mb-2 block ${validationErrors.includes('Catatan rekomendasi wajib diisi minimal 10 karakter.') ? 'text-red-600 dark:text-red-400' : ''}`}>Catatan Rekomendasi (Wajib)</Label>
            <textarea
              disabled={isReadOnly}
              value={localData.catatan_rekomendasi || ""}
              onChange={(e) => {
                handleTextChange("catatanRekomendasi", e.target.value);
                // Auto remove error if length is valid
                if (e.target.value.trim().length >= 10 && validationErrors.includes('Catatan rekomendasi wajib diisi minimal 10 karakter.')) {
                  setValidationErrors(prev => prev.filter(err => err !== 'Catatan rekomendasi wajib diisi minimal 10 karakter.'));
                }
              }}
              className={`w-full min-h-[80px] rounded-xl border bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-colors disabled:cursor-default disabled:opacity-80 ${validationErrors.includes('Catatan rekomendasi wajib diisi minimal 10 karakter.') ? 'border-red-500 focus:ring-red-500/20' : ''}`}
              placeholder={`Berikan alasan mengapa Anda memilih "${localData.rekomendasi}"...`}
            />
            {!isReadOnly && validationErrors.includes('Catatan rekomendasi wajib diisi minimal 10 karakter.') && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Catatan rekomendasi wajib diisi minimal 10 karakter.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-8 border-t space-y-4">
        {/* Progress Summary */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className={`flex items-center gap-2 ${isAllChecked ? 'text-green-600' : 'text-muted-foreground'}`}>
            <CheckCircle2 className="h-4 w-4" />
            <span>Checklist: {langkahList.filter(l => !!localData[l.key.replace('langkah', 'langkah_')]).length}/8</span>
          </div>
          <div className={`flex items-center gap-2 ${hasRekomendasi ? 'text-green-600' : 'text-muted-foreground'}`}>
            <CheckCircle2 className="h-4 w-4" />
            <span>Rekomendasi: {hasRekomendasi ? '✓' : 'Belum dipilih'}</span>
          </div>
          <div className={`flex items-center gap-2 ${hasCatatanRekomendasi ? 'text-green-600' : 'text-muted-foreground'}`}>
            <CheckCircle2 className="h-4 w-4" />
            <span>Catatan: {hasCatatanRekomendasi ? '✓' : 'Belum diisi'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {isReadOnly ? (
            <>
              <Link href="/asesor/pra-asesmen">
                <Button variant="outline">Kembali ke Daftar</Button>
              </Link>
              {!isRejected && (
                <Link href={`/asesor/workspace?tugasId=${task.id}`}>
                  <Button className="gap-2">
                    Buka Penilaian Portofolio
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <Button
              size="lg"
              disabled={saveMutation.isPending}
              onClick={handleSubmit}
              className={`gap-2 ${isReadyToSubmit
                ? 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90'
                : 'bg-slate-400 hover:bg-slate-500 text-white cursor-pointer'}`}
            >
              {saveMutation.isPending ? "Menyimpan..." : "Simpan & Buka Workspace"}
              {!saveMutation.isPending && <Send className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}

export default function PraAsesmenPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Memuat pra-asesmen...</div>}>
      <PraAsesmenPageContent />
    </Suspense>
  );
}
