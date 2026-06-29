import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const termsSections = [
  {
    title: "Penggunaan Layanan",
    bullets: [
      "Sistem digunakan untuk mendukung proses RPL POLIBAN, termasuk pendaftaran, verifikasi, asesmen, dan pengelolaan data terkait.",
      "Pengguna wajib menggunakan layanan secara benar, sesuai tujuan layanan, dan mengikuti ketentuan yang berlaku.",
    ],
  },
  {
    title: "Akun Pengguna",
    bullets: [
      "Pengguna bertanggung jawab atas keamanan akun masing-masing.",
      "Data login tidak boleh dibagikan secara sembarangan kepada pihak lain.",
      "Aktivitas yang dilakukan melalui akun pengguna menjadi tanggung jawab pengguna sesuai ketentuan yang berlaku.",
    ],
  },
  {
    title: "Kebenaran Data dan Dokumen",
    bullets: [
      "Data dan dokumen yang diunggah harus benar, jelas, dan dapat dipertanggungjawabkan.",
      "Pengelola berhak meminta perbaikan, klarifikasi, atau dokumen tambahan jika diperlukan.",
      "Dokumen yang tidak valid atau tidak dapat diverifikasi dapat memengaruhi kelanjutan proses RPL.",
    ],
  },
  {
    title: "Verifikasi dan Asesmen",
    bullets: [
      "Pengakuan SKS atau capaian pembelajaran tidak diberikan secara otomatis.",
      "Hasil mengikuti proses verifikasi, asesmen asesor, pleno, dan ketentuan akademik yang berlaku.",
      "Keputusan akhir mengikuti mekanisme resmi yang ditetapkan oleh pengelola.",
    ],
  },
  {
    title: "Pembayaran",
    bullets: [
      "Pembayaran mengikuti ketentuan biaya yang berlaku pada layanan RPL.",
      "Status pembayaran dapat diverifikasi melalui sistem atau payment gateway yang digunakan.",
      "Pengajuan pengembalian dana mengacu pada Kebijakan Refund yang berlaku.",
    ],
  },
  {
    title: "Sanggah dan Revisi",
    paragraphs: [
      "Jika mekanisme sanggah atau revisi tersedia, proses tersebut mengikuti jadwal, tahapan, dan ketentuan yang ditetapkan oleh pengelola RPL POLIBAN.",
    ],
  },
  {
    title: "Larangan",
    bullets: [
      "Memanipulasi data atau dokumen.",
      "Menyalahgunakan akun pengguna.",
      "Melakukan percobaan akses tidak sah.",
      "Melakukan tindakan yang dapat mengganggu keamanan, ketersediaan, atau integritas sistem.",
    ],
  },
  {
    title: "Perubahan Ketentuan",
    paragraphs: [
      "Syarat dan ketentuan ini dapat diperbarui sesuai kebutuhan layanan dan kebijakan resmi. Penggunaan layanan secara berkelanjutan berarti pengguna memahami pembaruan ketentuan yang berlaku.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Syarat & Ketentuan"
      description="Dengan menggunakan Sistem RPL POLIBAN, pengguna dianggap memahami bahwa layanan ini digunakan untuk mendukung proses pendaftaran, verifikasi, asesmen, dan pengelolaan Rekognisi Pembelajaran Lampau sesuai ketentuan yang berlaku."
      sections={termsSections}
    />
  );
}
