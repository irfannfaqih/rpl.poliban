"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UjiLanjutan {
  id: number;
  fase_tulis: string;
  status: string;
  tanggal_ujian: string | null;
  waktu_ujian: string | null;
  tempat: string | null;
  catatan_asesor: { is_submitted: boolean; nilai_akhir: number | null }[];
}

interface PendaftaranItem {
  id: number;
  nomor_pendaftaran: string;
  user: { nama: string };
  prodi: { nama: string };
  uji_lanjutan: UjiLanjutan | null;  // hasOne — bukan array
}

// Label dan warna badge status
function getStatusBadge(fase: string, sudahSubmit: boolean) {
  if (sudahSubmit) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Penilaian Disubmit
      </Badge>
    );
  }
  switch (fase) {
    case "buat_soal":
      return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400">Buat Instrumen</Badge>;
    case "menunggu_jawaban":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">Menunggu Jawaban</Badge>;
    case "koreksi":
      return <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400">Pelaksanaan & Penilaian</Badge>;
    case "selesai":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300">Selesai</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">{fase}</Badge>;
  }
}

export default function UjiLanjutanDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useQuery<{ data: PendaftaranItem[] }>({
    queryKey: ["asesor", "asesmen-tahap-2"],
    queryFn: async () => {
      const res = await api.get("/asesor/uji-lanjutan");
      return res.data;
    },
  });

  const pendaftarans = data?.data || [];

  const filtered = pendaftarans.filter((p) =>
    (p.user?.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.nomor_pendaftaran || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Asesmen Tahap 2</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kelola instrumen asesmen dan berikan penilaian untuk pemohon yang membutuhkan Asesmen Tahap 2.
        </p>
      </div>

      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama pemohon atau nomor pendaftaran..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Pendaftaran</th>
                <th className="px-6 py-4">Pemohon & Prodi</th>
                <th className="px-6 py-4">Jadwal</th>
                <th className="px-6 py-4">Status AT2</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Memuat data...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-red-500">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    Gagal memuat data.
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => {
                  const uji = item.uji_lanjutan;   // hasOne — langsung object
                  const fase = uji?.fase_tulis || "buat_soal";
                  const sudahSubmit = uji?.catatan_asesor?.[0]?.is_submitted ?? false;
                  const jadwalTanggal = uji?.tanggal_ujian
                    ? new Date(uji.tanggal_ujian).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                    : null;

                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-muted-foreground">
                        {item.nomor_pendaftaran}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{item.user?.nama || "Tanpa Nama"}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.prodi?.nama || "-"}</div>
                      </td>
                      <td className="px-6 py-4">
                        {jadwalTanggal ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                              {jadwalTanggal}
                            </div>
                            {uji?.waktu_ujian && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> {uji.waktu_ujian}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium">Belum Diatur</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(fase, sudahSubmit)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => router.push(`/asesor/asesmen-tahap-2/form?pendaftaranId=${item.id}`)}
                        >
                          {sudahSubmit ? "Lihat Detail" : fase === "koreksi" ? "Beri Penilaian" : "Kelola Ujian"}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Tidak ada pendaftaran yang membutuhkan Asesmen Tahap 2 saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
