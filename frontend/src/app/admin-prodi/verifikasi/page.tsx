"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft,
  FileCheck,
  FileText,
  UserCheck,
  Save,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  AlertTriangle,
  RotateCcw,
  Send,
  FileBadge,
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockAsesors = [
  { id: "A1", nama: "Ir. H. Budi Santoso, M.Kom." },
  { id: "A2", nama: "Dr. Eng. Siti Aminah, M.T." },
  { id: "A3", nama: "Agus Riyadi, S.Kom., M.Cs." },
  { id: "A4", nama: "Dian Puspita, S.T., M.Kom." },
];

// Daftar dokumen sesuai Master Formulir
const DAFTAR_DOKUMEN = [
  { id: "form01", label: "Aplikasi RPL", desc: "Data Diri, Pendidikan, Pengalaman Kerja, Dokumen Pendukung", required: true },
  { id: "form02", label: "Asesmen Mandiri & Evaluasi Diri", desc: "Matriks penilaian diri terhadap Capaian Pembelajaran MK", required: true },
  { id: "form16", label: "Daftar Riwayat Hidup", desc: "Riwayat Pendidikan, Pelatihan Profesional, Penghargaan, Organisasi", required: true },
  { id: "ijazah", label: "Ijazah / Transkrip Akademik Asal", desc: "Scan ijazah dan transkrip dari PT asal", required: true },
  { id: "sertifikat", label: "Sertifikat Kompetensi", desc: "Sertifikat asosiasi nasional/internasional (jika ada)", required: false },
  { id: "portofolio", label: "Dokumen Portofolio Pendukung", desc: "Resume pekerjaan, hasil kerja, laporan, SOP, rekomendasi atasan", required: false },
];

type ValidationStatus = "valid" | "invalid" | null;

interface DocValidation {
  status: ValidationStatus;
  catatan: string;
}

