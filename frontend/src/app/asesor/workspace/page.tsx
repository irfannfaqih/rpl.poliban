"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAsesorStore } from "@/store/useAsesorStore";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GripVertical, FileText, CheckCircle2, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import EvaluasiPortofolioForm from "./components/EvaluasiPortofolioForm";
import CapaianPembelajaranForm from "./components/CapaianPembelajaranForm";
import PemetaanMKForm from "./components/PemetaanMKForm";
import DokumenViewer from "./components/DokumenViewer";

export default function AsesorWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pemohonId = searchParams.get("pemohonId");

  const tugasList = useAsesorStore((s) => s.tugasList);
  const task = tugasList.find((t) => t.pemohonId === pemohonId);

  const [activeTab, setActiveTab] = useState<"portofolio" | "cpmk" | "pemetaan">("portofolio");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!pemohonId || !task) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Belum Ada Pemohon Dipilih</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Silakan kembali ke <Link href="/asesor/dashboard" className="text-primary hover:underline font-medium">Daftar Tugas</Link> dan pilih pemohon untuk mulai melakukan penilaian portofolio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 shrink-0 border-b flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-4">
          <Link href="/asesor/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              {task.namaPemohon.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight text-foreground">{task.namaPemohon}</h1>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                {task.prodi}
              </p>
            </div>
          </div>
        </div>

        <div className="flex bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("portofolio")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "portofolio" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Evaluasi Portofolio
          </button>
          <button
            onClick={() => setActiveTab("cpmk")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "cpmk" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Penilaian CPMK
          </button>
          <button
            onClick={() => setActiveTab("pemetaan")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeTab === "pemetaan" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pemetaan Mata Kuliah
          </button>
        </div>

        <div>
          <Button size="sm" className="h-8 text-xs gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground">
            <CheckCircle2 className="h-3 w-3" /> Submit Final
          </Button>
        </div>
      </header>

      {/* Split Screen Workspace */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup orientation="horizontal">
          
          {/* Left Panel: Dokumen Viewer (Read Only) */}
          <Panel defaultSize={45} minSize={30}>
            <div className="h-full flex flex-col bg-muted/10 border-r">
              <div className="h-10 shrink-0 border-b flex items-center px-4 bg-muted/30">
                <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Arsip Pemohon</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <DokumenViewer pemohonId={pemohonId!} />
              </div>
            </div>
          </Panel>

          {/* Resizer */}
          <PanelResizeHandle className="w-2 bg-border/50 hover:bg-primary/50 transition-colors flex items-center justify-center cursor-col-resize group">
            <div className="h-8 w-1 rounded-full bg-border group-hover:bg-primary/50" />
          </PanelResizeHandle>

          {/* Right Panel: Input Form */}
          <Panel defaultSize={55} minSize={40}>
            <div className="h-full flex flex-col bg-background">
              <div className="h-10 shrink-0 border-b flex items-center px-4 bg-background">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {activeTab === "portofolio" ? "Lembar Evaluasi Portofolio" : activeTab === "cpmk" ? "Lembar Penilaian CP" : "Matriks Alih Kredit Pemohon"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "portofolio" ? (
                  <EvaluasiPortofolioForm pemohonId={pemohonId!} />
                ) : activeTab === "cpmk" ? (
                  <CapaianPembelajaranForm pemohonId={pemohonId!} />
                ) : (
                  <PemetaanMKForm pemohonId={pemohonId!} />
                )}
              </div>
            </div>
          </Panel>
          
        </PanelGroup>
      </div>
    </div>
  );
}
