import { useState } from "react";
import { Label } from "@/components/ui/label";

// 10 Kategori PERSIS dari Form 04 Section 3 "Evaluasi Kesesuaian Dokumen"
const KATEGORI_DOKUMEN = [
  { no: 1, label: "Informasi Posisi di Tempat Kerja dengan Kompetensi Prodi" },
  { no: 2, label: "Bukti pendidikan jenjang sebelumnya" },
  { no: 3, label: "Pelatihan yang relevan" },
  { no: 4, label: "Uraian tugas (Job Description)" },
  { no: 5, label: "Standar Operasi Prosedur (SOP)" },
  { no: 6, label: "Hasil pekerjaan" },
  { no: 7, label: "Pengalaman kerja" },
  { no: 8, label: "Laporan pekerjaan" },
  { no: 9, label: "Hasil penilaian atasan" },
  { no: 10, label: "Lainnya" },
];

interface EvalItem {
  statusDokumen: "Ada" | "Tidak Ada" | null;
  kesesuaian: "Sesuai" | "Tidak Sesuai" | null;
  rekomendasiAT2: string;
}

export default function EvaluasiPortofolioForm({ pemohonId }: { pemohonId: string }) {
  const [evaluasi, setEvaluasi] = useState<Record<number, EvalItem>>({});

  const getItem = (no: number): EvalItem =>
    evaluasi[no] || { statusDokumen: null, kesesuaian: null, rekomendasiAT2: "" };

  const handleStatusChange = (no: number, value: "Ada" | "Tidak Ada") => {
    setEvaluasi((prev) => {
      const current = getItem(no);
      const isToggleOff = current.statusDokumen === value;
      return {
        ...prev,
        [no]: {
          ...current,
          statusDokumen: isToggleOff ? null : value,
          // Reset kesesuaian jika "Tidak Ada"
          kesesuaian: value === "Tidak Ada" ? null : current.kesesuaian,
        },
      };
    });
  };

  const handleKesesuaianChange = (no: number, value: "Sesuai" | "Tidak Sesuai") => {
    setEvaluasi((prev) => {
      const current = getItem(no);
      const isToggleOff = current.kesesuaian === value;
      return {
        ...prev,
        [no]: { ...current, kesesuaian: isToggleOff ? null : value },
      };
    });
  };

  const handleNoteChange = (no: number, value: string) => {
    setEvaluasi((prev) => {
      const current = getItem(no);
      return { ...prev, [no]: { ...current, rekomendasiAT2: value } };
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-xl font-bold">Evaluasi Kesesuaian Dokumen Portofolio</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Periksa ketersediaan dan kesesuaian setiap kategori dokumen terhadap Program Studi.
          Tentukan <strong>Status Dokumen</strong> (Ada / Tidak Ada), <strong>Kesesuaian</strong> (Sesuai / Tidak Sesuai),
          dan berikan <strong>Rekomendasi AT2</strong> (Asesmen Tahap 2) jika diperlukan.
        </p>
      </div>

      {/* Keterangan */}
      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300 space-y-1">
        <p><strong>Keterangan:</strong></p>
        <p>• AT2 = Asesmen Tahap ke-2 (pemohon wajib hadir, dilakukan oleh asesor RPL)</p>
        <p>• Jika hasil asesmen menyatakan berkas <strong>tidak valid</strong>, pemohon <strong>tidak direkomendasikan</strong> melanjutkan proses RPL.</p>
      </div>

      {/* Table-like Cards */}
      <div className="space-y-4">
        {KATEGORI_DOKUMEN.map((kategori) => {
          const val = getItem(kategori.no);
          const isTidakAda = val.statusDokumen === "Tidak Ada";

          return (
            <div
              key={kategori.no}
              className={`p-5 rounded-2xl border bg-card shadow-sm space-y-4 transition-all hover:border-primary/30 ${
                isTidakAda ? "opacity-60" : ""
              }`}
            >
              {/* Header Title */}
              <div className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0">
                  {kategori.no}
                </span>
                <h3 className="font-bold text-sm md:text-base leading-relaxed pt-1">{kategori.label}</h3>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-3 rounded-xl border border-dashed">
                {/* Status Dokumen */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Status Dokumen
                  </Label>
                  <div className="flex bg-background p-1 rounded-lg border shadow-sm">
                    <button
                      onClick={() => handleStatusChange(kategori.no, "Ada")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                        val.statusDokumen === "Ada"
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Ada
                    </button>
                    <button
                      onClick={() => handleStatusChange(kategori.no, "Tidak Ada")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                        val.statusDokumen === "Tidak Ada"
                          ? "bg-red-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Tidak Ada
                    </button>
                  </div>
                </div>

                {/* Kesesuaian */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Kesesuaian
                  </Label>
                  <div className={`flex bg-background p-1 rounded-lg border shadow-sm ${isTidakAda ? "opacity-40 pointer-events-none" : ""}`}>
                    <button
                      onClick={() => handleKesesuaianChange(kategori.no, "Sesuai")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                        val.kesesuaian === "Sesuai"
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Sesuai
                    </button>
                    <button
                      onClick={() => handleKesesuaianChange(kategori.no, "Tidak Sesuai")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                        val.kesesuaian === "Tidak Sesuai"
                          ? "bg-red-500 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Tidak Sesuai
                    </button>
                  </div>
                </div>
              </div>

              {/* Rekomendasi AT2 */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Rekomendasi AT2 (Asesmen Tahap 2)
                </Label>
                <textarea
                  className={`w-full min-h-[50px] p-3 text-sm rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                    isTidakAda ? "bg-muted/50 cursor-not-allowed" : "bg-background"
                  }`}
                  placeholder={
                    isTidakAda
                      ? "Dokumen tidak ada — tidak perlu rekomendasi"
                      : "Cth: Perlu klarifikasi lisan terkait relevansi dokumen ini..."
                  }
                  value={val.rekomendasiAT2}
                  onChange={(e) => handleNoteChange(kategori.no, e.target.value)}
                  disabled={isTidakAda}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
