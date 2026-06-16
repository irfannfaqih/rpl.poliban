"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { AsesorTask, resolveAsesorTaskAction } from "@/lib/asesor-flow";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

interface HasilTask extends AsesorTask {
  pendaftaran?: AsesorTask["pendaftaran"] & {
    pleno_mk?: {
      keputusan_final?: string | null;
    }[];
  };
}

function HasilList() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: tugasList = [], isLoading } = useQuery({
    queryKey: ["tugas-asesor-list"],
    queryFn: async () => {
      const { data } = await api.get("/asesor/tugas");
      return data.data || [];
    },
  });

  const tasks = tugasList as HasilTask[];
  const hasilList = tasks.filter((task) => {
    const action = resolveAsesorTaskAction(task);
    return ["menunggu_asesor", "asesmen_tahap2", "pleno", "selesai", "ditolak"].includes(action.stage);
  });

  const filtered = hasilList.filter((task) => {
    const query = searchQuery.toLowerCase();
    return (
      (task.pendaftaran?.user?.nama || "").toLowerCase().includes(query) ||
      (task.pendaftaran?.nomor_pendaftaran || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Hasil Asesmen</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Lihat ringkasan hasil tugas yang telah disubmit dan perkembangan tahap berikutnya.
        </p>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Cari nama atau nomor pendaftaran..."
          className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Pemohon</th>
                <th className="px-6 py-4">Program Studi</th>
                <th className="px-6 py-4">Tahap Terakhir</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    Memuat hasil asesmen...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((task) => {
                  const action = resolveAsesorTaskAction(task);
                  return (
                    <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{task.pendaftaran?.user?.nama || "Tanpa Nama"}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.pendaftaran?.nomor_pendaftaran || `Tugas #${task.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">{task.pendaftaran?.prodi?.nama || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          {action.stageLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => router.push(`/asesor/hasil?tugasId=${task.id}`)}
                        >
                          Lihat Ringkasan
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    Belum ada hasil asesmen yang tersedia.
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

function HasilDetail({ tugasId }: { tugasId: string }) {
  const { data: task, isLoading } = useQuery({
    queryKey: ["tugas-asesor", tugasId, "result"],
    queryFn: async () => {
      const { data } = await api.get(`/asesor/tugas/${tugasId}?view=result`);
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) return null;

  const action = resolveAsesorTaskAction(task);
  const pendaftaran = task.pendaftaran;
  const ujiLanjutan = pendaftaran?.uji_lanjutan;
  const catatanAt2 = ujiLanjutan?.catatan_asesor?.[0];
  const plenoList = pendaftaran?.pleno_mk || [];
  const totalDiakui = plenoList.filter((item: { keputusan_final?: string | null }) =>
    item.keputusan_final && item.keputusan_final !== "T",
  ).length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-start gap-6">
        <Link href="/asesor/hasil" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold tracking-tight">Hasil Asesmen</h1>
            <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {action.stageLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pendaftaran?.user?.nama || "Pemohon"} · {pendaftaran?.prodi?.nama || "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold">Pra-Asesmen</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Rekomendasi: <strong className="text-foreground">
              {task.pra_asesmen?.rekomendasi?.replaceAll("_", " ") || "-"}
            </strong>
          </p>
          <Link href={`/asesor/pra-asesmen?tugasId=${task.id}`}>
            <Button variant="outline" size="sm">Lihat Hasil Pra-Asesmen</Button>
          </Link>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold">Penilaian Portofolio</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Status: <strong className="text-foreground">
              {task.status === "submit_final" ? "Sudah disubmit final" : "Masih dikerjakan"}
            </strong>
          </p>
          <Link href={`/asesor/workspace?tugasId=${task.id}`}>
            <Button variant="outline" size="sm">Lihat Detail Penilaian</Button>
          </Link>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-2">
          <h2 className="font-bold">Asesmen Tahap 2</h2>
          <p className="text-sm text-muted-foreground">
            {ujiLanjutan
              ? `Fase: ${ujiLanjutan.fase_tulis?.replaceAll("_", " ") || "-"}`
              : "Tidak diperlukan atau belum tersedia."}
          </p>
          {catatanAt2?.nilai_akhir !== null && catatanAt2?.nilai_akhir !== undefined && (
            <p className="text-sm">Nilai asesor: <strong>{catatanAt2.nilai_akhir}</strong></p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-2">
          <h2 className="font-bold">Pleno dan Keputusan</h2>
          <p className="text-sm text-muted-foreground">
            Mata kuliah dengan keputusan diakui: <strong className="text-foreground">{totalDiakui}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Status SK: <strong className="text-foreground">
              {pendaftaran?.sk_keputusan?.status?.replaceAll("_", " ") || "Belum tersedia"}
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function HasilPageContent() {
  const tugasId = useSearchParams().get("tugasId");
  return tugasId ? <HasilDetail tugasId={tugasId} /> : <HasilList />;
}

export default function HasilAsesmenPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Memuat hasil asesmen...</div>}>
      <HasilPageContent />
    </Suspense>
  );
}
