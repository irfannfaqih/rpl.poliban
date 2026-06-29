"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  ClipboardCheck,
  Users,
  Award,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Shield,
  HelpCircle,
  Building2,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6 },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const steps = [
  {
    icon: FileText,
    title: "Registrasi & Pembayaran",
    desc: "Buat akun dan selesaikan pembayaran biaya pendaftaran untuk mengaktifkan akses pengisian borang.",
  },
  {
    icon: BookOpen,
    title: "Isi Borang & Asesmen Mandiri",
    desc: "Lengkapi data diri, riwayat pendidikan, dan lakukan penilaian mandiri terhadap capaian pembelajaran Anda.",
  },
  {
    icon: ClipboardCheck,
    title: "Verifikasi Administrasi",
    desc: "Tim admin akan memeriksa kelengkapan dan keabsahan dokumen persyaratan yang Anda unggah.",
  },
  {
    icon: Users,
    title: "Evaluasi & Asesmen Asesor",
    desc: "Asesor akan melakukan pra-asesmen dan asesmen lanjutan berupa wawancara atau observasi untuk memvalidasi kompetensi Anda.",
  },
  {
    icon: Award,
    title: "Pleno & Masa Sanggah",
    desc: "Keputusan pengakuan SKS ditetapkan di tahap Pleno. Jika hasil penilaian dirasa kurang sesuai, tersedia mekanisme sanggah yang dapat Anda ajukan.",
  },
];

const features = [
  {
    icon: GraduationCap,
    title: "Akui Pengalaman Anda",
    desc: "Pendidikan yang sudah Anda selesaikan sebelumnya dapat diakui sebagai bagian dari proses akademik di Politeknik Negeri Banjarmasin.",
  },
  {
    icon: BookOpen,
    title: "Proses Transparan",
    desc: "Pantau status pendaftaran Anda dari awal hingga selesai melalui dashboard pribadi yang tersedia.",
  },
  {
    icon: Shield,
    title: "Terakreditasi & Resmi",
    desc: "Dikelola oleh Politeknik Negeri Banjarmasin sesuai regulasi Kemendikbudristek.",
  },
];

const faqs = [
  {
    question: "Apa itu Rekognisi Pembelajaran Lampau (RPL)?",
    answer:
      "RPL adalah jalur pengakuan atas capaian pembelajaran yang diperoleh dari pendidikan formal, nonformal, informal, atau pengalaman kerja, sesuai ketentuan yang berlaku.",
  },
  {
    question: "Siapa yang dapat mendaftar?",
    answer:
      "Calon peserta yang memiliki riwayat pendidikan atau pengalaman belajar/kerja yang relevan dapat mengajukan pendaftaran. Kelayakan akhir tetap mengikuti verifikasi dan asesmen oleh pengelola.",
  },
  {
    question: "Dokumen apa yang perlu disiapkan?",
    answer:
      "Dokumen dapat mencakup identitas diri, ijazah/transkrip, bukti pengalaman kerja, sertifikat, portofolio, atau dokumen pendukung lain sesuai persyaratan program studi.",
  },
  {
    question: "Apakah semua mata kuliah otomatis diakui?",
    answer:
      "Tidak otomatis. Pengakuan dilakukan melalui proses verifikasi, asesmen mandiri, penilaian asesor, dan penetapan sesuai hasil evaluasi.",
  },
  {
    question: "Bagaimana saya memantau proses pendaftaran?",
    answer:
      "Setelah memiliki akun, pemohon dapat memantau status pendaftaran, pembayaran, verifikasi dokumen, asesmen, hingga hasil melalui dashboard.",
  },
  {
    question: "Bagaimana jika dokumen perlu diperbaiki?",
    answer:
      "Jika ada dokumen yang belum sesuai, pemohon dapat menerima catatan revisi dan mengunggah perbaikan melalui sistem sesuai arahan pengelola.",
  },
  {
    question: "Apakah tersedia mekanisme sanggah?",
    answer:
      "Mekanisme sanggah dapat tersedia sesuai ketentuan dan jadwal yang ditetapkan. Informasi lebih lanjut akan ditampilkan pada dashboard pemohon jika tahap tersebut dibuka.",
  },
  {
    question: "Bagaimana ketentuan refund/pengembalian dana?",
    answer:
      "Ketentuan pengembalian dana mengikuti kebijakan resmi pengelola RPL POLIBAN. Pengajuan tertentu seperti pembayaran ganda atau kendala sistem dapat diverifikasi oleh pengelola.",
  },
];

