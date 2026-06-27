"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

type PendaftaranSummary = {
  id?: number;
  status_alur?: string;
  data_diri?: {
    nama_lengkap?: string;
  };
};

type UserSummary = {
  nama?: string;
};

type PaymentRecord = {
  id: number;
  order_id: string;
  status: string;
  snap_token?: string | null;
  redirect_url?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type PaymentInfo = {
  pendaftaran_id: number;
  status_alur: string;
  amount: number;
  currency: string;
  gateway: string;
  payment: PaymentRecord | null;
};

type PaymentStatusInfo = {
  pendaftaran_id: number;
  status_alur: string;
  payment_status: string | null;
  is_paid: boolean;
  payment: PaymentRecord | null;
};

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

type MeEnvelope = {
  user?: UserSummary | null;
};

const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ?? "";
const MIDTRANS_IS_PRODUCTION =
  process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
const SNAP_SCRIPT_SRC = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";
const SNAP_SCRIPT_ID = "midtrans-snap-script";

function formatCurrency(amount?: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

function getApiMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

function loadSnapScript(clientKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Snap hanya tersedia di browser."));
      return;
    }

    if (window.snap) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      SNAP_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Gagal memuat Midtrans Snap.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SNAP_SCRIPT_ID;
    script.src = SNAP_SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap."));
    document.body.appendChild(script);
  });
}

