"use client";

import { useBorangStore } from "@/store/useBorangStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PekerjaanItem {
  namaPerusahaan: string;
  jabatan: string;
  tahunMulai: string;
  tahunSelesai: string;
  deskripsi: string;
}

interface OrganisasiItem {
  nama: string;
  peran: string;
  tahun: string;
}

interface PenghargaanItem {
  nama: string;
  penyelenggara: string;
  tahun: string;
}

export default function SectionC() {
  const data = useBorangStore((s) => s.data.sectionC);
  const updateSection = useBorangStore((s) => s.updateSection);

  const items: PekerjaanItem[] = data.items || [];

  const updateItem = (index: number, field: keyof PekerjaanItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    updateSection("sectionC", { ...data, items: newItems });
  };

  const addItem = () => {
    updateSection("sectionC", {
      ...data,
      items: [...items, { namaPerusahaan: "", jabatan: "", tahunMulai: "", tahunSelesai: "", deskripsi: "" }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateSection("sectionC", { ...data, items: newItems });
  };

  const organisasi: OrganisasiItem[] = data.organisasi || [];
  const penghargaan: PenghargaanItem[] = data.penghargaan || [];

  const updateOrganisasi = (index: number, field: keyof OrganisasiItem, value: string) => {
    const newVal = [...organisasi];
    newVal[index] = { ...newVal[index], [field]: value };
    updateSection("sectionC", { ...data, organisasi: newVal });
  };
  const addOrganisasi = () => updateSection("sectionC", { ...data, organisasi: [...organisasi, { nama: "", peran: "", tahun: "" }] });
  const removeOrganisasi = (index: number) => updateSection("sectionC", { ...data, organisasi: organisasi.filter((_, i) => i !== index) });

  const updatePenghargaan = (index: number, field: keyof PenghargaanItem, value: string) => {
    const newVal = [...penghargaan];
    newVal[index] = { ...newVal[index], [field]: value };
    updateSection("sectionC", { ...data, penghargaan: newVal });
  };
  const addPenghargaan = () => updateSection("sectionC", { ...data, penghargaan: [...penghargaan, { nama: "", penyelenggara: "", tahun: "" }] });
  const removePenghargaan = (index: number) => updateSection("sectionC", { ...data, penghargaan: penghargaan.filter((_, i) => i !== index) });

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">C. Pengalaman & Pencapaian</h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Opsional</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Riwayat pekerjaan, organisasi profesi, dan penghargaan. Bagian ini tidak wajib diisi.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-border rounded-2xl bg-muted/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background mx-auto mb-3 shadow-sm">
              <Briefcase className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Belum ada pengalaman kerja</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
              Bagian ini opsional. Tambahkan jika Anda memiliki riwayat pekerjaan yang relevan.
            </p>
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  Pengalaman {i + 1}
                  <span className="ml-2 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">PK-{i + 1}</span>
                </span>
                <button
                  onClick={() => removeItem(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Perusahaan/Instansi</Label>
                  <Input
                    placeholder="Contoh: PT. Teknologi Baru"
                    value={item.namaPerusahaan || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "namaPerusahaan", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan/Posisi</Label>
                  <Input
                    placeholder="Contoh: Staff IT"
                    value={item.jabatan || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "jabatan", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tahun Mulai</Label>
                  <Input
                    placeholder="Contoh: 2018"
                    maxLength={4}
                    value={item.tahunMulai || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "tahunMulai", e.target.value.replace(/\D/g, ""))}
                    className="h-11 font-mono text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tahun Selesai (Kosongkan jika masih bekerja)</Label>
                  <Input
                    placeholder="Contoh: 2022"
                    maxLength={4}
                    value={item.tahunSelesai || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(i, "tahunSelesai", e.target.value.replace(/\D/g, ""))}
                    className="h-11 font-mono text-left"
                  />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <Label>Deskripsi Pekerjaan</Label>
                <textarea
                  rows={3}
                  placeholder="Deskripsikan tanggung jawab dan tugas utama Anda..."
                  value={item.deskripsi || ""}
                  onChange={(e) => updateItem(i, "deskripsi", e.target.value)}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 resize-none"
                />
              </div>
            </div>
          ))
        )}

        <Button
          variant="outline"
          onClick={addItem}
          className="w-full h-11 gap-2 rounded-xl border-dashed hover:bg-primary/5 hover:border-primary/50 transition-all"
        >
          <Plus className="h-4 w-4" />
          {items.length === 0 ? "Tambah Pengalaman Kerja" : "Tambah Pengalaman Lain"}
        </Button>
      </div>

      <div className="mt-8 mb-6 border-t border-border pt-8">
        <h3 className="text-lg font-bold tracking-tight mb-4">Riwayat Organisasi Profesi</h3>
        <div className="space-y-4">
          {organisasi.map((item, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/50 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold inline-flex items-center">
                  Organisasi {i + 1}
                  <span className="ml-2 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 uppercase whitespace-nowrap">ORG-{i + 1}</span>
                </span>
                <button onClick={() => removeOrganisasi(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nama Organisasi</Label>
                  <Input value={item.nama} onChange={(e) => updateOrganisasi(i, "nama", e.target.value)} className="h-11" placeholder="Contoh: Ikatan Ahli Informatika" />
                </div>
                <div className="space-y-2">
                  <Label>Tahun</Label>
                  <Input value={item.tahun} onChange={(e) => updateOrganisasi(i, "tahun", e.target.value.replace(/\D/g, ""))} className="h-11 font-mono" placeholder="2020-2022" maxLength={9} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Peran / Jabatan</Label>
                <Input value={item.peran} onChange={(e) => updateOrganisasi(i, "peran", e.target.value)} className="h-11" placeholder="Contoh: Anggota Aktif" />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addOrganisasi} className="w-full h-11 gap-2 rounded-xl border-dashed">
            <Plus className="h-4 w-4" /> Tambah Organisasi
          </Button>
        </div>
      </div>

      <div className="mt-8 mb-6 border-t border-border pt-8">
        <h3 className="text-lg font-bold tracking-tight mb-4">Penghargaan / Piagam</h3>
        <div className="space-y-4">
          {penghargaan.map((item, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/50 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold inline-flex items-center">
                  Penghargaan {i + 1}
                  <span className="ml-2 rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700 uppercase whitespace-nowrap">H-{i + 1}</span>
                </span>
                <button onClick={() => removePenghargaan(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Penghargaan</Label>
                  <Input value={item.nama} onChange={(e) => updatePenghargaan(i, "nama", e.target.value)} className="h-11" placeholder="Contoh: Karyawan Terbaik" />
                </div>
                <div className="space-y-2">
                  <Label>Tahun</Label>
                  <Input value={item.tahun} onChange={(e) => updatePenghargaan(i, "tahun", e.target.value.replace(/\D/g, ""))} className="h-11 font-mono" placeholder="2021" maxLength={4} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Institusi Penyelenggara</Label>
                <Input value={item.penyelenggara} onChange={(e) => updatePenghargaan(i, "penyelenggara", e.target.value)} className="h-11" placeholder="Contoh: PT. Teknologi Baru" />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addPenghargaan} className="w-full h-11 gap-2 rounded-xl border-dashed">
            <Plus className="h-4 w-4" /> Tambah Penghargaan
          </Button>
        </div>
      </div>
    </div>
  );
}
