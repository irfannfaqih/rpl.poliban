"use client";

import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifikasiSkContent() {
  const params = useParams<{ id: string }>();
  const token = useSearchParams().get("token") || "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verifikasi-sk", params.id, token],
    queryFn: async () => {
      const response = await api.get(`/public/verify-sk/${params.id}`, {
        params: { token },
      });
      return response.data;
    },
    enabled: Boolean(params.id && token),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Memverifikasi keaslian dokumen...
      </div>
    );
  }

  if (!token || isError || !data?.verified) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message || "Dokumen tidak dapat diverifikasi.";

    return (
      <div className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-red-700 dark:text-red-400">
          Verifikasi Tidak Valid
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  const sk = data.data;

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-emerald-500/20 bg-card p-8 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
          Surat Keputusan Resmi dan Valid
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{data.message}</p>
      </div>

      <div className="mt-8 rounded-2xl border bg-muted/20 p-5">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {[
            ["Nomor SK", sk.nomor_sk],
            ["Tanggal Terbit", sk.tanggal_terbit],
            ["Nama Pemohon", sk.nama_pemohon],
            ["Program Studi", sk.program_studi],
            ["Total SKS Diakui", `${sk.total_sks_diakui} SKS`],
            ["Diterbitkan Oleh", sk.diterbitkan_oleh],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 font-semibold text-foreground">{value || "-"}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        Diverifikasi melalui SIRPL Politeknik Negeri Banjarmasin
      </div>
    </div>
  );
}

export default function VerifikasiSkPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <VerifikasiSkContent />
      </Suspense>
    </main>
  );
}