export default function BayarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: pendaftaran, isLoading: loadingPendaftaran } = useQuery({
    queryKey: ["pendaftaran", "summary"],
    queryFn: async () => {
      const { data: res } = await api.get<ApiEnvelope<PendaftaranSummary>>(
        "/pemohon/pendaftaran?view=summary",
      );
      return res.data;
    },
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: res } = await api.get<MeEnvelope>("/me");
      return res.user ?? null;
    },
  });

  const pendaftaranId = pendaftaran?.id;
  const namaLengkap = pendaftaran?.data_diri?.nama_lengkap || me?.nama || "";

  const {
    data: paymentInfo,
    isLoading: loadingPayment,
    refetch: refetchPaymentInfo,
  } = useQuery({
    queryKey: ["pendaftaran", pendaftaranId, "payment"],
    enabled: Boolean(pendaftaranId),
    queryFn: async () => {
      const { data: res } = await api.get<ApiEnvelope<PaymentInfo>>(
        `/pemohon/pendaftaran/${pendaftaranId}/payment`,
      );
      return res.data;
    },
  });

  const statusAlur =
    paymentInfo?.status_alur || pendaftaran?.status_alur || "pre_submit";
  const payment = paymentInfo?.payment ?? null;
  const paymentStatus = payment?.status ?? null;
  const amount = paymentInfo?.amount ?? 0;
  const currency = paymentInfo?.currency ?? "IDR";

  const isPaidOrVerified =
    statusAlur === "payment_verified" ||
    paymentStatus === "settlement" ||
    paymentStatus === "capture";
  const canPay = statusAlur === "waiting_payment" && !isPaidOrVerified;
  const loadingInitial = !mounted || loadingPendaftaran || loadingPayment;

  const statusLabel = useMemo(() => {
    if (isPaidOrVerified) return "Pembayaran sudah diverifikasi";
    if (paymentStatus) return `Status pembayaran: ${paymentStatus}`;
    if (statusAlur === "waiting_payment") return "Menunggu pembayaran";
    return `Status pendaftaran: ${statusAlur}`;
  }, [isPaidOrVerified, paymentStatus, statusAlur]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshPaymentStatus = async () => {
    if (!pendaftaranId) return;

    const { data: res } = await api.get<ApiEnvelope<PaymentStatusInfo>>(
      `/pemohon/pendaftaran/${pendaftaranId}/payment/status`,
    );

    queryClient.setQueryData(
      ["pendaftaran", pendaftaranId, "payment"],
      (current: PaymentInfo | undefined) => ({
        pendaftaran_id: res.data.pendaftaran_id,
        status_alur: res.data.status_alur,
        amount: current?.amount ?? amount,
        currency: current?.currency ?? currency,
        gateway: current?.gateway ?? "midtrans",
        payment: res.data.payment,
      }),
    );
    queryClient.invalidateQueries({ queryKey: ["pendaftaran", "summary"] });
  };

  const handleSnapCallback = async (nextMessage: string) => {
    setMessage(nextMessage);
    toast.info(nextMessage);

    try {
      await refreshPaymentStatus();
    } catch {
      toast.error("Gagal memperbarui status pembayaran.");
    }
  };

  const handlePay = async () => {
    if (!pendaftaranId) {
      toast.error("Pendaftaran tidak ditemukan.");
      return;
    }

    if (!MIDTRANS_CLIENT_KEY) {
      setMessage("Konfigurasi pembayaran belum lengkap.");
      toast.error("Konfigurasi pembayaran belum lengkap.");
      return;
    }

    setCreatingPayment(true);
    setMessage(null);

    try {
      await loadSnapScript(MIDTRANS_CLIENT_KEY);

      if (!window.snap) {
        throw new Error("Midtrans Snap belum tersedia.");
      }

      const { data: res } = await api.post<ApiEnvelope<PaymentInfo>>(
        `/pemohon/pendaftaran/${pendaftaranId}/payment/create`,
      );
      const snapToken = res.data.payment?.snap_token;

      queryClient.setQueryData(
        ["pendaftaran", pendaftaranId, "payment"],
        res.data,
      );

      if (!snapToken) {
        setMessage("Token pembayaran belum tersedia.");
        toast.error("Token pembayaran belum tersedia.");
        return;
      }

      window.snap.pay(snapToken, {
        onSuccess: () => {
          void handleSnapCallback(
            "Pembayaran berhasil diproses. Memperbarui status...",
          );
        },
        onPending: () => {
          void handleSnapCallback(
            "Pembayaran masih menunggu penyelesaian.",
          );
        },
        onError: () => {
          void handleSnapCallback("Pembayaran gagal diproses.");
        },
        onClose: () => {
          void handleSnapCallback(
            "Popup pembayaran ditutup sebelum selesai.",
          );
        },
      });
    } catch (error) {
      const errorMessage = getApiMessage(
        error,
        "Gagal memulai pembayaran Midtrans.",
      );
      setMessage(errorMessage);
      toast.error(errorMessage);
      await refetchPaymentInfo();
    } finally {
      setCreatingPayment(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="animate-pulse text-sm text-muted-foreground">
            Memuat halaman pembayaran...
          </p>
        </div>
      </div>
    );
  }

  if (!pendaftaranId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-xl font-bold">Pendaftaran tidak ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Silakan mulai atau lanjutkan pendaftaran RPL terlebih dahulu.
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push("/pemohon/borang")}
          >
            Ke Halaman Pendaftaran
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <motion.div
        className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-xl"
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
          Pembayaran
        </div>
      </motion.div>

      <div className="w-full max-w-lg">
        <motion.div
          className="text-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isPaidOrVerified ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : (
              <CreditCard className="h-7 w-7" />
            )}
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Pembayaran Asesmen RPL
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Halo{namaLengkap ? `, ${namaLengkap}` : ""}. Pembayaran diproses
            melalui Midtrans Snap.
          </p>
        </motion.div>

        <motion.div
          className="mt-8 rounded-2xl border border-border bg-card p-6 text-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <p className="text-sm text-muted-foreground">Total Biaya Asesmen</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {formatCurrency(amount, currency)}
          </p>
          <div className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-sm">
            <p className="font-medium">{statusLabel}</p>
            {payment?.order_id ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Order ID: {payment.order_id}
              </p>
            ) : null}
          </div>
        </motion.div>

        {message ? (
          <motion.div
            className="mt-5 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            {message}
          </motion.div>
        ) : null}

        <motion.div
          className="mt-6 rounded-2xl border border-border bg-card p-6"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Frontend hanya membuka halaman pembayaran. Status akhir pembayaran
            tetap mengikuti konfirmasi backend dan webhook Midtrans.
          </div>

          {!MIDTRANS_CLIENT_KEY ? (
            <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Konfigurasi pembayaran belum lengkap.
            </p>
          ) : null}

          {isPaidOrVerified ? (
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Pembayaran sudah diverifikasi. Anda dapat melanjutkan proses
              pendaftaran.
            </p>
          ) : statusAlur !== "waiting_payment" ? (
            <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              Pendaftaran belum berada pada tahap menunggu pembayaran.
            </p>
          ) : null}
        </motion.div>

        <motion.div
          className="mt-6 space-y-3"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          <Button
            onClick={handlePay}
            disabled={!canPay || creatingPayment || !MIDTRANS_CLIENT_KEY}
            className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"
          >
            {creatingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Membuka Midtrans Snap...
              </>
            ) : (
              <>
                Bayar Sekarang
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshPaymentStatus()}
            className="h-11 w-full gap-2 rounded-xl text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Perbarui Status Pembayaran
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
