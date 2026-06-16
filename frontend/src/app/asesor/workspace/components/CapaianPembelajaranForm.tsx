import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { openPrivateFile, privateDocumentPath } from "@/lib/private-files";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Lock, Save, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const VATC_ITEMS = [
  { key: "valid" as const, label: "V", title: "Valid", desc: "Terdapat hubungan jelas antara bukti dan indikator CP" },
  { key: "autentik" as const, label: "A", title: "Autentik", desc: "Bukti dapat diverifikasi di tempat kerja pemohon" },
  { key: "terkini" as const, label: "T", title: "Terkini", desc: "Bukti mendemonstrasikan pengetahuan/keterampilan terkini" },
  { key: "cukup" as const, label: "C", title: "Cukup", desc: "Bukti cukup untuk menilai kinerja indikator pembelajaran" },
];

interface PenilaianItem {
  nilai: "diakui" | "belum_diakui" | "";
  catatan: string;
  valid: boolean | null;
  autentik: boolean | null;
  terkini: boolean | null;
  cukup: boolean | null;
}

const defaultPenilaian = (): PenilaianItem => ({
  nilai: "", catatan: "", valid: null, autentik: null, terkini: null, cukup: null,
});

export default function CapaianPembelajaranForm({ tugas, onLocalChange, onRegisterSave, onPreview }: { tugas: any; onLocalChange?: (count: number) => void; onRegisterSave?: (fn: () => Promise<void>) => void; onPreview?: (url: string, name: string) => void }) {
  const queryClient = useQueryClient();
  const isReadOnly = tugas?.status === 'submit_final';

  const [penilaian, setPenilaian] = useState<Record<number, PenilaianItem>>({});
  const mataKuliahList = tugas?.pendaftaran?.prodi?.mata_kuliah || [];

  // Sinkronisasi data awal dari database
  useEffect(() => {
    if (tugas?.penilaian_cpmk && tugas.penilaian_cpmk.length > 0) {
      const initial: Record<number, PenilaianItem> = {};
      tugas.penilaian_cpmk.forEach((item: any) => {
        initial[item.cpmk_id] = {
          nilai: item.nilai || "",
          catatan: item.catatan || "",
          valid: item.valid ?? null,
          autentik: item.autentik ?? null,
          terkini: item.terkini ?? null,
          cukup: item.cukup ?? null,
        };
      });
      setPenilaian(initial);
    }
  }, [tugas]);

  // Laporan jumlah terisi ke parent (real-time)
  useEffect(() => {
    const count = Object.values(penilaian).filter((p) => p.nilai !== "").length;
    onLocalChange?.(count);
  }, [penilaian, onLocalChange]);

  // Daftarkan fungsi save ke parent agar bisa dipanggil saat submit final
  useEffect(() => {
    onRegisterSave?.(async () => {
      const items = buildPayload();
      if (items.length === 0) return;
      await api.post(`/asesor/tugas/${tugas.id}/penilaian-cpmk`, { items });
    });
  }, [penilaian, onRegisterSave, tugas.id]);

  const getItem = (cpmkId: number): PenilaianItem =>
    penilaian[cpmkId] || defaultPenilaian();

  const buildPayload = () =>
    Object.entries(penilaian)
      .filter(([_, item]) => item.nilai !== "")
      .map(([cpmkId, item]) => ({
        cpmk_id: parseInt(cpmkId),
        nilai: item.nilai,
        catatan: item.catatan || null,
        valid: item.valid,
        autentik: item.autentik,
        terkini: item.terkini,
        cukup: item.cukup,
      }));

  const handleNilaiChange = (cpmkId: number, value: "diakui" | "belum_diakui") => {
    if (isReadOnly) return;
    setPenilaian((prev) => {
      const current = getItem(cpmkId);
      return { ...prev, [cpmkId]: { ...current, nilai: current.nilai === value ? "" : value } };
    });
  };

  const handleCatatanChange = (cpmkId: number, value: string) => {
    if (isReadOnly) return;
    setPenilaian((prev) => ({ ...prev, [cpmkId]: { ...getItem(cpmkId), catatan: value } }));
  };

  const setVatcValue = (cpmkId: number, key: "valid" | "autentik" | "terkini" | "cukup", value: boolean | null) => {
    if (isReadOnly) return;
    setPenilaian((prev) => ({
      ...prev,
      [cpmkId]: {
        ...getItem(cpmkId),
        [key]: value,
      },
    }));
  };

  // Hitung jumlah CPMK yang sudah dinilai
  const totalCpmkCount = mataKuliahList.reduce((acc: number, mk: any) => acc + (mk.cpmk?.length || 0), 0);
  const assessedCpmkCount = Object.values(penilaian).filter((p) => p.nilai !== "").length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = buildPayload();
      const { data } = await api.post(`/asesor/tugas/${tugas.id}/penilaian-cpmk`, { items });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tugas-asesor', tugas.id.toString()] });
      toast.success("Penilaian CPMK berhasil disimpan sebagai draft!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan penilaian CPMK");
    }
  });

  return (
    <div className="space-y-8 pb-24">
      {isReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-300 flex items-center gap-3">
          <Lock className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">Penilaian Terkunci</p>
            <p className="text-xs mt-0.5">Tugas ini telah disubmit final. Anda tidak dapat mengubah penilaian CPMK.</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold">Penilaian Capaian Pembelajaran (CPMK)</h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Tentukan status pencapaian untuk masing-masing Capaian Pembelajaran Mata Kuliah (CPMK) dari kurikulum program studi tujuan.
          Bandingkan hasil evaluasi mandiri pemohon untuk membantu keputusan penilaian Anda.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 bg-muted/30 border rounded-xl p-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Progres Penilaian CPMK</span>
            <span className="text-sm font-bold text-foreground">{assessedCpmkCount}/{totalCpmkCount} CPMK</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${totalCpmkCount === 0 ? 0 : (assessedCpmkCount / totalCpmkCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Keterangan Nilai dihapus sesuai Master Formulir */}

      {/* Mata Kuliah and CPMK List */}
      <div className="space-y-6">
        {mataKuliahList.length === 0 ? (
          <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl text-muted-foreground text-sm">
            Tidak ada data Mata Kuliah kurikulum untuk program studi ini.
          </div>
        ) : (
          mataKuliahList.map((mk: any) => (
            <div key={mk.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {/* MK Header */}
              <div className="bg-muted/20 border-b px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded font-mono text-xs font-bold">
                    {mk.kode}
                  </span>
                  <h3 className="font-bold text-sm md:text-base text-foreground mt-1.5">{mk.nama}</h3>
                  {mk.deskripsi && (
                    <p className="text-xs text-muted-foreground mt-1 leading-normal italic">{mk.deskripsi}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold bg-background border px-3 py-1 rounded-md text-foreground shadow-sm">
                    {mk.sks} SKS
                  </span>
                </div>
              </div>

              {/* CPMK List */}
              <div className="divide-y divide-border">
                {mk.cpmk && mk.cpmk.length > 0 ? (
                  mk.cpmk.map((cpmk: any) => {
                    const val = getItem(cpmk.id);
                    // Cari evaluasi mandiri pemohon untuk CPMK ini
                    const selfEval = tugas?.pendaftaran?.evaluasi_diri?.find((ed: any) => ed.cpmk_id === cpmk.id);
                    const selfProfisiensi = selfEval ? selfEval.profisiensi : null;

                    return (
                      <div key={cpmk.id} className="p-5 space-y-4 hover:bg-muted/5 transition-colors">
                        {/* CPMK Title, Description & Self Evaluation */}
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <span className="bg-blue-500/10 text-blue-600 dark:bg-blue-950 dark:text-blue-400 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                                {cpmk.kode}
                              </span>
                              <h4 className="font-bold text-sm leading-normal text-foreground">{cpmk.nama}</h4>
                              {cpmk.deskripsi && (
                                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{cpmk.deskripsi}</p>
                              )}
                            </div>

                            {/* Self Eval Badge */}
                            <div className="shrink-0 flex items-center">
                              {selfProfisiensi !== null ? (
                                <span className={`border text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${String(selfProfisiensi) === '5' ? "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20" :
                                  String(selfProfisiensi) === '4' ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20" :
                                    String(selfProfisiensi) === '2' ? "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20" :
                                      "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20"
                                  }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${String(selfProfisiensi) === '5' ? "bg-green-500" :
                                    String(selfProfisiensi) === '4' ? "bg-blue-500" :
                                      String(selfProfisiensi) === '2' ? "bg-amber-500" :
                                        "bg-red-500"
                                    }`} />
                                  Evaluasi Diri: {
                                    String(selfProfisiensi) === '5' ? '5 - Sangat Mampu' :
                                      String(selfProfisiensi) === '4' ? '4 - Mampu' :
                                        String(selfProfisiensi) === '2' ? '2 - Kurang Mampu' :
                                          '1 - Tidak Mampu'
                                  }
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 dark:bg-slate-900 text-[10px] font-medium px-2 py-0.5 rounded-full border border-dashed">
                                  Tidak Diklaim
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dokumen Pendukung */}
                          {selfEval?.dokumen_pendukung && selfEval.dokumen_pendukung.length > 0 && (
                            <div className="bg-muted/30 border border-dashed rounded-lg p-3">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                Dokumen Bukti yang Diklaim Pemohon
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {selfEval.dokumen_pendukung.map((docKey: string, i: number) => {
                                  const allDokumen = tugas?.pendaftaran?.dokumen || [];

                                  // Cari dokumen: coba match by ID numerik, lalu by tipe, lalu by nama file
                                  const matchedDoc = allDokumen.find((d: any) =>
                                    d.id.toString() === docKey ||
                                    d.tipe?.toLowerCase() === docKey.toLowerCase() ||
                                    d.file_name?.toLowerCase().includes(docKey.toLowerCase())
                                  );

                                  // Juga cari dokumen wajib by key (Ijazah, Transkrip, KTP, PasFoto)
                                  const wajibMap: Record<string, string> = {
                                    'ijazah': 'ijazah', 'Ijazah': 'ijazah',
                                    'transkrip': 'transkrip', 'Transkrip': 'transkrip',
                                    'ktp': 'ktp', 'KTP': 'ktp',
                                    'pasfoto': 'pas_foto', 'PasFoto': 'pas_foto',
                                  };
                                  const wajibTipe = wajibMap[docKey];
                                  const wajibDoc = wajibTipe
                                    ? allDokumen.find((d: any) => d.tipe?.toLowerCase() === wajibTipe)
                                    : null;

                                  const doc = matchedDoc || wajibDoc;

                                  if (doc) {
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() =>
                                          openPrivateFile(privateDocumentPath(doc.id))
                                        }
                                        className="inline-flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-md text-[10px] font-bold hover:border-primary hover:text-primary transition-colors shadow-sm"
                                      >
                                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                        {doc.file_name}
                                      </button>
                                    );
                                  }

                                  // Tidak ditemukan di database - tampilkan label dari key
                                  // Coba mapping nama yang lebih ramah
                                  const labelMap: Record<string, string> = {
                                    'Ijazah': 'Ijazah Terakhir',
                                    'Transkrip': 'Transkrip Nilai',
                                    'KTP': 'KTP',
                                    'PasFoto': 'Pas Foto',
                                  };
                                  const label = labelMap[docKey] || docKey;

                                  return (
                                    <span key={i} className="inline-flex items-center gap-1.5 bg-muted/50 border border-dashed px-2.5 py-1 rounded-md text-[10px] font-bold text-muted-foreground">
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Grading Controls */}
                        <div className="flex flex-col gap-4 bg-muted/10 p-3 rounded-lg border border-dashed">
                          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            {/* Rekomendasi */}
                            <div className="space-y-1 shrink-0">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Rekomendasi
                              </span>
                              <div className={`flex bg-background p-1 rounded-lg border shadow-sm ${isReadOnly ? "opacity-50 pointer-events-none" : ""}`}>
                                {(["diakui", "belum_diakui"] as const).map((score) => {
                                  const label = score === "diakui" ? "Diakui" : "Belum Diakui";
                                  const activeStyles = score === "diakui"
                                    ? "bg-green-500 text-white shadow-sm ring-2 ring-green-500/20"
                                    : "bg-red-500 text-white shadow-sm ring-2 ring-red-500/20";

                                  return (
                                    <button
                                      key={score}
                                      type="button"
                                      disabled={isReadOnly}
                                      onClick={() => handleNilaiChange(cpmk.id, score)}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${val.nilai === score
                                        ? activeStyles
                                        : "text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* VATC - evaluasi kualitas bukti dokumen pemohon */}
                            <div className="space-y-1 shrink-0">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Evaluasi Bukti (VATC)
                              </span>
                              <div className="flex gap-1.5">
                                {VATC_ITEMS.map((v) => {
                                  const state = val[v.key];
                                  return (
                                    <DropdownMenu key={v.key}>
                                      <DropdownMenuTrigger
                                        disabled={isReadOnly}
                                        title={v.desc}
                                        className={`w-9 h-9 rounded-lg border-2 font-mono font-bold text-xs transition-all active:scale-95 flex items-center justify-center outline-none duration-200 ${state === true ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" :
                                          state === false ? "bg-red-500 border-red-500 text-white shadow-sm" :
                                            "bg-background border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                                          }`}
                                      >
                                        {state === true ? <CheckCircle2 className="h-4 w-4 animate-in fade-in zoom-in duration-300" /> :
                                          state === false ? <XCircle className="h-4 w-4 animate-in fade-in zoom-in duration-300" /> :
                                            v.label}
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="center" className="w-48">
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                                          {v.title}
                                        </div>
                                        <DropdownMenuItem onClick={() => setVatcValue(cpmk.id, v.key, true)} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 cursor-pointer">
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          <span>Memenuhi</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setVatcValue(cpmk.id, v.key, false)} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                                          <XCircle className="mr-2 h-4 w-4" />
                                          <span>Tidak Memenuhi</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setVatcValue(cpmk.id, v.key, null)} className="text-muted-foreground cursor-pointer">
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          <span>Kosongkan</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Catatan per CPMK */}
                          <div className="w-full space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Catatan Khusus CPMK
                            </span>
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={val.catatan}
                              onChange={(e) => handleCatatanChange(cpmk.id, e.target.value)}
                              placeholder="Cth: Bukti pendukung sangat relevan..."
                              className="w-full h-10 px-3 text-xs rounded-lg border bg-background focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                    Belum ada kriteria CPMK didefinisikan untuk mata kuliah ini.
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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
            {saveMutation.isPending ? "Menyimpan..." : "Simpan Draft Penilaian CPMK"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 p-4 bg-muted border rounded-xl text-muted-foreground text-sm font-medium">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Penilaian CPMK Terkunci (Sudah Submit Final)
        </div>
      )}
    </div>
  );
}
