"use client";

import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import { FOCUSED_STATUSES } from "@/lib/alur";
import Image from "next/image";

export default function PemohonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const statusAlur = usePendaftaranStore((s) => s.statusAlur);

  // Phase 1 statuses: full-screen focused mode (no sidebar)
  const isFocusedMode = FOCUSED_STATUSES.includes(statusAlur);

  if (isFocusedMode) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Phase 2: Panel mode with sidebar (post final-submit)
  return (
    <div className="flex min-h-screen bg-background">
      <div className="sticky top-0 h-screen hidden md:block border-r border-sidebar-border bg-sidebar z-50">
        <PemohonSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <PemohonHeader />
        <main className="flex-1 overflow-y-auto bg-muted/5">{children}</main>
      </div>
    </div>
  );
}

function PemohonHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Panel Pemohon</span>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar (Phase 2 only)                                             */
/* ------------------------------------------------------------------ */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import {
  LayoutDashboard,
  Archive,
  LogOut,
  ChevronRight,
  Bell,
  Scale,
  CalendarDays,
  PenLine,
} from "lucide-react";
import { motion } from "framer-motion";

import { ThemeToggle } from "@/components/theme-toggle";

const sidebarLinks = [
  { href: "/pemohon/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pemohon/notifikasi", label: "Pemberitahuan", icon: Bell, hasBadge: true },
  { href: "/pemohon/jadwal", label: "Jadwal Asesmen", icon: CalendarDays },
  { href: "/pemohon/ujian-tulis", label: "Ujian Tulis", icon: PenLine },
  { href: "/pemohon/hasil-sanggah", label: "Hasil & Sanggah", icon: Scale },
  { href: "/pemohon/arsip", label: "Arsip Borang", icon: Archive },
];

function PemohonSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const namaLengkap = user?.nama || "";
  const email = user?.email || "";

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-full w-64 flex-col">

      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="relative h-9 w-9">
          <Image 
            src="/poliban.png" 
            alt="Logo POLIBAN" 
            fill 
            className="object-contain"
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold uppercase tracking-tight">Sistem RPL</span>
          <span className="text-[11px] font-medium text-muted-foreground italic">POLIBAN</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <div className="relative">
                <link.icon className="h-4 w-4 shrink-0" />
                {link.hasBadge && (
                  <span className="absolute -right-1 -top-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className="flex-1">{link.label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-2 border-t">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30">
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>

      {/* User info footer */}
      <div className="border-t border-sidebar-border p-4 bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {namaLengkap?.charAt(0)?.toUpperCase() || "P"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{namaLengkap || "Pemohon"}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
