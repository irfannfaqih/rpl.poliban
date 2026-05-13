"use client";

import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Users,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data: jadwal yang sudah dibuat dari halaman Verifikasi
const mockJadwal = [
  {
    id: "J01",
    pemohon: "Ahmad Fauzi",
    nim: "RPL-2024-001",
    tanggal: "Senin, 12 Mei 2025",
    waktu: "09:00 - 11:30 WITA",
    tempat: "Ruang Rapat Prodi TI, Lt.2 Gedung C",
    asesor1: "Ir. H. Budi Santoso, M.Kom.",
    asesor2: "Dr. Eng. Siti Aminah, M.T.",
    status: "terjadwal",
  },
  {
    id: "J02",
    pemohon: "Budi Santoso",
    nim: "RPL-2024-002",
    tanggal: "Rabu, 14 Mei 2025",
    waktu: "13:00 - 15:00 WITA",
    tempat: "Lab Komputer 3, Lt.1 Gedung B",
    asesor1: "Agus Riyadi, S.Kom., M.Cs.",
    asesor2: "Dian Puspita, S.T., M.Kom.",
    status: "selesai",
  },
];

export default function KalenderJadwalPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Kalender Jadwal Asesmen</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Ringkasan seluruh jadwal asesmen yang telah dibuat melalui halaman Verifikasi Berkas.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{mockJadwal.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Jadwal</div>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {mockJadwal.filter(j => j.status === "terjadwal").length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Belum Dilaksanakan</div>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {mockJadwal.filter(j => j.status === "selesai").length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Selesai</div>
        </div>
      </div>

      {/* List of Schedules */}
      <div className="grid gap-4 md:grid-cols-2">
        {mockJadwal.map(jadwal => (
          <div key={jadwal.id} className="bg-card rounded-2xl border shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm">
                  {jadwal.pemohon.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{jadwal.pemohon}</h3>
                  <p className="text-[11px] text-muted-foreground">{jadwal.nim}</p>
                </div>
              </div>
              {jadwal.status === "terjadwal" ? (
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[11px]">
                  Terjadwal
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[11px] gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Selesai
                </Badge>
              )}
            </div>

            <div className="space-y-2.5 bg-muted/30 rounded-lg p-3 border">
              <div className="flex items-start gap-2.5">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{jadwal.tanggal}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {jadwal.waktu}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs leading-tight text-foreground/80">{jadwal.tempat}</p>
              </div>
            </div>

            {/* Asesor Info */}
            <div className="space-y-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Tim Asesor</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded px-1.5 py-0.5 font-bold shrink-0">A1</span>
                <p className="text-xs text-foreground/80">{jadwal.asesor1}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded px-1.5 py-0.5 font-bold shrink-0">A2</span>
                <p className="text-xs text-foreground/80">{jadwal.asesor2}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
