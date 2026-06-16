"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { FOCUSED_STATUSES, getRedirectPath } from "@/lib/alur";
import api from "@/lib/api";
import { notificationQueryOptions } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, Bell, CalendarDays, CheckCircle2, ChevronRight, Clock, Download, FileCheck, FileText, FolderOpen, GraduationCap, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const mainSteps = [
  { label: "Verifikasi Berkas", icon: FileText, desc: "Pemeriksaan kelengkapan dokumen pendaftaran oleh tim admin." },
  { label: "Pra-Asesmen", icon: Clock, desc: "Konsultasi dengan asesor dan penilaian portofolio sebelum asesmen lanjutan." },
  { label: "Asesmen Tahap 2", icon: User, desc: "Ujian Tulis / Wawancara / Demonstrasi kemampuan praktis." },
  { label: "Pleno & Sanggah", icon: CheckCircle2, desc: "Pengumuman hasil akhir RPL dan periode pengajuan keberatan." }
];

const getStepIndex = (status: string) => {
  switch (status) {
    case 'pre_submit':
    case 'waiting_payment':
    case 'payment_verified':
    case 'waiting_verification': return 0;
    case 'pra_asesmen': return 1;
    case 'asesmen_tahap2': return 2;
    case 'pleno':
    case 'finished': return 3;
    default: return 0;
  }
};

