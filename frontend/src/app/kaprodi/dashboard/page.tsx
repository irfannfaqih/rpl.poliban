"use client";

import api from "@/lib/api";
import {
  getPlenoApprovalStatusLabel,
  PLENO_APPROVAL_STATUS,
} from "@/lib/pleno-approval-status";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, ClipboardCheck, Loader2, XCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";

type Approval = {
  id: number;
  status: string;
  pendaftaran_id: number;
  submitted_at?: string | null;
  updated_at?: string | null;
  pendaftaran?: {
    nomor_pendaftaran?: string | null;
    user?: { nama?: string | null } | null;
  } | null;
};

function countByStatus(items: Approval[], statuses: string[]) {
  return items.filter((item) => statuses.includes(item.status)).length;
}

export default function KaprodiDashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: approvals = [], isLoading, error } = useQuery<Approval[]>({
    queryKey: ["kaprodi-dashboard-approvals"],
    queryFn: async () => {
      const { data } = await api.get("/kaprodi/pleno-approvals", {
        params: { per_page: 100 },
      });
      return data.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Memuat dashboard Kaprodi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold">Gagal Memuat Dashboard</h3>
        <p className="max-w-md text-sm text-muted-foreground">Data approval pleno prodi tidak dapat dimuat.</p>
      </div>
    );
  }

  const waiting = countByStatus(approvals, [PLENO_APPROVAL_STATUS.MENUNGGU_KAPRODI]);
  const forwarded = countByStatus(approvals, [PLENO_APPROVAL_STATUS.MENUNGGU_PIMPINAN]);
  const rejected = countByStatus(approvals, [PLENO_APPROVAL_STATUS.DITOLAK_KAPRODI]);
  const finalApproved = countByStatus(approvals, [PLENO_APPROVAL_STATUS.APPROVED_FINAL]);
  const latest = approvals.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard Kaprodi</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Ringkasan approval pleno untuk prodi yang dipimpin: <span className="font-semibold">{user?.prodi?.nama || "Prodi belum terhubung"}</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Menunggu" value={waiting} icon={Clock3} tone="text-amber-600 dark:text-amber-500" />
        <SummaryCard title="Diteruskan" value={forwarded} icon={ClipboardCheck} tone="text-blue-600 dark:text-blue-500" />
        <SummaryCard title="Final" value={finalApproved} icon={CheckCircle2} tone="text-emerald-600 dark:text-emerald-500" />
        <SummaryCard title="Ditolak" value={rejected} icon={XCircle} tone="text-red-600 dark:text-red-500" />
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-bold">Pengajuan Terbaru</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Lima approval pleno terakhir pada prodi Anda.</p>
          </div>
          <Link href="/kaprodi/pleno-approval" className="text-xs font-bold text-emerald-600 hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Pemohon</th>
                <th className="px-5 py-3 font-semibold">Nomor</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {latest.map((approval) => (
                <tr key={approval.id} className="hover:bg-muted/10">
                  <td className="px-5 py-4 font-semibold">{approval.pendaftaran?.user?.nama || "-"}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{approval.pendaftaran?.nomor_pendaftaran || `RPL-${approval.pendaftaran_id}`}</td>
                  <td className="px-5 py-4 text-xs">{getPlenoApprovalStatusLabel(approval.status)}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(approval.submitted_at || approval.updated_at)}</td>
                </tr>
              ))}
              {latest.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    Belum ada pengajuan pleno.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, tone }: { title: string; value: number; icon: LucideIcon; tone: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className={`h-4 w-4 ${tone}`} />
        {title}
      </div>
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
