"use client";

import { useState } from "react";
import {
  PenLine,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Mock data — soal dari asesor
const MOCK_UJIAN = [
  {
    id: "UJN-001",
    mkNama: "Pemrograman Web Lanjut",
    mkKode: "MK02",
    asesor: "Dr. Asesor Satu, M.Kom",
    tanggal: "2026-05-25",
    waktu: "09:00 - 10:30 WITA",
    status: "Belum Dikerjakan" as const, // Belum Dikerjakan | Sedang Dikerjakan | Sudah Dikirim
    soalList: [
      {
        no: 1,
        pertanyaan:
          "Jelaskan perbedaan antara Client-Side Rendering (CSR) dan Server-Side Rendering (SSR) dalam React. Berikan contoh kasus penggunaan masing-masing.",
      },
      {
        no: 2,
        pertanyaan:
          "Apa yang dimaksud dengan RESTful API? Jelaskan prinsip-prinsip utamanya dan berikan contoh endpoint untuk CRUD operasi pada entitas 'Mahasiswa'.",
      },
      {
        no: 3,
        pertanyaan:
          "Jelaskan konsep middleware dalam Express.js. Bagaimana cara membuat middleware autentikasi JWT?",
      },
    ],
  },
  {
    id: "UJN-002",
    mkNama: "Basis Data Dasar",
    mkKode: "MK03",
    asesor: "Dr. Asesor Dua, M.T",
    tanggal: "2026-05-28",
    waktu: "13:00 - 14:30 WITA",
    status: "Belum Dikerjakan" as const,
    soalList: [
      {
        no: 1,
        pertanyaan: "Sebutkan dan jelaskan 3 jenis anomali pada database beserta contohnya.",
      },
    ],
  },
];

type UjianStatus = "Belum Dikerjakan" | "Sedang Dikerjakan" | "Sudah Dikirim";

export default function UjianTulisPage() {
  const [ujianList] = useState(MOCK_UJIAN);
  const [jawaban, setJawaban] = useState<Record<string, Record<number, string>>>({});
  const [ujianStatus, setUjianStatus] = useState<Record<string, UjianStatus>>({});

  // Global lock state untuk seluruh sesi ujian tertulis
  const isSesiUjianTerkunci = true;

  const getJawaban = (ujianId: string, soalNo: number): string =>
    jawaban[ujianId]?.[soalNo] || "";

  const setJawabanSoal = (ujianId: string, soalNo: number, value: string) => {
    setJawaban((prev) => ({
      ...prev,
      [ujianId]: { ...(prev[ujianId] || {}), [soalNo]: value },
    }));
    if (!ujianStatus[ujianId] || ujianStatus[ujianId] === "Belum Dikerjakan") {
      setUjianStatus((prev) => ({ ...prev, [ujianId]: "Sedang Dikerjakan" }));
    }
  };

  const handleSubmit = (ujianId: string) => {
    const ujian = ujianList.find((u) => u.id === ujianId);
    if (!ujian) return;

    const jawabanUjian = jawaban[ujianId] || {};
    const belumDijawab = ujian.soalList.filter(
      (s) => !jawabanUjian[s.no] || jawabanUjian[s.no].trim() === ""
    );

    if (belumDijawab.length > 0) {
      alert(
        `Masih ada ${belumDijawab.length} soal yang belum dijawab. Silakan lengkapi terlebih dahulu.`
      );
      return;
    }

    if (
      confirm(
        "Apakah Anda yakin ingin mengirim jawaban? Jawaban yang sudah dikirim TIDAK DAPAT diubah."
      )
    ) {
      setUjianStatus((prev) => ({ ...prev, [ujianId]: "Sudah Dikirim" }));
    }
  };

  const getStatus = (ujianId: string): UjianStatus => ujianStatus[ujianId] || "Belum Dikerjakan";

  const hasUjian = ujianList.length > 0;

  if (isSesiUjianTerkunci) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Ujian Tulis
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Sesi asesmen tulisan belum dapat diakses pada saat ini.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border bg-card/50">
          <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Sesi Ujian Masih Terkunci</h2>
          <p className="text-xs text-muted-foreground max-w-lg">
            Asesor belum membuka akses untuk ujian tertulis Anda. Asesmen tertulis untuk semua mata kuliah biasanya dilakukan secara serentak. Silakan tunggu instruksi dari Asesor atau Admin Prodi Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Ujian Tulis
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Jawab soal ujian tulis yang diberikan oleh Asesor RPL untuk mata
          kuliah yang memerlukan uji lanjutan.
        </p>
      </div>

      {!hasUjian ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Belum Ada Ujian Tulis</h2>
          <p className="text-muted-foreground max-w-sm text-sm mt-2">
            Asesor belum memberikan soal ujian tulis untuk Anda. Silakan cek
            kembali nanti atau hubungi Admin Prodi.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {ujianList.map((ujian) => {
            const status = getStatus(ujian.id);
            const isSudahDikirim = status === "Sudah Dikirim";

            return (
              <div
                key={ujian.id}
                className="rounded-2xl border bg-card shadow-sm overflow-hidden transition-all"
              >
                {/* Ujian Header */}
                <div className="p-6 border-b bg-muted/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono text-xs font-bold">
                          {ujian.mkKode}
                        </span>
                        <h2 className="text-lg font-bold">{ujian.mkNama}</h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {ujian.tanggal} · {ujian.waktu}
                        </span>
                        <span>Asesor: {ujian.asesor}</span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                        status === "Sudah Dikirim"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : status === "Sedang Dikerjakan"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {status === "Sudah Dikirim" && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {status === "Sedang Dikerjakan" && <AlertCircle className="h-3.5 w-3.5" />}
                      {status}
                    </span>
                  </div>
                </div>

                {/* Instruksi */}
                    <div className="px-6 pt-5">
                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                        <strong>Instruksi:</strong> Jawablah setiap pertanyaan di
                        bawah ini dengan singkat dan jelas. Setiap pertanyaan
                        mengacu kepada indikator kinerja dan Capaian Pembelajaran
                        Program Studi. Jawaban yang sudah dikirim tidak dapat
                        diubah.
                      </div>
                    </div>

                    {/* Soal-soal */}
                    <div className="p-6 space-y-5">
                      {ujian.soalList.map((soal) => (
                        <div
                          key={soal.no}
                          className="p-5 rounded-xl border bg-background space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0">
                              {soal.no}
                            </span>
                            <p className="text-sm font-medium text-foreground leading-relaxed pt-1">
                              {soal.pertanyaan}
                            </p>
                          </div>

                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                              Jawaban Anda
                            </Label>
                            <textarea
                              className={`w-full min-h-[120px] p-4 text-sm rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                                isSudahDikirim
                                  ? "bg-muted/50 cursor-not-allowed opacity-70"
                                  : "bg-background"
                              }`}
                              placeholder="Tuliskan jawaban Anda di sini..."
                              value={getJawaban(ujian.id, soal.no)}
                              onChange={(e) =>
                                setJawabanSoal(ujian.id, soal.no, e.target.value)
                              }
                              disabled={isSudahDikirim}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Submit Button */}
                      {!isSudahDikirim && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <p className="text-xs text-muted-foreground">
                            Pastikan semua soal sudah dijawab sebelum mengirim.
                          </p>
                          <Button
                            className="gap-2"
                            onClick={() => handleSubmit(ujian.id)}
                          >
                            <Send className="h-4 w-4" />
                            Kirim Jawaban
                          </Button>
                        </div>
                      )}

                      {isSudahDikirim && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-green-700 dark:text-green-400">
                              Jawaban Berhasil Dikirim
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                              Jawaban Anda sedang dalam proses penilaian oleh
                              Asesor. Silakan cek halaman Hasil & Sanggah untuk
                              melihat hasilnya nanti.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