const contactCards = [
  {
    icon: Building2,
    title: "Unit Pengelola RPL",
    desc: "Politeknik Negeri Banjarmasin",
  },
  {
    icon: Mail,
    title: "Kanal Bantuan",
    desc: "Kontak resmi pengelola RPL POLIBAN akan diperbarui.",
  },
  {
    icon: MapPin,
    title: "Lokasi",
    desc: "Banjarmasin, Kalimantan Selatan",
  },
  {
    icon: Clock,
    title: "Jam Layanan",
    desc: "Hari dan jam layanan mengikuti jadwal kerja resmi kampus.",
  },
];

/* ------------------------------------------------------------------ */
/*  Floating Shape Components (decorative)                             */
/* ------------------------------------------------------------------ */
function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large blurred circle top-right */}
      <motion.div
        className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/8"
        animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      {/* Smaller accent circle bottom-left */}
      <motion.div
        className="absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full bg-blue-400/6"
        animate={{ y: [0, -15, 0], x: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      {/* Mid accent */}
      <motion.div
        className="absolute top-1/2 left-1/3 h-[180px] w-[180px] rounded-full bg-blue-300/5"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
function Navbar() {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9 transition-transform group-hover:scale-105">
            <Image 
              src="/poliban.png" 
              alt="Logo POLIBAN" 
              fill 
              className="object-contain"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight uppercase">
              Sistem RPL
            </span>
            <span className="text-[11px] font-medium text-muted-foreground italic">POLIBAN</span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#tentang"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Tentang RPL
          </a>
          <a
            href="#alur"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Alur Pendaftaran
          </a>
          <a
            href="#faq"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
          <a
            href="#kontak"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Kontak
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Masuk
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm">Daftar Sekarang</Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-28 md:pt-32 md:pb-40">
      <FloatingShapes />

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Pill badge */}
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Pendaftaran RPL Periode 2026 Telah Dibuka
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-4xl font-bold leading-[1.15] tracking-tight text-foreground md:text-6xl"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          Lanjutkan Studi Anda ke{" "}
          <span className="bg-gradient-to-r from-primary via-blue-500 to-blue-400 bg-clip-text text-transparent">
            Jenjang Lebih Tinggi
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          Sudah menyelesaikan pendidikan sebelumnya? Melalui jalur RPL di Politeknik Negeri
          Banjarmasin, Anda dapat melanjutkan studi ke jenjang berikutnya tanpa harus
          mengulang dari awal.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <Link href="/auth/register">
            <Button size="lg" className="gap-2 px-6 text-base h-12 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
              Daftar Sekarang
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#alur">
            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-xl px-6 text-base"
            >
              Pelajari Alur
            </Button>
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {[
            { label: "Jurusan", value: "5" },
            { label: "Program Studi", value: "21" },
            { label: "Kemendikbudristek", value: "Resmi" },
          ].map((s) => (
            <motion.div key={s.label} variants={scaleIn} className="text-center">
              <p className="text-2xl font-bold text-foreground md:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  About / Features                                                   */
/* ------------------------------------------------------------------ */
function AboutSection() {
  return (
    <section id="tentang" className="relative border-t border-border/60 bg-card px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Tentang Program
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Apa Itu RPL?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            RPL adalah jalur resmi bagi Anda yang ingin melanjutkan pendidikan ke jenjang
            lebih tinggi dengan mempertimbangkan ijazah dan pengalaman belajar yang sudah
            Anda tempuh sebelumnya.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="mt-16 grid gap-6 md:grid-cols-3"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background p-8 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Steps Timeline                                                     */
/* ------------------------------------------------------------------ */
function StepsSection() {
  return (
    <section id="alur" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Langkah-langkah
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Alur Pendaftaran RPL
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Berikut tahapan pendaftaran RPL yang perlu Anda ikuti secara berurutan.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Vertical line (desktop) */}
          <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent md:block z-0" />

          <div className="space-y-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative flex gap-6 md:gap-8"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                custom={i}
              >
                {/* Number circle */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-background text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/20">
                  <span className="text-xl font-bold">{i + 1}</span>
                </div>

                {/* Content */}
                <div className="pt-2">
                  <div className="flex items-center gap-3">
                    <step.icon className="h-5 w-5 text-primary/60" />
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */
function FAQSection() {
  return (
    <section id="faq" className="border-t border-border/60 bg-card px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Pertanyaan Umum
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Informasi Seputar RPL
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Temukan jawaban singkat mengenai pendaftaran, dokumen, asesmen, dan
            pemantauan proses RPL melalui sistem.
          </p>
        </motion.div>

        <motion.div
          className="mt-14 grid gap-5 md:grid-cols-2"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.question}
              variants={fadeUp}
              custom={i}
              className="group rounded-2xl border border-border/60 bg-background p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold leading-snug text-foreground">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact                                                            */
/* ------------------------------------------------------------------ */
function ContactSection() {
  return (
    <section id="kontak" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Kontak & Bantuan
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Butuh Informasi Lebih Lanjut?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Gunakan kanal resmi pengelola RPL POLIBAN untuk memperoleh informasi
            terbaru mengenai pendaftaran dan layanan bantuan.
          </p>
        </motion.div>

        <motion.div
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {contactCards.map((card, i) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={0}
        >
          <Link href="/auth/register">
            <Button size="lg" className="h-12 rounded-xl px-6">
              Daftar Sekarang
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg" className="h-12 rounded-xl px-6">
              Masuk ke Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */
function CTASection() {
  return (
    <section className="px-6 py-20">
      <motion.div
        className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-blue-500 p-12 text-center text-white shadow-2xl shadow-primary/30 md:p-16"
        variants={scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <CheckCircle2 className="mx-auto h-12 w-12 opacity-80" />
        <h2 className="mt-6 text-3xl font-bold md:text-4xl">
          Siap Memulai Perjalanan RPL?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-blue-100">
          Daftarkan diri Anda sekarang dan mulai proses pengakuan pengalaman
          kerja menjadi kredit akademik.
        </p>
        <Link href="/auth/register">
          <Button
            size="lg"
            className="mt-8 h-12 rounded-xl bg-white px-8 text-base font-semibold text-primary hover:bg-blue-50 shadow-lg transition-all"
          >
            Mulai Pendaftaran
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-4 md:items-start">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9">
                <Image
                  src="/poliban.png"
                  alt="Logo POLIBAN"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight uppercase">
                  Sistem RPL
                </span>
                <span className="text-[11px] font-medium text-muted-foreground italic">
                  Politeknik Negeri Banjarmasin
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Platform pendaftaran dan pengelolaan Rekognisi Pembelajaran Lampau
              Politeknik Negeri Banjarmasin.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
            <h3 className="text-sm font-semibold text-foreground">Navigasi</h3>
            <a href="#tentang" className="hover:text-foreground transition-colors">
              Tentang
            </a>
            <a href="#alur" className="hover:text-foreground transition-colors">
              Alur
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <a href="#kontak" className="hover:text-foreground transition-colors">
              Kontak
            </a>
          </div>

          <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
            <h3 className="text-sm font-semibold text-foreground">Akses</h3>
            <Link href="/auth/login" className="hover:text-foreground transition-colors">
              Masuk
            </Link>
            <Link href="/auth/register" className="hover:text-foreground transition-colors">
              Daftar Sekarang
            </Link>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Informasi</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Kebijakan refund, syarat & ketentuan, serta kebijakan privasi akan
              disesuaikan dengan ketentuan resmi pengelola.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground/70">
              <Link href="/kebijakan-refund" className="transition-colors hover:text-foreground">
                Kebijakan Refund
              </Link>
              <Link href="/syarat-ketentuan" className="transition-colors hover:text-foreground">
                Syarat & Ketentuan
              </Link>
              <Link href="/kebijakan-privasi" className="transition-colors hover:text-foreground">
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Politeknik Negeri Banjarmasin. Seluruh
          hak dilindungi.
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <StepsSection />
        <FAQSection />
        <ContactSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
