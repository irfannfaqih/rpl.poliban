"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { NotificationBell } from "@/components/NotificationBell";
import { FOCUSED_STATUSES, getRedirectPath } from "@/lib/alur";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Layout utama — AuthGuard membungkus sebelum konten apapun dirender
export default function PemohonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["pemohon"]}>
      <PemohonLayoutInner>{children}</PemohonLayoutInner>
    </AuthGuard>
  );
}

// Konten layout yang sesungguhnya — hanya dirender setelah AuthGuard OK
function PemohonLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: pendaftaran, isLoading } = useQuery({
    queryKey: ["pendaftaran", "summary"],
    queryFn: async () => {
      const { data: res } = await api.get("/pemohon/pendaftaran?view=summary");
      return res.data;
    },
  });

  const statusAlur = pendaftaran?.status_alur || "pre_submit";

  const isFocusedMode = FOCUSED_STATUSES.includes(statusAlur as any);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isFocusedMode) {
      const redirectPath = getRedirectPath(statusAlur as any);
      if (pathname !== redirectPath) {
        router.replace(redirectPath);
      }
    }
  }, [isLoading, isFocusedMode, statusAlur, pathname, router]);

  if (isLoading || isFocusedMode) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Fase 2: Panel mode dengan sidebar
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
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Panel Pemohon
        </span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar (Phase 2 only)                                             */
/* ------------------------------------------------------------------ */
import { useAuthStore } from "@/store/useAuthStore";
import {
  Archive,
  CalendarDays,
  ChevronRight,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PenLine,
  Scale
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

const sidebarNavLinks = [
  { href: "/pemohon/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pemohon/jadwal", label: "Jadwal Asesmen", icon: CalendarDays },
  { href: "/pemohon/asesmen-tahap-2", label: "Asesmen Tahap 2", icon: PenLine },
  { href: "/pemohon/hasil-sanggah", label: "Hasil & Sanggah", icon: Scale },
  { href: "/pemohon/arsip", label: "Arsip Borang", icon: Archive },
];

function PemohonSidebar() {
  const pathname = usePathname();
  // Query unread count — polling setiap 30 detik
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const namaLengkap = user?.nama || "";
  const email = user?.email || "";

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const [showChangePassword, setShowChangePassword] = useState(false);

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
          <span className="text-sm font-semibold uppercase tracking-tight">
            Sistem RPL
          </span>
          <span className="text-[11px] font-medium text-muted-foreground italic">
            POLIBAN
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border">
        {sidebarNavLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
            >
              <div>
                <link.icon className="h-4 w-4 shrink-0" />
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
        <button
          onClick={() => setShowChangePassword(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <KeyRound className="h-4 w-4" />
          Ganti Kata Sandi
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />

      {/* User info footer */}
      <div className="border-t border-sidebar-border p-4 bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold overflow-hidden">
            {user?.photo ? (
              <img src={`/storage/${user.photo}`} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              namaLengkap?.charAt(0)?.toUpperCase() || "P"
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {namaLengkap || "Pemohon"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
