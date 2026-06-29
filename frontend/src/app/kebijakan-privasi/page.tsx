import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const privacySections = [
  {
    title: "Data yang Dapat Dikumpulkan",
    bullets: [
      "Data akun seperti nama, email, dan nomor kontak jika tersedia.",
      "Data akademik seperti ijazah, transkrip, dan program studi tujuan.",
      "Dokumen pendukung yang diunggah untuk proses RPL.",
      "Data pembayaran dan status transaksi yang diperlukan untuk verifikasi layanan.",
      "Data asesmen, catatan proses, dan status tahapan RPL.",
      "Log aktivitas sistem yang diperlukan untuk keamanan, audit, dan pengelolaan layanan.",
    ],
  },
  {
    title: "Penggunaan Data",
    bullets: [
      "Mendukung proses pendaftaran RPL.",
      "Melakukan verifikasi data dan dokumen.",
      "Memproses dan memantau status pembayaran.",
      "Mendukung proses asesmen dan evaluasi.",
      "Menyampaikan komunikasi layanan kepada pengguna.",
      "Menjaga keamanan sistem dan kebutuhan audit.",
      "Mendukung pelaporan internal sesuai kebutuhan pengelola.",
    ],
  },
  {
    title: "Penyimpanan dan Keamanan",
    bullets: [
      "Data disimpan pada sistem yang dikelola untuk mendukung layanan RPL.",
      "Akses data dibatasi sesuai peran dan kebutuhan proses.",
      "Pengguna perlu menjaga kerahasiaan akun dan memastikan perangkat yang digunakan tetap aman.",
    ],
  },
  {
    title: "Berbagi Data",
    bullets: [
      "Data dapat diakses oleh pengelola, admin, asesor, dan pihak terkait sesuai kebutuhan proses RPL.",
      "Data pembayaran dapat diproses melalui payment gateway yang digunakan.",
      "Data tidak digunakan untuk tujuan di luar layanan tanpa dasar yang sesuai dengan ketentuan yang berlaku.",
    ],
  },
  {
    title: "Hak dan Tanggung Jawab Pengguna",
    bullets: [
      "Memastikan data yang diberikan benar dan dapat dipertanggungjawabkan.",
      "Memperbarui data apabila diperlukan sesuai prosedur layanan.",
      "Menghubungi pengelola melalui kanal resmi untuk pertanyaan atau koreksi data sesuai prosedur.",
    ],
  },
  {
    title: "Perubahan Kebijakan",
    paragraphs: [
      "Kebijakan ini dapat diperbarui sesuai kebutuhan layanan, perkembangan sistem, dan ketentuan resmi pengelola RPL POLIBAN.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Kebijakan Privasi"
      description="Kebijakan ini menjelaskan bagaimana data pengguna pada Sistem RPL POLIBAN dapat dikumpulkan, digunakan, dan dilindungi untuk mendukung proses layanan RPL."
      sections={privacySections}
    />
  );
}
