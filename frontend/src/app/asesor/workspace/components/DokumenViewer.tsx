import { File, CheckCircle2, AlertCircle } from "lucide-react";

export default function DokumenViewer({ pemohonId }: { pemohonId: string }) {
  // In a real app, fetch data based on pemohonId
  // Mock data for demo
  
  return (
    <div className="space-y-8">
      {/* Profil Singkat */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold border-b pb-2">Informasi Pemohon</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Nama Lengkap</p>
            <p className="font-semibold">Pemohon Demo</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">NIM / NIK</p>
            <p className="font-semibold">1234567890</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Asal Instansi</p>
            <p className="font-semibold">PT. Teknologi Abadi</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Program Studi Tujuan</p>
            <p className="font-semibold">D4 Sistem Informasi Kota Cerdas</p>
          </div>
        </div>
      </section>

      {/* Evaluasi Diri (Form 03) */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold border-b pb-2">Hasil Evaluasi Diri</h3>
        
        <div className="rounded-xl border bg-background overflow-hidden">
          <div className="bg-muted/50 p-3 flex justify-between items-center border-b">
            <span className="font-bold text-sm">Rekayasa Perangkat Lunak (3 SKS)</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="text-xs border-b border-border/50 pb-3">
              <p className="font-semibold mb-1">CPMK 1: Memahami konsep SDLC</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-2 py-0.5 rounded font-bold">Profisiensi: 5 (Sangat Mampu)</span>
              </div>
            </div>
            <div className="text-xs">
              <p className="font-semibold mb-1">CPMK 2: Mampu membuat diagram UML</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-0.5 rounded font-bold">Profisiensi: 4 (Mampu)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dokumen Portofolio */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold">Dokumen Portofolio Terunggah</h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">4 File</span>
        </div>
        
        <div className="space-y-3">
          {/* Item */}
          <div className="p-3 rounded-xl border bg-background flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <File className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Ijazah Terakhir</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ijazah_terakhir.pdf • Wajib</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600">Lihat</span>
          </div>

          <div className="p-3 rounded-xl border bg-background flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <File className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Transkrip Nilai Resmi</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Transkrip_nilai.pdf • Wajib</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-600">Lihat</span>
          </div>

          <div className="p-3 rounded-xl border bg-background flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px]">
                DT-01
              </div>
              <div>
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Sertifikat BNSP Web Dev</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Sertifikat_Kompetensi.pdf • P01</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-purple-600">Lihat</span>
          </div>

          <div className="p-3 rounded-xl border bg-background flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                DT-02
              </div>
              <div>
                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Surat Keterangan Kerja IT</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Paklaring.pdf • P04</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600">Lihat</span>
          </div>

        </div>
      </section>

    </div>
  );
}
