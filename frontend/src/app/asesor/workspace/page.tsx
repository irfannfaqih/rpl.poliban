"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileText, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toast } from "sonner";
import CapaianPembelajaranForm from "./components/CapaianPembelajaranForm";
import EvaluasiPortofolioForm from "./components/EvaluasiPortofolioForm";
import PemetaanMKForm from "./components/PemetaanMKForm";

function AsesorWorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tugasId = searchParams.get("tugasId");

  const { data: task, isLoading } = useQuery({
    queryKey: ['tugas-asesor', tugasId, 'workspace'],
    queryFn: async () => {
      if (!tugasId) return null;
      const { data: res } = await api.get(`/asesor/tugas/${tugasId}?view=workspace`);
      return res.data;
    },
    enabled: !!tugasId
  });

  const [activeTab, setActiveTab] = useState<"portofolio" | "cpmk" | "pemetaan">("portofolio");
  const [mounted, setMounted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [butuhAT2, setButuhAT2] = useState(false);

  const [localPortofolioCount, setLocalPortofolioCount] = useState<number | null>(null);
  const [localCpmkCount, setLocalCpmkCount] = useState<number | null>(null);
  const [localPemetaanCount, setLocalPemetaanCount] = useState<number | null>(null);

  // Document Preview State
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewName, setActivePreviewName] = useState<string | null>(null);

  // Ref ke fungsi save masing-masing form — dipanggil otomatis sebelum submit final
  const savePortofolioRef = useRef<(() => Promise<void>) | null>(null);
  const saveCpmkRef = useRef<(() => Promise<void>) | null>(null);
  const savePemetaanRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mutation Submit Final
  const submitFinalMutation = useMutation({
    mutationFn: async () => {
      // Auto-save semua form sebelum submit agar data local state tidak hilang
      const saveTasks = [
        savePortofolioRef.current?.(),
        saveCpmkRef.current?.(),
        savePemetaanRef.current?.(),
      ].filter(Boolean);
      if (saveTasks.length > 0) {
        await Promise.allSettled(saveTasks);
      }

      const { data } = await api.post(`/asesor/tugas/${tugasId}/submit-final`, {
        butuh_at2: butuhAT2
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tugas-asesor', tugasId] });
      queryClient.invalidateQueries({ queryKey: ['tugas-asesor-list'] });
      setShowConfirmDialog(false);
      if (data.semua_selesai) {
        const tujuan = data.status_alur === 'asesmen_tahap2' ? 'Asesmen Tahap 2' : 'Sidang Pleno';
        toast.success(`Semua asesor selesai. Pemohon dilanjutkan ke ${tujuan}.`);
      } else {
        toast.success(`Penilaian disubmit. Menunggu ${data.sisa} asesor lain menyelesaikan penilaian.`);
      }
      router.push("/asesor/dashboard");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal submit final penilaian");
      setShowConfirmDialog(false);
    },
  });



  if (!mounted) return null;

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!tugasId || !task) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Belum Ada Tugas Dipilih</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Silakan kembali ke <Link href="/asesor/dashboard" className="text-primary hover:underline font-medium">Daftar Tugas</Link> dan pilih tugas untuk mulai melakukan penilaian.
          </p>
        </div>
      </div>
    );
  }

  const pendaftaran = task.pendaftaran;
  const user = pendaftaran?.user;
  const prodi = pendaftaran?.prodi;
  const isSubmitFinal = task.status === 'submit_final';

  // ─── Cek kelengkapan sebelum submit final ───────────────────────────────────
  const mkAsalList = pendaftaran?.transkrip_asal || [];
  const mkPolibanCpmkList = pendaftaran?.prodi?.mata_kuliah || [];
  const totalCpmk = mkPolibanCpmkList.reduce((acc: number, mk: any) => acc + (mk.cpmk?.length || 0), 0);

  // Gunakan local state (real-time) jika tersedia, fallback ke data server
  const dinilaiCpmk = localCpmkCount ?? (task?.penilaian_cpmk || []).filter((p: any) =>
    p.nilai &&
    p.valid !== null &&
    p.autentik !== null &&
    p.terkini !== null &&
    p.cukup !== null
  ).length;
  const pemetaanSelesai = localPemetaanCount ?? mkAsalList.filter((mk: any) => {
    const mapped = (task?.pemetaan_mk || []).find((m: any) =>
      m.mk_asal_kode === mk.kode_mk || m.mk_asal_kode === mk.id?.toString()
    );
    return mapped?.mk_poliban_id && mapped?.kesenjangan && mapped?.keputusan;
  }).length;
  const evalPortofolio = localPortofolioCount ?? (task?.evaluasi_portofolio || []).filter((e: any) => e.status_dokumen).length;
  const totalKategoriPortofolio = 10;

  const validasiKelengkapan = [
    {
      key: "portofolio",
      label: "Evaluasi Portofolio",
      tab: "portofolio" as const,
      selesai: evalPortofolio,
      total: totalKategoriPortofolio,
      ok: evalPortofolio >= totalKategoriPortofolio,
    },
    {
      key: "cpmk",
      label: "Penilaian CPMK",
      tab: "cpmk" as const,
      selesai: dinilaiCpmk,
      total: totalCpmk,
      ok: totalCpmk === 0 || dinilaiCpmk >= totalCpmk,
    },
    {
      key: "pemetaan",
      label: "Pemetaan Mata Kuliah",
      tab: "pemetaan" as const,
      selesai: pemetaanSelesai,
      total: mkAsalList.length,
      ok: mkAsalList.length === 0 || pemetaanSelesai >= mkAsalList.length,
    },
  ];
  const semuaLengkap = validasiKelengkapan.every((v) => v.ok);
  const cpmkLengkap = validasiKelengkapan.find((v) => v.key === "cpmk")?.ok ?? false;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Confirmation Dialog Overlay */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${semuaLengkap ? "bg-amber-500/10" : "bg-red-500/10"}`}>
                <AlertTriangle className={`h-5 w-5 ${semuaLengkap ? "text-amber-600" : "text-red-600"}`} />
              </div>
              <h3 className="text-base font-bold text-foreground">Submit Final Penilaian?</h3>
            </div>

            {/* Checklist kelengkapan */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kelengkapan Penilaian</p>
              {validasiKelengkapan.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => { setActiveTab(v.tab); setShowConfirmDialog(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-colors ${v.ok
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    }`}
                >
                  {v.ok
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    : <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  }
                  <span className="flex-1 text-left font-medium">{v.label}</span>
                  <span className="text-xs font-mono shrink-0">{v.selesai}/{v.total}</span>
                  {!v.ok && <span className="text-[10px] font-bold shrink-0">Klik untuk mengisi</span>}
                </button>
              ))}
            </div>

            {/* Deskripsi */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {semuaLengkap
                ? <>Setelah submit final, <strong className="text-foreground">seluruh data penilaian</strong> akan terkunci. Jika asesor lain belum submit, pemohon akan dilanjutkan setelah semua asesor selesai.</>
                : <><strong className="text-red-600 dark:text-red-400">Masih ada penilaian yang belum lengkap.</strong> Klik item di atas untuk melengkapinya. Anda tetap bisa submit, namun pastikan data yang terisi sudah benar.</>
              }
            </p>

            {/* Checkbox AT2 */}
            <div className="p-4 border rounded-xl bg-muted/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 shrink-0 text-primary rounded border-gray-300 focus:ring-primary"
                  checked={butuhAT2}
                  onChange={(e) => setButuhAT2(e.target.checked)}
                />
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-foreground">Rekomendasikan Asesmen Tahap 2 (AT2)</span>
                  <span className="text-xs text-muted-foreground block leading-relaxed">
                    Centang jika bukti portofolio masih kurang dan perlu uji tertulis, lisan, atau praktik. Pemohon baru masuk AT2 setelah <strong>semua asesor</strong> submit dan minimal satu merekomendasikan AT2.
                  </span>
                </div>
              </label>
            </div>

            {/* Tombol */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitFinalMutation.isPending}
                className="flex-1 h-10"
              >
                {semuaLengkap ? "Batal" : "Kembali Lengkapi"}
              </Button>
              <Button
                onClick={() => submitFinalMutation.mutate()}
                disabled={submitFinalMutation.isPending || !cpmkLengkap}
                className={`flex-1 h-10 gap-2 ${semuaLengkap
                  ? "bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
                  }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitFinalMutation.isPending
                  ? "Memproses..."
                  : !cpmkLengkap
                    ? "Lengkapi VATC CPMK"
                    : semuaLengkap
                      ? "Ya, Submit Final"
                      : "Submit Meski Belum Lengkap"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-14 shrink-0 border-b flex items-center justify-between px-4 bg-background">
        <div className="flex items-center gap-4">
          <Link href="/asesor/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
              {user?.nama?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight text-foreground">{user?.nama || "Pemohon"}</h1>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                {prodi?.nama}
              </p>
            </div>
          </div>
        </div>

        <div className="flex bg-muted/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("portofolio")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "portofolio" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Evaluasi Portofolio
          </button>
          <button
            onClick={() => setActiveTab("cpmk")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "cpmk" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Penilaian CPMK
          </button>
          <button
            onClick={() => setActiveTab("pemetaan")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === "pemetaan" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Pemetaan Mata Kuliah
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isSubmitFinal ? (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <Lock className="h-3.5 w-3.5" />
              Sudah Submit Final
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
              className={`h-8 text-xs gap-2 ${semuaLengkap
                ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground"
                : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
            >
              <CheckCircle2 className="h-3 w-3" /> Submit Final
              {!semuaLengkap && <span className="bg-white/20 rounded px-1 text-[10px]">Ada yang belum</span>}
            </Button>
          )}
        </div>
      </header>

      {/* Split Screen Workspace */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal">

          {/* Left Panel: Input Form */}
          <Panel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col bg-background">
              <div className="h-10 shrink-0 border-b flex items-center px-4 bg-background">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {activeTab === "portofolio" ? "Lembar Evaluasi Portofolio" : activeTab === "cpmk" ? "Lembar Penilaian CP" : "Matriks Alih Kredit Pemohon"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className={activeTab === "portofolio" ? "block" : "hidden"}>
                  <EvaluasiPortofolioForm 
                    tugas={task} 
                    onLocalChange={setLocalPortofolioCount} 
                    onRegisterSave={(fn) => { savePortofolioRef.current = fn; }} 
                    onPreview={(url, name) => { setActivePreviewUrl(url); setActivePreviewName(name); }}
                  />
                </div>
                <div className={activeTab === "cpmk" ? "block" : "hidden"}>
                  <CapaianPembelajaranForm 
                    tugas={task} 
                    onLocalChange={setLocalCpmkCount} 
                    onRegisterSave={(fn) => { saveCpmkRef.current = fn; }} 
                    onPreview={(url, name) => { setActivePreviewUrl(url); setActivePreviewName(name); }}
                  />
                </div>
                <div className={activeTab === "pemetaan" ? "block" : "hidden"}>
                  <PemetaanMKForm 
                    tugas={task} 
                    onLocalChange={setLocalPemetaanCount} 
                    onRegisterSave={(fn) => { savePemetaanRef.current = fn; }} 
                  />
                </div>
              </div>
            </div>
          </Panel>

          {/* Resizer */}
          <Separator className="w-2 bg-border/50 hover:bg-primary/50 transition-colors flex items-center justify-center cursor-col-resize group">
            <div className="h-8 w-1 rounded-full bg-border group-hover:bg-primary/50" />
          </Separator>

          {/* Right Panel: Document Preview */}
          <Panel defaultSize={40} minSize={25}>
            <div className="h-full flex flex-col bg-muted/10 border-l">
              <div className="h-10 shrink-0 border-b flex items-center justify-between px-4 bg-muted/30">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-muted-foreground mr-2" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Preview Dokumen
                  </span>
                </div>
                {activePreviewUrl && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => { setActivePreviewUrl(null); setActivePreviewName(null); }}>
                    Tutup Preview
                  </Button>
                )}
              </div>
              <div className="flex-1 overflow-hidden relative">
                {activePreviewUrl ? (
                  <div className="h-full flex flex-col">
                    <div className="bg-background border-b px-3 py-2 shrink-0">
                      <p className="text-sm font-semibold truncate" title={activePreviewName || "Dokumen"}>
                        {activePreviewName || "Dokumen Pendaftar"}
                      </p>
                    </div>
                    {(activePreviewUrl?.match(/\.(jpeg|jpg|gif|png)$/i) || activePreviewName?.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                      <div className="flex-1 overflow-auto bg-muted/30 p-4 flex items-center justify-center">
                        <img 
                          src={activePreviewUrl} 
                          alt={activePreviewName || "Document Preview"} 
                          className="max-w-full object-contain shadow-sm border rounded bg-white"
                        />
                      </div>
                    ) : (
                      <iframe 
                        src={activePreviewUrl} 
                        className="w-full h-full flex-1 border-none bg-muted/30"
                        title="Document Preview"
                      />
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 opacity-50" />
                    </div>
                    <p className="text-sm font-medium">Belum ada dokumen yang dipilih</p>
                    <p className="text-xs mt-1 max-w-[250px]">
                      Klik tombol <strong>"Preview Dokumen"</strong> pada lembar di sebelah kiri untuk menampilkan isinya di panel ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Panel>

        </Group>
      </div>
    </div>
  );
}

export default function AsesorWorkspace() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <AsesorWorkspaceContent />
    </Suspense>
  );
}
