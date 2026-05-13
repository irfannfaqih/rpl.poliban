"use client";

import { useAsesorStore, PraAsesmenData } from "@/store/useAsesorStore";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Info, FileText, Send } from "lucide-react";
import Link from "next/link";

const langkahList = [
  { key: "langkah1", label: "1. Pembukaan", desc: "Menjelaskan dan mendiskusikan tujuan konsultasi pra asesmen dengan pemohon." },
  { key: "langkah2", label: "2. Evaluasi Bukti & Asesmen Mandiri", desc: "Mengkaji kesesuaian dokumen bukti dan hasil asesmen mandiri terhadap standar kualifikasi." },
  { key: "langkah3", label: "3. Penjelasan Proses", desc: "Menjelaskan proses asesmen, metode Desk Evaluation, serta hak pemohon untuk mengajukan sanggah." },
  { key: "langkah4", label: "4. Konfirmasi Tujuan", desc: "Mengkonfirmasi tujuan utama pemohon mengikuti asesmen RPL ini." },
  { key: "langkah5", label: "5. Perencanaan & Pengorganisasian", desc: "Menjelaskan jenis bukti, metode asesmen, perangkat yang digunakan, serta sumber daya yang diperlukan." },
  { key: "langkah6", label: "6. Tata Tertib & Aturan", desc: "Menjelaskan tata tertib, aturan K3 (bila ada), penyesuaian yang wajar, serta kerahasiaan data." },
  { key: "langkah7", label: "7. Konfirmasi Jadwal", desc: "Menyepakati estimasi jadwal penyelesaian asesmen portofolio atau jadwal uji lanjutan jika diperlukan." },
  { key: "langkah8", label: "8. Persetujuan Bersama", desc: "Pemohon telah menyetujui seluruh rencana asesmen dan proses akan dilanjutkan ke tahap Workspace Penilaian." },
];

export default function PraAsesmenPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pemohonId = searchParams.get("pemohonId");
  
  const tugasList = useAsesorStore((s) => s.tugasList);
  const praAsesmenData = useAsesorStore((s) => s.praAsesmenData);
  const updatePraAsesmen = useAsesorStore((s) => s.updatePraAsesmen);
  const submitPraAsesmen = useAsesorStore((s) => s.submitPraAsesmen);

  const task = tugasList.find((t) => t.pemohonId === pemohonId);
  const data = praAsesmenData[pemohonId || ""] || {};

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pemohonId || !task) {
      router.push("/asesor/dashboard");
    }
  }, [pemohonId, task, router]);

  if (!task) return null;

  const isAllChecked = langkahList.every((l) => data[l.key as keyof PraAsesmenData] === true);
  const isReadyToSubmit = isAllChecked && data.rekomendasi;

  const handleToggle = (key: keyof PraAsesmenData) => {
    updatePraAsesmen(pemohonId!, { [key]: !data[key] });
  };

  const handleTextChange = (key: keyof PraAsesmenData, value: string) => {
    updatePraAsesmen(pemohonId!, { [key]: value });
  };

  const handleSubmit = async () => {
    if (!isReadyToSubmit) return;
    
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    submitPraAsesmen(pemohonId!);
    setLoading(false);
    
    router.push(`/asesor/workspace?pemohonId=${pemohonId}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-6">
        <Link href="/asesor/dashboard" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Pra Asesmen</h1>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400">
              {task.id}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Konsultasi awal dengan pemohon sebelum membuka akses Workspace Penilaian Portofolio.</p>
        </div>
      </div>

      {/* Identitas Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-500">
            {task.namaPemohon.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{task.namaPemohon}</h2>
            <p className="text-sm text-muted-foreground">{task.asalPt}</p>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-sm text-muted-foreground">Program Studi Tujuan</p>
          <p className="font-semibold text-primary">{task.prodi}</p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5 flex gap-4">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed text-blue-900 dark:text-blue-200">
          <p className="font-bold mb-1">Penting:</p>
          <p>Lengkapi seluruh 8 langkah checklist konsultasi di bawah ini bersama pemohon (via tatap muka / daring). Setelah form ini di-submit, Anda baru akan diberikan akses ke Workspace Penilaian Portofolio untuk pemohon ini.</p>
        </div>
      </div>

      {/* Checklist 8 Langkah */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Checklist Kegiatan Pra Asesmen
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {langkahList.map((item) => {
            const isChecked = !!data[item.key as keyof PraAsesmenData];
            return (
              <div 
                key={item.key}
                onClick={() => handleToggle(item.key as keyof PraAsesmenData)}
                className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isChecked 
                    ? "border-green-500 bg-green-50/50 dark:bg-green-500/10" 
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isChecked ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground"
                }`}>
                  {isChecked && <CheckCircle2 className="h-4 w-4" />}
                </div>
                <div>
                  <p className={`font-bold text-sm ${isChecked ? "text-green-800 dark:text-green-400" : "text-foreground"}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Catatan Khusus */}
      <div className="space-y-6 pt-4">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
          <FileText className="h-5 w-5 text-primary" />
          Catatan & Identifikasi Khusus
        </h3>

        <div className="space-y-3">
          <Label className="font-semibold text-sm">Catatan Observasi Kesesuaian Bukti (Opsional)</Label>
          <textarea 
            value={data.catatanObservasi || ""}
            onChange={(e) => handleTextChange("catatanObservasi", e.target.value)}
            className="w-full min-h-[100px] rounded-xl border bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Tuliskan catatan awal Anda saat meninjau dokumen pemohon..."
          />
        </div>

        <div className="space-y-3">
          <Label className="font-semibold text-sm">Kebutuhan Spesifik / Penyesuaian Wajar (Bila Ada)</Label>
          <textarea 
            value={data.kebutuhanKhusus || ""}
            onChange={(e) => handleTextChange("kebutuhanKhusus", e.target.value)}
            className="w-full min-h-[80px] rounded-xl border bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder="Karakteristik khusus pemohon, kendala bahasa, aksesibilitas, dll..."
          />
        </div>
      </div>

      {/* Rekomendasi Akhir */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-bold">Rekomendasi Tindak Lanjut</h3>
        <p className="text-sm text-muted-foreground mb-4">Pilih rekomendasi berdasarkan konsultasi pra asesmen ini.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {["Lanjut Penuh", "Lanjut dengan Catatan", "Tidak Memenuhi Syarat"].map((opt) => (
            <button
              key={opt}
              onClick={() => handleTextChange("rekomendasi", opt)}
              className={`p-4 rounded-xl border-2 font-bold text-sm transition-all ${
                data.rekomendasi === opt
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {data.rekomendasi && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
            <Label className="font-semibold text-sm mb-2 block">Catatan Rekomendasi (Wajib)</Label>
            <textarea 
              value={data.catatanRekomendasi || ""}
              onChange={(e) => handleTextChange("catatanRekomendasi", e.target.value)}
              className="w-full min-h-[80px] rounded-xl border bg-background p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder={`Berikan alasan mengapa Anda memilih "${data.rekomendasi}"...`}
            />
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-8 border-t flex justify-end">
        <Button 
          size="lg" 
          disabled={!isReadyToSubmit || !data.catatanRekomendasi || loading}
          onClick={handleSubmit}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
        >
          {loading ? "Menyimpan..." : "Simpan & Buka Workspace"}
          {!loading && <Send className="h-4 w-4" />}
        </Button>
      </div>

    </div>
  );
}
