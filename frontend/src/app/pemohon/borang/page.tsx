"use client";

import SectionA from "@/components/pemohon/borang/SectionA";
import SectionB from "@/components/pemohon/borang/SectionB";
import SectionC from "@/components/pemohon/borang/SectionC";
import SectionD from "@/components/pemohon/borang/SectionD";
import SectionE from "@/components/pemohon/borang/SectionE";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { FOCUSED_STATUSES, getRedirectPath } from "@/lib/alur";
import { useBorangStore } from "@/store/useBorangStore";
import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import { useShallow } from "zustand/react/shallow";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  GraduationCap,
  LogOut,
  Save,
  Send,
  User,
  X
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/*  Section config                                                     */
/* ------------------------------------------------------------------ */
const sections = [
  { id: "sectionA", label: "Data Diri", icon: User },
  { id: "sectionB", label: "Riwayat Pendidikan", icon: GraduationCap },
  { id: "sectionC", label: "Pengalaman Kerja", icon: Briefcase },
  { id: "sectionE", label: "Dokumen Pendukung", icon: Send },
  { id: "sectionD", label: "Evaluasi Diri", icon: FileCheck },
];

export default function BorangPage() {
  const router = useRouter();
  const {
    activeSection,
    setActiveSection,
    validateSection,
    lastSaved
  } = useBorangStore(useShallow((state) => ({
    activeSection: state.activeSection,
    setActiveSection: state.setActiveSection,
    validateSection: state.validateSection,
    lastSaved: state.lastSaved,
  })));

  const user = useAuthStore((state) => state.user);
  const prodiId = usePendaftaranStore((state) => state.prodiId);
  const setBorangOwnerContext = useBorangStore((state) => state.setOwnerContext);
  const setPendaftaranOwnerContext = usePendaftaranStore((state) => state.setOwnerContext);
  const setPendaftaranId = usePendaftaranStore((state) => state.setPendaftaranId);
  const setProfile = usePendaftaranStore((state) => state.setProfile);

  const { data: pendaftaran, isLoading, refetch } = useQuery({
    queryKey: ['pendaftaran', 'summary'],
    queryFn: async () => {
      const { data: res } = await api.get('/pemohon/pendaftaran?view=summary');
      return res.data;
    }
  });

  const statusAlur = pendaftaran?.status_alur || 'pre_submit';

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState("");
  const [showError, setShowError] = useState(false);
  const observerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Access control
  const isAllowedStatus = statusAlur === 'pre_submit' || statusAlur === 'payment_verified';
  const isFocusedMode = FOCUSED_STATUSES.includes(statusAlur as any);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    setPendaftaranOwnerContext(user.id);
    if (pendaftaran?.id) {
      setBorangOwnerContext(user.id, pendaftaran.id);
      setPendaftaranId(pendaftaran.id);
      setProfile(user.nama, user.email, pendaftaran.prodi_id ? String(pendaftaran.prodi_id) : null);
    }
  }, [
    user,
    pendaftaran?.id,
    pendaftaran?.prodi_id,
    setBorangOwnerContext,
    setPendaftaranOwnerContext,
    setPendaftaranId,
    setProfile,
  ]);

  useEffect(() => {
    // If user is not allowed on this page, redirect them to their proper path
    if (mounted && !isLoading && !isAllowedStatus) {
      router.replace(getRedirectPath(statusAlur as any));
    }
  }, [mounted, isLoading, isAllowedStatus, statusAlur, router]);

  const handleLogout = () => {
    // Simulate logout - in real app would clear tokens
    router.push("/auth/login");
  };

  // Calculate overall progress based on valid sections
  const validSectionsCount = sections.filter(s => validateSection(s.id, prodiId)).length;

  // Auto-save simulation every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoSaveMsg("Menyimpan otomatis...");
      setTimeout(() => setAutoSaveMsg("Tersimpan"), 800);
      setTimeout(() => setAutoSaveMsg(""), 3000);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll-spy: pilih section yang sedang berada paling dekat dengan area baca.
  useEffect(() => {
    const updateActiveSection = () => {
      const anchorY = 112;
      let nextSection = sections[0].id;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const el = observerRefs.current.get(section.id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= anchorY && rect.bottom > anchorY) {
          nextSection = section.id;
          break;
        }

        const distance = Math.abs(rect.top - anchorY);
        if (distance < closestDistance) {
          closestDistance = distance;
          nextSection = section.id;
        }
      }

      if (useBorangStore.getState().activeSection !== nextSection) {
        setActiveSection(nextSection);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [setActiveSection]);

  const setRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) observerRefs.current.set(id, el);
  }, []);

  const scrollToSection = (id: string) => {
    const el = observerRefs.current.get(id);
    setActiveSection(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);

  const handleFinalSubmit = () => {
    // Check if all sections are valid
    const allValid = sections.every(s => validateSection(s.id, prodiId));
    if (!allValid) {
      setShowError(true);
      const firstInvalid = sections.find(s => !validateSection(s.id, prodiId));
      if (firstInvalid) scrollToSection(firstInvalid.id);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    setShowSubmitDialog(true);
  };

  const executeFinalSubmit = async () => {
    setShowSubmitDialog(false);
    setSubmitting(true);
    try {
      const borangData = useBorangStore.getState().data;
      const validUrls: string[] = [];
      const sectionE = borangData.sectionE;

      if (sectionE.dokumenWajib) {
        if ((sectionE.dokumenWajib as any).IjazahUrl) validUrls.push((sectionE.dokumenWajib as any).IjazahUrl);
        if ((sectionE.dokumenWajib as any).TranskripUrl) validUrls.push((sectionE.dokumenWajib as any).TranskripUrl);
        if ((sectionE.dokumenWajib as any).KTPUrl) validUrls.push((sectionE.dokumenWajib as any).KTPUrl);
        if ((sectionE.dokumenWajib as any).PasFotoUrl) validUrls.push((sectionE.dokumenWajib as any).PasFotoUrl);
      }

      if (sectionE.dokumenTambahan) {
        sectionE.dokumenTambahan.forEach((dok: any) => {
          if (dok.url) validUrls.push(dok.url);
        });
      }

      // 1. Data Diri (Section A)
      const secA = borangData.sectionA as any;
      await api.post(`/pemohon/pendaftaran/${pendaftaran?.id}/data-diri`, {
        nama_lengkap: secA.namaLengkap,
        nik: secA.nik,
        tempat_lahir: secA.tempatLahir,
        tanggal_lahir: secA.tanggalLahir,
        jenis_kelamin: secA.jenisKelamin,
        agama: secA.agama || null,
        kebangsaan: secA.kebangsaan || 'Indonesia',
        no_hp: secA.noHP,
        no_telp_rumah: secA.noTelpRumah || null,
        alamat: secA.alamat,
        kode_pos: secA.kodePos || null,
        email_pribadi: secA.emailPribadi,
      });

      // 2. Riwayat Pendidikan & Transkrip (Section B)
      const secB_items = borangData.sectionB.items as any[];
      if (secB_items && secB_items.length > 0) {
        await api.post(`/pemohon/pendaftaran/${pendaftaran?.id}/riwayat-pendidikan`, {
          items: secB_items.map((i: any) => ({
            jenjang: i.jenjang,
            institusi: i.institusi,
            program_studi: i.jurusan || i.program_studi || null,
            tahun_masuk: Number(i.tahunMasuk),
            tahun_lulus: Number(i.tahunLulus),
            ipk: Number(i.ipk),
          }))
        });
      }

      const secB_transkrip = borangData.sectionB.transkrip as any[];
      if (secB_transkrip && secB_transkrip.length > 0) {
        await api.post(`/pemohon/pendaftaran/${pendaftaran?.id}/transkrip`, {
          items: secB_transkrip.map((t: any) => ({
            semester: parseInt(t.semester) || 1,
            nama_mk: t.namaMk,
            sks: parseInt(t.sks) || 2,
            nilai_huruf: t.nilaiHuruf,
            nilai_angka: parseFloat(t.nilaiAngka) || 0,
          }))
        });
      }

      // 3. Pengalaman & Organisasi/Penghargaan (Section B & C)
      const pengalamanItems: any[] = [];
      const secB_pel = borangData.sectionB.pelatihan as any[];
      if (secB_pel && secB_pel.length > 0) {
        secB_pel.forEach((p: any) => {
          if (p.nama) pengalamanItems.push({ tipe: 'pelatihan', nama: p.nama, tahun_mulai: parseInt(p.tahun) || new Date().getFullYear(), deskripsi: p.penyelenggara });
        });
      }
      const secC_kerja = borangData.sectionC.items as any[];
      if (secC_kerja && secC_kerja.length > 0) {
        secC_kerja.forEach((c: any) => {
          if (c.namaPerusahaan) pengalamanItems.push({ tipe: 'kerja', nama: c.namaPerusahaan, jabatan_peran: c.jabatan, tahun_mulai: parseInt(c.tahunMulai) || new Date().getFullYear(), tahun_selesai: c.tahunSelesai ? parseInt(c.tahunSelesai) : null, deskripsi: c.deskripsi });
        });
      }
      const secC_org = borangData.sectionC.organisasi as any[];
      if (secC_org && secC_org.length > 0) {
        secC_org.forEach((o: any) => {
          if (o.nama) pengalamanItems.push({ tipe: 'organisasi', nama: o.nama, jabatan_peran: o.peran, tahun_mulai: parseInt(o.tahun) || new Date().getFullYear() });
        });
      }
      const secC_peng = borangData.sectionC.penghargaan as any[];
      if (secC_peng && secC_peng.length > 0) {
        secC_peng.forEach((p: any) => {
          if (p.nama) pengalamanItems.push({ tipe: 'penghargaan', nama: p.nama, deskripsi: p.penyelenggara, tahun_mulai: parseInt(p.tahun) || new Date().getFullYear() });
        });
      }

      const secC = borangData.sectionC as any;
      if (pengalamanItems.length > 0 || secC.instansi) {
        await api.post(`/pemohon/pendaftaran/${pendaftaran?.id}/pengalaman`, {
          instansi: secC.instansi || null,
          pekerjaan: secC.pekerjaan || null,
          alamat_instansi: secC.alamatInstansi || null,
          telp_instansi: secC.telpInstansi || null,
          golongan: secC.golongan || null,
          items: pengalamanItems
        });
      }

      // 4. Evaluasi Diri (Section D)
      const secD = borangData.sectionD as any;
      if (secD.evaluasi) {
        const evaluasiData = Object.entries(secD.evaluasi).map(([cpmkId, val]: [string, any]) => ({
          cpmk_id: cpmkId,
          profisiensi: Number(val.profisiensi),
          dokumen_pendukung: val.dokumenPendukung || [],
        })).filter(e => e.profisiensi && e.dokumen_pendukung.length > 0);

        if (evaluasiData.length > 0) {
          await api.post(`/pemohon/pendaftaran/${pendaftaran?.id}/evaluasi-diri`, {
            items: evaluasiData
          });
        }
      }

      // 5. Final Submit & Dokumen
      await api.post(`/pemohon/pendaftaran/${pendaftaran?.id}/submit`, {
        valid_dokumen_urls: validUrls
      });
      // Refetch to get new status
      await refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
      router.push("/pemohon/dashboard");
    }
  };

  // If not mounted or not allowed, render a simple loader while redirecting
  // to avoid rendering the heavy BorangPage components and sidebars incorrectly.
  if (!mounted || !isAllowedStatus || !isFocusedMode) {
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
    <div className="flex min-h-screen">
      {/* Top bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-6"
        initial={{ y: -56 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8">
            <Image
              src="/poliban.png"
              alt="Logo POLIBAN"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-sm font-semibold">Formulir Pendaftaran RPL</span>
        </div>
        <div className="flex items-center gap-4">
          {autoSaveMsg && (
            <motion.span
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {autoSaveMsg === "Tersimpan" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Save className="h-3.5 w-3.5 animate-pulse" />
              )}
              {autoSaveMsg}
            </motion.span>
          )}
          {lastSaved && !autoSaveMsg && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Terakhir disimpan{" "}
              {new Date(lastSaved).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Langkah 2 dari 3
          </span>
          <div className="border-l border-border h-6 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Sidebar Progress Mini */}
      <motion.aside
        className="fixed left-0 top-14 bottom-0 z-40 hidden w-72 border-r border-border/60 bg-background/95 backdrop-blur-sm lg:block"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex h-full flex-col">
          <div className="p-5 pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Progres Pengisian
            </p>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-green-500"
                animate={{
                  width: `${(validSectionsCount / sections.length) * 100}%`,
                }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {validSectionsCount} dari {sections.length} bagian selesai
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const isValid = validateSection(section.id, prodiId);
              const hasError = showError && !isValid;
              let iconBgClass = "bg-muted text-muted-foreground";

              if (isValid) {
                iconBgClass = "bg-green-100 text-green-600";
              } else if (hasError) {
                iconBgClass = "bg-red-100 text-red-600";
              }

              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all ${hasError
                      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                      : isActive
                        ? "bg-primary/5 text-primary font-bold shadow-sm"
                        : "text-foreground/70 hover:bg-muted"
                    }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive && !isValid && !hasError
                        ? "bg-primary text-primary-foreground"
                        : iconBgClass
                      }`}
                  >
                    {isValid ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : hasError ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <section.icon className={`h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
                    )}
                  </div>
                  <span className="flex-1">
                    {section.label}
                  </span>
                  {isValid ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : hasError ? (
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  ) : isActive ? (
                    <ChevronRight className="h-3.5 w-3.5 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Final Submit */}
          <div className="border-t border-border/60 p-4">
            <Button
              onClick={handleFinalSubmit}
              disabled={submitting || validSectionsCount !== sections.length}
              className="w-full h-10 gap-2 rounded-xl text-sm font-semibold"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Mengirim...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Final Submit
                </>
              )}
            </Button>
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                Pastikan semua bagian telah terisi sebelum mengirim.
              </span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 pt-14 lg:pl-72">
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-16">
          <div ref={(el) => setRef("sectionA", el)} id="sectionA">
            <SectionA />
          </div>
          <div ref={(el) => setRef("sectionB", el)} id="sectionB">
            <SectionB />
          </div>
          <div ref={(el) => setRef("sectionC", el)} id="sectionC">
            <SectionC />
          </div>
          <div ref={(el) => setRef("sectionE", el)} id="sectionE">
            <SectionE pendaftaranId={pendaftaran?.id} />
          </div>
          <div ref={(el) => setRef("sectionD", el)} id="sectionD">
            <SectionD />
          </div>

          <div className="pb-10 lg:hidden">
            <Button
              onClick={handleFinalSubmit}
              disabled={submitting || validSectionsCount !== sections.length}
              className="w-full h-12 gap-2 rounded-xl text-sm font-semibold"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Mengirim...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Final Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
      {/* Error Alert Toast */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -100, x: "-50%" }}
            className="fixed top-20 left-1/2 z-[100] px-4 w-full max-w-md"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-2xl backdrop-blur-xl dark:border-red-900/30 dark:bg-red-900/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="pr-4">
                <h4 className="text-sm font-bold text-red-900 dark:text-red-100">
                  Formulir Belum Lengkap
                </h4>
                <p className="text-xs text-red-700/80 dark:text-red-300/80">
                  Mohon lengkapi semua bagian formulir sebelum mengirim.
                </p>
              </div>
              <button
                onClick={() => setShowError(false)}
                className="rounded-lg p-1.5 text-red-900/40 hover:bg-red-200/50 hover:text-red-900 dark:text-red-100/40 dark:hover:bg-red-900/50 dark:hover:text-red-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showSubmitDialog} onOpenChange={(open) => {
        setShowSubmitDialog(open);
        if (!open) setHasAgreed(false);
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="text-lg font-bold">
              Konfirmasi Pengiriman
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Dengan mengirimkan formulir RPL ini, saya menyatakan bahwa:
            </p>
            <ul className="space-y-3 text-sm text-foreground/70 list-disc pl-5">
              <li className="pl-1">
                <strong className="font-semibold text-foreground">Kebenaran Data:</strong> Seluruh informasi dan dokumen yang dilampirkan adalah benar. Saya bersedia menerima sanksi apabila terbukti ada pemalsuan.
              </li>
              <li className="pl-1">
                <strong className="font-semibold text-foreground">Izin Verifikasi:</strong> Saya memberikan izin kepada pengelola RPL untuk memverifikasi keabsahan data saya ke pihak terkait.
              </li>
              <li className="pl-1">
                <strong className="font-semibold text-foreground">Asesmen Lanjutan:</strong> Saya bersedia mengikuti tahapan asesmen lanjutan sesuai jadwal dari unit RPL.
              </li>
            </ul>

            <label className="flex items-start gap-3 p-4 mt-2 cursor-pointer rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-primary text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm font-medium leading-relaxed select-none text-foreground/90">
                Ya, saya menyetujui pernyataan di atas dan <span className="text-primary font-bold">bertanggung jawab penuh atas kebenaran data yang dikirim.</span>
              </span>
            </label>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="ghost" onClick={() => setShowSubmitDialog(false)} disabled={submitting}>
              Batal
            </Button>
            <Button
              onClick={executeFinalSubmit}
              disabled={submitting || !hasAgreed}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Kirim Formulir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
