"use client";

import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Eye, Filter, Loader2, Search, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "menunggu_approval_kaprodi", label: "Menunggu Kaprodi" },
  { value: "menunggu_approval_pimpinan", label: "Menunggu Pimpinan" },
  { value: "ditolak_kaprodi", label: "Ditolak Kaprodi" },
  { value: "ditolak_pimpinan", label: "Ditolak Pimpinan" },
  { value: "approved_final", label: "Disetujui Final" },
];

const STATUS_LABEL: Record<string, string> = {
  menunggu_approval_kaprodi: "Menunggu Kaprodi",
  menunggu_approval_pimpinan: "Menunggu Pimpinan",
  ditolak_kaprodi: "Ditolak Kaprodi",
  ditolak_pimpinan: "Ditolak Pimpinan",
  approved_final: "Disetujui Final",
};

export default function KaprodiPlenoApprovalPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("menunggu_approval_kaprodi");
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data: approvals = [], isLoading, error } = useQuery({
    queryKey: ["kaprodi-pleno-approvals"],
    queryFn: async () => {
      const { data } = await api.get("/kaprodi/pleno-approvals", {
        params: { per_page: 100 },
      });
      return data.data || [];
    },
  });

  const filteredApprovals = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return approvals.filter((approval: any) => {
      const matchesStatus = statusFilter === "all" || approval.status === statusFilter;
      const nama = approval.pendaftaran?.user?.nama || "";
      const nomor = approval.pendaftaran?.nomor_pendaftaran || `RPL-${approval.pendaftaran_id}`;
      const prodi = approval.pendaftaran?.prodi?.nama || "";
      const matchesSearch = !keyword || [nama, nomor, prodi].some((value) =>
        value.toLowerCase().includes(keyword),
      );

      return matchesStatus && matchesSearch;
    });
  }, [approvals, searchTerm, statusFilter]);

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/kaprodi/pleno-approvals/${id}/approve`),
    onSuccess: () => {
      toast.success("Pleno disetujui Kaprodi dan dikirim ke Pimpinan.");
      setSelectedApproval(null);
      queryClient.invalidateQueries({ queryKey: ["kaprodi-pleno-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["kaprodi-dashboard-approvals"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyetujui pleno."),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/kaprodi/pleno-approvals/${selectedApproval?.id}/reject`, { catatan: rejectNote }),
    onSuccess: () => {
      toast.success("Pleno ditolak dan dikembalikan ke Admin Prodi.");
      setSelectedApproval(null);
      setRejectNote("");
      queryClient.invalidateQueries({ queryKey: ["kaprodi-pleno-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["kaprodi-dashboard-approvals"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menolak pleno."),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Memuat pengajuan pleno...</p>
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
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Sahkan Pleno</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Daftar pengajuan pleno dari Admin Prodi. Detail dan keputusan dibuka lewat tombol aksi.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari pemohon, nomor, atau prodi..."
              className="h-10 bg-background pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
            <SelectTrigger className="h-10 w-full bg-background sm:w-[220px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status approval" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs font-semibold text-muted-foreground">
          {filteredApprovals.length} dari {approvals.length} pengajuan
        </div>
      </div>

      <ApprovalTable approvals={filteredApprovals} onDetail={setSelectedApproval} />

      <ApprovalDetailDialog
        approval={selectedApproval}
        onClose={() => {
          setSelectedApproval(null);
          setRejectNote("");
        }}
        rejectNote={rejectNote}
        setRejectNote={setRejectNote}
        approveMutation={approveMutation}
        rejectMutation={rejectMutation}
        roleLabel="Kaprodi"
      />
    </div>
  );
}

function ApprovalTable({ approvals, onDetail }: { approvals: any[]; onDetail: (approval: any) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">No</th>
              <th className="px-5 py-3 font-semibold">Nama Pemohon</th>
              <th className="px-5 py-3 font-semibold">Nomor Pendaftaran</th>
              <th className="px-5 py-3 font-semibold">Prodi</th>
              <th className="px-5 py-3 font-semibold text-center">Jumlah MK</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Tanggal Pengajuan</th>
              <th className="px-5 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {approvals.map((approval, index) => (
              <tr key={approval.id} className="hover:bg-muted/10">
                <td className="px-5 py-4 text-muted-foreground">{index + 1}</td>
                <td className="px-5 py-4 font-semibold">{approval.pendaftaran?.user?.nama || "-"}</td>
                <td className="px-5 py-4 text-xs text-muted-foreground">{approval.pendaftaran?.nomor_pendaftaran || `RPL-${approval.pendaftaran_id}`}</td>
                <td className="px-5 py-4">{approval.pendaftaran?.prodi?.nama || "-"}</td>
                <td className="px-5 py-4 text-center font-bold">{approval.pendaftaran?.pleno_mk?.length || 0}</td>
                <td className="px-5 py-4"><StatusBadge status={approval.status} /></td>
                <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(approval.submitted_at || approval.updated_at)}</td>
                <td className="px-5 py-4 text-right">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => onDetail(approval)}>
                    <Eye className="h-3.5 w-3.5" />
                    Detail
                  </Button>
                </td>
              </tr>
            ))}
            {approvals.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  Tidak ada pengajuan pada status ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApprovalDetailDialog({
  approval,
  onClose,
  rejectNote,
  setRejectNote,
  approveMutation,
  rejectMutation,
  roleLabel,
}: {
  approval: any | null;
  onClose: () => void;
  rejectNote: string;
  setRejectNote: (value: string) => void;
  approveMutation: any;
  rejectMutation: any;
  roleLabel: string;
}) {
  const pleno = approval?.pendaftaran?.pleno_mk || [];
  const accepted = pleno.filter((item: any) => item.keputusan_final && item.keputusan_final !== "T");
  const pending = approval?.status === "menunggu_approval_kaprodi";

  return (
    <Dialog open={!!approval} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detail Approval Pleno</DialogTitle>
          <DialogDescription>
            Periksa ringkasan pleno sebelum memberi keputusan sebagai {roleLabel}.
          </DialogDescription>
        </DialogHeader>

        {approval && (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-3">
              <Info label="Pemohon" value={approval.pendaftaran?.user?.nama || "-"} />
              <Info label="Nomor Pendaftaran" value={approval.pendaftaran?.nomor_pendaftaran || `RPL-${approval.pendaftaran_id}`} />
              <Info label="Prodi" value={approval.pendaftaran?.prodi?.nama || "-"} />
              <Info label="Status" value={STATUS_LABEL[approval.status] || approval.status || "-"} />
              <Info label="Diajukan Oleh" value={approval.submitter?.nama || "Admin Prodi"} />
              <Info label="Tanggal Pengajuan" value={formatDate(approval.submitted_at || approval.updated_at)} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryBox label="Total MK" value={pleno.length} />
              <SummaryBox label="MK Diakui" value={accepted.length} />
              <SummaryBox label="MK Ditolak" value={pleno.length - accepted.length} />
            </div>

            <div className="rounded-xl border">
              <div className="border-b px-4 py-3 text-sm font-bold">Daftar Mata Kuliah Pleno</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Kode</th>
                      <th className="px-4 py-3">Mata Kuliah</th>
                      <th className="px-4 py-3 text-center">SKS</th>
                      <th className="px-4 py-3">Keputusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pleno.map((item: any, index: number) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{item.mata_kuliah?.kode || "-"}</td>
                        <td className="px-4 py-3 font-medium">{item.mata_kuliah?.nama || "-"}</td>
                        <td className="px-4 py-3 text-center">{item.mata_kuliah?.sks || 0}</td>
                        <td className="px-4 py-3"><Badge variant="outline">{item.keputusan_final || "-"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {approval.kaprodi_catatan && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <strong>Catatan Kaprodi:</strong> {approval.kaprodi_catatan}
              </div>
            )}

            {pending && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Catatan Reject
                </label>
                <Textarea
                  value={rejectNote}
                  onChange={(event) => setRejectNote(event.target.value)}
                  placeholder="Isi jika pleno perlu dikembalikan ke Admin Prodi..."
                  className="min-h-[100px]"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          {pending && (
            <>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={!rejectNote.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
              >
                {rejectMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                Reject
              </Button>
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(approval.id)}
              >
                {approveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className = status === "approved_final" || status === "menunggu_approval_pimpinan"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status?.startsWith("ditolak")
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return <Badge variant="outline" className={className}>{STATUS_LABEL[status] || status || "-"}</Badge>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-muted/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black text-emerald-600">{value}</p>
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
