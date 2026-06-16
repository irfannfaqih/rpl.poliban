"use client";

import { SearchableSelect } from "@/components/SearchableSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Lock, Save, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Kesenjangan = "sesuai" | "sebagian_sesuai" | "tidak_sesuai" | "";
type Keputusan = "diakui_penuh" | "diakui_sebagian" | "tidak_diakui" | "";

interface Mapping {
  mkPolibanId: number | "";
  kesenjangan: Kesenjangan;
  keputusan: Keputusan;
  catatan: string;
}

// Label dan warna untuk display
const KESENJANGAN_LABELS: Record<string, string> = {
  sesuai: "Sesuai",
  sebagian_sesuai: "Sebagian Sesuai",
  tidak_sesuai: "Tidak Sesuai",
};

const KEPUTUSAN_LABELS: Record<string, string> = {
  diakui_penuh: "Diakui Penuh",
  diakui_sebagian: "Diakui Sebagian",
  tidak_diakui: "Tidak Diakui",
};

export default function PemetaanMKForm({ tugas, onLocalChange, onRegisterSave }: { tugas: any; onLocalChange?: (count: number) => void; onRegisterSave?: (fn: () => Promise<void>) => void }) {
  const queryClient = useQueryClient();
  const isReadOnly = tugas?.status === "submit_final";

  const [mappings, setMappings] = useState<Record<string, Mapping>>({});

  // Data riil dari database
  const mkAsalList = tugas?.pendaftaran?.transkrip_asal || [];
  const mkPolibanList = tugas?.pendaftaran?.prodi?.mata_kuliah || [];

  // Sinkronisasi data awal dari database
  useEffect(() => {
    if (tugas?.pemetaan_mk && tugas.pemetaan_mk.length > 0) {
      const initial: Record<string, Mapping> = {};
      tugas.pemetaan_mk.forEach((item: any) => {
        // Key berdasarkan mk_asal_kode untuk mencocokkan
        const matchingAsal = mkAsalList.find(
          (mk: any) => mk.kode_mk === item.mk_asal_kode || mk.id.toString() === item.mk_asal_kode
        );
        const key = matchingAsal ? matchingAsal.id.toString() : item.mk_asal_kode;
        initial[key] = {
          mkPolibanId: item.mk_poliban_id || "",
          kesenjangan: item.kesenjangan || "",
          keputusan: item.keputusan || "",
          catatan: item.catatan || "",
        };
      });
      setMappings(initial);
    }
  }, [tugas, mkAsalList]);

  // Laporan jumlah terisi ke parent (real-time)
  useEffect(() => {
    const count = mkAsalList.filter((mk: any) => {
      const m = mappings[mk.id.toString()] || { mkPolibanId: "", kesenjangan: "", keputusan: "" };
      return m.mkPolibanId && m.kesenjangan && m.keputusan;
    }).length;
    onLocalChange?.(count);
  }, [mappings, mkAsalList, onLocalChange]);

  // Daftarkan fungsi save ke parent agar bisa dipanggil saat submit final
  useEffect(() => {
    onRegisterSave?.(async () => {
      const items = mkAsalList
        .filter((mk: any) => {
          const m = mappings[mk.id.toString()] || { mkPolibanId: "" };
          return m.mkPolibanId;
        })
        .map((mk: any) => {
          const m = mappings[mk.id.toString()] || { mkPolibanId: "", kesenjangan: "", keputusan: "", catatan: "" };
          return {
            mk_asal_kode: mk.kode_mk || mk.id.toString(),
            mk_asal_nama: mk.nama_mk,
            mk_poliban_id: m.mkPolibanId,
            kesenjangan: m.kesenjangan || null,
            keputusan: m.keputusan || null,
            catatan: m.catatan || null,
          };
        });
      if (items.length === 0) return;
      await api.post(`/asesor/tugas/${tugas.id}/pemetaan-mk`, { items });
    });
  }, [mappings, mkAsalList, onRegisterSave, tugas.id]);

  const getMapping = (key: string): Mapping =>
    mappings[key] || { mkPolibanId: "", kesenjangan: "", keputusan: "", catatan: "" };

  const updateMapping = (key: string, field: keyof Mapping, value: string | number) => {
    if (isReadOnly) return;
    setMappings((prev) => ({
      ...prev,
      [key]: { ...getMapping(key), [field]: value },
    }));
  };

  const completedCount = mkAsalList.filter((mk: any) => {
    const m = getMapping(mk.id.toString());
    return m.mkPolibanId && m.kesenjangan && m.keputusan;
  }).length;

  const getKesenjanganColor = (k: Kesenjangan) => {
    if (k === "sesuai") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    if (k === "sebagian_sesuai") return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    if (k === "tidak_sesuai") return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800";
    return "";
  };

  const getKeputusanIcon = (k: Keputusan) => {
    if (k === "diakui_penuh") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    if (k === "diakui_sebagian") return <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
    if (k === "tidak_diakui") return <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
    return null;
  };

  // Mutation simpan draft
  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = mkAsalList
        .filter((mk: any) => {
          const m = getMapping(mk.id.toString());
          return m.mkPolibanId; // Minimal harus ada MK Poliban terpilih
        })
        .map((mk: any) => {
          const m = getMapping(mk.id.toString());
          return {
            mk_asal_kode: mk.kode_mk || mk.id.toString(),
            mk_asal_nama: mk.nama_mk,
            mk_poliban_id: m.mkPolibanId,
            kesenjangan: m.kesenjangan || null,
            keputusan: m.keputusan || null,
            catatan: m.catatan || null,
          };
        });

      const { data } = await api.post(`/asesor/tugas/${tugas.id}/pemetaan-mk`, { items });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tugas-asesor", tugas.id.toString()] });
      toast.success("Pemetaan MK berhasil disimpan sebagai draft!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan pemetaan MK");
    },
  });

  return (
    <div className="space-y-8 pb-24">
      {isReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-sm text-amber-800 dark:text-amber-300 flex items-center gap-3">
          <Lock className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">Penilaian Terkunci</p>
            <p className="text-xs mt-0.5">Tugas ini telah disubmit final. Anda tidak dapat mengubah pemetaan mata kuliah.</p>
          </div>
        </div>
      )}

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
            <span className="text-sm font-bold text-foreground">{completedCount}/{mkAsalList.length}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${mkAsalList.length === 0 ? 0 : (completedCount / mkAsalList.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mapping Cards */}
      <div className="space-y-6">
        {mkAsalList.length === 0 ? (
          <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl text-muted-foreground text-sm">
            Tidak ada data transkrip MK Asal dari pemohon.
          </div>
        ) : (
          mkAsalList.map((mkAsal: any, idx: number) => {
            const m = getMapping(mkAsal.id.toString());
            const selectedPoliban = mkPolibanList.find((p: any) => p.id === m.mkPolibanId || p.id === Number(m.mkPolibanId));
            const isComplete = m.mkPolibanId && m.kesenjangan && m.keputusan;

            return (
              <div
                key={mkAsal.id}
                className={`border rounded-xl overflow-hidden transition-all ${isComplete
                  ? "border-emerald-200 dark:border-emerald-800/50"
                  : "border-border"
                  }`}
              >
                {/* Card Header */}
                <div className={`px-5 py-3 flex items-center justify-between ${isComplete
                  ? "bg-emerald-50 dark:bg-emerald-900/20"
                  : "bg-muted/30"
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-sm text-foreground">{mkAsal.nama_mk}</span>
                      <span className="text-xs text-muted-foreground ml-2">({mkAsal.sks} SKS, Nilai: {mkAsal.nilai_huruf})</span>
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
                  {/* Info MK Asal */}
                  <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed">
                    <span className="font-bold text-foreground block mb-1">Informasi MK Asal:</span>
                    Semester {mkAsal.semester} - {mkAsal.sks} SKS (Nilai: {mkAsal.nilai_huruf})
                  </div>

                  {/* Mapping Row */}
                  <div className={`flex flex-col space-y-4 ${isReadOnly ? "opacity-60 pointer-events-none" : ""}`}>
                    {/* MK Poliban Dropdown */}
                    <div className="w-full space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        MK Poliban Setara
                      </label>
                      <SearchableSelect
                        options={mkPolibanList.map((p: any) => ({
                          value: p.id.toString(),
                          label: `${p.kode} - ${p.nama}`,
                          sublabel: `${p.sks} SKS`,
                        }))}
                        value={m.mkPolibanId ? m.mkPolibanId.toString() : ""}
                        onChange={(val) => updateMapping(mkAsal.id.toString(), "mkPolibanId", parseInt(val || "0"))}
                        placeholder="Pilih MK Poliban..."
                        searchPlaceholder="Cari kode atau nama mata kuliah..."
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Kesenjangan & Keputusan (2 Columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kesenjangan */}
                      <div className="w-full space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Kesenjangan
                        </label>
                        <Select
                          value={m.kesenjangan}
                          onValueChange={(val) => updateMapping(mkAsal.id.toString(), "kesenjangan", val || "")}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="bg-background w-full">
                            <SelectValue placeholder="Pilih tingkat kesenjangan...">
                              {m.kesenjangan ? KESENJANGAN_LABELS[m.kesenjangan] : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sesuai">Sesuai</SelectItem>
                            <SelectItem value="sebagian_sesuai">Sebagian Sesuai</SelectItem>
                            <SelectItem value="tidak_sesuai">Tidak Sesuai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Keputusan */}
                      <div className="w-full space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Hasil Keputusan
                        </label>
                        <Select
                          value={m.keputusan}
                          onValueChange={(val) => updateMapping(mkAsal.id.toString(), "keputusan", val || "")}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="bg-background w-full">
                            <SelectValue placeholder="Pilih hasil...">
                              {m.keputusan ? KEPUTUSAN_LABELS[m.keputusan] : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diakui_penuh">Diakui Penuh</SelectItem>
                            <SelectItem value="diakui_sebagian">Diakui Sebagian</SelectItem>
                            <SelectItem value="tidak_diakui">Tidak Diakui</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* MK Poliban Description */}
                  {selectedPoliban && (
                    <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800/50">
                      <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">
                        Deskripsi MK Poliban ({selectedPoliban.kode}):
                      </span>
                      {selectedPoliban.deskripsi || "Tidak ada deskripsi"}
                    </div>
                  )}

                  {/* Status Badges */}
                  {(m.kesenjangan || m.keputusan) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {m.kesenjangan && (
                        <Badge variant="outline" className={`text-[11px] ${getKesenjanganColor(m.kesenjangan)}`}>
                          Kesenjangan: {KESENJANGAN_LABELS[m.kesenjangan]}
                        </Badge>
                      )}
                      {m.keputusan && (
                        <Badge variant="outline" className="text-[11px] gap-1">
                          {getKeputusanIcon(m.keputusan)} {KEPUTUSAN_LABELS[m.keputusan]}
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
                      onChange={(e) => updateMapping(mkAsal.id.toString(), "catatan", e.target.value)}
                      placeholder="Tuliskan catatan pemetaan (opsional)..."
                      className="min-h-[60px] resize-y text-sm"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            );
          })
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
            {saveMutation.isPending ? "Menyimpan..." : "Simpan Draft Pemetaan MK"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 p-4 bg-muted border rounded-xl text-muted-foreground text-sm font-medium">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Pemetaan MK Terkunci (Sudah Submit Final)
        </div>
      )}
    </div>
  );
}
