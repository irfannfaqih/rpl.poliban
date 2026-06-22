"use client";

import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, ClipboardCheck, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statusLabel: Record<string, string> = {
  menunggu_approval_pimpinan: "Menunggu Approval Pimpinan",
  ditolak_pimpinan: "Ditolak Pimpinan",
  approved_final: "Approved Final",
};

function statusClass(status: string) {
  if (status === "approved_final") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "ditolak_pimpinan") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function PimpinanPlenoApprovalPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("menunggu_approval_pimpinan");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: approvals = [], isLoading, error } = useQuery({
    queryKey: ["pimpinan-pleno-approvals", statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/pimpinan/pleno-approvals", { params });
      return data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/pimpinan/pleno-approvals/${id}/approve`),
    onSuccess: () => {
      toast.success("Pleno disetujui. F19 dan SK dapat diproses.");
      queryClient.invalidateQueries({ queryKey: ["pimpinan-pleno-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["pimpinan-sk-list"] });
      queryClient.invalidateQueries({ queryKey: ["pimpinan-dashboard"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyetujui pleno."),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/pimpinan/pleno-approvals/${rejectId}/reject`, { catatan: rejectNote }),
    onSuccess: () => {
      toast.success("Pleno ditolak dan dikembalikan ke Admin Prodi.");
      setRejectId(null);
      setRejectNote("");
      queryClient.invalidateQueries({ queryKey: ["pimpinan-pleno-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["pimpinan-dashboard"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menolak pleno."),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Memuat approval pleno...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold">Gagal Memuat Data</h3>
        <p className="max-w-md text-sm text-muted-foreground">Approval pleno tidak dapat dimuat.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Approval Pleno Pimpinan</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Verifikasi akhir berita acara pleno setelah disetujui Kaprodi.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
          <SelectTrigger className="h-10 w-full bg-background sm:w-72">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="menunggu_approval_pimpinan">Menunggu Pimpinan</SelectItem>
            <SelectItem value="ditolak_pimpinan">Ditolak Pimpinan</SelectItem>
            <SelectItem value="approved_final">Approved Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {approvals.map((approval: any) => {
          const pleno = approval.pendaftaran?.pleno_mk || [];
          const accepted = pleno.filter((item: any) => item.keputusan_final && item.keputusan_final !== "T");
          const pending = approval.status === "menunggu_approval_pimpinan";

          return (
            <div key={approval.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">{approval.pendaftaran?.user?.nama || "-"}</h2>
                    <Badge variant="outline" className={statusClass(approval.status)}>
                      {statusLabel[approval.status] || approval.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {approval.pendaftaran?.nomor_pendaftaran || `RPL-${approval.pendaftaran_id}`} · {approval.pendaftaran?.prodi?.nama || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Disetujui Kaprodi: {approval.kaprodi_approver?.nama || "-"} ·{" "}
                    {approval.kaprodi_approved_at ? new Date(approval.kaprodi_approved_at).toLocaleString("id-ID") : "-"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={!pending || approveMutation.isPending}
                    onClick={() => approveMutation.mutate(approval.id)}
                  >
                    {approveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                    Approve Final
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    disabled={!pending}
                    onClick={() => setRejectId(approval.id)}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
                <div className="rounded-xl border bg-muted/10 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    Detail Mata Kuliah Pleno
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {pleno.map((item: any) => (
                      <div key={item.id} className="rounded-lg border bg-background p-3 text-sm">
                        <div className="font-semibold">{item.mata_kuliah?.nama || "-"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.mata_kuliah?.kode || "-"} · {item.mata_kuliah?.sks || 0} SKS
                        </div>
                        <Badge variant="outline" className="mt-2 text-[11px]">
                          Keputusan: {item.keputusan_final || "-"}
                        </Badge>
                      </div>
                    ))}
                    {pleno.length === 0 && (
                      <p className="text-sm text-muted-foreground">Tidak ada detail mata kuliah pleno.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ringkasan</p>
                  <p className="mt-2 text-3xl font-black text-emerald-600">{accepted.length}</p>
                  <p className="text-xs text-muted-foreground">MK diakui dari {pleno.length} MK pleno</p>
                  {approval.pimpinan_catatan && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {approval.pimpinan_catatan}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {approvals.length === 0 && (
          <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
            Tidak ada pleno pada status ini.
          </div>
        )}
      </div>

      <Dialog open={rejectId !== null} onOpenChange={(open) => {
        if (!open) {
          setRejectId(null);
          setRejectNote("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pleno?</DialogTitle>
            <DialogDescription>Catatan wajib diisi agar Admin Prodi dapat memperbaiki keputusan pleno.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
            placeholder="Tuliskan alasan penolakan..."
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)} disabled={rejectMutation.isPending}>Batal</Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={!rejectNote.trim() || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Tolak Pleno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
