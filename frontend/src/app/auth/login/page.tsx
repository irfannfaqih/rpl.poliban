"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore, getRoleDashboard } from "@/store/useAuthStore";
import axios from "axios";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

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
        router.push(getRoleDashboard(user.role));
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
    <motion.div initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden mb-6">
          <LogIn className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Selamat Datang</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Masuk ke akun RPL Anda untuk melanjutkan pendaftaran.
        </p>
      </motion.div>

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
  );
}
