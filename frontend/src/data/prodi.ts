// ──────────────────────────────────────────────
// Interfaces — akan dipakai oleh Section D (Evaluasi Diri)
// Nanti ketika terintegrasi backend, data ini ditarik dari API
// ──────────────────────────────────────────────

export interface CPMK {
  id: string;
  deskripsi: string;
}

export interface MataKuliah {
  kode: string;
  nama: string;
  sks: number;
  deskripsi: string;
  cpmk: CPMK[];
}

export interface ProgramStudi {
  id: string;
  nama: string;
  jenjang: string;
  jurusan: string;
  kurikulum: MataKuliah[];
}

// ──────────────────────────────────────────────
// Dummy CPMK data — hanya untuk D3 TI & D4 SIKC
// Prodi lain kurikulumnya kosong (diisi admin via backend nanti)
// ──────────────────────────────────────────────

const kurikulumTI: MataKuliah[] = [
  {
    kode: "TI101",
    nama: "Algoritma Pemrograman",
    sks: 3,
    deskripsi: "Mata kuliah ini membahas tentang konsep dasar algoritma, konsep dasar pemrograman dan bahasa pemrograman, tipe data, operator, identifier, fungsi input dan output, fungsi dan prosedur, pengendalian program (percabangan), perulangan dan larik (array).",
    cpmk: [
      { id: "TI101-1", deskripsi: "Mahasiswa mampu mengetahui dan memahami pengantar dan konsep dasar algoritma dan pemrograman serta bahasa pemrograman" },
      { id: "TI101-2", deskripsi: "Mahasiswa mampu mengetahui dan memahami dasar-dasar algoritma" },
      { id: "TI101-3", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan mempraktikkan tipe data, operator, dan identifier" },
      { id: "TI101-4", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan mempraktikkan Input dan output pada algoritma pemrograman" },
      { id: "TI101-5", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan mempraktikkan statement pengendalian/percabangan" },
      { id: "TI101-6", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan mempraktikkan statement perulangan" },
    ],
  },
  {
    kode: "TI102",
    nama: "Basis Data",
    sks: 3,
    deskripsi: "Mata kuliah ini akan memberikan konsep dasar basis data kepada mahasiswa, bagaimana membuat model data, merancang basis data dengan baik serta menjelaskan sistem informasi dimana aplikasi basis data dapat diterapkan.",
    cpmk: [
      { id: "TI102-1", deskripsi: "Mampu menjelaskan konsep database dan tingkatan yang ada dalam database" },
      { id: "TI102-2", deskripsi: "Mampu menjelaskan komponen pendukung sebuah database" },
      { id: "TI102-3", deskripsi: "Mampu merancang dan memodelkan basis data dengan model data hirarki, jaringan relasional dan ERD" },
      { id: "TI102-4", deskripsi: "Mampu merancang dan memodelkan dengan menggunakan teknik normalisasi" },
    ],
  },
  {
    kode: "TI103",
    nama: "Pemrograman Berbasis Web",
    sks: 3,
    deskripsi: "Mata kuliah ini berupa pemahaman tentang segala sesuatu yang berkaitan dengan pemrograman berbasis web, meliputi HTML, CSS, PHP, MySQL, dan pembuatan aplikasi web dinamis.",
    cpmk: [
      { id: "TI103-1", deskripsi: "Mahasiswa mampu mengimplementasikan konsep dan teori dasar web, HTML dan memiliki kemampuan untuk mempersiapkan kebutuhan" },
      { id: "TI103-2", deskripsi: "Mahasiswa mampu menjelaskan penggunaan CSS" },
      { id: "TI103-3", deskripsi: "Mahasiswa mampu menjelaskan PHP, sintak PHP, membuat form" },
      { id: "TI103-4", deskripsi: "Mahasiswa mampu membuat koneksi database dan mampu membuat aplikasi dengan PHP dan MySQL" },
    ],
  },
  {
    kode: "TI104",
    nama: "Sistem Operasi",
    sks: 3,
    deskripsi: "Mata kuliah ini membahas arsitektur dasar sistem operasi, manajemen proses, manajemen memori, manajemen I/O, sistem file/direktori, dan dasar-dasar keamanan sistem operasi.",
    cpmk: [
      { id: "TI104-1", deskripsi: "Mahasiswa mampu mengetahui dan memahami konsep dasar dari arsitektur dasar sistem operasi" },
      { id: "TI104-2", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan mempraktikkan teknik booting serta penjadwalan dan manajemen proses" },
      { id: "TI104-3", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan mempraktikkan manajemen memori" },
    ],
  },
  {
    kode: "TI105",
    nama: "Rekayasa Perangkat Lunak",
    sks: 3,
    deskripsi: "Mata kuliah ini berisi materi teori yang memberikan pemahaman tentang dasar-dasar rekayasa perangkat lunak, mengenalkan model pengembangan sistem, dan memberikan dasar perancangan sistem dengan menggunakan UML.",
    cpmk: [
      { id: "TI105-1", deskripsi: "Mahasiswa mampu memahami dan mampu menjelaskan konsep rekayasa perangkat lunak" },
      { id: "TI105-2", deskripsi: "Mahasiswa memahami Software Development Life Cycle (SDLC)" },
      { id: "TI105-3", deskripsi: "Mahasiswa mampu mendesain perangkat lunak" },
      { id: "TI105-4", deskripsi: "Mahasiswa mampu mengimplementasikan dan menguji perangkat lunak" },
    ],
  },
];

const kurikulumSIKC: MataKuliah[] = [
  {
    kode: "SI201",
    nama: "Pengantar Sistem Informasi",
    sks: 3,
    deskripsi: "Mata kuliah ini bertujuan untuk memberikan pemahaman terhadap sistem informasi yang mencakup teori, teknologi, dan perangkat yang dapat digunakan dalam mengelola bisnis dan organisasi.",
    cpmk: [
      { id: "SI201-1", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan menjelaskan konsep dan pengertian sistem informasi dan teknologi informasi" },
      { id: "SI201-2", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan menjelaskan jenis-jenis sistem informasi" },
      { id: "SI201-3", deskripsi: "Mahasiswa mampu mengetahui, memahami, dan menjelaskan pengembangan dan pengadaan sistem informasi" },
    ],
  },
  {
    kode: "SI202",
    nama: "Dasar Internet of Things",
    sks: 3,
    deskripsi: "Mata kuliah ini memberikan tantangan kepada mahasiswa agar mengikuti tren perkembangan dan mengaplikasikan ilmu terkait dengan jaringan dan organisasi komputer untuk memahami bagaimana mendesain dan memprogram perangkat IoT.",
    cpmk: [
      { id: "SI202-1", deskripsi: "Mampu memahami prinsip atau konsep dasar dari Internet of Things (IoT) serta arsitekturnya" },
      { id: "SI202-2", deskripsi: "Mampu memahami berbagai macam bentuk solusi dan enablers Internet of Things (IoT)" },
      { id: "SI202-3", deskripsi: "Mampu merancang, membangun, dan menerapkan pemrograman berbasis Internet of Things (IoT)" },
    ],
  },
  {
    kode: "SI203",
    nama: "Pemodelan Proses Bisnis",
    sks: 3,
    deskripsi: "Mata kuliah ini bertujuan untuk memberikan mahasiswa dengan konsep, pengetahuan & keterampilan yang diperlukan untuk memahami proses bisnis, menganalisis strategi, dan mendesain model proses bisnis.",
    cpmk: [
      { id: "SI203-1", deskripsi: "Mahasiswa mampu mengetahui dan memahami konsep, teori, dan metode dari pemodelan proses bisnis" },
      { id: "SI203-2", deskripsi: "Mahasiswa mampu menjelaskan tentang bagian-bagian proses bisnis dan mampu mengimplementasikan serta menghasilkan sebuah sistem informasi" },
      { id: "SI203-3", deskripsi: "Mahasiswa mampu merancang dan menganalisis model bisnis sesuai ide dan peluang yang ada saat ini" },
    ],
  },
];

// ──────────────────────────────────────────────
// Semua Program Studi di Politeknik Negeri Banjarmasin
// ──────────────────────────────────────────────

export const dataProdi: ProgramStudi[] = [
  // ═══ Jurusan Teknik Sipil ═══
  { id: "TS-D3", nama: "Teknik Sipil", jenjang: "D3", jurusan: "Teknik Sipil", kurikulum: [] },
  { id: "TBR-D4", nama: "Teknik Bangunan Rawa", jenjang: "D4", jurusan: "Teknik Sipil", kurikulum: [] },
  { id: "TG-D3", nama: "Teknik Geodesi", jenjang: "D3", jurusan: "Teknik Sipil", kurikulum: [] },
  { id: "TP-D3", nama: "Teknik Pertambangan", jenjang: "D3", jurusan: "Teknik Sipil", kurikulum: [] },
  { id: "TRKJJ-D4", nama: "Teknik Rekayasa Konstruksi Jalan dan Jembatan", jenjang: "D4", jurusan: "Teknik Sipil", kurikulum: [] },

  // ═══ Jurusan Teknik Mesin ═══
  { id: "TM-D3", nama: "Teknik Mesin", jenjang: "D3", jurusan: "Teknik Mesin", kurikulum: [] },
  { id: "TMO-D3", nama: "Teknik Mesin Otomotif", jenjang: "D3", jurusan: "Teknik Mesin", kurikulum: [] },
  { id: "AB-D3", nama: "Alat Berat", jenjang: "D3", jurusan: "Teknik Mesin", kurikulum: [] },

  // ═══ Jurusan Teknik Elektro ═══
  { id: "TL-D3", nama: "Teknik Listrik", jenjang: "D3", jurusan: "Teknik Elektro", kurikulum: [] },
  { id: "EL-D3", nama: "Elektronika", jenjang: "D3", jurusan: "Teknik Elektro", kurikulum: [] },
  { id: "TI-D3", nama: "Teknik Informatika", jenjang: "D3", jurusan: "Teknik Elektro", kurikulum: kurikulumTI },
  { id: "SIKC-D4", nama: "Sistem Informasi Kota Cerdas", jenjang: "D4", jurusan: "Teknik Elektro", kurikulum: kurikulumSIKC },
  { id: "TRPE-D4", nama: "Teknik Rekayasa Pembangkit Energi", jenjang: "D4", jurusan: "Teknik Elektro", kurikulum: [] },

  // ═══ Jurusan Akuntansi ═══
  { id: "AK-D3", nama: "Akuntansi", jenjang: "D3", jurusan: "Akuntansi", kurikulum: [] },
  { id: "KA-D3", nama: "Komputerisasi Akuntansi", jenjang: "D3", jurusan: "Akuntansi", kurikulum: [] },
  { id: "ALKS-D4", nama: "Akuntansi Lembaga Keuangan Syariah", jenjang: "D4", jurusan: "Akuntansi", kurikulum: [] },

  // ═══ Jurusan Administrasi Bisnis ═══
  { id: "ABN-D3", nama: "Administrasi Bisnis", jenjang: "D3", jurusan: "Administrasi Bisnis", kurikulum: [] },
  { id: "MI-D3", nama: "Manajemen Informatika", jenjang: "D3", jurusan: "Administrasi Bisnis", kurikulum: [] },
  { id: "BD-D4", nama: "Bisnis Digital", jenjang: "D4", jurusan: "Administrasi Bisnis", kurikulum: [] },
];
