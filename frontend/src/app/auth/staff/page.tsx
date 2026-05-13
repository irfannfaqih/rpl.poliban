"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function StaffLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Mohon isi kredensial dengan lengkap.");
      return;
    }

    setLoading(true);

    // Simulate API login
    await new Promise((r) => setTimeout(r, 1200));

    setLoading(false);
    
    // Simulate Role-Based Routing based on email prefix
    const emailLower = email.toLowerCase();
    if (emailLower.startsWith("admin")) {
      router.push("/admin-prodi/dashboard");
    } else if (emailLower.startsWith("super")) {
      setError("Portal Super Admin belum tersedia.");
    } else {
      // Default to asesor
      router.push("/asesor/dashboard");
    }
  };

  return (
    <motion.div initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={fadeUp} custom={0}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 shadow-sm border border-primary/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Portal Internal Staff</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Masuk dengan kredensial staff Anda (Asesor / Admin).
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
          <Label htmlFor="email">NIP / Email Instansi</Label>
          <Input
            id="email"
            type="text"
            placeholder="Masukkan NIP atau Email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Kata Sandi</Label>
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
          <p className="text-sm text-destructive font-medium bg-destructive/10 border border-destructive/20 p-3 rounded-md">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Memverifikasi...
            </span>
          ) : (
            "Masuk ke Portal Staff"
          )}
        </Button>
      </motion.form>
    </motion.div>
  );
}
