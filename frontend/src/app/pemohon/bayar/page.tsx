"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Copy,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendaftaranStore } from "@/store/usePendaftaranStore";
import { getRedirectPath } from "@/lib/alur";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

type PaymentMethod = "va" | "qris";

export default function BayarPage() {
  const router = useRouter();
  const simulatePayment = usePendaftaranStore((s) => s.simulatePayment);
  const namaLengkap = usePendaftaranStore((s) => s.namaLengkap);
  const statusAlur = usePendaftaranStore((s) => s.statusAlur);

  const [method, setMethod] = useState<PaymentMethod>("va");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isAllowedStatus = statusAlur === 'waiting_payment';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: hanya boleh diakses saat status 'waiting_payment'
  useEffect(() => {
    if (mounted && !isAllowedStatus) {
      router.replace(getRedirectPath(statusAlur));
    }
  }, [mounted, isAllowedStatus, statusAlur, router]);

  const vaNumber = "8800 1234 5678 9012";
  const amount = "Rp 500.000";

  const handleCopy = () => {
    navigator.clipboard.writeText(vaNumber.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = async () => {
    setProcessing(true);
    await simulatePayment();
    setPaid(true);
    setProcessing(false);

    // Redirect after showing success
    setTimeout(() => {
      router.push("/pemohon/borang");
    }, 2000);
  };

  // Tampilkan loader saat belum mounted atau status tidak sesuai
  if (!mounted || !isAllowedStatus) {
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Top header bar */}
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
          <span className="text-sm font-semibold">Sistem RPL POLIBAN</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Langkah 1 dari 3
        </div>
      </motion.div>

      <div className="w-full max-w-lg">
        {/* Success State */}
        {paid ? (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Pembayaran Berhasil!</h2>
            <p className="mt-2 text-muted-foreground">
              Anda akan dialihkan ke formulir pendaftaran...
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-primary">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Mengalihkan...
            </div>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <motion.div className="text-center" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard className="h-7 w-7" />
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight">
                Pembayaran Asesmen RPL
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Halo{namaLengkap ? `, ${namaLengkap}` : ""}. Silakan lakukan pembayaran untuk melanjutkan pendaftaran.
              </p>
            </motion.div>

            {/* Amount card */}
            <motion.div
              className="mt-8 rounded-2xl border border-border bg-card p-6 text-center"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <p className="text-sm text-muted-foreground">Total Biaya Asesmen</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{amount}</p>
            </motion.div>

            {/* Method selector */}
            <motion.div
              className="mt-6 grid grid-cols-2 gap-3"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
            >
              <button
                onClick={() => setMethod("va")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  method === "va"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Virtual Account
              </button>
              <button
                onClick={() => setMethod("qris")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  method === "qris"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <QrCode className="h-5 w-5" />
                QRIS
              </button>
            </motion.div>

            {/* Payment details */}
            <motion.div
              className="mt-6 rounded-2xl border border-border bg-card p-6"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              {method === "va" ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Bank Tujuan
                    </p>
                    <p className="mt-1 text-sm font-semibold">Bank Negara Indonesia (BNI)</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Nomor Virtual Account
                    </p>
                    <div className="mt-1 flex items-center gap-3">
                      <p className="text-lg font-mono font-bold tracking-wider">
                        {vaNumber}
                      </p>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? "Tersalin!" : "Salin"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                    <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Pembayaran diproses secara aman. Status akan otomatis diperbarui setelah pembayaran dikonfirmasi.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {/* Mock QRIS placeholder */}
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                    <QrCode className="h-20 w-20 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan menggunakan aplikasi e-wallet atau mobile banking Anda.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Simulate payment button */}
            <motion.div
              className="mt-6"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <Button
                onClick={handlePay}
                disabled={processing}
                className="w-full h-12 text-sm font-semibold rounded-xl gap-2"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Memverifikasi Pembayaran...
                  </span>
                ) : (
                  <>
                    Simulasikan Pembayaran Berhasil
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Mode demo — klik tombol di atas untuk mensimulasikan pembayaran.
              </p>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
