"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

// Mock data MK Asal (dari transkrip pemohon)
const MK_ASAL_MOCK = [
  { kode: "INF101", nama: "Algoritma Pemrograman", cp: "Mampu memahami konsep dasar algoritma, tipe data, percabangan, perulangan, dan array." },
  { kode: "INF102", nama: "Basis Data", cp: "Mampu merancang ERD dan mengimplementasikan query SQL dasar." },
  { kode: "INF103", nama: "Pemrograman Web", cp: "Mampu membuat halaman web dinamis menggunakan HTML, CSS, dan JavaScript." },
  { kode: "INF104", nama: "Jaringan Komputer", cp: "Mampu memahami konsep jaringan, OSI Layer, subnetting, dan konfigurasi dasar." },
  { kode: "INF105", nama: "Sistem Informasi", cp: "Mampu memahami konsep SI, jenis-jenis SI, dan pengembangan sistem." },
];

// Mock data MK Poliban (dari kurikulum prodi tujuan)
const MK_POLIBAN_MOCK = [
  { kode: "TI101", nama: "Algoritma Pemrograman", sks: 3, cp: "Mahasiswa mampu memahami dasar pemrograman, tipe data, operator, percabangan, perulangan, dan array." },
  { kode: "TI102", nama: "Basis Data Dasar", sks: 3, cp: "Mampu merancang basis data relasional dan mengimplementasikan SQL." },
  { kode: "TI103", nama: "Pemrograman Berbasis Web", sks: 3, cp: "Mampu membuat aplikasi web dinamis." },
  { kode: "TI104", nama: "Dasar-Dasar Jaringan", sks: 3, cp: "Mampu memahami konsep jaringan komputer, protokol, dan konfigurasi." },
  { kode: "TI105", nama: "Pengantar Sistem Informasi", sks: 3, cp: "Mampu memahami konsep dan jenis sistem informasi." },
  { kode: "TI106", nama: "Matematika", sks: 3, cp: "Mampu memahami konsep dasar matriks, vektor, dan SPL." },
];

type Kesenjangan = "Sesuai" | "Sebagian Sesuai" | "Tidak Sesuai" | "";
type Keputusan = "Diakui Penuh" | "Diakui Sebagian" | "Tidak Diakui" | "";

interface Mapping {
  mkPoliban: string;
  kesenjangan: Kesenjangan;
  keputusan: Keputusan;
  catatan: string;
}

