"use client";

import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  User, 
  Info, 
  ArrowLeft, 
  Download,
  Calendar,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function JadwalPage() {
  const { jadwal, statusAlur } = usePendaftaranStore();

  // Memaksa tampil true untuk kebutuhan demonstrasi UI
  const hasSchedule = true; 

  if (!hasSchedule) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border bg-card/50">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Belum Ada Jadwal</h1>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          Saat ini belum ada jadwal asesmen yang ditetapkan untuk Anda.
          Silakan tunggu informasi lebih lanjut.
        </p>
        <Link 
          href="/pemohon/dashboard" 
          className={cn(buttonVariants({ variant: "outline" }), "mt-8")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
        </Link>
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
        <Button variant="outline" className="hidden sm:flex" size="sm">
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
                  {jadwal.title}
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
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Hari & Tanggal</h3>
                    <p className="text-base font-bold mt-0.5">{jadwal.date}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-primary text-sm font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{jadwal.time}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Lokasi / Tempat</h3>
                    <p className="text-base font-bold mt-0.5">{jadwal.location}</p>
                    {jadwal.room && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold">
                        {jadwal.room}
                      </div>
                    )}
                    {jadwal.link && (
                      <a 
                        href={jadwal.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto mt-2 text-primary gap-1")}
                      >
                        Klik Link Pertemuan (Google Meet) <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Assessor */}
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Dosen Penguji / Asesor</h3>
                    <div className="space-y-2 mt-1">
                      {jadwal.assessor.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          <p className="text-base font-bold leading-none">{name}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3">Tim Asesor Program Studi TI POLIBAN</p>
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
                  "{jadwal.notes}"
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
