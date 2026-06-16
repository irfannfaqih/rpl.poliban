"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ArrowRight,
  CheckCircle2,
  FileClock,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AsesorTask,
  resolveAsesorTaskAction,
} from "@/lib/asesor-flow";

export default function AsesorDashboard() {
  const router = useRouter();
  const { data: fetchResult, isLoading } = useQuery({
    queryKey: ['tugas-asesor-list'],
    queryFn: async () => {
      const { data } = await api.get('/asesor/tugas');
      return data.data;
    }
  });

  const tugasList = fetchResult || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const tasks = tugasList as AsesorTask[];

  const filteredTugas = tasks.filter((t) => {
    const nama = t.pendaftaran?.user?.nama || "Tanpa Nama";
    const action = resolveAsesorTaskAction(t);
    const matchQuery = nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       String(t.id).includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "All" || action.stage === filterStatus;
    return matchQuery && matchStatus;
  });

  const handleAction = (task: AsesorTask) => {
    router.push(resolveAsesorTaskAction(task).href);
  };

  const resolvedTasks = tasks.map((task) => ({
    task,
    action: resolveAsesorTaskAction(task),
  }));
  const statBelum = resolvedTasks.filter(({ action }) => action.stage === "pra_asesmen").length;
  const statSedang = resolvedTasks.filter(({ action }) =>
    ["desk_evaluation", "menunggu_asesor", "asesmen_tahap2"].includes(action.stage),
  ).length;
  const statSelesai = resolvedTasks.filter(({ action }) =>
    ["pleno", "selesai", "ditolak"].includes(action.stage),
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Daftar Tugas Asesmen</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Kelola pendaftaran RPL yang ditugaskan kepada Anda oleh Admin Prodi.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <ClipboardList className="h-5 w-5" />
            <h3 className="font-medium">Total Tugas</h3>
          </div>
          <p className="text-3xl font-bold">{isLoading ? "..." : tugasList.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Perlu Dimulai</h3>
          </div>
          <p className="text-3xl font-bold">{isLoading ? "..." : statBelum}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <FileClock className="h-5 w-5" />
            <h3 className="font-medium">Dalam Proses</h3>
          </div>
          <p className="text-3xl font-bold">{isLoading ? "..." : statSedang}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-green-600 mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-medium">Hasil Tersedia</h3>
          </div>
          <p className="text-3xl font-bold">{isLoading ? "..." : statSelesai}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama pemohon atau ID penugasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          >
            <option value="All">Semua Status</option>
            <option value="pra_asesmen">Pra-Asesmen</option>
            <option value="desk_evaluation">Penilaian Portofolio</option>
            <option value="menunggu_asesor">Menunggu Asesor Lain</option>
            <option value="asesmen_tahap2">Asesmen Tahap 2</option>
            <option value="pleno">Sidang Pleno</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Tidak Memenuhi Syarat</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">ID Penugasan</th>
                <th className="px-4 py-3">Nama Pemohon</th>
                <th className="px-4 py-3">Prodi Tujuan</th>
                <th className="px-4 py-3">Tanggal Masuk</th>
                <th className="px-4 py-3">Progres</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mb-3" />
                      <p>Memuat tugas...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTugas.length > 0 ? (
                filteredTugas.map((task) => {
                  const action = resolveAsesorTaskAction(task);
                  const isPraAsesmenSubmitted = task.pra_asesmen?.is_submitted;
                  const nama = task.pendaftaran?.user?.nama || "Tanpa Nama";
                  const asalPt = task.pendaftaran?.riwayat_pendidikan?.[0]?.institusi || task.pendaftaran?.user?.instansi || "Tanpa Instansi";
                  const prodi = task.pendaftaran?.prodi?.nama || "Prodi";

                  const statusAlur = task.pendaftaran?.status_alur || "pra_asesmen";
                  const isDeskEvalDone = task.status === "submit_final";
                  const hasAt2 = Boolean(task.pendaftaran?.uji_lanjutan);
                  const at2Done = task.pendaftaran?.uji_lanjutan?.fase_tulis === "selesai";

                  // Determine stepper progress
                  const stepPra = isPraAsesmenSubmitted ? "done" : "active";
                  const stepDesk = isDeskEvalDone ? "done" : isPraAsesmenSubmitted ? "active" : "pending";

                  let stepUji = "pending";
                  if (statusAlur === "asesmen_tahap2") {
                    stepUji = at2Done ? "done" : "active";
                  } else if (hasAt2 && ["pleno", "finished"].includes(statusAlur)) {
                    stepUji = "done";
                  }

                  let stepPleno = "pending";
                  if (statusAlur === "pleno") {
                    stepPleno = "active";
                  } else if (["finished", "ditolak"].includes(statusAlur)) {
                    stepPleno = "done";
                  }

                  let stepSelesai = "pending";
                  if (["finished", "ditolak"].includes(statusAlur)) {
                    stepSelesai = "done";
                  }

                  const steps = [
                    { label: "Pra-Asesmen", state: stepPra },
                    { label: "Desk Eval", state: stepDesk },
                    { label: "Asesmen Tahap 2", state: stepUji },
                    { label: "Sidang Pleno", state: stepPleno },
                    { label: "Selesai", state: stepSelesai },
                  ];
                  
                  return (
                    <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{task.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{nama}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{asalPt}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{prodi}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(task.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">
                        {/* Stepper */}
                        <div className="flex items-center gap-0.5">
                          {steps.map((step, i) => (
                            <div key={step.label} className="flex items-center gap-0.5">
                              <div className="flex flex-col items-center">
                                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  step.state === "done" ? "bg-emerald-500 text-white" :
                                  step.state === "active" ? "bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-700" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {step.state === "done" ? "✓" : i + 1}
                                </div>
                                <span className={`text-[9px] mt-0.5 leading-tight text-center w-12 ${
                                  step.state === "active" ? "font-bold text-blue-600 dark:text-blue-400" :
                                  step.state === "done" ? "text-emerald-600 dark:text-emerald-400" :
                                  "text-muted-foreground"
                                }`}>{step.label}</span>
                              </div>
                              {i < steps.length - 1 && (
                                <div className={`h-0.5 w-2 mt-[-12px] ${
                                  step.state === "done" ? "bg-emerald-400" : "bg-muted"
                                }`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {action.stageLabel}
                          </span>
                          <Button
                            variant={action.isComplete ? "outline" : "default"}
                            size="sm"
                            className={action.isComplete ? "gap-2" : "gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"}
                            onClick={() => handleAction(task)}
                          >
                            {action.actionLabel}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-8 w-8 opacity-20" />
                      <p>Tidak ada tugas asesmen yang ditemukan.</p>
                    </div>
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
