"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  GraduationCap,
  Briefcase,
  FileCheck,
  Send,
  Save,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  X
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useBorangStore } from "@/store/useBorangStore";
import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import SectionA from "@/components/pemohon/borang/SectionA";
import SectionB from "@/components/pemohon/borang/SectionB";
import SectionC from "@/components/pemohon/borang/SectionC";
import SectionD from "@/components/pemohon/borang/SectionD";
import SectionE from "@/components/pemohon/borang/SectionE";
import { ThemeToggle } from "@/components/theme-toggle";
import { FOCUSED_STATUSES, getRedirectPath } from "@/lib/alur";
import { LogOut } from "lucide-react";

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
    touchedSections, 
    validateSection, 
    lastSaved 
  } = useBorangStore();
  
  const { 
    prodiId, 
    submitPendaftaran, 
    statusAlur 
  } = usePendaftaranStore();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState("");
  const [showError, setShowError] = useState(false);
  const observerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Access control
  const isAllowedStatus = statusAlur === 'payment_verified';
  const isFocusedMode = FOCUSED_STATUSES.includes(statusAlur);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // If user is not allowed on this page, redirect them to their proper path
    if (mounted && !isAllowedStatus) {
      router.replace(getRedirectPath(statusAlur));
    }
  }, [mounted, isAllowedStatus, statusAlur, router]);

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

  // Intersection Observer for scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );

    observerRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [setActiveSection]);

  const setRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) observerRefs.current.set(id, el);
  }, []);

  const scrollToSection = (id: string) => {
    const el = observerRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFinalSubmit = async () => {
    // Check if all sections are valid
    const allValid = sections.every(s => validateSection(s.id, prodiId));
    if (!allValid) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    setSubmitting(true);
    await submitPendaftaran();
    setSubmitting(false);
    router.push("/pemohon/dashboard");
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
              const isTouched = touchedSections.includes(section.id);
              
              // Status Logic:
              // 1. Valid -> Green
              // 2. Touched but Invalid -> Red
              // 3. Not Touched -> Neutral/Grey
              
              let statusColorClass = "text-muted-foreground";
              let iconBgClass = "bg-muted text-muted-foreground";
              
              if (isValid) {
                statusColorClass = "text-green-600";
                iconBgClass = "bg-green-100 text-green-600";
              } else if (isTouched) {
                statusColorClass = "text-red-500";
                iconBgClass = "bg-red-100 text-red-500";
              }

              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-all ${
                    isActive
                      ? "bg-primary/5 text-primary font-bold shadow-sm"
                      : "text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive && !isValid && !isTouched
                        ? "bg-primary text-primary-foreground"
                        : iconBgClass
                    }`}
                  >
                    {isValid ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isTouched && !isValid ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <section.icon className={`h-4 w-4 ${isActive ? "animate-pulse" : ""}`} />
                    )}
                  </div>
                  <span className={`flex-1 ${isTouched && !isValid ? "font-medium" : ""}`}>
                    {section.label}
                  </span>
                  {isValid ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : isTouched ? (
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
              disabled={submitting}
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
            <SectionE />
          </div>
          <div ref={(el) => setRef("sectionD", el)} id="sectionD">
            <SectionD />
          </div>

          {/* Mobile final submit */}
          <div className="pb-10 lg:hidden">
            <Button
              onClick={handleFinalSubmit}
              disabled={submitting}
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
    </div>
  );
}