export default function DashboardPage() {
  const router = useRouter();

  const { data: pendaftaran, isLoading } = useQuery({
    queryKey: ['pendaftaran', 'dashboard'],
    queryFn: async () => {
      const { data: res } = await api.get('/pemohon/pendaftaran?view=dashboard');
      return res.data;
    }
  });

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data: res } = await api.get('/me');
      return res.user ?? null;
    }
  });

  const { data: latestNotif } = useQuery({
    ...notificationQueryOptions,
    select: (data) => data.data?.[0] || null,
  });

  const statusAlur = pendaftaran?.status_alur || 'pre_submit';
  const namaLengkap = pendaftaran?.data_diri?.nama_lengkap || me?.nama || '';
  const prodiName = pendaftaran?.prodi?.nama || "-";
  const prodiId = pendaftaran?.prodi_id;

  const [mounted, setMounted] = useState(false);
  const [isDownloadingSk, setIsDownloadingSk] = useState(false);

  const isFocusedMode = FOCUSED_STATUSES.includes(statusAlur);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: jika status masih di fase awal (belum final submit), redirect ke halaman yang sesuai
  useEffect(() => {
    if (mounted && !isLoading && isFocusedMode) {
      router.replace(getRedirectPath(statusAlur));
    }
  }, [mounted, isLoading, isFocusedMode, statusAlur, router]);

  const currentStepIndex = getStepIndex(statusAlur);
  const isSkTerbit = pendaftaran?.sk_keputusan?.status === "sk_terbit";

  const handleDownloadSk = async () => {
    if (!isSkTerbit || isDownloadingSk) return;

    const toastId = toast.loading("Menyiapkan Surat Keputusan RPL...");
    setIsDownloadingSk(true);

    try {
      const response = await api.get("/pemohon/hasil/sk", {
        responseType: "blob",
      });
      const disposition = response.headers["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch?.[1] || "SK_RPL.pdf";
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Surat Keputusan RPL berhasil diunduh", { id: toastId });
    } catch {
      toast.error("Gagal mengunduh Surat Keputusan RPL", {
        id: toastId,
        description:
          "Pastikan SK sudah diterbitkan oleh pimpinan, lalu coba kembali.",
      });
    } finally {
      setIsDownloadingSk(false);
    }
  };

  // Derive ringkasan data dari borang riil database
  const ringkasan = useMemo(() => {
    if (!pendaftaran) return { dokWajibCount: 0, dokTambahanCount: 0, totalDokumen: 0, totalCpmk: 0, filledCpmk: 0, pendidikanCount: 0, pengalamanCount: 0, prodiName: "-" };

    const dokWajibCount = pendaftaran.dokumen_wajib_count || 0;
    const dokTambahanCount = pendaftaran.dokumen_tambahan_count || 0;
    const filledCpmk = pendaftaran.evaluasi_diri_count || 0;
    // Asumsikan total cpmk tersedia jika diperlukan, atau placeholder untuk saat ini
    const totalCpmk = filledCpmk; // Idealnya dari kurikulum prodi

    return {
      dokWajibCount,
      dokTambahanCount,
      totalDokumen: dokWajibCount + dokTambahanCount,
      totalCpmk,
      filledCpmk,
      pendidikanCount: pendaftaran.riwayat_pendidikan_count || 0,
      pengalamanCount: pendaftaran.pengalaman_kerja_count || 0,
      prodiName: pendaftaran.prodi?.nama || "-",
    };
  }, [pendaftaran]);

  // Tampilkan loader saat belum mounted atau loading dari API
  if (!mounted || isLoading || isFocusedMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Halo, {namaLengkap || "Pemohon"}</h1>
          <p className="mt-1.5 text-xs text-muted-foreground italic">
            Selamat datang di panel pemantauan pendaftaran RPL Anda.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
          <Clock className="w-3.5 h-3.5" /> Terakhir diperbarui: Hari ini, {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* PEMBERITAHUAN TERBARU — dari database, hanya tampil kalau ada notifikasi */}
      {latestNotif && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "mb-8 rounded-xl border p-4",
            latestNotif.is_read
              ? "border-border bg-muted/40"
              : "border-amber-500/30 bg-amber-500/10"
          )}
        >
          <div className="flex gap-4 items-start">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white",
              latestNotif.is_read ? "bg-muted-foreground/60" : "bg-amber-500"
            )}>
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <h3 className={cn(
                  "font-semibold text-sm",
                  latestNotif.is_read
                    ? "text-foreground/70"
                    : "text-amber-700 dark:text-amber-400"
                )}>
                  {latestNotif.title}
                </h3>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  latestNotif.is_read ? "text-muted-foreground" : "text-amber-600/70"
                )}>
                  {latestNotif.is_read ? "Dibaca" : "Baru"}
                </span>
              </div>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                {latestNotif.message}
              </p>
              {latestNotif.href && (
                <Link
                  href={latestNotif.href}
                  className={cn(
                    buttonVariants({ variant: "link", size: "sm" }),
                    "p-0 h-auto mt-2 font-bold items-center inline-flex",
                    latestNotif.is_read
                      ? "text-muted-foreground"
                      : "text-amber-700 dark:text-amber-400"
                  )}
                >
                  Lihat Detail <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* RINGKASAN PENDAFTARAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-muted-foreground">Program Studi</span>
          </div>
          <p className="text-sm font-bold text-foreground truncate">{ringkasan.prodiName}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen className="h-4 w-4 text-green-500" />
            <span className="text-xs font-semibold text-muted-foreground">Dokumen</span>
          </div>
          <p className="text-sm font-bold text-foreground">
            {ringkasan.totalDokumen} <span className="text-xs font-normal text-muted-foreground">terunggah</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{ringkasan.dokWajibCount}/4 wajib • {ringkasan.dokTambahanCount} tambahan</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-semibold text-muted-foreground">Evaluasi Diri</span>
          </div>
          <p className="text-sm font-bold text-foreground">
            {ringkasan.filledCpmk}/{ringkasan.totalCpmk} <span className="text-xs font-normal text-muted-foreground">CPMK</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground">Profil</span>
          </div>
          <p className="text-sm font-bold text-foreground">
            {ringkasan.pendidikanCount} <span className="text-xs font-normal text-muted-foreground">Pendidikan</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{ringkasan.pengalamanCount} Pengalaman Kerja</p>
        </motion.div>
      </div>

      {/* JADWAL PRA ASESMEN IF APPLICABLE */}
      {statusAlur === 'pra_asesmen' && (() => {
        const jadwal = Array.isArray(pendaftaran?.jadwal_asesmen) ? pendaftaran.jadwal_asesmen[0] : pendaftaran?.jadwal_asesmen;
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400">
                Jadwal Pra Asesmen
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Harap hadir tepat waktu dengan membawa dokumen asli.</p>
              <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-3">
                {jadwal?.tanggal ? (
                  <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    {new Date(jadwal.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                ) : null}
                {jadwal?.waktu ? (
                  <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                    <Clock className="w-4 h-4 text-blue-500" />
                    {jadwal.waktu}
                  </div>
                ) : null}
                {jadwal?.tempat ? (
                  <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {jadwal.tempat}
                  </div>
                ) : null}
                {!jadwal?.tanggal && !jadwal?.waktu && !jadwal?.tempat && (
                  <p className="text-sm text-muted-foreground italic">Jadwal belum ditentukan oleh Admin Prodi. Anda akan menerima notifikasi setelah jadwal ditetapkan.</p>
                )}

                {jadwal?.link_meeting && (
                  <a
                    href={jadwal.link_meeting}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg border border-blue-700 shadow-sm transition-colors"
                  >
                    <MapPin className="w-4 h-4" /> Gabung Meeting Online
                  </a>
                )}
              </div>
            </div>
            <Link
              href="/pemohon/jadwal"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Lihat Detail
            </Link>
          </motion.div>
        );
      })()}

      {/* JADWAL ASESMEN TAHAP 2 IF APPLICABLE */}
      {statusAlur === 'asesmen_tahap2' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl bg-purple-500/10 border border-purple-500/20 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-400">
              Jadwal Asesmen Tahap 2 (Wawancara)
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Sesi tanya jawab mendalam berdasarkan portofolio dan klaim Anda.</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              {pendaftaran?.uji_lanjutan?.tanggal_ujian ? (
                <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                  <Clock className="w-4 h-4 text-purple-500" />
                  {new Date(pendaftaran.uji_lanjutan.tanggal_ujian).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {pendaftaran.uji_lanjutan.waktu_ujian ? ` - ${pendaftaran.uji_lanjutan.waktu_ujian}` : ""}
                </div>
              ) : null}
              {pendaftaran?.uji_lanjutan?.tempat ? (
                <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  {pendaftaran.uji_lanjutan.tempat}
                </div>
              ) : null}
              {!pendaftaran?.uji_lanjutan?.tanggal_ujian && !pendaftaran?.uji_lanjutan?.tempat && (
                <p className="text-sm text-muted-foreground italic">Jadwal belum ditentukan oleh Admin Prodi. Anda akan menerima notifikasi setelah jadwal ditetapkan.</p>
              )}
              {pendaftaran?.uji_lanjutan?.link_meeting && (
                <a
                  href={pendaftaran.uji_lanjutan.link_meeting}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg border border-purple-700 shadow-sm transition-colors"
                >
                  <MapPin className="w-4 h-4" /> Gabung Meeting Online
                </a>
              )}
            </div>
          </div>
          <Link
            href="/pemohon/jadwal"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Lihat Detail
          </Link>
        </motion.div>
      )}

      {/* HASIL PLENO IF APPLICABLE */}
      {statusAlur === 'finished' && pendaftaran?.sk_keputusan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl bg-green-500/10 border border-green-500/20 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-semibold text-xl text-green-700 dark:text-green-400">
                {isSkTerbit ? "Surat Keputusan RPL Diterbitkan" : "Hasil Pleno Ditetapkan"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Selamat! Anda telah diakui menguasai{" "}
                <strong className="text-foreground">{pendaftaran.sk_keputusan.total_sks_diakui ?? "-"} SKS</strong>{" "}
                melalui proses RPL. Anda dapat melanjutkan pendaftaran studi.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Link href="/pemohon/hasil-sanggah" className={cn(buttonVariants({ variant: "outline" }), "text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10")}>
                <AlertCircle className="w-4 h-4 mr-2" /> Sanggah Hasil
              </Link>
              <Button
                onClick={handleDownloadSk}
                disabled={!isSkTerbit || isDownloadingSk}
                className="gap-2"
                title={isSkTerbit ? "Unduh Surat Keputusan RPL" : "SK masih menunggu penerbitan pimpinan"}
              >
                <Download className="h-4 w-4" />
                {isDownloadingSk
                  ? "Menyiapkan SK..."
                  : isSkTerbit
                    ? "Unduh SK RPL"
                    : "Menunggu SK Terbit"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* MENUNGGU SIDANG PLENO */}
      {statusAlur === 'pleno' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl bg-orange-500/10 border border-orange-500/20 p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-orange-700 dark:text-orange-400">
                Menunggu Sidang Pleno
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Penilaian dari semua asesor telah selesai. Admin Prodi sedang melakukan sidang pleno untuk menentukan hasil akhir RPL Anda. Hasil akan diberitahukan melalui notifikasi.
              </p>
            </div>
          </div>
        </motion.div>
      )}



      <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold border-b pb-3">Status & Alur Pendaftaran</h2>

        <div className="relative">
          <div className="absolute left-[19px] top-6 hidden h-[calc(100%-3rem)] w-0.5 bg-muted md:block z-0">
            <motion.div
              className="w-full bg-primary"
              initial={{ height: "0%" }}
              animate={{ height: `${(currentStepIndex / (mainSteps.length - 1)) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          <div className="space-y-6 relative z-10 px-1 lg:px-0">
            {mainSteps.map((step, i) => {
              const isActive = i === currentStepIndex;
              const isPast = i < currentStepIndex;

              return (
                <div key={i} className="flex gap-4 md:gap-5 items-start">
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 mt-0.5 ${isActive ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110" :
                      isPast ? "border-primary bg-background text-primary" : "border-muted bg-background text-muted-foreground"
                      }`}
                  >
                    <step.icon className={`h-4.5 w-4.5 ${isActive && "animate-pulse"}`} />
                  </div>
                  <div className="pt-1 flex-1">
                    <h3 className={`font-semibold text-base ${isActive ? "text-foreground" : isPast ? "text-foreground/80" : "text-muted-foreground"}`}>
                      {step.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                      {step.desc}
                    </p>
                    {isActive && i === 0 && statusAlur === 'waiting_verification' && (
                      <div className="mt-2 inline-block bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-tighter">
                        Menunggu Verifikasi Admin
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DEV TOOLS SIMULATOR (Removed since we use real API now) */}
    </div>
  );
}
