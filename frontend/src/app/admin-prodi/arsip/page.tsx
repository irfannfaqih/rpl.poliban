"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  Megaphone,
  Upload
} from "lucide-react";
import { useState } from "react";

import { SearchableSelect } from "@/components/SearchableSelect";
import api from "@/lib/api";
import { openPrivateFile, privateArchivePath } from "@/lib/private-files";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// F13 dinonaktifkan sementara karena Matriks Asesmen MK belum dipakai workflow.
const dokumenMaster = [
  { id: "F01", nama: "Aplikasi RPL", isAuto: true, isRequired: true },
  { id: "F02", nama: "Pra Asesmen", isAuto: true, isRequired: true },
  { id: "F03", nama: "Asesmen Mandiri", isAuto: true, isRequired: true },
  { id: "F04", nama: "Asesmen Portofolio", isAuto: true, isRequired: true },
  { id: "F05", nama: "Asesmen Capaian Pembelajaran", isAuto: true, isRequired: true },
  { id: "F06", nama: "Tanda Terima Portofolio", isAuto: true, isRequired: true },
  { id: "F07", nama: "Biodata Asesor", isAuto: true, isRequired: true },
  { id: "F08", nama: "Asesmen Tahap 2", isAuto: false, isRequired: true },
  { id: "F09", nama: "Perangkat Asesmen Tulis", isAuto: true, isRequired: true },
  { id: "F10", nama: "Lembar Jawaban Tulis", isAuto: true, isRequired: true },
  { id: "F11", nama: "Lembar Pertanyaan Lisan", isAuto: true, isRequired: true },
  { id: "F12", nama: "Matriks Alih Kredit Pemohon RPL", isAuto: false, isRequired: true },
  { id: "F14", nama: "Rekap Asesmen Prodi", isAuto: false, isRequired: true },
  { id: "F15", nama: "Rekap Asesmen Pemohon", isAuto: false, isRequired: true },
  { id: "F16", nama: "Daftar Riwayat Hidup", isAuto: true, isRequired: true },
  { id: "F17", nama: "Surat Sanggah", isAuto: true, isRequired: false },
  { id: "F18", nama: "Rekap Mahasiswa RPL", isAuto: false, isRequired: true },
  { id: "F19", nama: "Berita Acara Asesmen", isAuto: false, isRequired: true },
];

