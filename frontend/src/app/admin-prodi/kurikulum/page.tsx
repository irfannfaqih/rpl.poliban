"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Edit,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Cpmk {
  id: number;
  kode: string;
  deskripsi: string;
}

interface MataKuliah {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  semester?: number;
  level_kkni?: number;
  deskripsi: string | null;
  is_active: boolean;
  cpmk_count: number;
  cpmk?: Cpmk[];
  matriks_asesmen?: any;
}

export default function KurikulumPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("kurikulum");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<MataKuliah | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // CPMK State
  const [cpmkModalMk, setCpmkModalMk] = useState<MataKuliah | null>(null);
  const formCpmkKode = useRef<HTMLInputElement>(null);
  const formCpmkDesk = useRef<HTMLInputElement>(null);
  const [cpmkList, setCpmkList] = useState<Cpmk[]>([]);
  const [editingCpmk, setEditingCpmk] = useState<{ id: number, kode: string, deskripsi: string } | null>(null);

  // Matriks Asesmen State
  const [matriksState, setMatriksState] = useState<
    Record<number, Record<string, boolean>>
  >({});
  const [isMatriksDirty, setIsMatriksDirty] = useState(false);

  const formKode = useRef<HTMLInputElement>(null);
  const formNama = useRef<HTMLInputElement>(null);
  const formSks = useRef<HTMLInputElement>(null);
  const formDesk = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data = [], isLoading: loading } = useQuery({
    queryKey: ["kurikulum", debouncedSearch],
    queryFn: async () => {
      const { data: res } = await api.get("/admin-prodi/mata-kuliah", {
        params: debouncedSearch ? { search: debouncedSearch } : {},
      });
      const d = res.data as MataKuliah[];

      // Initialize Matriks State if not dirty
      if (!isMatriksDirty) {
        const initial: Record<number, Record<string, boolean>> = {};
        d.forEach((mk) => {
          if (mk.matriks_asesmen) {
            initial[mk.id] = mk.matriks_asesmen;
          }
        });
        setMatriksState(initial);
      }
      return d;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin-prodi/mata-kuliah/${id}`);
    },
    onSuccess: () => {
      toast.success("Mata kuliah berhasil dihapus");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["kurikulum"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menghapus");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editTarget) {
        await api.put(`/admin-prodi/mata-kuliah/${editTarget.id}`, payload);
      } else {
        await api.post("/admin-prodi/mata-kuliah", payload);
      }
    },
    onSuccess: () => {
      toast.success(
        `Mata kuliah berhasil ${editTarget ? "diperbarui" : "ditambahkan"}`,
      );
      setIsFormModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["kurikulum"] });
    },
    onError: (err: any) => {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || "Gagal menyimpan");
      }
    },
  });

  const fetchCpmk = async (mk: MataKuliah) => {
    try {
      const { data: res } = await api.get(
        `/admin-prodi/mata-kuliah/${mk.id}/cpmk`,
      );
      setCpmkList(res.data);
    } catch (err: any) {
      toast.error("Gagal memuat CPMK");
    }
  };

  const handleOpenCpmk = (mk: MataKuliah) => {
    setCpmkModalMk(mk);
    setCpmkList([]);
    setEditingCpmk(null);
    setErrors({});
    // Clear input refs
    if (formCpmkKode.current) formCpmkKode.current.value = "";
    if (formCpmkDesk.current) formCpmkDesk.current.value = "";
    fetchCpmk(mk);
  };

  const cpmkSaveMutation = useMutation({
    mutationFn: async (payload: any) => {
      await api.post(
        `/admin-prodi/mata-kuliah/${cpmkModalMk!.id}/cpmk`,
        payload,
      );
    },
    onSuccess: () => {
      toast.success("CPMK berhasil ditambahkan");
      if (formCpmkKode.current) formCpmkKode.current.value = "";
      if (formCpmkDesk.current) formCpmkDesk.current.value = "";
      fetchCpmk(cpmkModalMk!);
      queryClient.invalidateQueries({ queryKey: ["kurikulum"] });
    },
    onError: (err: any) => {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || "Gagal menambah CPMK");
      }
    },
  });

  const cpmkDeleteMutation = useMutation({
    mutationFn: async (cpmkId: number) => {
      await api.delete(
        `/admin-prodi/mata-kuliah/${cpmkModalMk!.id}/cpmk/${cpmkId}`,
      );
    },
    onSuccess: () => {
      toast.success("CPMK dihapus");
      fetchCpmk(cpmkModalMk!);
      queryClient.invalidateQueries({ queryKey: ["kurikulum"] });
    },
    onError: (err: any) => {
      toast.error("Gagal menghapus CPMK");
    },
  });

  const cpmkUpdateMutation = useMutation({
    mutationFn: async (payload: { id: number, kode: string, deskripsi: string }) => {
      await api.put(
        `/admin-prodi/mata-kuliah/${cpmkModalMk!.id}/cpmk/${payload.id}`,
        { kode: payload.kode, deskripsi: payload.deskripsi }
      );
    },
    onSuccess: () => {
      toast.success("CPMK berhasil diperbarui");
      setEditingCpmk(null);
      fetchCpmk(cpmkModalMk!);
      queryClient.invalidateQueries({ queryKey: ["kurikulum"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal memperbarui CPMK");
    },
  });

  const handleAddCpmk = () => {
    const payload = {
      kode: formCpmkKode.current?.value || "",
      deskripsi: formCpmkDesk.current?.value || "",
    };

    const newErrors: Record<string, string[]> = {};
    if (!payload.kode.trim()) newErrors.cpmk_kode = ["Kode CPMK wajib diisi."];
    if (!payload.deskripsi.trim())
      newErrors.cpmk_deskripsi = ["Deskripsi CPMK wajib diisi."];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    cpmkSaveMutation.mutate(payload);
  };

  // Toggle is_active MK (PRD Bab 4.3 Halaman 2.2)
  const toggleActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/admin-prodi/mata-kuliah/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kurikulum"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengubah status");
    },
  });

  const matriksSaveMutation = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(matriksState).map(([mkId, values]) =>
        api.post(`/admin-prodi/mata-kuliah/${mkId}/matriks`, values),
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Matriks asesmen berhasil disimpan");
      setIsMatriksDirty(false);
      queryClient.invalidateQueries({ queryKey: ["kurikulum"] });
    },
    onError: (err: any) => {
      toast.error("Gagal menyimpan matriks asesmen");
    },
  });

  const handleCheckboxChange = (
    mkId: number,
    cKey: string,
    checked: boolean,
  ) => {
    setIsMatriksDirty(true);
    setMatriksState((prev) => ({
      ...prev,
      [mkId]: {
        ...(prev[mkId] || {}),
        [cKey]: checked,
      },
    }));
  };

  const handleOpenAdd = () => {
    setErrors({});
    setEditTarget(null);
    setIsFormModalOpen(true);
  };
  const handleOpenEdit = (item: MataKuliah) => {
    setErrors({});
    setEditTarget(item);
    setIsFormModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
  };

  const handleSave = () => {
    const payload = {
      kode: formKode.current?.value || "",
      nama: formNama.current?.value || "",
      sks: Number(formSks.current?.value) || 3,
      deskripsi: formDesk.current?.value || null,
    };

    const newErrors: Record<string, string[]> = {};
    if (!payload.kode.trim()) newErrors.kode = ["Kode MK wajib diisi."];
    if (!payload.nama.trim())
      newErrors.nama = ["Nama Mata Kuliah wajib diisi."];
    if (!payload.sks || payload.sks <= 0) newErrors.sks = ["SKS wajib valid."];

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveMutation.mutate(payload);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Kurikulum
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola daftar mata kuliah RPL dan CPMK program studi.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* TAB 1: Daftar Kurikulum */}
        <TabsContent value="kurikulum" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode atau nama mata kuliah..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleOpenAdd} className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" /> Tambah Mata Kuliah
            </Button>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/30 border-b uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Kode MK</th>
                    <th className="px-6 py-4 font-semibold">Mata Kuliah</th>
                    <th className="px-6 py-4 font-semibold text-center">SKS</th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Jml CPMK
                    </th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Memuat data...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        Tidak ada data ditemukan.
                      </td>
                    </tr>
                  ) : (
                    data.map((mk) => (
                      <tr
                        key={mk.id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium font-mono text-foreground">
                          {mk.kode}
                        </td>
                        <td className="px-6 py-4 font-medium">{mk.nama}</td>
                        <td className="px-6 py-4 tabular-nums text-center">
                          {mk.sks}
                        </td>
                        <td className="px-6 py-4 tabular-nums text-center">
                          <Badge variant="secondary" className="font-mono">
                            {mk.cpmk_count}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActiveMutation.mutate(mk.id)}
                            disabled={toggleActiveMutation.isPending}
                            title={
                              mk.is_active
                                ? "Klik untuk nonaktifkan"
                                : "Klik untuk aktifkan"
                            }
                            className="focus:outline-none"
                          >
                            <Badge
                              variant="outline"
                              className={
                                mk.is_active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                                  : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors line-through"
                              }
                            >
                              {mk.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenCpmk(mk)}
                              className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 mr-2"
                            >
                              Kelola CPMK
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(mk)}
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(mk.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Matriks Asesmen MK (Form 13) */}
        <TabsContent value="matriks" className="mt-6 space-y-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4">
            <BookOpen className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-blue-900">
                Petunjuk Matriks Asesmen
              </h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                Pilih metode asesmen yang sesuai dengan karakteristik setiap
                Mata Kuliah. Metode ini akan menjadi acuan bagi Asesor dalam
                menentukan jenis Asesmen Tahap 2.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Pemetaan Metode Asesmen</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Centang metode yang berlaku untuk tiap MK
                </p>
              </div>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => matriksSaveMutation.mutate()}
                disabled={matriksSaveMutation.isPending || !isMatriksDirty}
              >
                {matriksSaveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Matriks
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-muted-foreground bg-background border-b uppercase tracking-wider text-center">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-left w-64 border-r bg-muted/10">
                      Mata Kuliah
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Sertifikat asosiasi nasional/ internasional"
                    >
                      C1
                      <br />
                      Sert
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Observasi langsung / kunjungan industri"
                    >
                      C2
                      <br />
                      Obsrv
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Ujian lisan / wawancara"
                    >
                      C3
                      <br />
                      Lisan
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Peragaan / praktik"
                    >
                      C4
                      <br />
                      Prak
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Penilaian terhadap pekerjaan"
                    >
                      C5
                      <br />
                      Nilai P.
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Review terhadap pekerjaan yang telah dilakukan"
                    >
                      C6
                      <br />
                      Review
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Tes tertulis"
                    >
                      C7
                      <br />
                      Tulis
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Pertanyaan tertulis pelamar"
                    >
                      C8
                      <br />
                      Prt Tls
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Lap tertulis dari supervisor"
                    >
                      C9
                      <br />
                      Lap SPV
                    </th>
                    <th
                      className="px-2 py-3 font-semibold border-r"
                      title="Catatan harian pekerjaan (log book)"
                    >
                      C10
                      <br />
                      Log
                    </th>
                    <th
                      className="px-2 py-3 font-semibold"
                      title="Bukti /Dokumen laporan pekerjaan"
                    >
                      C11
                      <br />
                      Bukti
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y text-center">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Memuat data...
                      </td>
                    </tr>
                  ) : (
                    data.map((mk) => (
                      <tr
                        key={mk.id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-left border-r bg-muted/5">
                          <div
                            className="font-medium text-foreground line-clamp-1"
                            title={mk.nama}
                          >
                            {mk.nama}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {mk.kode} • {mk.sks} SKS
                          </div>
                        </td>
                        {Array.from({ length: 11 }, (_, i) => {
                          const cKey = `c${i + 1}`;
                          const isChecked =
                            matriksState[mk.id]?.[cKey] === true;
                          return (
                            <td
                              key={i}
                              className={`px-2 py-3 ${i < 10 ? "border-r" : ""}`}
                            >
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 text-primary cursor-pointer"
                                checked={isChecked}
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    mk.id,
                                    cKey,
                                    e.target.checked,
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-muted/10 border-t text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Legenda Metode Asesmen:</strong>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                <div>C1: Sertifikat Asosiasi</div>
                <div>C2: Observasi Langsung</div>
                <div>C3: Ujian Lisan/Wawancara</div>
                <div>C4: Peragaan/Praktik</div>
                <div>C5: Penilaian Pekerjaan</div>
                <div>C6: Review Pekerjaan</div>
                <div>C7: Tes Tertulis</div>
                <div>C8: Pertanyaan Tertulis</div>
                <div>C9: Laporan Supervisor</div>
                <div>C10: Log Book Pekerjaan</div>
                <div>C11: Dokumen Portofolio</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-background rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">
                {editTarget ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Lengkapi informasi kurikulum.
              </p>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${errors.kode?.length ? "text-red-500" : "text-muted-foreground"}`}
                >
                  Kode MK
                </label>
                <Input
                  ref={formKode}
                  defaultValue={editTarget?.kode || ""}
                  placeholder="Contoh: TI123"
                  className={
                    errors.kode?.length
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={() => setErrors((prev) => { const { kode, ...rest } = prev; return rest; })}
                />
                {errors.kode && errors.kode.length > 0 && (
                  <p className="text-[10px] text-red-500">{errors.kode[0]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label
                  className={`text-xs font-bold uppercase tracking-wider ${errors.nama?.length ? "text-red-500" : "text-muted-foreground"}`}
                >
                  Nama Mata Kuliah
                </label>
                <Input
                  ref={formNama}
                  defaultValue={editTarget?.nama || ""}
                  placeholder="Contoh: Pemrograman Web"
                  className={
                    errors.nama?.length
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  onChange={() => setErrors((prev) => { const { nama, ...rest } = prev; return rest; })}
                />
                {errors.nama && errors.nama.length > 0 && (
                  <p className="text-[10px] text-red-500">{errors.nama[0]}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.sks?.length ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    Bobot SKS
                  </label>
                  <Input
                    ref={formSks}
                    type="number"
                    defaultValue={editTarget?.sks || ""}
                    placeholder="3"
                    className={
                      errors.sks?.length
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                    onChange={() => setErrors((prev) => { const { sks, ...rest } = prev; return rest; })}
                  />
                  {errors.sks && errors.sks.length > 0 && (
                    <p className="text-[10px] text-red-500">{errors.sks[0]}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    className={`text-xs font-bold uppercase tracking-wider ${errors.deskripsi?.length ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    Deskripsi
                  </label>
                  <Input
                    ref={formDesk}
                    defaultValue={editTarget?.deskripsi || ""}
                    placeholder="Opsional"
                    className={
                      errors.deskripsi?.length
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                    onChange={() =>
                      setErrors((prev) => { const { deskripsi, ...rest } = prev; return rest; })
                    }
                  />
                  {errors.deskripsi && errors.deskripsi.length > 0 && (
                    <p className="text-[10px] text-red-500">
                      {errors.deskripsi[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsFormModalOpen(false)}
                disabled={saveMutation.isPending}
              >
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Mata Kuliah"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Hapus Mata Kuliah
            </DialogTitle>
            <DialogDescription className="pt-2">
              Apakah Anda yakin ingin menghapus mata kuliah ini dari kurikulum?
              Matriks asesmen terkait akan ikut terhapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ya, Hapus Data"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Kelola CPMK */}
      {cpmkModalMk && (
        <Dialog open={!!cpmkModalMk} onOpenChange={() => setCpmkModalMk(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Kelola CPMK: {cpmkModalMk.nama}
              </DialogTitle>
              <DialogDescription className="pt-2">
                Capaian Pembelajaran Mata Kuliah (CPMK) menjadi landasan bagi
                Asesor untuk menguji kompetensi pendaftar.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/30 p-4 rounded-xl border border-dashed flex flex-col gap-2 my-2">
              <div className="flex gap-3">
                <div className="w-1/3 space-y-1">
                  <Input
                    ref={formCpmkKode}
                    placeholder="Kode (e.g. CPMK-1)"
                    className={`h-9 bg-background text-xs ${errors.cpmk_kode?.length ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    onChange={() =>
                      setErrors((prev) => { const { cpmk_kode, ...rest } = prev; return rest; })
                    }
                  />
                  {errors.cpmk_kode && errors.cpmk_kode.length > 0 && (
                    <p className="text-[10px] text-red-500 px-1">
                      {errors.cpmk_kode[0]}
                    </p>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    ref={formCpmkDesk}
                    placeholder="Deskripsi Capaian Pembelajaran"
                    className={`h-9 bg-background text-xs ${errors.cpmk_deskripsi?.length ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    onChange={() =>
                      setErrors((prev) => { const { cpmk_deskripsi, ...rest } = prev; return rest; })
                    }
                  />
                  {errors.cpmk_deskripsi && errors.cpmk_deskripsi.length > 0 && (
                    <p className="text-[10px] text-red-500 px-1">
                      {errors.cpmk_deskripsi[0]}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleAddCpmk}
                  disabled={cpmkSaveMutation.isPending}
                  size="sm"
                  className="h-9 shrink-0"
                >
                  {cpmkSaveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Tambah
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-2">
              <div className="space-y-2">
                {cpmkList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    Belum ada CPMK untuk mata kuliah ini.
                  </div>
                ) : (
                  cpmkList.map((c) => (
                    <div
                      key={c.id}
                      className="bg-card border rounded-lg p-3 hover:border-amber-200 transition-colors"
                    >
                      {editingCpmk?.id === c.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={editingCpmk.kode}
                              onChange={(e) => setEditingCpmk({ ...editingCpmk, kode: e.target.value })}
                              className="h-8 text-xs w-1/3"
                              placeholder="Kode"
                            />
                            <Input
                              value={editingCpmk.deskripsi}
                              onChange={(e) => setEditingCpmk({ ...editingCpmk, deskripsi: e.target.value })}
                              className="h-8 text-xs flex-1"
                              placeholder="Deskripsi"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setEditingCpmk(null)}
                            >
                              Batal
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={cpmkUpdateMutation.isPending}
                              onClick={() => cpmkUpdateMutation.mutate(editingCpmk)}
                            >
                              {cpmkUpdateMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Simpan"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 mb-1.5"
                            >
                              {c.kode}
                            </Badge>
                            <p className="text-sm leading-relaxed">{c.deskripsi}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => setEditingCpmk({ id: c.id, kode: c.kode, deskripsi: c.deskripsi })}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => cpmkDeleteMutation.mutate(c.id)}
                              disabled={cpmkDeleteMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button onClick={() => setCpmkModalMk(null)}>Selesai</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
