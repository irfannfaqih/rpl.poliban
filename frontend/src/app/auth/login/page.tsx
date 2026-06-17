"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleDashboard, useAuthStore } from "@/store/useAuthStore";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, Loader2, LogIn, Mail, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  // State untuk modal lupa kata sandi
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail) { setForgotError("Masukkan alamat email Anda."); return; }
    setForgotLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      await axios.post(`${apiUrl}/forgot-password`, { email: forgotEmail });
      setForgotSent(true);
    } catch {
      setForgotError("Gagal mengirim permintaan. Coba lagi nanti.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail("");
    setForgotSent(false);
    setForgotError("");
  };

  // Pesan berdasarkan reason redirect
  const reason = searchParams.get("reason");
  const sessionExpired = searchParams.get("session_expired");
  const infoMessage = sessionExpired
    ? "Sesi Anda telah berakhir. Silakan login kembali."
    : reason === "inactivity"
      ? "Anda dikeluarkan karena tidak ada aktivitas selama 2 jam."
      : null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Mohon isi email dan kata sandi.");
      return;
    }

    try {
      await login(email, password);

      // Get fresh user from store after login
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(getRoleDashboard(user));
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const messages = err.response.data.errors?.email;
        setError(messages?.[0] || "Email atau password salah.");
      } else if (axios.isAxiosError(err) && err.response?.status === 0) {
        setError("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    }
  };

  return (
    <>
      <motion.div initial="hidden" animate="visible">
        {/* Header */}
        <motion.div variants={fadeUp} custom={0}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden mb-6">
            <LogIn className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat Datang</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Masuk ke akun Anda untuk melanjutkan proses pendaftaran RPL.
          </p>
        </motion.div>

        {/* Info message (session expired / inactivity) */}
        {infoMessage && (
          <motion.div variants={fadeUp} custom={0.5}
            className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {infoMessage}
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
          className="mt-8 space-y-5"
          variants={fadeUp}
          custom={1}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Kata Sandi</Label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-primary hover:underline"
              >
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Memproses...
              </span>
            ) : (
              "Masuk"
            )}
          </Button>
        </motion.form>

        {/* Footer */}
        <motion.p
          className="mt-8 text-center text-sm text-muted-foreground"
          variants={fadeUp}
          custom={2}
        >
          Belum punya akun?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary hover:underline"
          >
            Daftar di sini
          </Link>
        </motion.p>
      </motion.div>

      {/* Modal Lupa Kata Sandi */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleCloseForgotModal(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-background border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">Lupa Kata Sandi?</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Masukkan email Anda dan kami akan mengirimkan tautan reset kata sandi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseForgotModal}
                  className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {forgotSent ? (
                /* Sukses */
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Email Terkirim</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Jika email <strong>{forgotEmail}</strong> terdaftar, tautan reset kata sandi telah dikirimkan. Periksa kotak masuk atau folder spam Anda.
                      </p>
                    </div>
                  </div>
                  <Button className="w-full h-10" onClick={handleCloseForgotModal}>
                    Kembali ke Login
                  </Button>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Alamat Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-9 h-10"
                        autoFocus
                      />
                    </div>
                    {forgotError && (
                      <p className="text-xs text-destructive font-medium">{forgotError}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-10"
                      onClick={handleCloseForgotModal}
                      disabled={forgotLoading}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-10 gap-2"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
                      ) : (
                        "Kirim"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
