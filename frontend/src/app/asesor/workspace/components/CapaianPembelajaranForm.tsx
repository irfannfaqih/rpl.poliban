import { useState } from "react";
import { Label } from "@/components/ui/label";

const MATA_KULIAH_MOCK = [
  { id: "MK01", nama: "Rekayasa Perangkat Lunak", sks: 3 },
  { id: "MK02", nama: "Pemrograman Web Lanjut", sks: 3 },
  { id: "MK03", nama: "Basis Data Dasar", sks: 2 },
];

// Sub-kriteria per dimensi sesuai Form 05
const SUB_KOGNITIF = [
  { key: "level1", label: "Level 1 — Pengetahuan" },
  { key: "level2", label: "Level 2 — Analistik" },
  { key: "level3", label: "Level 3 — Sintetik" },
];

const SUB_SKILL = [
  { key: "komunikasi_oral", label: "Komunikasi Oral" },
  { key: "komunikasi_tulisan", label: "Komunikasi Tulisan" },
  { key: "presentasi", label: "Presentasi" },
  { key: "kerja_tim", label: "Kerja Tim" },
  { key: "kemampuan_it", label: "Kemampuan IT" },
];

const SUB_AFEKTIF = [
  { key: "manajemen_waktu", label: "Manajemen Waktu" },
  { key: "sikap", label: "Sikap" },
  { key: "pengambilan_keputusan", label: "Pengambilan Keputusan" },
  { key: "multi_task", label: "Multi Task" },
];

interface SubScores {
  [key: string]: number | null;
}

interface MKPenilaian {
  kognitif: SubScores;
  skill: SubScores;
  afektif: SubScores;
  note: string;
  status: string;
}

