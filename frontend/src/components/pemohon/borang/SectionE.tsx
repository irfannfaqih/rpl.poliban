"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { openPrivateFile, privateDocumentPath } from "@/lib/private-files";
import { DokumenTambahan, DokumenWajib, useBorangStore } from "@/store/useBorangStore";
import { Eye, File, FolderOpen, Info, Loader2, Plus, ShieldCheck, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Tipe Dokumen Dropdown Options                                      */
/* ------------------------------------------------------------------ */

const TIPE_DOKUMEN_OPTIONS = [
  // === 10 Kategori sesuai Form 04 (Evaluasi Kesesuaian Dokumen) ===
  { value: "Informasi Posisi di Tempat Kerja", desc: "Dokumen yang menunjukkan keterkaitan posisi Anda di tempat kerja dengan kompetensi prodi" },
  { value: "Bukti Pendidikan Jenjang Sebelumnya", desc: "Ijazah, transkrip, atau sertifikat dari pendidikan formal sebelumnya" },
  { value: "Pelatihan yang Relevan", desc: "Sertifikat pelatihan, workshop, atau kursus dari lembaga resmi (BNSP, dll)" },
  { value: "Uraian Tugas (Job Description)", desc: "Dokumen deskripsi pekerjaan dari perusahaan tempat Anda bekerja" },
  { value: "Standar Operasi Prosedur (SOP)", desc: "SOP yang pernah Anda buat atau gunakan di tempat kerja" },
  { value: "Hasil Pekerjaan", desc: "Produk, karya nyata, atau output pekerjaan yang pernah Anda buat" },
  { value: "Pengalaman Kerja", desc: "Surat keterangan kerja, paklaring, atau bukti pengalaman kerja" },
  { value: "Laporan Pekerjaan", desc: "Laporan proyek, laporan berkala, atau dokumentasi hasil kerja" },
  { value: "Hasil Penilaian Atasan", desc: "Surat rekomendasi, penilaian kinerja, atau evaluasi dari atasan langsung" },
  // === Tambahan (diluar 10 kategori Form 04, tetap relevan) ===
  { value: "Penghargaan / Bukti Prestasi", desc: "Piagam, piala, sertifikat apresiasi, atau bukti achievement" },
  { value: "Surat Keputusan (SK) Pekerjaan", desc: "SK Pengangkatan, Mutasi, atau Penugasan Proyek" },
  { value: "Logbook / Jurnal Kerja", desc: "Catatan harian/berkala tentang aktivitas pekerjaan" },
  { value: "Dokumen Lainnya", desc: "Dokumen relevan lain yang belum tercantum di atas" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SectionE({ pendaftaranId }: { pendaftaranId?: number }) {
  const data = useBorangStore((s) => s.data.sectionE);
  const updateSection = useBorangStore((s) => s.updateSection);

  const dokumenWajib: DokumenWajib = data.dokumenWajib || {};
  const dokumenTambahan: DokumenTambahan[] = data.dokumenTambahan || [];

  const [showGuide, setShowGuide] = useState(false);
  const [uploadingWajib, setUploadingWajib] = useState<string | null>(null);
  const [uploadingTambahan, setUploadingTambahan] = useState<number | null>(null);

  const triggerFileUpload = (accept: string, onFileSelect: (file: File) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
        const isAllowedExtension = file.name.match(/\.(pdf|jpg|jpeg|png)$/i);

        if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
          toast.error("Format tidak didukung. Harap unggah file berformat .pdf, .jpg, .jpeg, atau .png");
          return;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error("Ukuran file maksimal 10MB");
          return;
        }
        onFileSelect(file);
      }
    };
    input.click();
  };

  /* ---------- Handlers: Dokumen Wajib ---------- */

  const handleUploadWajib = (key: keyof DokumenWajib) => {
    if (!pendaftaranId) {
      toast.error("ID Pendaftaran tidak ditemukan. Mohon refresh halaman.");
      return;
    }

    triggerFileUpload(".pdf,.jpg,.jpeg,.png", async (file) => {
      setUploadingWajib(key as string);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tipe", (key as string).toLowerCase());
        formData.append("deskripsi", "Dokumen Wajib " + (key as string));

        const res = await api.post(`/pemohon/pendaftaran/${pendaftaranId}/dokumen`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const currentState = useBorangStore.getState().data.sectionE;
        const next = {
          ...currentState.dokumenWajib,
          [key]: res.data.data.file_name,
          [`${key}Url`]: res.data.data.file_path,
          [`${key}Id`]: res.data.data.id?.toString(),
        };
        updateSection("sectionE", { ...currentState, dokumenWajib: next });
        toast.success(`Berhasil mengunggah ${key}`);
      } catch (err: any) {
        toast.error(`Gagal mengunggah ${key}: ` + (err.response?.data?.message || err.message));
      } finally {
        setUploadingWajib(null);
      }
    });
  };

  const handleRemoveWajib = (key: keyof DokumenWajib) => {
    const next = { ...dokumenWajib };
    delete next[key];
    updateSection("sectionE", { ...data, dokumenWajib: next });
  };

  /* ---------- Handlers: Dokumen Tambahan ---------- */

  const getNextDokId = () => {
    const existingNums = dokumenTambahan
      .map((d) => parseInt(d.id.replace("DOK-", ""), 10))
      .filter((n) => !isNaN(n));
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    return `DOK-${maxNum + 1}`;
  };

  const addDokumenTambahan = () => {
    const newDok: DokumenTambahan = {
      id: getNextDokId(),
      tipe: "",
      deskripsi: "",
      fileName: "",
    };
    updateSection("sectionE", {
      ...data,
      dokumenTambahan: [...dokumenTambahan, newDok],
    });
  };

  const updateDokumenTambahan = (index: number, field: keyof DokumenTambahan, value: string) => {
    const currentState = useBorangStore.getState().data.sectionE;
    const updated = [...currentState.dokumenTambahan];
    updated[index] = { ...updated[index], [field]: value };
    updateSection("sectionE", { ...currentState, dokumenTambahan: updated });
  };

  const uploadDokumenTambahan = (index: number) => {
    if (!pendaftaranId) {
      toast.error("ID Pendaftaran tidak ditemukan. Mohon refresh halaman.");
      return;
    }
    const dok = dokumenTambahan[index];
    if (!dok.tipe || !dok.deskripsi) {
      toast.error("Pilih tipe dokumen dan isi nama/deskripsi terlebih dahulu.");
      return;
    }

    triggerFileUpload(".pdf,.jpg,.jpeg,.png", async (file) => {
      setUploadingTambahan(index);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tipe", "tambahan");
        formData.append("deskripsi", `${dok.tipe}: ${dok.deskripsi}`);

        const res = await api.post(`/pemohon/pendaftaran/${pendaftaranId}/dokumen`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const currentState = useBorangStore.getState().data.sectionE;
        const updated = [...currentState.dokumenTambahan];
        updated[index] = {
          ...updated[index],
          fileName: res.data.data.file_name,
          url: res.data.data.file_path,
          // Simpan database ID agar bisa di-resolve di workspace asesor
          dbId: res.data.data.id?.toString(),
        };
        updateSection("sectionE", { ...currentState, dokumenTambahan: updated });
        toast.success(`Berhasil mengunggah dokumen tambahan`);
      } catch (err: any) {
        toast.error(`Gagal mengunggah dokumen: ` + (err.response?.data?.message || err.message));
      } finally {
        setUploadingTambahan(null);
      }
    });
  };

  const removeDokumenTambahan = (index: number) => {
    const updated = dokumenTambahan.filter((_, i) => i !== index);
    updateSection("sectionE", { ...data, dokumenTambahan: updated });
  };

  /* ---------- Render Helpers ---------- */

  const wajibSlots: { key: keyof DokumenWajib; title: string; desc: string }[] = [
    { key: "Ijazah", title: "Ijazah Terakhir", desc: "Scan ijazah pendidikan terakhir Anda" },
    { key: "Transkrip", title: "Transkrip Nilai Resmi", desc: "Scan transkrip nilai akademik resmi" },
  ];

  const uploadedWajibCount = Object.values(dokumenWajib).filter(Boolean).length;
  const uploadedTambahanCount = dokumenTambahan.filter(d => d.fileName).length;
  const totalUploaded = uploadedWajibCount + uploadedTambahanCount;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">D. Dokumen Pendukung</h2>
          <p className="text-sm text-muted-foreground">
            Unggah dokumen yang membuktikan kompetensi dan pengalaman Anda.
          </p>
        </div>
      </div>

      {/* Panduan Info Box */}
      <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm">
        <div className="flex gap-3">
          <div className="mt-0.5 shrink-0">
            <Info className="h-4 w-4 text-blue-500" />
          </div>
          <div className="space-y-2 w-full">
            <p className="font-semibold text-blue-700 dark:text-blue-300">Panduan Unggah Dokumen</p>
            <p className="leading-relaxed text-foreground/80">
              Lengkapi dokumen wajib terlebih dahulu, lalu tambahkan dokumen bukti lainnya
              yang mendukung klaim kompetensi Anda.
            </p>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-blue-600 dark:text-blue-400 font-semibold text-xs underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            >
              {showGuide ? "Sembunyikan panduan tipe dokumen ▲" : "Lihat contoh tipe dokumen ▼"}
            </button>

            {showGuide && (
              <div className="mt-2 rounded-xl bg-background/80 dark:bg-background/40 border border-border p-3 space-y-1.5">
                {TIPE_DOKUMEN_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex gap-2 text-xs">
                    <span className="font-bold text-blue-500 shrink-0">•</span>
                    <div>
                      <span className="font-semibold text-foreground">{opt.value}</span>
                      <span className="text-muted-foreground">: {opt.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======== DOKUMEN WAJIB ======== */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-red-500" />
          <h3 className="text-base font-bold">Dokumen Wajib</h3>
          <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
            Harus Diisi
          </span>
          <span className="ml-auto text-xs text-muted-foreground">{uploadedWajibCount}/2 terunggah</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {wajibSlots.map((slot) => {
            const fileName = dokumenWajib[slot.key];
            return (
              <div key={slot.key} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3">
                  <Label className="block text-sm font-semibold text-foreground">
                    {slot.title} <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{slot.desc}</p>
                </div>

                {fileName ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                    <div className="flex flex-1 min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-600 dark:text-green-400">
                        <File className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate" title={fileName}>{fileName}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ Selesai diunggah</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {dokumenWajib[`${slot.key}Id` as keyof DokumenWajib] && (
                        <button
                          type="button"
                          onClick={() =>
                            openPrivateFile(
                              privateDocumentPath(
                                dokumenWajib[`${slot.key}Id` as keyof DokumenWajib]!,
                              ),
                            )
                          }
                          className="rounded-full p-2 text-primary hover:bg-primary/10 transition-colors"
                          title="Lihat Dokumen"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveWajib(slot.key)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Hapus Dokumen"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUploadWajib(slot.key)}
                    disabled={uploadingWajib === slot.key}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-red-500/30 py-6 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
                  >
                    {uploadingWajib === slot.key ? (
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="h-7 w-7 opacity-40" />
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium">Klik untuk mengunggah</p>
                      <p className="text-xs">PDF, JPG, atau PNG (Maks. 5MB)</p>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ======== DOKUMEN TAMBAHAN ======== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <File className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold">Dokumen Bukti Tambahan</h3>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
              Opsional
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{dokumenTambahan.length} dokumen</span>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Tambahkan sertifikat, portofolio, surat referensi, atau dokumen lain yang mendukung
          klaim kompetensi Anda untuk setiap mata kuliah yang diajukan RPL.
        </p>

        {dokumenTambahan.length > 0 && (
          <div className="space-y-4 mb-4">
            {dokumenTambahan.map((dok, index) => (
              <div
                key={dok.id}
                className="rounded-xl border border-border bg-card p-5 relative group"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                    {dok.id}
                  </span>
                  <button
                    onClick={() => removeDokumenTambahan(index)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus dokumen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Tipe Dokumen <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={dok.tipe}
                      onChange={(e) => updateDokumenTambahan(index, "tipe", e.target.value)}
                      className="h-9 rounded-lg border border-border bg-background text-foreground px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    >
                      <option value="">Pilih tipe dokumen</option>
                      {TIPE_DOKUMEN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Nama / Deskripsi Dokumen <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Contoh: Sertifikat BNSP Jaringan Komputer 2023"
                      value={dok.deskripsi}
                      onChange={(e) => updateDokumenTambahan(index, "deskripsi", e.target.value)}
                      className="h-9 text-sm rounded-lg"
                    />
                  </div>
                </div>

                {/* File Upload */}
                {dok.fileName ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                    <div className="flex flex-1 min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-600 dark:text-green-400">
                        <File className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate" title={dok.fileName}>{dok.fileName}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">✓ Selesai diunggah</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {dok.dbId && (
                        <button
                          type="button"
                          onClick={() =>
                            openPrivateFile(privateDocumentPath(dok.dbId!))
                          }
                          className="rounded-full p-1.5 text-primary hover:bg-primary/10 transition-colors"
                          title="Lihat Dokumen"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => updateDokumenTambahan(index, "fileName", "")}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Hapus Dokumen"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => uploadDokumenTambahan(index)}
                    disabled={uploadingTambahan === index}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-5 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
                  >
                    {uploadingTambahan === index ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="h-5 w-5 opacity-50" />
                    )}
                    <span className="text-sm font-medium">Klik untuk mengunggah file</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={addDokumenTambahan}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 py-4 text-primary font-semibold text-sm transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" />
          Tambah Dokumen Bukti Lain
        </button>
      </div>
    </div>
  );
}
