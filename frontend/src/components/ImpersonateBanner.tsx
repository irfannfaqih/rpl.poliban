"use client";

/**
 * ImpersonateBanner
 *
 * Banner kuning permanen yang muncul di atas halaman saat Super Admin
 * sedang menggunakan fitur "Login Sebagai" (impersonate).
 *
 * PRD Bab 4.6: "Banner kuning permanen di atas layar saat mode impersonate.
 * Tombol 'Kembali ke Akun Saya' → DELETE /super-admin/impersonate."
 */

import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { LogIn, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ImpersonateBanner() {
  const isImpersonating = useAuthStore((state) => state.isImpersonating);
  const clearImpersonate = useAuthStore((state) => state.clearImpersonate);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isImpersonating) return null;

  const handleStop = async () => {
    setLoading(true);
    try {
      await api.delete("/super-admin/impersonate");
    } catch {
      // Abaikan error — token mungkin sudah tidak valid
    }

    clearImpersonate();
    router.push("/super-admin/pengguna");
    toast.success("Sesi impersonate berakhir. Selamat datang kembali.");
  };

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] bg-amber-400 text-amber-900 px-4 py-2 flex items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-bold">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>
          Mode Impersonate Aktif - Anda sedang masuk sebagai pengguna lain
        </span>
      </div>
      <button
        onClick={handleStop}
        disabled={loading}
        className="flex items-center gap-1.5 shrink-0 bg-amber-900 text-amber-100 hover:bg-amber-800 px-3 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
      >
        <LogIn className="h-3.5 w-3.5" />
        {loading ? "Kembali..." : "Kembali ke Akun Saya"}
      </button>
    </div>
  );
}
