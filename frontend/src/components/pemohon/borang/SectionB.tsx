"use client";

import { useBorangStore } from "@/store/useBorangStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Plus, Trash2, Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendidikanItem {
  jenjang: string;
  institusi: string;
  jurusan: string;
  tahunMasuk: string;
  tahunLulus: string;
  ipk: string;
  fileTranskrip?: string;
}

interface TranskripItem {
  semester: string;
  namaMk: string;
  sks: string;
  nilaiHuruf: string;
  nilaiAngka: string;
}

interface PelatihanItem {
  nama: string;
  penyelenggara: string;
  tahun: string;
}

export default function SectionB() {
  const data = useBorangStore((s) => s.data.sectionB);
  const updateSection = useBorangStore((s) => s.updateSection);

  const items: PendidikanItem[] = data.items || [];

  const transkrip: TranskripItem[] = data.transkrip || [];
  const pelatihan: PelatihanItem[] = data.pelatihan || [];

  const updateItem = (index: number, field: keyof PendidikanItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    updateSection("sectionB", { ...data, items: newItems });
  };

  const handleFileUpload = (index: number) => {
    // Simulate file upload for individual education item
    const newItems = [...items];
    newItems[index] = { ...newItems[index], fileTranskrip: `transkrip_${index + 1}.pdf` };
    updateSection("sectionB", { ...data, items: newItems });
  };

  const removeFile = (index: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], fileTranskrip: undefined };
    updateSection("sectionB", { ...data, items: newItems });
  };

  const addItem = () => {
    updateSection("sectionB", {
      ...data,
      items: [...items, { jenjang: "", institusi: "", jurusan: "", tahunMasuk: "", tahunLulus: "", ipk: "" }],
    });
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    updateSection("sectionB", { ...data, items: newItems });
  };

  const updateTranskrip = (index: number, field: keyof TranskripItem, value: string) => {
    const newTranskrip = [...transkrip];
    newTranskrip[index] = { ...newTranskrip[index], [field]: value };
    updateSection("sectionB", { ...data, transkrip: newTranskrip });
  };

  const addTranskrip = () => {
    updateSection("sectionB", {
      ...data,
      transkrip: [...transkrip, { semester: "", namaMk: "", sks: "", nilaiHuruf: "", nilaiAngka: "" }],
    });
  };

  const removeTranskrip = (index: number) => {
    const newTranskrip = transkrip.filter((_, i) => i !== index);
    updateSection("sectionB", { ...data, transkrip: newTranskrip });
  };

  const updatePelatihan = (index: number, field: keyof PelatihanItem, value: string) => {
    const newVal = [...pelatihan];
    newVal[index] = { ...newVal[index], [field]: value };
    updateSection("sectionB", { ...data, pelatihan: newVal });
  };

  const addPelatihan = () => {
    updateSection("sectionB", {
      ...data,
      pelatihan: [...pelatihan, { nama: "", penyelenggara: "", tahun: "" }],
    });
  };

  const removePelatihan = (index: number) => {
    const newVal = pelatihan.filter((_, i) => i !== index);
    updateSection("sectionB", { ...data, pelatihan: newVal });
  };

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">B. Riwayat Pendidikan & Pelatihan</h2>
            <p className="text-sm text-muted-foreground">
              Riwayat pendidikan formal, transkrip nilai, dan pelatihan yang pernah ditempuh.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  Pendidikan Formal {i + 1}
                </span>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid gap-x-5 gap-y-6 md:grid-cols-12">
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Jenjang <span className="text-destructive">*</span></Label>
                  <select
                    value={item.jenjang || ""}
                    onChange={(e) => updateItem(i, "jenjang", e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="">Pilih Jenjang</option>
                    <option value="SMA/SMK">SMA / SMK</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="D4/S1">D4 / S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
                <div className="md:col-span-5 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Nama Institusi <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Nama sekolah/universitas"
                    value={item.institusi || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "institusi", e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Jurusan / Program Studi</Label>
                  <Input
                    placeholder="Opsional untuk SMA"
                    value={item.jurusan || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "jurusan", e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="md:col-span-4 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Tahun Masuk <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="YYYY"
                    maxLength={4}
                    value={item.tahunMasuk || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateItem(i, "tahunMasuk", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-11 font-mono rounded-xl text-left"
                  />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Tahun Lulus <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="YYYY"
                    maxLength={4}
                    value={item.tahunLulus || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateItem(i, "tahunLulus", e.target.value.replace(/\D/g, ""))
                    }
                    className="h-11 font-mono rounded-xl text-left"
                  />
                </div>
                <div className="md:col-span-4 space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">IPK Akhir</Label>
                  <Input
                    placeholder="Contoh: 3.50"
                    value={item.ipk || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateItem(i, "ipk", e.target.value)
                    }
                    className="h-11 font-mono rounded-xl text-left"
                  />
                </div>
              </div>

            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl bg-background">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <GraduationCap className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Belum ada riwayat pendidikan</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Silakan tambahkan riwayat pendidikan formal Anda.</p>
              <Button onClick={addItem} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Tambah Pendidikan Pertama
              </Button>
            </div>
          )}

          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={addItem}
              className="w-full h-11 gap-2 rounded-xl border-dashed"
            >
              <Plus className="h-4 w-4" />
              Tambah Riwayat Pendidikan Lain
            </Button>
          )}
        </div>
      </div>

      {/* Manual Transcript Input Section */}
      <div className="border-t border-border pt-8">
        <div className="rounded-2xl border border-border bg-muted/30 p-6 shadow-inner">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">Input Nilai Mata Kuliah (Manual)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Masukkan rincian nilai mata kuliah Anda secara manual di sini. <strong className="text-foreground">Pastikan data sesuai dengan transkrip resmi yang Anda unggah di atas.</strong>
            </p>
          </div>

          <div className="space-y-4">
            {/* Header Row untuk Desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 rounded-lg">
              <div className="md:col-span-1 text-center">Smt</div>
              <div className="md:col-span-5">Nama Mata Kuliah</div>
              <div className="md:col-span-1 text-center">SKS</div>
              <div className="md:col-span-2 text-center">Nilai (A-E)</div>
              <div className="md:col-span-2 text-center">Nilai (Angka)</div>
              <div className="md:col-span-1 text-center">Aksi</div>
            </div>

            {/* Transcript Rows */}
            {transkrip.length === 0 && (
               <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl bg-background">
                 <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                   <AlertCircle className="h-5 w-5" />
                 </div>
                 <p className="text-sm font-medium text-foreground">Belum ada mata kuliah</p>
                 <p className="text-xs text-muted-foreground mt-1 mb-4">Silakan tambahkan data mata kuliah secara berurutan.</p>
                 <Button onClick={addTranskrip} size="sm" className="gap-2">
                   <Plus className="h-4 w-4" /> Tambah Mata Kuliah Pertama
                 </Button>
               </div>
            )}

            {transkrip.map((mk, i) => (
              <div key={i} className="flex flex-col md:grid md:grid-cols-12 gap-3 p-4 border border-border rounded-xl bg-background shadow-sm items-center">
              <div className="w-full md:col-span-1">
                <Label className="md:hidden text-xs text-muted-foreground mb-1 block">Semester</Label>
                <Input
                  placeholder="1-14"
                  value={mk.semester || ""}
                  onChange={(e) => updateTranskrip(i, "semester", e.target.value.replace(/\D/g, ""))}
                  className="h-10"
                />
              </div>
              <div className="w-full md:col-span-5">
                <Label className="md:hidden text-xs text-muted-foreground mb-1 block">Nama Mata Kuliah</Label>
                <Input
                  placeholder="Contoh: Algoritma & Pemrograman"
                  value={mk.namaMk || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTranskrip(i, "namaMk", e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
              <div className="w-full md:col-span-1">
                <Label className="md:hidden text-xs text-muted-foreground mb-1 block">SKS</Label>
                <Input
                  placeholder="1-6"
                  value={mk.sks || ""}
                  onChange={(e) => updateTranskrip(i, "sks", e.target.value.replace(/\D/g, ""))}
                  className="h-10 text-center"
                />
              </div>
              <div className="w-full md:col-span-2">
                <Label className="md:hidden text-xs text-muted-foreground mb-1 block">Nilai Huruf</Label>
                <select
                  value={mk.nilaiHuruf || ""}
                  onChange={(e) => updateTranskrip(i, "nilaiHuruf", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">-</option>
                  <option value="A">A</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="C+">C+</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="K">K</option>
                </select>
              </div>
              <div className="w-full md:col-span-2">
                <Label className="md:hidden text-xs text-muted-foreground mb-1 block">Nilai Angka</Label>
                <Input
                  placeholder="0-100"
                  value={mk.nilaiAngka || ""}
                  onChange={(e) => updateTranskrip(i, "nilaiAngka", e.target.value)}
                  className="h-10 font-mono text-center"
                />
              </div>
              <div className="w-full md:col-span-1 flex justify-end md:justify-center mt-2 md:mt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTranskrip(i)}
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {transkrip.length > 0 && (
            <Button
              variant="secondary"
              onClick={addTranskrip}
              className="w-full md:w-auto h-10 gap-2 mt-4"
            >
              <Plus className="h-4 w-4" />
              Tambah Baris Mata Kuliah
            </Button>
          )}
        </div>
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <h3 className="text-lg font-bold tracking-tight mb-2">Pendidikan Non Formal / Pelatihan</h3>
        <p className="text-sm text-muted-foreground mb-4">Tambahkan riwayat pelatihan profesional, bootcamp, atau sertifikasi (Opsional).</p>
        
        <div className="space-y-4">
          {pelatihan.map((item, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">Pelatihan {i + 1}</span>
                <button
                  onClick={() => removePelatihan(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Pelatihan</Label>
                  <Input
                    placeholder="Contoh: Web Development Bootcamp"
                    value={item.nama || ""}
                    onChange={(e) => updatePelatihan(i, "nama", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tahun</Label>
                  <Input
                    placeholder="Contoh: 2022"
                    maxLength={4}
                    value={item.tahun || ""}
                    onChange={(e) => updatePelatihan(i, "tahun", e.target.value.replace(/\D/g, ""))}
                    className="h-11 font-mono"
                  />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Label>Institusi Penyelenggara</Label>
                <Input
                  placeholder="Contoh: Dicoding Indonesia"
                  value={item.penyelenggara || ""}
                  onChange={(e) => updatePelatihan(i, "penyelenggara", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addPelatihan}
            className="w-full h-11 gap-2 rounded-xl border-dashed"
          >
            <Plus className="h-4 w-4" />
            Tambah Pelatihan
          </Button>
        </div>
      </div>
    </div>
  );
}
