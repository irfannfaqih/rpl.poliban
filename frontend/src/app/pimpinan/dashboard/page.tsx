"use client";

import { 
  Users, 
  GraduationCap, 
  Banknote, 
  BookOpenCheck,
  TrendingUp,
  ArrowUpRight,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock Data Eksekutif
const stats = {
  totalPendaftar: 245,
  lulusRPL: 182,
  totalPendapatan: 612500000, // 245 * 2.500.000
  totalSksDiakui: 4550, // rata-rata 25 SKS per orang
  prodiDist: [
    { nama: "TI-D3", lulus: 65, pendaftar: 80 },
    { nama: "TM-D3", lulus: 42, pendaftar: 60 },
    { nama: "AB-D4", lulus: 45, pendaftar: 55 },
    { nama: "SI-D3", lulus: 30, pendaftar: 50 },
  ]
};

export default function PimpinanDashboard() {
  const successRate = Math.round((stats.lulusRPL / stats.totalPendaftar) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard RPL</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Ringkasan performa program Rekognisi Pembelajaran Lampau (RPL) Tahun Ajaran 2026/2027 Ganjil.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Unduh Laporan PDF
        </Button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border shadow-sm p-6 group">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Users className="h-4 w-4" /> Total Pendaftar
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalPendaftar}</div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" /> +12% dari tahun lalu
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-6 group">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <GraduationCap className="h-4 w-4 text-emerald-600" /> Lulus Asesmen
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{stats.lulusRPL}</div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <span className="font-bold text-foreground">{successRate}%</span> Success Rate
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-6 group">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <BookOpenCheck className="h-4 w-4 text-blue-600" /> Total SKS Diakui
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{stats.totalSksDiakui.toLocaleString('id-ID')}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Rata-rata {Math.round(stats.totalSksDiakui / stats.lulusRPL)} SKS / mahasiswa
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-6 group">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
            <Banknote className="h-4 w-4 text-amber-600" /> Total Pendapatan
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 flex items-baseline gap-1">
            <span className="text-lg">Rp</span>
            {(stats.totalPendapatan / 1000000).toFixed(1)}M
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-600" /> Rekonsiliasi 100% Cocok
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi Prodi */}
        <div className="bg-card rounded-2xl border shadow-sm p-6">
          <h3 className="font-bold text-lg mb-6">Distribusi Lulusan per Prodi</h3>
          <div className="space-y-6">
            {stats.prodiDist.map((p) => {
              const rate = Math.round((p.lulus / p.pendaftar) * 100);
              const maxLulus = Math.max(...stats.prodiDist.map(x => x.lulus));
              const widthPct = Math.round((p.lulus / maxLulus) * 100);
              
              return (
                <div key={p.nama} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-semibold text-sm">{p.nama}</span>
                    <span className="text-xs font-bold text-muted-foreground">{p.lulus} dari {p.pendaftar} ({rate}%)</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tren Kelulusan Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-lg mb-6">Tren Penerimaan RPL (3 Tahun Terakhir)</h3>
          <div className="flex-1 flex items-end gap-6 justify-center h-48 pt-8 border-b pb-2">
             {/* Year 1 */}
             <div className="flex flex-col justify-end items-center gap-2 group w-16 h-full">
               <div className="text-xs font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">95</div>
               <div className="w-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 rounded-t-md transition-all duration-500" style={{ height: '50%' }}></div>
               <div className="text-xs font-medium text-muted-foreground">2024</div>
             </div>
             {/* Year 2 */}
             <div className="flex flex-col justify-end items-center gap-2 group w-16 h-full">
               <div className="text-xs font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">120</div>
               <div className="w-full bg-blue-200 hover:bg-blue-300 dark:bg-blue-800/50 dark:hover:bg-blue-700/60 rounded-t-md transition-all duration-500" style={{ height: '70%' }}></div>
               <div className="text-xs font-medium text-muted-foreground">2025</div>
             </div>
             {/* Year 3 */}
             <div className="flex flex-col justify-end items-center gap-2 group w-16 h-full">
               <div className="text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">182</div>
               <div className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t-md transition-all duration-500 relative" style={{ height: '100%' }}>
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></div>
               </div>
               <div className="text-xs font-bold text-foreground">2026</div>
             </div>
          </div>
          <div className="mt-6 text-sm text-muted-foreground text-center">
            Penerimaan mahasiswa RPL meningkat <span className="font-bold text-emerald-600 dark:text-emerald-500">+51.6%</span> dibandingkan tahun sebelumnya.
          </div>
        </div>
      </div>
    </div>
  );
}
