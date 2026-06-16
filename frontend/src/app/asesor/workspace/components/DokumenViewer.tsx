import { ExternalLink, FileText } from "lucide-react";
import { openPrivateFile, privateDocumentPath } from "@/lib/private-files";

interface DokumenViewerProps {
  pendaftaran: any;
}

export default function DokumenViewer({ pendaftaran }: DokumenViewerProps) {
  const user = pendaftaran?.user;
  const dataDiri = pendaftaran?.data_diri;

  return (
    <div className="space-y-8">
      {/* Profil Singkat */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold border-b pb-2 text-foreground">Informasi Pemohon</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground font-medium">Nama Lengkap</p>
            <p className="font-semibold text-foreground">{dataDiri?.nama_lengkap || user?.nama || "Belum Diisi"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">NIK</p>
            <p className="font-semibold text-foreground">{dataDiri?.nik || "Belum Diisi"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Asal Instansi / Sekolah</p>
            <p className="font-semibold text-foreground">
              {pendaftaran?.riwayat_pendidikan?.[0]?.institusi || "Belum Diisi"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Program Studi Tujuan</p>
            <p className="font-semibold text-foreground">{pendaftaran?.prodi?.nama || "Belum Diisi"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Nomor HP</p>
            <p className="font-semibold text-foreground">{dataDiri?.no_hp || user?.phone || "Belum Diisi"}</p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Email</p>
            <p className="font-semibold text-foreground">{dataDiri?.email_pribadi || user?.email || "Belum Diisi"}</p>
          </div>
        </div>
      </section>

      {/* Evaluasi Diri (Form 03) */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold border-b pb-2 text-foreground">Hasil Evaluasi Diri (Klaim CPMK)</h3>

        {pendaftaran?.evaluasi_diri && pendaftaran.evaluasi_diri.length > 0 ? (
          <div className="rounded-xl border bg-background overflow-hidden divide-y">
            {pendaftaran.evaluasi_diri.map((item: any) => (
              <div key={item.id} className="p-3 space-y-2 hover:bg-muted/10 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-[9px] font-bold">
                      {item.cpmk?.kode}
                    </span>
                    <p className="font-semibold text-xs leading-normal">{item.cpmk?.deskripsi}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap shrink-0 ${String(item.profisiensi) === '1' ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                    String(item.profisiensi) === '2' ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                      String(item.profisiensi) === '4' ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                        "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                    }`}>
                    Profisiensi: {item.profisiensi}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Belum ada evaluasi diri diisi.</p>
        )}
      </section>

      {/* Dokumen Portofolio */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-foreground">Dokumen Portofolio Terunggah</h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            {pendaftaran?.dokumen?.length || 0} File
          </span>
        </div>

        {pendaftaran?.dokumen && pendaftaran.dokumen.length > 0 ? (
          <div className="space-y-3">
            {pendaftaran.dokumen.map((dok: any) => {
              const sizeInKb = dok.file_size ? `${(dok.file_size / 1024).toFixed(1)} KB` : 'N/A';

              return (
                <div
                  key={dok.id}
                  className="p-3 rounded-xl border bg-background flex items-center justify-between hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${dok.tipe === 'ijazah' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' :
                      dok.tipe === 'transkrip' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
                        dok.tipe === 'sertifikat' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400' :
                          dok.tipe === 'portofolio' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' :
                            'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                      }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {dok.file_name}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                        Tipe: {dok.tipe} {dok.deskripsi ? `• ${dok.deskripsi}` : ''} • {sizeInKb}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPrivateFile(privateDocumentPath(dok.id))}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Buka</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-6 bg-muted/20 border border-dashed rounded-xl text-muted-foreground text-xs">
            Belum ada dokumen portofolio terunggah.
          </div>
        )}
      </section>
    </div>
  );
}
