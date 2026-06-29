import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const refundSections = [
  {
    title: "Ruang Lingkup",
    bullets: [
      "Kebijakan ini berlaku untuk pembayaran yang dilakukan melalui Sistem RPL POLIBAN.",
      "Pengembalian dana tidak bersifat otomatis dan perlu melalui verifikasi pengelola.",
      "Ketentuan final mengikuti kebijakan resmi pengelola RPL POLIBAN dan ketentuan pihak terkait jika berlaku.",
    ],
  },
  {
    title: "Kondisi yang Dapat Dipertimbangkan",
    bullets: [
      "Pembayaran ganda untuk pendaftaran yang sama.",
      "Transaksi berhasil tetapi layanan atau pendaftaran tidak terbentuk karena kendala sistem yang dapat diverifikasi.",
      "Kesalahan nominal atau transaksi yang dapat diverifikasi oleh pengelola.",
      "Kondisi lain yang disetujui pengelola sesuai ketentuan resmi.",
    ],
  },
  {
    title: "Kondisi yang Mungkin Tidak Memenuhi Refund",
    bullets: [
      "Pembatalan sepihak setelah proses verifikasi atau asesmen berjalan.",
      "Data atau dokumen tidak benar, tidak lengkap, atau tidak dapat diverifikasi.",
      "Kondisi di luar ketentuan resmi pengelola RPL POLIBAN.",
      "Biaya administrasi atau payment gateway, jika berlaku, dapat mengikuti ketentuan pihak terkait.",
    ],
  },
  {
    title: "Proses Pengajuan",
    bullets: [
      "Pemohon menghubungi pengelola melalui kanal resmi yang tersedia.",
      "Pemohon menyertakan nama, email akun, nomor pendaftaran atau order, bukti pembayaran, dan alasan pengajuan.",
      "Pengelola melakukan verifikasi terhadap data dan transaksi yang diajukan.",
      "Hasil verifikasi diinformasikan melalui kanal resmi sesuai prosedur pengelola.",
    ],
  },
  {
    title: "Waktu Proses",
    paragraphs: [
      "Waktu proses mengikuti jadwal layanan dan kebutuhan verifikasi. Pengelola dapat meminta informasi tambahan apabila diperlukan untuk memastikan keabsahan pengajuan.",
    ],
  },
  {
    title: "Catatan",
    paragraphs: [
      "Kebijakan ini dapat diperbarui sesuai kebutuhan layanan dan ketentuan resmi pengelola. Keputusan atas pengajuan refund mengikuti hasil verifikasi dan kebijakan yang berlaku.",
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Kebijakan Refund"
      description="Kebijakan ini menjelaskan informasi umum mengenai pengajuan pengembalian dana pada layanan Sistem RPL Politeknik Negeri Banjarmasin. Ketentuan final mengikuti kebijakan resmi pengelola RPL POLIBAN dan dapat diperbarui sewaktu-waktu."
      sections={refundSections}
    />
  );
}
