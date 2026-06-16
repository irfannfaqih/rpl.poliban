"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Archive,
  ArrowRightLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileText,
  KeyRound,
  LogOut,
  Scale,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

export default function AdminProdiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["admin_prodi"]}>
      <div className="flex min-h-screen bg-background">
        <div className="sticky top-0 h-screen hidden md:block border-r border-sidebar-border bg-sidebar z-50">
          <AdminProdiSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <AdminProdiHeader />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function AdminProdiHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Panel Admin Prodi
        </span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}

const sidebarLinks = [
  { href: "/admin-prodi/dashboard", label: "Antrean Pendaftar", icon: Users },
  {
    href: "/admin-prodi/kurikulum",
    label: "Kurikulum & Matriks",
    icon: BookOpen,
  },
  { href: "/admin-prodi/jadwal", label: "Jadwal Asesmen", icon: CalendarDays },
  { href: "/admin-prodi/at2", label: "Atur AT2", icon: FileText },
  {
    href: "/admin-prodi/matriks",
    label: "Review Matriks",
    icon: ArrowRightLeft,
  },
  { href: "/admin-prodi/pleno", label: "Dashboard Pleno", icon: Scale },
  { href: "/admin-prodi/arsip", label: "Loker Arsip Fisik", icon: Archive },
];

function AdminProdiSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

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
        {sidebarLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{link.label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-2 border-t border-sidebar-border">
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
              user?.nama?.charAt(0)?.toUpperCase() || "A"
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user?.nama || "Admin Prodi"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.prodi?.nama || "Admin Prodi"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