function calcAvg(scores: SubScores): string {
  const vals = Object.values(scores).filter((v) => v !== null) as number[];
  if (vals.length === 0) return "—";
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

export default function CapaianPembelajaranForm({ pemohonId }: { pemohonId: string }) {
  const [penilaian, setPenilaian] = useState<Record<string, MKPenilaian>>({});

  const getItem = (mkId: string): MKPenilaian =>
    penilaian[mkId] || {
      kognitif: {},
      skill: {},
      afektif: {},
      note: "",
      status: "Belum Dinilai",
    };

  const handleSubScore = (
    mkId: string,
    dim: "kognitif" | "skill" | "afektif",
    subKey: string,
    value: number
  ) => {
    setPenilaian((prev) => {
      const current = getItem(mkId);
      const currentDim = { ...current[dim] };
      currentDim[subKey] = currentDim[subKey] === value ? null : value;
      return {
        ...prev,
        [mkId]: { ...current, [dim]: currentDim },
      };
    });
  };

  const handleNoteChange = (mkId: string, value: string) => {
    setPenilaian((prev) => {
      const current = getItem(mkId);
      return { ...prev, [mkId]: { ...current, note: value } };
    });
  };

  const handleStatusChange = (mkId: string, value: string) => {
    setPenilaian((prev) => {
      const current = getItem(mkId);
      return { ...prev, [mkId]: { ...current, status: value } };
    });
  };

  const renderSubCriteria = (
    mkId: string,
    dim: "kognitif" | "skill" | "afektif",
    subItems: { key: string; label: string }[],
    dimLabel: string,
    color: string
  ) => {
    const current = getItem(mkId);
    const scores = current[dim];
    const avg = calcAvg(scores);

    return (
      <div className="space-y-3">
        {/* Dimension Header */}
        <div className="flex flex-col gap-2 pb-2">
          <h4 className={`text-[11px] font-bold uppercase tracking-wider leading-tight ${color}`}>
            {dimLabel}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Rata-rata:</span>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-md ${
                avg === "—"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {avg}
            </span>
          </div>
        </div>

        {/* Sub Items */}
        <div className="space-y-2">
          {subItems.map((sub) => {
            const val = scores[sub.key] ?? null;
            return (
              <div
                key={sub.key}
                className="flex flex-col gap-2 p-3 rounded-lg border bg-background hover:border-primary/20 transition-colors"
              >
                <span className="text-sm text-foreground font-medium">
                  {sub.label}
                </span>
                <div className="flex bg-muted/50 p-1 rounded-md w-full">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleSubScore(mkId, dim, sub.key, num)}
                      className={`flex-1 h-8 text-xs font-bold rounded-md transition-all ${
                        val === num
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-background hover:text-foreground"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-xl font-bold">
          Penilaian Capaian Pembelajaran
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Beri penilaian per Mata Kuliah pada 3 dimensi:{" "}
          <strong>Kognitif</strong> (3 level),{" "}
          <strong>Skill/Psikomotorik</strong> (5 sub-kriteria), dan{" "}
          <strong>Afektif</strong> (4 sub-kriteria). Gunakan skala{" "}
          <strong>1 (Sangat Kurang)</strong> hingga{" "}
          <strong>4 (Sangat Baik)</strong>. Tentukan keputusan akhir pengakuan
          SKS.
        </p>
      </div>

      <div className="space-y-6">
        {MATA_KULIAH_MOCK.map((mk) => {
          const val = getItem(mk.id);

          return (
            <div
              key={mk.id}
              className="rounded-2xl border bg-card shadow-sm overflow-hidden transition-all hover:border-primary/30"
            >
              {/* MK Header */}
              <div className="flex items-center justify-between p-5 border-b bg-muted/10">
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono text-xs font-bold">
                    {mk.id}
                  </span>
                  <div>
                    <h3 className="font-bold text-base">{mk.nama}</h3>
                    <p className="text-xs text-muted-foreground">
                      {mk.sks} SKS
                    </p>
                  </div>
                </div>

                <select
                  value={val.status}
                  onChange={(e) => handleStatusChange(mk.id, e.target.value)}
                  className={`h-9 rounded-lg border text-xs font-bold px-3 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    val.status === "Diakui"
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:border-green-500/20"
                      : val.status === "Ditolak"
                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:border-red-500/20"
                      : val.status === "Uji Lanjutan"
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  <option value="Belum Dinilai">-- Keputusan --</option>
                  <option value="Diakui">Diakui ({mk.sks} SKS)</option>
                  <option value="Ditolak">Ditolak (0 SKS)</option>
                  <option value="Uji Lanjutan">
                    Uji Lanjutan (Ujian Tulis/Lisan)
                  </option>
                </select>
              </div>

              {/* 3 Dimensi */}
              <div className="p-5 space-y-6">
                {/* Grid 3 kolom di layar lebar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl border bg-blue-50/30 dark:bg-blue-500/5 border-blue-200/50 dark:border-blue-500/10">
                    {renderSubCriteria(
                      mk.id,
                      "kognitif",
                      SUB_KOGNITIF,
                      "Kognitif (Pengetahuan)",
                      "text-blue-600 dark:text-blue-400"
                    )}
                  </div>
                  <div className="p-4 rounded-xl border bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-500/10">
                    {renderSubCriteria(
                      mk.id,
                      "skill",
                      SUB_SKILL,
                      "Skill (Psikomotorik)",
                      "text-emerald-600 dark:text-emerald-400"
                    )}
                  </div>
                  <div className="p-4 rounded-xl border bg-purple-50/30 dark:bg-purple-500/5 border-purple-200/50 dark:border-purple-500/10">
                    {renderSubCriteria(
                      mk.id,
                      "afektif",
                      SUB_AFEKTIF,
                      "Afektif (Sikap)",
                      "text-purple-600 dark:text-purple-400"
                    )}
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Catatan Keputusan
                  </Label>
                  <textarea
                    className="w-full min-h-[70px] p-3 text-sm rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Berikan alasan atas skor dan keputusan Anda..."
                    value={val.note}
                    onChange={(e) => handleNoteChange(mk.id, e.target.value)}
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