export default function VerifikasiBerkasPage() {
  const [validations, setValidations] = useState<Record<string, DocValidation>>({});
  const [asesor1, setAsesor1] = useState("");
  const [asesor2, setAsesor2] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [tempat, setTempat] = useState("");
  const [praPemetaan, setPraPemetaan] = useState("");

  const getValidation = (id: string): DocValidation =>
    validations[id] || { status: null, catatan: "" };

  const setDocStatus = (id: string, status: ValidationStatus) => {
    setValidations(prev => ({
      ...prev,
      [id]: { ...getValidation(id), status: status === getValidation(id).status ? null : status },
    }));
  };

  const setDocCatatan = (id: string, catatan: string) => {
    setValidations(prev => ({
      ...prev,
      [id]: { ...getValidation(id), catatan },
    }));
  };

  const requiredDocs = DAFTAR_DOKUMEN.filter(d => d.required);
  const allRequiredValidated = requiredDocs.every(d => getValidation(d.id).status === "valid");
  const hasInvalidDoc = DAFTAR_DOKUMEN.some(d => getValidation(d.id).status === "invalid");
  const validatedCount = DAFTAR_DOKUMEN.filter(d => getValidation(d.id).status !== null).length;

  const canAssignAsesor = allRequiredValidated && !hasInvalidDoc;
  const asesorSelected = asesor1 && asesor2 && asesor1 !== asesor2;
  const isFormComplete = canAssignAsesor && asesorSelected && tanggal && waktu && tempat;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin-prodi/dashboard">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Ahmad Fauzi</h1>
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                Verifikasi Berkas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              RPL-2024-001 • Teknik Informatika (D3) • Universitas Terbuka
            </p>
          </div>
        </div>
        <Button disabled={!isFormComplete} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700">
          <Send className="h-4 w-4" />
          Verifikasi & Tugaskan
        </Button>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* LEFT COLUMN: Daftar Validasi Dokumen (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              <h2 className="font-bold text-foreground text-base">Validasi Kelengkapan Dokumen</h2>
            </div>
            <Badge variant="outline" className="text-xs">{validatedCount}/{DAFTAR_DOKUMEN.length} Diperiksa</Badge>
          </div>

          {/* Progress */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(validatedCount / DAFTAR_DOKUMEN.length) * 100}%` }}
            />
          </div>

          {/* Document Cards */}
          <div className="space-y-3">
            {DAFTAR_DOKUMEN.map((doc) => {
              const v = getValidation(doc.id);
              const isValid = v.status === "valid";
              const isInvalid = v.status === "invalid";

              return (
                <div
                  key={doc.id}
                  className={`border rounded-xl p-4 transition-all ${
                    isValid
                      ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/10"
                      : isInvalid
                      ? "border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${
                      isValid
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                        : isInvalid
                        ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isValid ? <CheckCircle2 className="h-5 w-5" /> : isInvalid ? <XCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground">{doc.label}</span>
                        {doc.required ? (
                          <Badge variant="outline" className="text-[10px] border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">Wajib</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Opsional</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.desc}</p>

                      {/* Catatan (shown when invalid) */}
                      {isInvalid && (
                        <div className="mt-3">
                          <Textarea
                            value={v.catatan}
                            onChange={(e) => setDocCatatan(doc.id, e.target.value)}
                            placeholder="Tuliskan alasan dokumen tidak valid (misal: scan buram, file salah, TTD kurang)..."
                            className="min-h-[60px] resize-y text-xs bg-background"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        onClick={() => window.open("#", "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Buka
                      </Button>
                      <Button
                        variant={isValid ? "default" : "outline"}
                        size="sm"
                        className={`h-8 text-xs w-20 ${isValid ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
                        onClick={() => setDocStatus(doc.id, "valid")}
                      >
                        Valid
                      </Button>
                      <Button
                        variant={isInvalid ? "destructive" : "outline"}
                        size="sm"
                        className="h-8 text-xs w-24"
                        onClick={() => setDocStatus(doc.id, "invalid")}
                      >
                        Tidak Valid
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Return to Pemohon (only if invalid doc) */}
          {hasInvalidDoc && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex gap-4 items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-bold text-red-900 dark:text-red-300">Ada Dokumen Tidak Valid</h3>
                <p className="text-xs text-red-800 dark:text-red-400/90 leading-relaxed">
                  Penugasan Asesor tidak dapat dilakukan jika masih ada dokumen yang ditandai tidak valid. 
                  Kembalikan form ke Pemohon agar mereka dapat memperbaiki dokumen yang bermasalah.
                </p>
                <Button variant="destructive" size="sm" className="gap-2 mt-1">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Kembalikan ke Pemohon (Buka Gembok)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Penugasan Asesor + Pra-Pemetaan (2/5) */}
        <div className={`lg:col-span-2 space-y-6 ${!canAssignAsesor ? "opacity-50 pointer-events-none" : ""}`}>
          
          {!canAssignAsesor && (
            <div className="bg-muted/30 border border-dashed rounded-xl p-4 flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Validasi seluruh dokumen wajib terlebih dahulu sebelum menugaskan Asesor.
              </p>
            </div>
          )}

          {/* Section: Penugasan Asesor */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <UserCheck className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              <h2 className="font-bold text-foreground text-base">Penugasan Asesor</h2>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asesor 1</Label>
                <Select value={asesor1} onValueChange={setAsesor1}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Pilih Asesor 1" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAsesors.map(a => (
                      <SelectItem 
                        key={`a1-${a.id}`} 
                        value={a.id}
                        disabled={asesor2 === a.id}
                      >
                        {a.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asesor 2</Label>
                <Select value={asesor2} onValueChange={setAsesor2}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Pilih Asesor 2" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAsesors.map(a => (
                      <SelectItem 
                        key={`a2-${a.id}`} 
                        value={a.id}
                        disabled={asesor1 === a.id}
                      >
                        {a.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {asesor1 && asesor2 && asesor1 === asesor2 && (
                <p className="text-xs text-red-600 font-medium">Asesor 1 dan Asesor 2 tidak boleh orang yang sama.</p>
              )}
            </div>
          </section>

          {/* Section: Jadwal Asesmen */}
          <section className={`space-y-4 ${!asesorSelected ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 border-b pb-2">
              <CalendarDays className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              <h2 className="font-bold text-foreground text-base">Jadwal Asesmen</h2>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="pl-10 bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Waktu</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={waktu} onChange={(e) => setWaktu(e.target.value)} placeholder="09:00 - 12:00 WITA" className="pl-10 bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempat</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea value={tempat} onChange={(e) => setTempat(e.target.value)} placeholder="Ruang Rapat Prodi TI, Gedung A Lt.2" className="pl-10 min-h-[60px] resize-y bg-background" />
                </div>
              </div>
            </div>
          </section>

          {/* Section: Pra-Pemetaan Opsional */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <h2 className="font-bold text-foreground text-base">Pra-Pemetaan MK Asal</h2>
              </div>
              <Badge variant="secondary" className="font-normal text-[10px]">Opsional</Badge>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda dapat memberikan catatan atau usulan pemetaan dari MK Transkrip Asal ke MK POLIBAN sebagai saran bagi Asesor.
              </p>
              <Textarea 
                value={praPemetaan}
                onChange={(e) => setPraPemetaan(e.target.value)}
                placeholder="Contoh: MK Algoritma 1 (PT Asal) bisa disetarakan dengan TI101 (Poliban)."
                className="min-h-[120px] resize-y"
              />
            </div>
            
            <div className="pt-2">
              <Button variant="outline" className="w-full gap-2">
                <Save className="h-4 w-4" />
                Simpan Draf Pra-Pemetaan
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