export default function PemetaanMKForm({ pemohonId }: { pemohonId: string }) {
  const [mappings, setMappings] = useState<Record<string, Mapping>>({});

  const getMapping = (kodeAsal: string): Mapping =>
    mappings[kodeAsal] || { mkPoliban: "", kesenjangan: "", keputusan: "", catatan: "" };

  const updateMapping = (kodeAsal: string, field: keyof Mapping, value: string) => {
    setMappings((prev) => ({
      ...prev,
      [kodeAsal]: { ...getMapping(kodeAsal), [field]: value },
    }));
  };

  const completedCount = MK_ASAL_MOCK.filter((mk) => {
    const m = getMapping(mk.kode);
    return m.mkPoliban && m.kesenjangan && m.keputusan;
  }).length;

  const getKesenanganColor = (k: Kesenjangan) => {
    if (k === "Sesuai") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    if (k === "Sebagian Sesuai") return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    if (k === "Tidak Sesuai") return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800";
    return "";
  };

  const getKeputusanIcon = (k: Keputusan) => {
    if (k === "Diakui Penuh") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    if (k === "Diakui Sebagian") return <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
    if (k === "Tidak Diakui") return <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
    return null;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Pemetaan Mata Kuliah</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Petakan setiap MK Asal dari transkrip pemohon ke MK Poliban yang setara. Tentukan tingkat
          kesenjangan CP dan keputusan alih kredit.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 bg-muted/30 border rounded-xl p-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Progres Pemetaan</span>
            <span className="text-sm font-bold text-foreground">{completedCount}/{MK_ASAL_MOCK.length}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / MK_ASAL_MOCK.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mapping Cards */}
      <div className="space-y-6">
        {MK_ASAL_MOCK.map((mkAsal, idx) => {
          const m = getMapping(mkAsal.kode);
          const selectedPoliban = MK_POLIBAN_MOCK.find((p) => p.kode === m.mkPoliban);
          const isComplete = m.mkPoliban && m.kesenjangan && m.keputusan;

          return (
            <div
              key={mkAsal.kode}
              className={`border rounded-xl overflow-hidden transition-all ${
                isComplete
                  ? "border-emerald-200 dark:border-emerald-800/50"
                  : "border-border"
              }`}
            >
              {/* Card Header */}
              <div className={`px-5 py-3 flex items-center justify-between ${
                isComplete
                  ? "bg-emerald-50 dark:bg-emerald-900/20"
                  : "bg-muted/30"
              }`}>
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-sm text-foreground">{mkAsal.nama}</span>
                    <span className="text-xs text-muted-foreground ml-2">({mkAsal.kode})</span>
                  </div>
                </div>
                {isComplete && (
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Selesai
                  </Badge>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 bg-background">
                {/* CP Asal */}
                <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed">
                  <span className="font-bold text-foreground block mb-1">CP MK Asal:</span>
                  {mkAsal.cp}
                </div>

                {/* Mapping Row */}
                <div className="flex items-start gap-3">
                  {/* MK Poliban Dropdown */}
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      MK Poliban Setara
                    </label>
                    <Select
                      value={m.mkPoliban}
                      onValueChange={(val) => updateMapping(mkAsal.kode, "mkPoliban", val)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih MK Poliban...">
                          {selectedPoliban ? `${selectedPoliban.kode} — ${selectedPoliban.nama} (${selectedPoliban.sks} SKS)` : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {MK_POLIBAN_MOCK.map((p) => (
                          <SelectItem key={p.kode} value={p.kode}>
                            {p.kode} — {p.nama} ({p.sks} SKS)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Arrow */}
                  <div className="pt-8">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Kesenjangan */}
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Kesenjangan
                    </label>
                    <Select
                      value={m.kesenjangan}
                      onValueChange={(val) => updateMapping(mkAsal.kode, "kesenjangan", val)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sesuai">Sesuai</SelectItem>
                        <SelectItem value="Sebagian Sesuai">Sebagian Sesuai</SelectItem>
                        <SelectItem value="Tidak Sesuai">Tidak Sesuai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Keputusan */}
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Hasil
                    </label>
                    <Select
                      value={m.keputusan}
                      onValueChange={(val) => updateMapping(mkAsal.kode, "keputusan", val)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diakui Penuh">Diakui Penuh</SelectItem>
                        <SelectItem value="Diakui Sebagian">Diakui Sebagian</SelectItem>
                        <SelectItem value="Tidak Diakui">Tidak Diakui</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Auto-fill CP Poliban */}
                {selectedPoliban && (
                  <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50">
                    <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">
                      CP MK Poliban ({selectedPoliban.kode}):
                    </span>
                    {selectedPoliban.cp}
                  </div>
                )}

                {/* Status Badges Row */}
                {(m.kesenjangan || m.keputusan) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {m.kesenjangan && (
                      <Badge variant="outline" className={`text-[11px] ${getKesenanganColor(m.kesenjangan)}`}>
                        Kesenjangan: {m.kesenjangan}
                      </Badge>
                    )}
                    {m.keputusan && (
                      <Badge variant="outline" className="text-[11px] gap-1">
                        {getKeputusanIcon(m.keputusan)} {m.keputusan}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Catatan Asesor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Catatan Asesor
                  </label>
                  <Textarea
                    value={m.catatan}
                    onChange={(e) => updateMapping(mkAsal.kode, "catatan", e.target.value)}
                    placeholder="Tuliskan catatan pemetaan (opsional)..."
                    className="min-h-[60px] resize-y text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
