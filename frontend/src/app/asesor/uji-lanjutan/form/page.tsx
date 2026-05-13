"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, HelpCircle, CheckCircle2, Send, Eye, PenLine, Lock, BookOpenCheck, Key, FileText } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Simulasi status fase ujian
type FaseUjian = "buat_soal" | "menunggu_jawaban" | "koreksi";

interface SoalTulis {
  id: number;
  pertanyaan: string;
  kunciJawaban: string;
  jawabanPemohon: string; // Akan terisi setelah pemohon menjawab
  nilai: number | null;
}

const MOCK_SOAL_AWAL: SoalTulis[] = [
  {
    id: 1,
    pertanyaan: "Jelaskan perbedaan antara Client-Side Rendering (CSR) dan Server-Side Rendering (SSR) dalam konteks framework web modern!",
    kunciJawaban: "CSR merender halaman di browser menggunakan JavaScript setelah HTML kosong dikirim server. SSR merender HTML lengkap di server sebelum dikirim ke browser. CSR lebih cepat navigasi antar halaman, SSR lebih baik untuk SEO dan First Contentful Paint.",
    jawabanPemohon: "CSR itu render di client, SSR di server. CSR pakai JavaScript buat render, SSR sudah jadi HTML dari server. CSR lebih cepat pindah halaman tapi kurang SEO, SSR bagus SEO tapi server lebih berat kerjanya.",
    nilai: null,
  },
  {
    id: 2,
    pertanyaan: "Apa yang dimaksud dengan RESTful API? Sebutkan minimal 4 HTTP method beserta fungsinya!",
    kunciJawaban: "RESTful API adalah arsitektur API yang mengikuti prinsip REST (Representational State Transfer). 4 HTTP method: GET (mengambil data), POST (membuat data baru), PUT (memperbarui data secara keseluruhan), DELETE (menghapus data). Opsional: PATCH (memperbarui sebagian data).",
    jawabanPemohon: "RESTful API adalah cara membuat API yang terstruktur. HTTP method: GET untuk ambil data, POST untuk kirim data baru, PUT untuk update, DELETE untuk hapus.",
    nilai: null,
  },
  {
    id: 3,
    pertanyaan: "Jelaskan konsep normalisasi basis data dan mengapa hal tersebut penting dalam perancangan database!",
    kunciJawaban: "Normalisasi adalah proses penyusunan tabel dalam database untuk mengurangi redundansi data dan mencegah anomali (insert, update, delete anomaly). Tahapan: 1NF (atomik), 2NF (tanpa partial dependency), 3NF (tanpa transitive dependency). Penting untuk integritas data, efisiensi penyimpanan, dan kemudahan pemeliharaan.",
    jawabanPemohon: "Normalisasi itu mengatur tabel biar data tidak duplikat. Ada 1NF, 2NF, 3NF. Penting biar database tidak boros dan datanya konsisten.",
    nilai: null,
  },
];

