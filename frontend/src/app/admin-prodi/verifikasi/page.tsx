"use client";

import { SearchableSelect } from "@/components/SearchableSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { openPrivateFile, privateDocumentPath } from "@/lib/private-files";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  FileCheck,
  FileJson,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Send,
  Unlock,
  User,
  UserCheck,
  X,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

// ─── Komponen Timeline Jadwal Hari Ini ────────────────────────────────────────
function JadwalHariIni({ tanggal, pendaftaranId }: { tanggal: string; pendaftaranId: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-prodi", "jadwal-per-tanggal", tanggal],
    queryFn: async () => {
      const { data } = await api.get("/admin-prodi/jadwal-per-tanggal", { params: { tanggal } });
      return data.data as any[];
    },
    enabled: !!tanggal,
    staleTime: 30_000,
  });

  if (isLoading) return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Memuat jadwal hari ini...</span>
    </div>
  );

  const list = data || [];

  return (
    <div className="rounded-xl border bg-muted/20 overflow-hidden">
      <div className="px-3 py-2 bg-muted/40 border-b flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Jadwal di hari ini
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {list.length === 0 ? "Kosong" : `${list.length} jadwal`}
        </span>
      </div>
      {list.length === 0 ? (
        <p className="px-3 py-2.5 text-xs text-muted-foreground">Tidak ada jadwal lain, hari ini kosong.</p>
      ) : (
        <div className="divide-y">
          {list.map((j: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <span className="font-mono text-xs font-bold text-foreground w-10 shrink-0">{j.waktu}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${j.tipe === "at2"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                }`}>
                {j.tipe === "at2" ? "AT2" : "Pra Asesmen"}
              </span>
              <span className="text-xs text-foreground font-medium truncate flex-1">{j.pemohon}</span>
              {j.asesor?.length > 0 && (
                <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block truncate max-w-[120px]">
                  {j.asesor.join(", ")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Komponen Conflict Warning Jadwal ─────────────────────────────────────────
function KonflikJadwal({ tanggal, waktu, pendaftaranId, tipe }: {
  tanggal: string; waktu: string; pendaftaranId: string | null; tipe: string;
}) {
  const { data, isFetching } = useQuery({
    queryKey: ["admin-prodi", "cek-konflik", tanggal, waktu, pendaftaranId],
    queryFn: async () => {
      const { data } = await api.get("/admin-prodi/cek-konflik-jadwal", {
        params: { tanggal, waktu, durasi_menit: 90, pendaftaran_id: pendaftaranId, tipe },
      });
      return data;
    },
    enabled: !!(tanggal && waktu && waktu.match(/^\d{1,2}:\d{2}$/)),
    staleTime: 10_000,
  });

  if (isFetching) return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Memeriksa konflik jadwal...</span>
    </div>
  );
  if (!data) return null;

  if (!data.ada_konflik) return (
    <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium">Waktu ini aman, tidak ada konflik jadwal.</span>
    </div>
  );

  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-700 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/40 border-b border-amber-300 dark:border-amber-700">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Potensi Konflik Asesor</span>
      </div>
      <div className="divide-y divide-amber-200 dark:divide-amber-800/50 bg-amber-50 dark:bg-amber-900/20">
        {data.konflik.map((k: any, i: number) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${k.tipe === "at2"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              }`}>
              {k.tipe === "at2" ? "AT2" : "Pra Asesmen"}
            </span>
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">{k.pemohon} · {k.waktu}{/wita|wib/i.test(k.waktu || "") ? "" : " WITA"}</p>
              {k.asesor?.length > 0 && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Asesor yang sama: {k.asesor.join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-200 dark:border-amber-800">
        <p className="text-[11px] text-amber-600 dark:text-amber-500">
          Anda tetap bisa menyimpan jadwal ini. Pastikan ada koordinasi dengan asesor.
        </p>
      </div>
    </div>
  );
}

// Document List configuration matching database keys
const BASE_DAFTAR_DOKUMEN = [
  { id: "form01", label: "Aplikasi RPL (Form 01)", desc: "Data Diri, Pendidikan, Pengalaman Kerja, Dokumen Pendukung", required: true, systemGenerated: true },
  { id: "form02", label: "Evaluasi Diri (Form 02)", desc: "Matriks penilaian diri terhadap Capaian Pembelajaran MK", required: true, systemGenerated: true },
  { id: "form16", label: "Riwayat Hidup (Form 16)", desc: "Riwayat Pendidikan, Pelatihan Profesional, Penghargaan, Organisasi", required: true, systemGenerated: true },
  { id: "ijazah", label: "Ijazah Akademik Asal", desc: "Scan ijazah asli dari instansi/perguruan tinggi asal", required: true, systemGenerated: false },
  { id: "transkrip", label: "Transkrip Akademik Asal", desc: "Scan transkrip nilai asli dari instansi asal", required: true, systemGenerated: false },
];

type ValidationStatus = "valid" | "invalid" | null;

interface DocValidation {
  status: ValidationStatus;
  catatan: string;
}

interface AsesorItem {
  id: number;
  nama: string;
  email: string;
  nip: string;
}

function VerifikasiBerkasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"verifikasi" | "biodata" | "evaluasi" | "transkrip">("verifikasi");
  const [validations, setValidations] = useState<Record<string, DocValidation>>({});
  const [asesor1, setAsesor1] = useState("");
  const [asesor2, setAsesor2] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [tempat, setTempat] = useState("");
  const [linkMeeting, setLinkMeeting] = useState("");
  const [praPemetaan, setPraPemetaan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  // Fetch applicant details
  const { data: pendaftaran, isLoading, error } = useQuery({
    queryKey: ["pendaftaran-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/admin-prodi/pendaftaran/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const DAFTAR_DOKUMEN = useMemo(() => {
    const list = [...BASE_DAFTAR_DOKUMEN];
    if (pendaftaran?.dokumen) {
      pendaftaran.dokumen.forEach((doc: any) => {
        if (doc.tipe !== "ijazah" && doc.tipe !== "transkrip" && doc.tipe !== "pas_foto") {
          list.push({
            id: doc.tipe,
            label: doc.deskripsi || "Dokumen Pendukung",
            desc: doc.file_name || doc.tipe,
            required: false,
            systemGenerated: false,
          });
        }
      });
    }
    return list;
  }, [pendaftaran]);

  // Fetch available asesors
  const { data: asesors = [] } = useQuery<AsesorItem[]>({
    queryKey: ["admin-prodi-asesor"],
    queryFn: async () => {
      const { data } = await api.get("/admin-prodi/asesor");
      return data.data;
    },
  });

  // Populate validations from database if already verified
  useEffect(() => {
    if (pendaftaran?.verifikasi_berkas) {
      const initialValidations: Record<string, DocValidation> = {};
      pendaftaran.verifikasi_berkas.forEach((v: any) => {
        initialValidations[v.kode_dokumen] = {
          status: v.status as ValidationStatus,
          catatan: v.catatan || "",
        };
      });
      setValidations(initialValidations);
      // populate existing assignments
      if (pendaftaran.penugasan_asesor) {
        const a1 = pendaftaran.penugasan_asesor.find((p: any) => p.urutan === "asesor_1");
        const a2 = pendaftaran.penugasan_asesor.find((p: any) => p.urutan === "asesor_2");
        if (a1) setAsesor1(a1.asesor_id.toString());
        if (a2) setAsesor2(a2.asesor_id.toString());
      }

      // populate existing jadwal
      if (pendaftaran.jadwal_asesmen) {
        setTanggal(pendaftaran.jadwal_asesmen.tanggal || "");
        setWaktu(pendaftaran.jadwal_asesmen.waktu || "");
        setTempat(pendaftaran.jadwal_asesmen.tempat || "");
        setLinkMeeting(pendaftaran.jadwal_asesmen.link_meeting || "");
        setPraPemetaan(pendaftaran.jadwal_asesmen.catatan || "");
      }
    }
  }, [pendaftaran]);

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold">ID Pendaftaran Tidak Ditemukan</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Silakan kembali ke antrean pendaftar dan pilih berkas yang ingin diverifikasi.
        </p>
        <Link href="/admin-prodi/dashboard">
          <Button className="mt-2 bg-indigo-600 text-white hover:bg-indigo-700">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-muted-foreground animate-pulse">Memuat detail pendaftar...</p>
      </div>
    );
  }

  if (error || !pendaftaran) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold">Gagal Memuat Data</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Terjadi kesalahan saat mengambil berkas pendaftar dari server. Silakan coba kembali.
        </p>
        <Link href="/admin-prodi/dashboard">
          <Button className="mt-2" variant="outline">Kembali ke Dashboard</Button>
        </Link>
      </div>
    );
  }

  const getValidation = (docId: string): DocValidation =>
    validations[docId] || { status: null, catatan: "" };

  const setDocStatus = (docId: string, status: ValidationStatus) => {
    setValidations(prev => ({
      ...prev,
      [docId]: { ...getValidation(docId), status: status === getValidation(docId).status ? null : status },
    }));
  };

  const setDocCatatan = (docId: string, catatan: string) => {
    setValidations(prev => ({
      ...prev,
      [docId]: { ...getValidation(docId), catatan },
    }));
  };

  const requiredDocs = DAFTAR_DOKUMEN.filter(d => d.required);
  const allRequiredValidated = requiredDocs.every(d => getValidation(d.id).status === "valid");
  const hasInvalidDoc = DAFTAR_DOKUMEN.some(d => getValidation(d.id).status === "invalid");
  const validatedCount = DAFTAR_DOKUMEN.filter(d => getValidation(d.id).status !== null).length;

  const canAssignAsesor = allRequiredValidated && !hasInvalidDoc;
  const asesorSelected = asesor1 && asesor2 && asesor1 !== asesor2;
  const isFormComplete = canAssignAsesor && asesorSelected && tanggal && waktu && tempat;

  // Handle Complete Verification and Assignment
  const handleVerifyAndAssign = async () => {
    if (!isFormComplete) return;
    setIsSubmitting(true);

    try {
      const items = DAFTAR_DOKUMEN.map((doc) => {
        // If it's an optional doc and NOT uploaded, we shouldn't send 'invalid'
        const isNotUploaded = !doc.systemGenerated && !pendaftaran?.dokumen?.find((d: any) => d.jenis_dokumen === doc.id);
        if (!doc.required && isNotUploaded) {
          return null;
        }
        return {
          kode_dokumen: doc.id,
          status: validations[doc.id]?.status || "invalid",
          catatan: validations[doc.id]?.catatan || "",
        };
      }).filter(Boolean);

      // 1. Submit validations and move flow status to pra_asesmen
      await api.post(`/admin-prodi/pendaftaran/${id}/verifikasi`, {
        items,
        submit: true,
      });

      // 2. Assign advisors
      await api.post(`/admin-prodi/pendaftaran/${id}/assign-asesor`, {
        asesor_1_id: Number(asesor1),
        asesor_2_id: Number(asesor2),
      });

      // 3. Create assessment schedule
      await api.post(`/admin-prodi/jadwal`, {
        pendaftaran_id: Number(id),
        tanggal,
        waktu,
        tempat,
        link_meeting: linkMeeting || null,
        catatan: praPemetaan || null,
      });

      toast.success("Verifikasi berhasil diselesaikan dan Asesor telah ditugaskan!");
      queryClient.invalidateQueries({ queryKey: ["pendaftaran"] });
      router.push("/admin-prodi/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses verifikasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unlock and return form to student (Pre-submit state) to correct documents
  const handleUnlockAndReturn = async () => {
    setIsUnlocking(true);
    try {
      const items = DAFTAR_DOKUMEN.map((doc) => ({
        kode_dokumen: doc.id,
        status: validations[doc.id]?.status || null,
        catatan: validations[doc.id]?.catatan || "",
      })).filter(item => item.status !== null);

      if (items.length > 0) {
        // Save status validations first
        await api.post(`/admin-prodi/pendaftaran/${id}/verifikasi`, { items });
      }

      // Rollback status to pre_submit so they can edit
      await api.patch(`/admin-prodi/pendaftaran/${id}/status`, {
        status_alur: "pre_submit",
        catatan_admin: "Terdapat berkas verifikasi yang tidak valid. Silakan periksa catatan admin dan lengkapi ulang dokumen Anda."
      });

      toast.success("Berkas dikembalikan ke pemohon. Gembok pengisian telah dibuka.");
      setShowUnlockDialog(false);
      queryClient.invalidateQueries({ queryKey: ["pendaftaran"] });
      router.push("/admin-prodi/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal mengembalikan berkas ke pemohon.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Modal Konfirmasi Buka Gembok */}
      <AnimatePresence>
        {showUnlockDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <Unlock className="h-5 w-5" />
                  <h2 className="text-base font-bold">Buka Gembok Formulir</h2>
                </div>
                <button
                  onClick={() => setShowUnlockDialog(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  disabled={isUnlocking}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Tindakan ini akan mengembalikan status pendaftaran{" "}
                <span className="font-semibold text-foreground">
                  {pendaftaran?.user?.nama}
                </span>{" "}
                ke tahap <span className="font-semibold text-foreground">pengisian borang</span>. Pemohon akan menerima notifikasi dan dapat memperbaiki dokumen mereka.
              </p>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed mb-6">
                <strong>Perhatian:</strong> Data verifikasi yang sudah diisi akan tetap tersimpan sebagai referensi, namun status alur akan dikembalikan ke awal.
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUnlockDialog(false)}
                  disabled={isUnlocking}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleUnlockAndReturn}
                  disabled={isUnlocking}
                  className="gap-2"
                >
                  {isUnlocking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                  Ya, Buka Gembok
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin-prodi/dashboard">
            <Button variant="outline" size="icon" className="h-8 w-8 hover:bg-indigo-50 dark:hover:bg-indigo-950/30">
              <ChevronLeft className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{pendaftaran.user?.nama || "Pendaftar"}</h1>
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                Verifikasi Berkas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendaftaran.nomor_pendaftaran || `RPL-${pendaftaran.id}`} • {pendaftaran.user?.email} • {pendaftaran.user?.phone || "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasInvalidDoc && (
            <Button
              variant="destructive"
              onClick={() => setShowUnlockDialog(true)}
              disabled={isUnlocking}
              className="gap-2 text-white bg-red-600 hover:bg-red-700"
            >
              {isUnlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
              Kembalikan ke Pemohon
            </Button>
          )}
          <Button
            disabled={!isFormComplete || isSubmitting}
            onClick={handleVerifyAndAssign}
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Verifikasi & Tugaskan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b gap-1 bg-muted/20 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("verifikasi")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === "verifikasi"
            ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
        >
          <FileCheck className="h-4 w-4" />
          Verifikasi & Penugasan
        </button>
        <button
          onClick={() => setActiveTab("biodata")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === "biodata"
            ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
        >
          <User className="h-4 w-4" />
          Biodata Aplikasi RPL
        </button>
        <button
          onClick={() => setActiveTab("evaluasi")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === "evaluasi"
            ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
        >
          <GraduationCap className="h-4 w-4" />
          Evaluasi Diri MK
        </button>
        <button
          onClick={() => setActiveTab("transkrip")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === "transkrip"
            ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
        >
          <BookOpen className="h-4 w-4" />
          Transkrip PT Asal
        </button>
      </div>

      {/* Tab 1: Verifikasi & Penugasan */}
      {activeTab === "verifikasi" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT COLUMN: Daftar Validasi Dokumen (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-foreground text-base">Validasi Kelengkapan Dokumen</h2>
              </div>
              <Badge variant="outline" className="text-xs bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300">
                {validatedCount}/{DAFTAR_DOKUMEN.length} Diperiksa
              </Badge>
            </div>

            {/* Progress */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(validatedCount / DAFTAR_DOKUMEN.length) * 100}%` }}
              />
            </div>

            {/* Document Cards */}
            <div className="space-y-4">
              {DAFTAR_DOKUMEN.map((doc) => {
                const v = getValidation(doc.id);
                const isValid = v.status === "valid";
                const isInvalid = v.status === "invalid";

                // Check if this document has an uploaded file in the database
                const uploadedFile = pendaftaran.dokumen?.find(
                  (d: any) => d.tipe === doc.id
                );
                const isNotUploaded = !doc.systemGenerated && !uploadedFile;

                return (
                  <div
                    key={doc.id}
                    className={`border rounded-xl p-4 transition-all duration-300 ${isValid
                      ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/10 dark:bg-emerald-900/5"
                      : isInvalid
                        ? "border-red-200 dark:border-red-800/50 bg-red-50/10 dark:bg-red-900/5"
                        : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Icon */}
                      <div className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${isValid
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                        : isInvalid
                          ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                          : "bg-muted text-muted-foreground"
                        }`}>
                        {isValid ? <CheckCircle2 className="h-5 w-5" /> : isInvalid ? <XCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{doc.label}</span>
                          {doc.required ? (
                            <Badge variant="outline" className="text-[10px] border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">Wajib</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">Opsional</Badge>
                          )}
                          {doc.systemGenerated && (
                            <Badge variant="outline" className="text-[10px] border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">Sistem Generated</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{doc.desc}</p>

                        {/* File Details if uploaded */}
                        {uploadedFile && (
                          <div className="bg-muted/40 p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileJson className="h-4 w-4 shrink-0 text-indigo-500" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate text-foreground">{uploadedFile.file_name}</p>
                                <p className="text-[10px] text-muted-foreground">{(uploadedFile.file_size / 1024).toFixed(1)} KB • {uploadedFile.deskripsi || "Tidak ada deskripsi"}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] gap-1 px-3 self-end sm:self-auto text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800/80 dark:hover:bg-indigo-950/20"
                              onClick={() =>
                                openPrivateFile(
                                  privateDocumentPath(uploadedFile.id),
                                )
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
                              Buka Dokumen
                            </Button>
                          </div>
                        )}

                        {/* Catatan Input (always visible or expandable on invalid) */}
                        {isInvalid && (
                          <div className="mt-3 animate-fade-in">
                            <Textarea
                              value={v.catatan}
                              onChange={(e) => setDocCatatan(doc.id, e.target.value)}
                              placeholder="Tuliskan catatan detail dokumen tidak valid..."
                              className="min-h-[65px] text-xs bg-background"
                            />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {doc.systemGenerated && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                            onClick={() => setActiveTab(doc.id === "form02" ? "evaluasi" : "biodata")}
                          >
                            Tinjau
                          </Button>
                        )}
                        {!doc.systemGenerated && isNotUploaded ? (
                          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border">
                            Belum Diunggah
                          </span>
                        ) : (
                          <>
                            <Button
                              variant={isValid ? "default" : "outline"}
                              size="sm"
                              className={`h-8 text-xs px-3 ${isValid ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" : ""}`}
                              onClick={() => setDocStatus(doc.id, "valid")}
                            >
                              Valid
                            </Button>
                            <Button
                              variant={isInvalid ? "destructive" : "outline"}
                              size="sm"
                              className="h-8 text-xs px-3"
                              onClick={() => setDocStatus(doc.id, "invalid")}
                            >
                              Tidak Valid
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Penugasan Asesor + Pra-Pemetaan (2/5) */}
          <div className={`lg:col-span-2 space-y-6 ${!canAssignAsesor ? "opacity-50 pointer-events-none" : ""}`}>
            {!canAssignAsesor && (
              <div className="bg-amber-50/50 dark:bg-amber-950/15 border border-dashed border-amber-300 dark:border-amber-900 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
                  Validasi seluruh dokumen wajib di sebelah kiri terlebih dahulu sebelum menugaskan Asesor dan mengatur jadwal.
                </p>
              </div>
            )}

            {/* Section: Penugasan Asesor */}
            <section className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <UserCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="font-bold text-foreground text-base">Penugasan Asesor</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asesor 1</Label>
                  <SearchableSelect
                    options={asesors
                      .filter(a => a.id.toString() !== asesor2)
                      .map(a => ({
                        value: a.id.toString(),
                        label: a.nama,
                        sublabel: a.nip || "NIP Kosong",
                      }))}
                    value={asesor1}
                    onChange={(val) => setAsesor1(val || "")}
                    placeholder="Pilih Asesor 1"
                    searchPlaceholder="Cari nama atau NIP asesor..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asesor 2</Label>
                  <SearchableSelect
                    options={asesors
                      .filter(a => a.id.toString() !== asesor1)
                      .map(a => ({
                        value: a.id.toString(),
                        label: a.nama,
                        sublabel: a.nip || "NIP Kosong",
                      }))}
                    value={asesor2}
                    onChange={(val) => setAsesor2(val || "")}
                    placeholder="Pilih Asesor 2"
                    searchPlaceholder="Cari nama atau NIP asesor..."
                  />
                </div>

                {asesor1 && asesor2 && asesor1 === asesor2 && (
                  <p className="text-xs text-red-600 font-medium">Asesor 1 dan Asesor 2 tidak boleh orang yang sama.</p>
                )}
              </div>
            </section>

            {/* Section: Jadwal Asesmen */}
            <section className={`bg-card rounded-2xl border shadow-sm p-5 space-y-4 ${!asesorSelected ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="pb-2 border-b">
                <h2 className="font-bold text-foreground text-base">Jadwal Asesmen</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="pl-10 bg-background" />
                  </div>
                </div>

                {/* Timeline jadwal hari yang dipilih */}
                {tanggal && <JadwalHariIni tanggal={tanggal} pendaftaranId={id} />}

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Waktu Mulai</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={waktu} onChange={(e) => setWaktu(e.target.value)} className="pl-10 bg-background" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Gunakan format 24 jam, contoh: 09:00</p>
                </div>

                {/* Conflict warning */}
                {tanggal && waktu && waktu.match(/^\d{1,2}:\d{2}$/) && (
                  <KonflikJadwal tanggal={tanggal} waktu={waktu} pendaftaranId={id} tipe="pra_asesmen" />
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tempat</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea value={tempat} onChange={(e) => setTempat(e.target.value)} placeholder="Ruang Sidang Lt. 3, Gedung Kantor Pusat Poliban" className="pl-10 min-h-[60px] resize-y bg-background" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Link Meeting (Opsional)</Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={linkMeeting} onChange={(e) => setLinkMeeting(e.target.value)} placeholder="https://zoom.us/j/..." className="pl-10 bg-background" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Catatan Pra-Pemetaan */}
            <section className="bg-card rounded-2xl border shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h2 className="font-bold text-foreground text-base">Pra-Pemetaan & Catatan Asesor</h2>
                </div>
                <Badge variant="secondary" className="font-normal text-[10px]">Opsional</Badge>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tuliskan catatan penting, SLA penilaian, atau rekomendasi alih kredit MK asal kepada tim Asesor yang bertugas.
                </p>
                <Textarea
                  value={praPemetaan}
                  onChange={(e) => setPraPemetaan(e.target.value)}
                  placeholder="Contoh: Periksa kemiripan syllabus MK Pemrograman Web (PT Asal) dengan TI302. Rekomendasi alih kredit penuh."
                  className="min-h-[100px] resize-y bg-background"
                />
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Tab 2: Biodata Aplikasi RPL */}
      {activeTab === "biodata" && (
        <div className="space-y-8 bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          {/* Data Diri */}
          <section className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2 text-indigo-600 dark:text-indigo-400">
              <User className="h-5 w-5" />
              A. Biodata Pendaftar
            </h2>

            {pendaftaran.data_diri ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Nama Lengkap</Label>
                  <p className="text-sm font-semibold">{pendaftaran.data_diri.nama_lengkap}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">NIK / No. KTP</Label>
                  <p className="text-sm font-mono">{pendaftaran.data_diri.nik}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tempat, Tanggal Lahir</Label>
                  <p className="text-sm">
                    {pendaftaran.data_diri.tempat_lahir}, {pendaftaran.data_diri.tanggal_lahir ? new Date(pendaftaran.data_diri.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Jenis Kelamin</Label>
                  <p className="text-sm capitalize">
                    {pendaftaran.data_diri.jenis_kelamin === 'L' ? 'Laki-Laki' :
                      pendaftaran.data_diri.jenis_kelamin === 'P' ? 'Perempuan' :
                        pendaftaran.data_diri.jenis_kelamin}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">No. HP / WhatsApp</Label>
                  <p className="text-sm">{pendaftaran.data_diri.no_hp || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Email Pribadi</Label>
                  <p className="text-sm">{pendaftaran.data_diri.email_pribadi || "-"}</p>
                </div>
                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Alamat Lengkap</Label>
                  <p className="text-sm">{pendaftaran.data_diri.alamat}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Pemohon belum melengkapi data diri.</p>
            )}
          </section>

          {/* Riwayat Pendidikan */}
          <section className="space-y-6 pt-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="h-5 w-5" />
              B. Riwayat Pendidikan Formal
            </h2>

            {pendaftaran.riwayat_pendidikan && pendaftaran.riwayat_pendidikan.length > 0 ? (
              <div className="overflow-x-auto border rounded-xl bg-card">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/40 uppercase font-semibold border-b">
                    <tr>
                      <th className="px-6 py-3">Jenjang</th>
                      <th className="px-6 py-3">Institusi Sekolah / Kampus</th>
                      <th className="px-6 py-3">Jurusan / Program Studi</th>
                      <th className="px-6 py-3 text-center">Tahun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendaftaran.riwayat_pendidikan.map((edu: any) => (
                      <tr key={edu.id} className="hover:bg-muted/10">
                        <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 uppercase">{edu.jenjang}</td>
                        <td className="px-6 py-4 font-medium">{edu.institusi}</td>
                        <td className="px-6 py-4 text-muted-foreground">{edu.program_studi || "-"}</td>
                        <td className="px-6 py-4 text-center tabular-nums text-muted-foreground">{edu.tahun_masuk} - {edu.tahun_lulus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Tidak ada riwayat pendidikan yang diinput.</p>
            )}
          </section>

          {/* Pengalaman Kerja */}
          <section className="space-y-6 pt-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b pb-2 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="h-5 w-5" />
              C. Pengalaman Kerja & Pelatihan
            </h2>

            {pendaftaran.pengalaman_kerja && pendaftaran.pengalaman_kerja.length > 0 ? (
              <div className="space-y-4">
                {pendaftaran.pengalaman_kerja.map((job: any) => (
                  <div key={job.id} className="p-5 border rounded-xl hover:bg-muted/5 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-base text-foreground">{job.jabatan_peran}</h4>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{job.nama} • {job.bidang || "Umum"}</p>
                      </div>
                      <Badge variant="secondary" className="w-fit font-semibold tabular-nums">
                        {job.tahun_mulai} - {job.tahun_selesai || "Sekarang"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-3 rounded-lg border">{job.deskripsi}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Tidak ada riwayat pengalaman kerja yang diinput.</p>
            )}
          </section>
        </div>
      )}

      {/* Tab 3: Evaluasi Diri MK */}
      {activeTab === "evaluasi" && (
        <div className="space-y-6 bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <GraduationCap className="h-5 w-5" />
              Evaluasi Mandiri & Capaian Pembelajaran (CPMK)
            </h2>
            <p className="text-xs text-muted-foreground">
              Berikut adalah penilaian kemampuan pemohon secara mandiri terhadap Capaian Pembelajaran Mata Kuliah (CPMK).
            </p>
          </div>

          {pendaftaran.evaluasi_diri && pendaftaran.evaluasi_diri.length > 0 ? (
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/40 uppercase font-semibold border-b">
                  <tr>
                    <th className="px-6 py-3 w-32">Mata Kuliah / CPMK</th>
                    <th className="px-6 py-3">Deskripsi Capaian</th>
                    <th className="px-6 py-3 text-center w-36">Tingkat Profisiensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendaftaran.evaluasi_diri.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/10">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {item.cpmk?.mata_kuliah?.kode || "MK"} / {item.cpmk?.kode || "CPMK"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-xs text-foreground mb-1">{item.cpmk?.mata_kuliah?.nama || "Mata Kuliah"}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.cpmk?.deskripsi || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant="outline"
                          className={`capitalize font-bold text-xs ${item.profisiensi === "mampu" || item.profisiensi === "tahu"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900"
                            }`}
                        >
                          {item.profisiensi || "-"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Pemohon belum melakukan evaluasi diri.</p>
          )}
        </div>
      )}

      {/* Tab 4: Transkrip PT Asal */}
      {activeTab === "transkrip" && (
        <div className="space-y-6 bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
              <BookOpen className="h-5 w-5" />
              Mata Kuliah Terdaftar di Perguruan Tinggi Asal
            </h2>
            <p className="text-xs text-muted-foreground">
              Daftar mata kuliah yang telah diselesaikan pemohon di perguruan tinggi asal, diunggah via Transkrip Akademik.
            </p>
          </div>

          {pendaftaran.transkrip_asal && pendaftaran.transkrip_asal.length > 0 ? (
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/40 uppercase font-semibold border-b">
                  <tr>
                    <th className="px-6 py-3 text-center w-24">Semester</th>
                    <th className="px-6 py-3">Nama Mata Kuliah Asal</th>
                    <th className="px-6 py-3 text-center w-24">SKS</th>
                    <th className="px-6 py-3 text-center w-32">Nilai Huruf</th>
                    <th className="px-6 py-3 text-center w-32">Bobot Angka</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendaftaran.transkrip_asal.map((mk: any) => (
                    <tr key={mk.id} className="hover:bg-muted/10">
                      <td className="px-6 py-4 text-center font-semibold tabular-nums text-muted-foreground">{mk.semester}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{mk.nama_mk}</td>
                      <td className="px-6 py-4 text-center tabular-nums font-semibold">{mk.sks}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                          {mk.nilai_huruf}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold font-mono tabular-nums text-muted-foreground">{mk.nilai_angka}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Tidak ada mata kuliah transkrip asal yang diinput.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifikasiBerkasPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm text-muted-foreground animate-pulse">Memuat modul verifikasi...</p>
      </div>
    }>
      <VerifikasiBerkasContent />
    </Suspense>
  );
}