export default function LokerArsipPage() {
  const [selectedPemohon, setSelectedPemohon] = useState<number | "">("");
  const queryClient = useQueryClient();

  const { data: pendaftaransData, isLoading: pendaftaransLoading } = useQuery({
    queryKey: ['admin-prodi', 'arsip'],
    queryFn: async () => {
      const res = await api.get('/admin-prodi/arsip');
      return res.data.data; // array of pendaftarans
    }
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-prodi', 'arsip', selectedPemohon],
    queryFn: async () => {
      if (!selectedPemohon) return null;
      const res = await api.get(`/admin-prodi/arsip/${selectedPemohon}`);
      return res.data.data;
    },
    enabled: !!selectedPemohon,
  });

  // Uploaded forms will be the keys of detailData.uploaded_forms object
  const uploadedForms = detailData?.uploaded_forms ? Object.keys(detailData.uploaded_forms) : [];

  const uploadMutation = useMutation({
    mutationFn: async ({ id, file, kode_formulir }: { id: number, file: File, kode_formulir: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kode_formulir', kode_formulir);
      const res = await api.post(`/admin-prodi/arsip/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Dokumen berhasil diunggah!");
      queryClient.invalidateQueries({ queryKey: ['admin-prodi', 'arsip', selectedPemohon] });
    },
    onError: () => {
      toast.error("Gagal mengunggah dokumen.");
    }
  });

  const handleUploadClick = (docId: string) => {
    // create a hidden input file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file && selectedPemohon) {
        uploadMutation.mutate({ id: selectedPemohon as number, file, kode_formulir: docId });
      }
    };
    input.click();
  };

  const handleDownloadPdf = async (docId: string) => {
    if (!selectedPemohon) return;
    const toastId = toast.loading(`Mengunduh dokumen ${docId}...`);
    try {
      const response = await api.get(`/admin-prodi/arsip/${selectedPemohon}/pdf/${docId}`, {
        responseType: 'blob' // Penting: karena API mengembalikan file binary
      });

      // Ambil nama file dari header jika ada, atau gunakan default
      let filename = `${docId}_Pendaftaran_${selectedPemohon}.pdf`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename="(.+)"/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Buat URL untuk blob dan trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Bersihkan
      window.URL.revokeObjectURL(url);
      link.parentNode?.removeChild(link);

      toast.success(`Berhasil mengunduh dokumen ${docId}`, { id: toastId });
    } catch (err) {
      toast.error("Gagal mendownload PDF", { id: toastId });
    }
  };

  const requiredCount = dokumenMaster.filter(d => d.isRequired).length;
  const completedCount = dokumenMaster.filter(d => {
    if (!d.isRequired) return true;
    if (d.isAuto) return true;
    return uploadedForms.includes(d.id);
  }).length;

  const progressPercentage = Math.round((completedCount / requiredCount) * 100);
  const isAllComplete = progressPercentage === 100;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Loker Arsip Dokumen</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola dokumen fisik/digital untuk setiap pemohon. Upload scan dokumen yang membutuhkan tanda tangan basah.
        </p>
      </div>

      {/* Select Pemohon */}
      <div className="bg-card rounded-2xl border shadow-sm p-6">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
          Pilih Pendaftar
        </label>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <SearchableSelect
              options={(pendaftaransData || []).map((p: any) => ({
                value: String(p.id),
                label: p.nama || "Tanpa Nama",
                sublabel: p.nim,
              }))}
              value={selectedPemohon ? String(selectedPemohon) : ""}
              onChange={(val) => setSelectedPemohon(val ? Number(val) : "")}
              placeholder="Pilih mahasiswa untuk melihat arsip..."
              searchPlaceholder="Cari nama atau NIM..."
              loading={pendaftaransLoading}
            />
          </div>


          {selectedPemohon && (
            <div className="flex-1 w-full max-w-md self-center mt-2 sm:mt-0">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Kelengkapan Dokumen Wajib</span>
                <span className="text-xs font-bold text-slate-900">{completedCount} / {requiredCount} ({progressPercentage}%)</span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border">
                <div
                  className={`h-full transition-all duration-1000 ${isAllComplete ? 'bg-emerald-500' : 'bg-blue-600'}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPemohon && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
          {detailLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
          <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm">Daftar Formulir Master</h3>
            </div>

            <Button
              className={`gap-2 ${isAllComplete ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              disabled={!isAllComplete}
            >
              <Megaphone className="h-4 w-4" />
              Publikasi Hasil Akhir
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-muted-foreground bg-muted/10 border-b uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold w-24 text-center">Kode</th>
                  <th className="px-6 py-3 font-semibold">Nama Dokumen</th>
                  <th className="px-6 py-3 font-semibold">Tipe Arsip</th>
                  <th className="px-6 py-3 font-semibold w-40">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dokumenMaster.map((doc) => {
                  const isUploaded = uploadedForms.includes(doc.id);
                  const isComplete = doc.isAuto || isUploaded;

                  return (
                    <tr key={doc.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-3 text-center">
                        <Badge variant="outline" className="bg-background font-mono">{doc.id}</Badge>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-foreground">{doc.nama}</div>
                        {!doc.isRequired && <span className="text-[10px] text-muted-foreground block">Opsional (Jika ada)</span>}
                      </td>
                      <td className="px-6 py-3">
                        {doc.isAuto ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            Auto-generated
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-500 flex items-center gap-1.5">
                            TTD Basah
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {isComplete ? (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 gap-1.5 justify-center w-28">
                            <CheckCircle2 className="h-3 w-3" />
                            Lengkap
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 gap-1.5 justify-center w-28">
                            <Clock className="h-3 w-3" />
                            Menunggu TTD
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/40"
                            onClick={() => handleDownloadPdf(doc.id)}
                            title={doc.isAuto ? "Download PDF" : "Download Template untuk dicetak dan di TTD"}
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{doc.isAuto ? "PDF" : "Cetak Template"}</span>
                          </Button>

                          {!doc.isAuto && isUploaded && detailData?.uploaded_forms?.[doc.id] && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                              onClick={() =>
                                openPrivateFile(
                                  privateArchivePath(
                                    detailData.uploaded_forms[doc.id].id,
                                  ),
                                )
                              }
                              title="Lihat Scan TTD"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Lihat Scan</span>
                            </Button>
                          )}

                          {!doc.isAuto && (
                            <Button
                              variant={isUploaded ? "outline" : "default"}
                              size="sm"
                              className={`h-8 gap-2 w-28 ${isUploaded ? 'bg-background border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40' : 'bg-primary text-primary-foreground'}`}
                              onClick={() => handleUploadClick(doc.id)}
                              disabled={uploadMutation.isPending}
                            >
                              {isUploaded ? (
                                <>
                                  <Check className="h-3.5 w-3.5" /> Re-upload
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3.5 w-3.5" /> Upload Scan
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
