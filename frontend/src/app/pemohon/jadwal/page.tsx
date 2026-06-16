"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  ChevronRight,
  Download,
  ExternalLink,
  Info,
  MapPin,
  User
} from "lucide-react";
import Link from "next/link";

import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function JadwalPage() {
  const { data: pendaftaran } = useQuery({
    queryKey: ['pendaftaran', 'schedule'],
    queryFn: async () => {
      const { data: res } = await api.get('/pemohon/pendaftaran?view=schedule');
      return res.data;
    }
  });

  const statusAlur = pendaftaran?.status_alur || 'pre_submit';

  const { data: listJadwal = [], isLoading } = useQuery({
    queryKey: ['jadwal-pemohon'],
    queryFn: async () => {
      const { data: res } = await api.get('/pemohon/jadwal');
      return res.data || [];
    }
  });

  const jadwal = listJadwal[0]; // Ambil jadwal terbaru
  const hasSchedule = !!jadwal;

  const handleDownloadKartu = async () => {
    const toastId = toast.loading("Mengunduh Kartu Peserta Asesmen...");
    try {
      const response = await api.get('/pemohon/jadwal/kartu', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Kartu_Peserta_Asesmen.pdf');
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.parentNode?.removeChild(link);
      toast.success("Kartu berhasil diunduh", { id: toastId });
    } catch (error) {
      toast.error("Gagal mengunduh kartu", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  if (!hasSchedule) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Jadwal Asesmen</h1>
          <p className="mt-1 text-xs text-muted-foreground">Jadwal pertemuan dengan asesor akan ditampilkan di sini.</p>
        </div>
        <div className="rounded-2xl border bg-card p-10 text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Belum Ada Jadwal</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
              Saat ini belum ada jadwal asesmen yang ditetapkan untuk Anda.
              Silakan tunggu informasi lebih lanjut.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Menunggu penetapan jadwal
          </div>
          <div className="pt-4">
            <Link
              href="/pemohon/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
            >
              <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 pb-20">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Detail Jadwal Asesmen</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Informasi lengkap mengenai agenda pertemuan asesmen Anda.
          </p>
        </div>
        <Button variant="outline" className="hidden sm:flex" size="sm" onClick={handleDownloadKartu} disabled={!hasSchedule}>
          <Download className="mr-2 h-4 w-4" /> Unduh Kartu
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Schedule Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:shadow-md">
            {/* Header Color Strip */}
            <div className={`h-3 w-full bg-gradient-to-r ${statusAlur === 'asesmen_tahap2' ? 'from-purple-500 to-indigo-600' : 'from-blue-500 to-cyan-500'}`} />

            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusAlur === 'asesmen_tahap2' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'}`}>
                  {statusAlur === 'asesmen_tahap2' ? 'Asesmen Tahap 2' : 'Pra Asesmen'}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-orange-600 animate-pulse">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  Wajib Hadir
                </div>
              </div>

              <div className="grid gap-8">
                {/* Time & Date */}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Waktu Pelaksanaan</h3>
                    <p className="text-base font-bold mt-0.5">
                      {jadwal.tanggal ? new Date(jadwal.tanggal).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "Belum ditentukan"}
                      {jadwal.waktu ? ` - ${jadwal.waktu}` : ""}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Lokasi / Tempat</h3>
                    <p className="text-base font-bold mt-0.5">{jadwal.tempat || "Belum ditentukan"}</p>
                    {jadwal.link_meeting && (
                      <a
                        href={jadwal.link_meeting}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto mt-2 text-primary gap-1")}
                      >
                        Klik Link Pertemuan <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Assessor */}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-tight mb-2.5">Tim Asesor Penguji</h3>
                    {pendaftaran?.penugasan_asesor && pendaftaran.penugasan_asesor.length > 0 ? (
                      <div className="flex flex-col sm:flex-row gap-x-12 gap-y-5 mt-0.5">
                        {pendaftaran.penugasan_asesor.map((tugas: any) => (
                          <div key={tugas.id} className="relative">
                            <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest mb-1">
                              {tugas.urutan === 'asesor_1' ? 'Asesor 1' : 'Asesor 2'}
                            </p>
                            <p className="text-base font-bold leading-none text-foreground">{tugas.asesor?.nama || "Asesor"}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base font-bold mt-0.5">Belum Ditugaskan</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="mt-10 rounded-2xl bg-muted/50 p-5 border border-dashed border-border">
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-foreground uppercase tracking-tight">
                  <Info className="w-4 h-4 text-primary" />
                  Instruksi Khusus
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{jadwal.catatan || "Tidak ada catatan khusus."}"
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Info/Preps */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-bold text-sm mb-4">Persiapan Asesmen</h3>
            <ul className="space-y-4">
              {[
                { title: "Dokumen Asli", desc: "Siapkan semua ijazah, sertifikat, dan SK yang diunggah." },
                { title: "Koneksi Internet", desc: "Pastikan koneksi stabil jika dilakukan secara daring." },
                { title: "Kehadiran", desc: "Harap hadir 15 menit sebelum waktu dimulai." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ChevronRight className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-primary/10 p-6 border border-primary/20">
            <h3 className="font-bold text-sm text-primary mb-2 italic">Butuh Bantuan?</h3>
            <p className="text-xs text-muted-foreground leading-snug">
              Hubungi Admin Program Studi melalui helpdesk jika Anda tidak bisa hadir di waktu tersebut.
            </p>
            <Button className="w-full mt-4 bg-primary/90 hover:bg-primary shadow-sm" size="sm">
              Hubungi Admin
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
