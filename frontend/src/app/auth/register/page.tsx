"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function RegisterPage() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [prodiId, setProdiId] = useState("");
  const [gelombangId, setGelombangId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: prodiList = [] } = useQuery({
    queryKey: ['prodi-aktif'],
    queryFn: async () => {
      const { data: res } = await api.get('/public/prodi-aktif');
      return res.data;
    }
  });

  const { data: gelombangList = [] } = useQuery({
    queryKey: ['gelombang-aktif'],
    queryFn: async () => {
      const { data: res } = await api.get('/public/gelombang-aktif');
      return res.data;
    }
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nama || !email || !password || !confirmPw || !prodiId || !gelombangId) {
      setError("Mohon lengkapi semua field.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirmPw) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      // 1. Register User & Start Pendaftaran in one go
      const { data: regRes } = await api.post('/register', { 
        nama, 
        email, 
        password,
        prodi_id: Number(prodiId),
        gelombang_id: Number(gelombangId)
      });
      
      // 2. Set Token automatically (auto login)
      useAuthStore.getState().clearAuth(); // Clear old sessions (like super_admin)
      localStorage.setItem("auth_token", regRes.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${regRes.token}`;
      useAuthStore.setState({
        token: regRes.token,
        user: regRes.user,
        isAuthenticated: true,
      });

      toast.success("Registrasi berhasil!");
      router.push("/pemohon/bayar");
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal melakukan registrasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible">
      <motion.div variants={fadeUp} custom={0}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden mb-6">
          <UserPlus className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Buat Akun Baru</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Daftarkan diri Anda untuk memulai pendaftaran RPL.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleRegister}
        className="mt-8 space-y-4"
        variants={fadeUp}
        custom={1}
      >
        <div className="space-y-2">
          <Label htmlFor="nama">Nama Lengkap</Label>
          <Input
            id="nama"
            placeholder="Masukkan nama lengkap"
            value={nama}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNama(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            autoComplete="email"
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gelombang">Gelombang Pendaftaran</Label>
            <select
              id="gelombang"
              value={gelombangId}
              onChange={(e) => setGelombangId(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 text-foreground"
            >
              <option value="" disabled className="text-muted-foreground">Pilih Gelombang</option>
              {gelombangList.map((g: any) => (
                <option key={g.id} value={g.id}>{g.nama}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prodi">Program Studi (RPL)</Label>
            <select
              id="prodi"
              value={prodiId}
              onChange={(e) => setProdiId(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 text-foreground"
            >
              <option value="" disabled className="text-muted-foreground">Pilih Program Studi</option>
              {prodiList.map((p: any) => (
                <option key={p.id} value={p.id}>{p.jenjang} - {p.nama}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password">Kata Sandi</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPw ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Ulangi kata sandi"
            value={confirmPw}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPw(e.target.value)}
            className="h-11"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Mendaftarkan...
            </span>
          ) : (
            "Daftar Sekarang"
          )}
        </Button>
      </motion.form>

      <motion.p
        className="mt-8 text-center text-sm text-muted-foreground"
        variants={fadeUp}
        custom={2}
      >
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Masuk di sini
        </Link>
      </motion.p>
    </motion.div>
  );
}
