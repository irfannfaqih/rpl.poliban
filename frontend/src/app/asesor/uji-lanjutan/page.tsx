"use client";

import { useAsesorStore } from "@/store/useAsesorStore";
import { GraduationCap, Search, ArrowRight, CalendarDays, Clock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Mock data khusus uji lanjutan
const MOCK_UJI_LANJUTAN = [
  {
    id: "UJI-001",
    pemohonId: "PMH-001",
    namaPemohon: "Pemohon Demo",
    asalPt: "Universitas Contoh",
    prodi: "D4 Sistem Informasi Kota Cerdas",
    jadwal: "2026-05-15 09:00 WITA",
    status: "Menunggu Ujian", // Menunggu Ujian, Sedang Dinilai, Selesai
    mkList: ["Pemrograman Web Lanjut", "Basis Data Dasar"]
  },
  {
    id: "UJI-002",
    pemohonId: "PMH-003",
    namaPemohon: "Siti Aminah",
    asalPt: "Politeknik Dummy",
    prodi: "D3 Teknik Informatika",
    jadwal: "Belum Diatur",
    status: "Menjadwalkan",
    mkList: ["Algoritma Pemrograman"]
  }
];

export default function UjiLanjutanDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_UJI_LANJUTAN.filter(t => 
    t.namaPemohon.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.pemohonId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Uji Lanjutan (Ujian Tulis/Lisan)</h1>
        <p className="mt-1 text-xs text-muted-foreground">Kelola perangkat asesmen dan berikan nilai untuk pemohon yang membutuhkan uji lanjutan.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama pemohon atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID Pemohon</th>
                <th className="px-6 py-4">Pemohon & MK</th>
                <th className="px-6 py-4">Jadwal Ujian</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-muted-foreground">{item.pemohonId}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{item.namaPemohon}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {item.mkList.length} MK: {item.mkList.join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className={item.jadwal === "Belum Diatur" ? "text-amber-600 font-medium" : ""}>
                          {item.jadwal}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.status === "Menjadwalkan" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                        item.status === "Menunggu Ujian" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
                        "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      }`}>
                        {item.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" className="gap-2" onClick={() => router.push(`/asesor/uji-lanjutan/form?pemohonId=${item.pemohonId}`)}>
                        Kelola Ujian
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Tidak ada pemohon yang membutuhkan uji lanjutan.
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
