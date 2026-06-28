"use client";

import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import {
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_KEY,
  CROSS_TAB_SESSION_MESSAGE_KEY,
  clearWorkflowStorage,
  markCrossTabSessionChanged,
} from "@/lib/auth-session";
import { getRoleDashboard, resetWorkflowStores, useAuthStore } from "@/store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Role yang diizinkan mengakses halaman ini */
  allowedRoles: string[];
}

/**
 * Membungkus halaman dan memastikan:
 * 1. User sudah login (token valid di server)
 * 2. Role user sesuai dengan allowedRoles
 * 3. Auto-logout setelah 2 jam tidak ada aktivitas
 *
 * Jika tidak memenuhi syarat:
 * - Belum login → redirect ke /auth/login
 * - Role salah  → redirect ke dashboard role yang benar
 */
export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const queryClient = useQueryClient();
  const router = useRouter();
  // isVerifying: true selama re-validasi token ke server berlangsung
  const [isVerifying, setIsVerifying] = useState(true);

  // Inactivity timeout — auto-logout setelah 2 jam tidak ada aktivitas
  useInactivityLogout();

  useEffect(() => {
    const pendingMessage = sessionStorage.getItem(CROSS_TAB_SESSION_MESSAGE_KEY);
    if (pendingMessage) {
      sessionStorage.removeItem(CROSS_TAB_SESSION_MESSAGE_KEY);
      toast.info(pendingMessage);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (![AUTH_TOKEN_KEY, AUTH_STORAGE_KEY].includes(event.key || "")) {
        return;
      }

      if (event.oldValue === event.newValue) {
        return;
      }

      clearWorkflowStorage();
      resetWorkflowStores();
      queryClient.clear();
      markCrossTabSessionChanged();

      if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
        window.location.href = "/auth/login?session_changed=1";
        return;
      }

      window.location.reload();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient]);

  useEffect(() => {
    async function verify() {
      // Cek langsung ke localStorage karena state Zustand mungkin belum selesai hidrasi (delay SSR)
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      // Re-validasi token ke server untuk tangani kasus:
      // - Token sudah di-revoke (logout dari perangkat lain)
      // - Token expired (8 jam)
      // fetchMe akan memanggil clearAuth() jika server menolak token
      await fetchMe();
      setIsVerifying(false);
    }

    verify();
    // Hanya dijalankan saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setelah verifikasi selesai, cek ulang state yang mungkin berubah oleh fetchMe
  useEffect(() => {
    if (isVerifying) return;

    if (!isAuthenticated) {
      // Token ditolak server → clearAuth sudah dipanggil di fetchMe, redirect login
      router.replace("/auth/login");
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      // Role tidak sesuai → arahkan ke dashboard yang benar
      router.replace(getRoleDashboard(user));
    }
  }, [isVerifying, isAuthenticated, user, allowedRoles, router]);

  // Tampilkan loading saat verifikasi berlangsung
  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  // Belum authenticated atau role salah → render null (redirect sedang berjalan)
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
