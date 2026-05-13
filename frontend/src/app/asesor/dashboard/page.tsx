"use client";

import { useAsesorStore, TugasAsesmen } from "@/store/useAsesorStore";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ArrowRight,
  Clock,
  CheckCircle2,
  FileClock,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AsesorDashboard() {
  const router = useRouter();
  const tugasList = useAsesorStore((s) => s.tugasList);
  const praAsesmenData = useAsesorStore((s) => s.praAsesmenData);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const filteredTugas = tugasList.filter(t => {
    const matchQuery = t.namaPemohon.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "All" || t.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const handleAction = (task: TugasAsesmen) => {
    const isPraAsesmenSubmitted = praAsesmenData[task.pemohonId]?.isSubmitted;
    
    if (isPraAsesmenSubmitted) {
      router.push(`/asesor/workspace?pemohonId=${task.pemohonId}`);
    } else {
      router.push(`/asesor/pra-asesmen?pemohonId=${task.pemohonId}`);
    }
  };

  const statBelum = tugasList.filter(t => t.status === "Belum Dinilai").length;
  const statSedang = tugasList.filter(t => t.status === "Sedang Dinilai").length;
  const statSelesai = tugasList.filter(t => t.status === "Submit Final").length;

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
          <p className="text-3xl font-bold">{tugasList.length}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Belum Dinilai</h3>
          </div>
          <p className="text-3xl font-bold">{statBelum}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-blue-600 mb-4">
            <FileClock className="h-5 w-5" />
            <h3 className="font-medium">Sedang Dinilai</h3>
          </div>
          <p className="text-3xl font-bold">{statSedang}</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 text-green-600 mb-4">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="font-medium">Selesai (Final)</h3>
          </div>
          <p className="text-3xl font-bold">{statSelesai}</p>
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
            <option value="Belum Dinilai">Belum Dinilai</option>
            <option value="Sedang Dinilai">Sedang Dinilai</option>
            <option value="Submit Final">Selesai / Submit Final</option>
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
              {filteredTugas.length > 0 ? (
                filteredTugas.map((task) => {
                  const isPraAsesmenSubmitted = praAsesmenData[task.pemohonId]?.isSubmitted;
                  
                  // Determine stepper progress
                  const stepPra = isPraAsesmenSubmitted ? "done" : task.status === "Belum Dinilai" ? "active" : "pending";
                  const stepDesk = isPraAsesmenSubmitted && task.status === "Sedang Dinilai" ? "active" : isPraAsesmenSubmitted && task.status === "Submit Final" ? "done" : "pending";
                  const stepUji = task.status === "Submit Final" ? "done" : "pending";
                  const stepFinal = task.status === "Submit Final" ? "done" : "pending";

                  const steps = [
                    { label: "Pra-Asesmen", state: stepPra },
                    { label: "Desk Eval", state: stepDesk },
                    { label: "Uji Lanjut", state: stepUji },
                    { label: "Submit", state: stepFinal },
                  ];
                  
                  return (
                    <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{task.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{task.namaPemohon}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{task.asalPt}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{task.prodi}</td>
                      <td className="px-4 py-3 text-muted-foreground">{task.tanggalMasuk}</td>
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
                        {task.status === "Submit Final" ? (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/asesor/workspace?pemohonId=${task.pemohonId}`)}>
                            Lihat Hasil
                          </Button>
                        ) : (
                          <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" onClick={() => handleAction(task)}>
                            {isPraAsesmenSubmitted ? "Lanjutkan Penilaian" : "Mulai Pra-Asesmen"}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
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
