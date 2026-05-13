"use client";

import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import { useBorangStore } from "@/store/useBorangStore";
import { FOCUSED_STATUSES, getRedirectPath } from "@/lib/alur";
import { CheckCircle2, Clock, FileText, User, CalendarDays, MapPin, AlertCircle, Bell, ChevronRight, FolderOpen, FileCheck, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { dataProdi } from "@/data/prodi";

const mainSteps = [
  { label: "Verifikasi Berkas", icon: FileText, desc: "Pemeriksaan kelengkapan dokumen pendaftaran oleh tim admin." },
  { label: "Asesmen Mandiri", icon: Clock, desc: "Penilaian mandiri berdasarkan portofolio & konsultasi pra-asesmen." },
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
  const statusAlur = usePendaftaranStore((s) => s.statusAlur);
  const namaLengkap = usePendaftaranStore((s) => s.namaLengkap);
  const prodiId = usePendaftaranStore((s) => s.prodiId);
  const setStatusAlur = usePendaftaranStore((s) => s.setStatusAlur);
  
  const borangData = useBorangStore((s) => s.data);

  const [showSanggahModal, setShowSanggahModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isFocusedMode = FOCUSED_STATUSES.includes(statusAlur);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: jika status masih di fase awal (belum final submit), redirect ke halaman yang sesuai
  useEffect(() => {
    if (mounted && isFocusedMode) {
      router.replace(getRedirectPath(statusAlur));
    }
  }, [mounted, isFocusedMode, statusAlur, router]);

  const currentStepIndex = getStepIndex(statusAlur);

  // Derive ringkasan data dari borang
  const ringkasan = useMemo(() => {
    const wajib = borangData.sectionE.dokumenWajib || {};
    const tambahan = borangData.sectionE.dokumenTambahan || [];
    const dokWajibCount = Object.values(wajib).filter(Boolean).length;
    const dokTambahanCount = tambahan.filter(d => d.fileName).length;

    const selectedProdi = dataProdi.find(p => p.id === prodiId);
    const totalCpmk = selectedProdi?.kurikulum.reduce((acc, mk) => acc + mk.cpmk.length, 0) || 0;
    const evaluasi = borangData.sectionD.evaluasi || {};
    const filledCpmk = Object.values(evaluasi).filter(v => v.profisiensi).length;

    const pendidikan = (borangData.sectionB.items || []) as Record<string, string>[];
    const pengalaman = (borangData.sectionC.items || []) as Record<string, string>[];

    return {
      dokWajibCount,
      dokTambahanCount,
      totalDokumen: dokWajibCount + dokTambahanCount,
      totalCpmk,
      filledCpmk,
      pendidikanCount: pendidikan.length,
      pengalamanCount: pengalaman.length,
      prodiName: selectedProdi?.nama || "—",
    };
  }, [borangData, prodiId]);

  // Tampilkan loader saat belum mounted atau masih dalam focused mode
  if (!mounted || isFocusedMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Halo, {namaLengkap || "Pemohon"} 👋</h1>
          <p className="mt-1.5 text-xs text-muted-foreground italic">
            Selamat datang di panel pemantauan pendaftaran RPL Anda.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
          <Clock className="w-3.5 h-3.5" /> Terakhir diperbarui: Hari ini, {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* PEMBERITAHUAN TERBARU */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
      >
        <div className="flex gap-4 items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Pemberitahuan Terbaru</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70">Sistem</span>
            </div>
            <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
              Admin Program Studi telah menetapkan jadwal <span className="font-bold">{statusAlur === 'pra_asesmen' ? 'Konsultasi Pra Asesmen' : 'Asesmen Tahap 2 (Wawancara)'}</span> Anda. Mohon periksa detail jadwal dan siapkan diri Anda.
            </p>
            <Link 
              href="/pemohon/jadwal" 
              className={cn(buttonVariants({ variant: "link", size: "sm" }), "p-0 h-auto mt-2 text-amber-700 dark:text-amber-400 font-bold items-center inline-flex")}
            >
              Lihat Detail Jadwal <ChevronRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </motion.div>

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
      {statusAlur === 'pra_asesmen' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Jadwal Pra Asesmen
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Harap hadir tepat waktu dengan membawa dokumen asli.</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                <Clock className="w-4 h-4 text-blue-500" /> {usePendaftaranStore.getState().jadwal?.date || "Menunggu..."}
              </div>
              <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                <MapPin className="w-4 h-4 text-blue-500" /> {usePendaftaranStore.getState().jadwal?.location || "Menunggu..."}
              </div>
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

      {/* JADWAL ASESMEN TAHAP 2 IF APPLICABLE */}
      {statusAlur === 'asesmen_tahap2' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl bg-purple-500/10 border border-purple-500/20 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Jadwal Asesmen Tahap 2 (Wawancara)
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Sesi tanya jawab mendalam berdasarkan portofolio dan klaim Anda.</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                <Clock className="w-4 h-4 text-purple-500" /> {usePendaftaranStore.getState().jadwal?.date || "Menunggu..."}
              </div>
              <div className="flex items-center gap-2 text-sm bg-background/50 px-3 py-1.5 rounded-lg border">
                <MapPin className="w-4 h-4 text-purple-500" /> {usePendaftaranStore.getState().jadwal?.location || "Menunggu..."}
              </div>
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
      {statusAlur === 'pleno' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl bg-green-500/10 border border-green-500/20 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-semibold text-xl text-green-700 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" /> Hasil Pleno Diterbitkan
              </h3>
              <p className="text-sm text-muted-foreground mt-2">Selamat! Anda telah diakui menguasai 12 Mata Kuliah (36 SKS). Anda dapat melanjutkan pendaftaran studi.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button onClick={() => setShowSanggahModal(true)} variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10">
                <AlertCircle className="w-4 h-4 mr-2" /> Sanggah Hasil
              </Button>
              <Button>Unduh SK RPL</Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* SANGGAH MODAL MOCK */}
      {showSanggahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-lg border shadow-xl">
            <h3 className="font-bold text-lg mb-2">Periode Sanggah</h3>
            <p className="text-sm text-muted-foreground mb-4">Anda memiliki waktu 3 hari sejak SK diterbitkan untuk mengajukan sanggah atas keputusan Pleno.</p>
            <textarea className="w-full rounded-md border p-3 text-sm focus:ring-1 focus:ring-primary min-h-[120px] bg-background text-foreground" placeholder="Masukkan alasan sanggah beserta kode bukti yang ingin ditinjau ulang..." />
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowSanggahModal(false)}>Batal</Button>
              <Button onClick={() => setShowSanggahModal(false)}>Kirim Sanggahan</Button>
            </div>
          </div>
        </div>
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
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 mt-0.5 ${
                      isActive ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110" :
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

      {/* DEV TOOLS SIMULATOR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex items-center justify-center gap-2 flex-wrap z-30">
        <span className="text-xs font-bold text-muted-foreground mr-2">SIMULATOR STATUS:</span>
        <Button variant="outline" size="sm" onClick={() => setStatusAlur("waiting_verification")}>Step 1 (Verifikasi)</Button>
        <Button variant="outline" size="sm" onClick={() => setStatusAlur("pra_asesmen")}>Step 2 (Pra Asesmen)</Button>
        <Button variant="outline" size="sm" onClick={() => setStatusAlur("asesmen_tahap2")}>Step 3 (Asesmen T2)</Button>
        <Button variant="outline" size="sm" onClick={() => setStatusAlur("pleno")}>Step 4 (Pleno)</Button>
      </div>
    </div>
  );
}
