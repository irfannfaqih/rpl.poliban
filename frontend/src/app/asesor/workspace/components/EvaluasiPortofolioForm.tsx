import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { getPrivateFileObjectUrl, privateDocumentPath } from "@/lib/private-files";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// 10 Kategori dari F04 Section 3 "Evaluasi Kesesuaian Dokumen"
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
  statusDokumen: "ada" | "tidak_ada" | null;
  kesesuaian: "sesuai" | "tidak_sesuai" | null;
  rekomendasiAT2: string;
}

const defaultItem = (): EvalItem => ({
  statusDokumen: null,
  kesesuaian: null,
  rekomendasiAT2: "",
});

function mapFromDb(item: any): EvalItem {
  return {
    statusDokumen: item.status_dokumen ?? null,
    kesesuaian: item.kesesuaian ?? null,
    rekomendasiAT2: item.rekomendasi_at2 || "",
  };
}

export default function EvaluasiPortofolioForm({
  tugas,
  onLocalChange,
  onRegisterSave,
  onPreview,
}: {
  tugas: any;
  onLocalChange?: (count: number) => void;
  onRegisterSave?: (fn: () => Promise<void>) => void;
  onPreview?: (url: string, name: string) => void;
}) {
  const queryClient = useQueryClient();
  const isReadOnly = tugas?.status === "submit_final";
  const pendaftaran = tugas?.pendaftaran;

  const [evaluasi, setEvaluasi] = useState<Record<number, EvalItem>>(() => {
    const initial: Record<number, EvalItem> = {};
    (tugas?.evaluasi_portofolio || []).forEach((item: any) => {
      initial[item.kategori_no] = mapFromDb(item);
    });
    return initial;
  });

  // Sinkronisasi jika data tugas diperbarui di cache
  useEffect(() => {
    if (tugas?.evaluasi_portofolio?.length > 0) {
      const next: Record<number, EvalItem> = {};
      tugas.evaluasi_portofolio.forEach((item: any) => {
        next[item.kategori_no] = mapFromDb(item);
      });
      setEvaluasi(next);
    }
  }, [tugas]);

  // Laporan jumlah terisi ke parent (real-time)
  useEffect(() => {
    const count = KATEGORI_DOKUMEN.filter(
      (k) => evaluasi[k.no]?.statusDokumen !== null && evaluasi[k.no]?.statusDokumen !== undefined,
    ).length;
    onLocalChange?.(count);
  }, [evaluasi, onLocalChange]);

  // Daftarkan fungsi save ke parent agar bisa dipanggil saat submit final
  useEffect(() => {
    onRegisterSave?.(async () => {
      const items = buildPayload();
      if (!items.some((i) => i.status_dokumen !== null)) return;
      await api.post(`/asesor/tugas/${tugas.id}/evaluasi-portofolio`, { items });
    });
  }, [evaluasi, onRegisterSave, tugas.id]);

  const getItem = (no: number): EvalItem => evaluasi[no] ?? defaultItem();

  const buildPayload = () =>
    KATEGORI_DOKUMEN.map((kat) => {
      const val = getItem(kat.no);
      return {
        kategori_no: kat.no,
        status_dokumen: val.statusDokumen,
        kesesuaian: val.kesesuaian,
        rekomendasi_at2: val.rekomendasiAT2 || null,
      };
    });

  const handleStatusChange = (no: number, value: "ada" | "tidak_ada") => {
    if (isReadOnly) return;
    const current = getItem(no);
    const isToggleOff = current.statusDokumen === value;
    setEvaluasi((prev) => ({
      ...prev,
      [no]: {
        ...current,
        statusDokumen: isToggleOff ? null : value,
        // Reset kesesuaian & rekomendasi jika "Tidak Ada"
        ...(value === "tidak_ada" && !isToggleOff
          ? { kesesuaian: null, rekomendasiAT2: "" }
          : {}),
      },
    }));
  };

  const handleKesesuaianChange = (no: number, value: "sesuai" | "tidak_sesuai") => {
    if (isReadOnly) return;
    const current = getItem(no);
    setEvaluasi((prev) => ({
      ...prev,
      [no]: { ...current, kesesuaian: current.kesesuaian === value ? null : value },
    }));
  };

  const handleRekomendasiChange = (no: number, value: string) => {
    if (isReadOnly) return;
    setEvaluasi((prev) => ({ ...prev, [no]: { ...getItem(no), rekomendasiAT2: value } }));
  };

  // Mutation untuk simpan draft
  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = buildPayload();
      const { data } = await api.post(`/asesor/tugas/${tugas.id}/evaluasi-portofolio`, { items });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tugas-asesor", tugas.id.toString()] });
      toast.success("Evaluasi portofolio berhasil disimpan sebagai draft!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan evaluasi portofolio");
    },
  });

  return (
    <div className="space-y-8 pb-24">
      {isReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-300 flex items-center gap-3">
          <Lock className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">Penilaian Terkunci</p>
            <p className="text-xs mt-0.5">Tugas ini telah disubmit final. Anda tidak dapat mengubah data evaluasi portofolio.</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold">Evaluasi Kesesuaian Dokumen Portofolio</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Periksa ketersediaan dan kesesuaian setiap kategori dokumen terhadap Program Studi.
          Isi kolom <strong>Rekomendasi AT2</strong> jika dokumen memerlukan tindak lanjut asesmen tahap 2.
        </p>
      </div>



      {/* Dokumen Portofolio Terunggah */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-bold text-foreground">Dokumen Portofolio Pemohon</h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            {pendaftaran?.dokumen?.length || 0} File
          </span>
        </div>

        {pendaftaran?.dokumen && pendaftaran.dokumen.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendaftaran.dokumen.map((dok: any) => {
              const sizeInKb = dok.file_size ? `${(dok.file_size / 1024).toFixed(1)} KB` : 'N/A';

              return (
                <div
                  key={dok.id}
                  className="p-3 rounded-xl border bg-background flex flex-col justify-between hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${dok.tipe === 'ijazah' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' :
                      dok.tipe === 'transkrip' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
                        dok.tipe === 'sertifikat' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400' :
                          dok.tipe === 'portofolio' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' :
                            'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                      }`}>
                      {dok.tipe.substring(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {dok.file_name}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">
                        Tipe: {dok.tipe} {dok.deskripsi ? `• ${dok.deskripsi}` : ''} • {sizeInKb}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const url = await getPrivateFileObjectUrl(privateDocumentPath(dok.id));
                        onPreview?.(url, dok.file_name || "Dokumen");
                      } catch {
                        toast.error("Gagal membuka preview dokumen.");
                      }
                    }}
                    className="w-full py-1.5 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    Buka Dokumen
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-6 bg-muted/20 border border-dashed rounded-xl text-muted-foreground text-xs">
            Belum ada dokumen portofolio terunggah.
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {KATEGORI_DOKUMEN.map((kategori) => {
          const val = getItem(kategori.no);
          const isTidakAda = val.statusDokumen === "tidak_ada";
          const isAda = val.statusDokumen === "ada";

          return (
            <div
              key={kategori.no}
              className={`p-5 rounded-2xl border bg-card shadow-sm space-y-4 transition-all hover:border-primary/30 ${isTidakAda ? "opacity-60" :
                isAda && !val.kesesuaian && !isReadOnly ? "border-amber-300 dark:border-amber-700" : ""
                }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0">
                  {kategori.no}
                </span>
                <h3 className="font-bold text-sm md:text-base leading-relaxed pt-1">{kategori.label}</h3>
              </div>

              {/* Status + Kesesuaian - selalu tampil, kesesuaian disabled jika bukan "ada" */}
              <div className={`flex flex-wrap items-center gap-6 bg-muted/20 p-3 rounded-xl border border-dashed ${isReadOnly ? "opacity-50 pointer-events-none" : ""}`}>

                {/* Status Dokumen */}
                <div className="space-y-1 shrink-0">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Status Dokumen
                  </Label>
                  <div className="flex bg-background p-1 rounded-lg border shadow-sm">
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handleStatusChange(kategori.no, "ada")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${val.statusDokumen === "ada" ? "bg-green-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      Ada
                    </button>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handleStatusChange(kategori.no, "tidak_ada")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${val.statusDokumen === "tidak_ada" ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      Tidak Ada
                    </button>
                  </div>
                </div>

                {/* Kesesuaian - selalu tampil, disabled jika bukan "ada" */}
                <div className={`space-y-1 shrink-0 transition-opacity duration-200 ${!isAda ? "opacity-40 pointer-events-none" : ""}`}>
                  <Label className={`text-[10px] font-bold uppercase tracking-wider block ${isAda && !val.kesesuaian && !isReadOnly ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                    Kesesuaian {isAda && !val.kesesuaian && !isReadOnly && <span className="text-amber-500">*</span>}
                  </Label>
                  <div className="flex bg-background p-1 rounded-lg border shadow-sm">
                    <button
                      type="button"
                      disabled={isReadOnly || !isAda}
                      onClick={() => handleKesesuaianChange(kategori.no, "sesuai")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${val.kesesuaian === "sesuai" ? "bg-green-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      Sesuai
                    </button>
                    <button
                      type="button"
                      disabled={isReadOnly || !isAda}
                      onClick={() => handleKesesuaianChange(kategori.no, "tidak_sesuai")}
                      className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${val.kesesuaian === "tidak_sesuai" ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      Tidak Sesuai
                    </button>
                  </div>
                </div>
              </div>

              {/* Rekomendasi AT2 - selalu tampil, disabled jika bukan "ada" */}
              <div className={`transition-opacity duration-200 ${!isAda ? "opacity-40 pointer-events-none" : ""}`}>
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Rekomendasi AT2 (Opsional)
                </Label>
                <textarea
                  className="w-full min-h-[50px] p-3 text-sm rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Cth: Perlu C1 lisan untuk klarifikasi kompetensi terkait dokumen ini..."
                  value={val.rekomendasiAT2}
                  onChange={(e) => handleRekomendasiChange(kategori.no, e.target.value)}
                  disabled={isReadOnly || !isAda}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      {!isReadOnly ? (
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:text-primary-foreground flex items-center gap-2 rounded-xl h-11 px-6 text-sm font-semibold shadow-sm"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Menyimpan..." : "Simpan Draft Evaluasi"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 p-4 bg-muted border rounded-xl text-muted-foreground text-sm font-medium">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Evaluasi Portofolio Terkunci (Sudah Submit Final)
        </div>
      )}
    </div>
  );
}