export default function UjiLanjutanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pemohonId = searchParams.get("pemohonId");

  const [activeTab, setActiveTab] = useState<"tulis" | "wawancara">("tulis");
  // Simulasi: di real app, fase ini ditentukan oleh status di DB
  const [faseTulis, setFaseTulis] = useState<FaseUjian>("koreksi"); // "koreksi" untuk demo
  const [soalList, setSoalList] = useState<SoalTulis[]>(MOCK_SOAL_AWAL);
  const [soalBaru, setSoalBaru] = useState({ pertanyaan: "", kunciJawaban: "" });
  const [catatan, setCatatan] = useState("");

  if (!pemohonId) return null;

  const handleTambahSoal = () => {
    if (!soalBaru.pertanyaan.trim() || !soalBaru.kunciJawaban.trim()) return;
    setSoalList(prev => [...prev, {
      id: prev.length + 1,
      pertanyaan: soalBaru.pertanyaan,
      kunciJawaban: soalBaru.kunciJawaban,
      jawabanPemohon: "",
      nilai: null,
    }]);
    setSoalBaru({ pertanyaan: "", kunciJawaban: "" });
  };

  const handleNilai = (soalId: number, nilai: number) => {
    setSoalList(prev => prev.map(s => s.id === soalId ? { ...s, nilai } : s));
  };

  const scoredCount = soalList.filter(s => s.nilai !== null).length;
  const rataRata = scoredCount > 0
    ? soalList.reduce((sum, s) => sum + (s.nilai || 0), 0) / soalList.length
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-6">
          <Link href="/asesor/uji-lanjutan" className="flex h-10 w-10 items-center justify-center rounded-xl border bg-background hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Kelola Uji Lanjutan</h1>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold font-mono">{pemohonId}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Isi instrumen ujian tulis atau wawancara/demonstrasi.</p>
          </div>
        </div>
        <Button className="gap-2" disabled={faseTulis === "koreksi" && scoredCount < soalList.length}>
          <Save className="h-4 w-4" /> Simpan Hasil Ujian
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab("tulis")}
          className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "tulis"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <PenLine className="h-5 w-5" />
          Ujian Tulis & Penilaian
        </button>
        <button
          onClick={() => setActiveTab("wawancara")}
          className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "wawancara"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <CheckCircle2 className="h-5 w-5" />
          Wawancara & Observasi
        </button>
      </div>

      {/* Content Form Tulis */}
      {activeTab === "tulis" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

          {/* Stepper Fase */}
          <div className="flex items-center gap-2 bg-card rounded-xl border p-4">
            {[
              { key: "buat_soal", label: "Fase 1: Buat Soal & Kunci", icon: PenLine },
              { key: "menunggu_jawaban", label: "Fase 2: Menunggu Jawaban", icon: Lock },
              { key: "koreksi", label: "Fase 3: Koreksi & Nilai", icon: BookOpenCheck },
            ].map((fase, i) => (
              <div key={fase.key} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  faseTulis === fase.key
                    ? "bg-primary text-primary-foreground"
                    : faseTulis === "koreksi" && fase.key !== "koreksi"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : faseTulis === "menunggu_jawaban" && fase.key === "buat_soal"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}>
                  <fase.icon className="h-3.5 w-3.5 shrink-0" />
                  {fase.label}
                </div>
                {i < 2 && <div className="h-0.5 w-4 bg-muted shrink-0" />}
              </div>
            ))}
          </div>

          {/* FASE 1: Buat Soal + Kunci Jawaban */}
          {faseTulis === "buat_soal" && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p><strong>Fase 1 — Buat Soal & Kunci Jawaban</strong></p>
                <p className="text-xs opacity-80">Tulis pertanyaan essay beserta kunci jawaban. Setelah selesai, terbitkan soal ke Pemohon.</p>
              </div>

              <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-6">
                <h3 className="font-bold text-lg border-b pb-2">Mata Kuliah: Pemrograman Web Lanjut</h3>

                {soalList.map((soal) => (
                  <div key={soal.id} className="p-4 bg-muted/30 border rounded-xl space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground">Soal {soal.id}</Label>
                      <Textarea className="min-h-[60px] bg-background" defaultValue={soal.pertanyaan} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> Kunci Jawaban</Label>
                      <Textarea className="min-h-[60px] bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" defaultValue={soal.kunciJawaban} />
                    </div>
                  </div>
                ))}

                {/* Tambah Soal */}
                <div className="p-4 border-2 border-dashed rounded-xl space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground">Tambah Soal Baru</Label>
                  <Textarea value={soalBaru.pertanyaan} onChange={(e) => setSoalBaru(p => ({...p, pertanyaan: e.target.value}))} placeholder="Tuliskan pertanyaan..." className="min-h-[50px] bg-background" />
                  <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> Kunci Jawaban</Label>
                  <Textarea value={soalBaru.kunciJawaban} onChange={(e) => setSoalBaru(p => ({...p, kunciJawaban: e.target.value}))} placeholder="Tuliskan kunci jawaban..." className="min-h-[50px] bg-emerald-50 dark:bg-emerald-900/20" />
                  <Button variant="outline" className="w-full" onClick={handleTambahSoal} disabled={!soalBaru.pertanyaan.trim() || !soalBaru.kunciJawaban.trim()}>
                    + Tambah Soal
                  </Button>
                </div>
              </div>

              <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setFaseTulis("menunggu_jawaban")} disabled={soalList.length === 0}>
                <Send className="h-4 w-4" />
                Terbitkan Soal ke Pemohon ({soalList.length} soal)
              </Button>
            </div>
          )}

          {/* FASE 2: Menunggu Jawaban Pemohon */}
          {faseTulis === "menunggu_jawaban" && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-xl text-center space-y-3">
                <Lock className="h-10 w-10 text-amber-600 dark:text-amber-400 mx-auto" />
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">Menunggu Jawaban Pemohon</h3>
                <p className="text-sm text-amber-800 dark:text-amber-400 max-w-md mx-auto leading-relaxed">
                  Soal telah diterbitkan ke portal Pemohon (<code className="bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded text-xs">/pemohon/ujian-tulis</code>). 
                  Anda akan mendapat notifikasi setelah pemohon menyelesaikan dan mengirimkan jawaban.
                </p>
                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground mt-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Menunggu submit dari pemohon...
                </div>
                {/* Demo button */}
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setFaseTulis("koreksi")}>
                  <Eye className="h-3.5 w-3.5" /> (Demo) Simulasikan Jawaban Masuk
                </Button>
              </div>
            </div>
          )}

          {/* FASE 3: Koreksi & Penilaian */}
          {faseTulis === "koreksi" && (
            <div className="space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-sm text-emerald-800 dark:text-emerald-300 space-y-1">
                <p><strong>Fase 3 — Koreksi Jawaban & Beri Nilai</strong></p>
                <p className="text-xs opacity-80">Bandingkan jawaban pemohon dengan kunci jawaban Anda, lalu beri skor ketepatan 1-5.</p>
                <p className="text-xs opacity-80 mt-1">
                  1 = Ketepatan &lt;20% · 2 = 21-40% · 3 = 41-60% · 4 = 61-80% · 5 = 81-100%
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-bold text-lg">MK: Pemrograman Web Lanjut</h3>
                  <Badge variant="outline" className="text-xs">{scoredCount}/{soalList.length} Dinilai</Badge>
                </div>

                {soalList.map((soal) => (
                  <div key={soal.id} className={`rounded-xl border overflow-hidden transition-all ${
                    soal.nilai !== null ? "border-emerald-200 dark:border-emerald-800/50" : "border-border"
                  }`}>
                    {/* Soal Header */}
                    <div className={`px-5 py-3 flex items-center justify-between ${
                      soal.nilai !== null ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-muted/30"
                    }`}>
                      <span className="font-bold text-sm text-foreground flex items-center gap-2">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{soal.id}</span>
                        Soal {soal.id}
                      </span>
                      {soal.nilai !== null && (
                        <Badge className="bg-emerald-600 text-white text-xs">Skor: {soal.nilai}/5</Badge>
                      )}
                    </div>

                    <div className="p-5 space-y-4 bg-background">
                      {/* Pertanyaan */}
                      <div className="text-sm text-foreground bg-muted/20 p-3 rounded-lg border border-dashed">
                        <span className="font-bold text-muted-foreground text-[11px] uppercase tracking-wider block mb-1">Pertanyaan:</span>
                        {soal.pertanyaan}
                      </div>

                      {/* 2 Column: Jawaban Pemohon vs Kunci Jawaban */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Jawaban Pemohon */}
                        <div className="bg-blue-50 dark:bg-blue-900/15 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50">
                          <span className="font-bold text-blue-700 dark:text-blue-300 text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Jawaban Pemohon:
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">{soal.jawabanPemohon || <span className="italic text-muted-foreground">Belum dijawab</span>}</p>
                        </div>

                        {/* Kunci Jawaban */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/15 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" /> Kunci Jawaban:
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">{soal.kunciJawaban}</p>
                        </div>
                      </div>

                      {/* Penilaian */}
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">Skor Ketepatan:</Label>
                        <div className="flex bg-muted/50 p-1 rounded-lg border flex-1 max-w-xs">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => handleNilai(soal.id, n)}
                              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                                soal.nilai === n
                                  ? n >= 4 ? "bg-emerald-500 text-white shadow-sm" :
                                    n === 3 ? "bg-amber-500 text-white shadow-sm" :
                                    "bg-red-500 text-white shadow-sm"
                                  : "text-muted-foreground hover:bg-background"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {soal.nilai === 1 && "< 20%"}
                          {soal.nilai === 2 && "21-40%"}
                          {soal.nilai === 3 && "41-60%"}
                          {soal.nilai === 4 && "61-80%"}
                          {soal.nilai === 5 && "81-100%"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nilai Akhir */}
              <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Nilai Akhir = Rata-rata × 20</p>
                    <p className="text-xs text-muted-foreground">Otomatis dihitung dari skor per soal</p>
                  </div>
                  <div className={`px-6 py-3 rounded-xl text-2xl font-bold ${
                    scoredCount === soalList.length
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {scoredCount === soalList.length
                      ? (rataRata * 20).toFixed(0)
                      : "—"
                    }
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold">Catatan Kelulusan Ujian Tulis</Label>
                  <Textarea 
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Kesimpulan Asesor terkait hasil ujian tulis pemohon ini..."
                    className="min-h-[80px] resize-y"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Form Wawancara */}
      {activeTab === "wawancara" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-300">
            <strong>Instruksi Wawancara/Praktik:</strong> Beri centang K (Kompeten) atau BK (Belum Kompeten) pada saat wawancara atau demonstrasi praktik.
          </div>
          
          <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-6">
            <h3 className="font-bold text-lg border-b pb-2">Mata Kuliah: Basis Data Dasar</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 border rounded-xl space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs font-bold text-muted-foreground block mb-2">Instruksi Observasi / Pertanyaan</Label>
                    <input 
                      type="text"
                      className="w-full p-3 text-sm rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                      defaultValue="Praktikkan cara membuat table dengan relasi One-to-Many di SQL."
                    />
                  </div>
                  <div className="w-40">
                    <Label className="text-xs font-bold text-muted-foreground block mb-2 text-center">Keputusan</Label>
                    <div className="flex bg-background border p-1 rounded-lg">
                      <button className="flex-1 py-1.5 text-xs font-bold rounded-md hover:bg-muted text-muted-foreground">BK</button>
                      <button className="flex-1 py-1.5 text-xs font-bold rounded-md bg-green-500 text-white shadow-sm">K</button>
                    </div>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full border-dashed">
                + Tambah Poin Observasi
              </Button>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-bold block mb-2">Kesimpulan Rekomendasi Asesor (Wawancara/Observasi)</Label>
              <Textarea 
                placeholder="Rekomendasi apakah SKS mata kuliah ini diakui penuh atau ditolak berdasarkan wawancara..."
                className="min-h-[80px] resize-y"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
