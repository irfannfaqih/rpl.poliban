# Rencana Implementasi Frontend: Sistem RPL POLIBAN (Role Pemohon & Penyesuaian Formulir)

Dokumen ini menguraikan langkah-langkah implementasi untuk frontend sistem RPL POLIBAN yang telah **terkalibrasi** dengan Master Formulir Asli (01-19). Fokus utama kita saat ini adalah memastikan **Role Pemohon** mencakup setiap *field* penyesuaian terbaru dan alurnya persis seperti dokumen resmi.

## Butuh Ulasan Pengguna

> [!IMPORTANT]
> - **Self Asesmen Mandiri**: Saya menemukan di Formulir 03 (*Asesmen Mandiri*), kolom yang diisi Pelamar bukanlah checkbox, melainkan *Level Profisiensi* (Skala: 1 - tidak mampu, 2 - kurang mampu, 4 - mampu, 5 - sangat mampu). Saya akan merombak `SectionD.tsx` untuk menampilkan pemilihan skala (Radio Group skala 1, 2, 4, 5) per indikator kinerja.
> - **Daftar Riwayat Hidup (CV)**: Di Formulir 16, ada rincian riwayat khusus seperti *Pelatihan Profesional, Konferensi/Seminar, Penghargaan/Piagam, dan Organisasi Profesi*. Oleh karena itu, saya akan menambah seksi baru di form Pemohon, atau menggabungkannya ke dalam `SectionB` & `SectionC` kita, sehingga tidak ada isian Master yang hilang.
> - **Surat Sanggah (Banding)**: Di Formulir 17, setelah Sidang Pleno / SK Keputusan terbit, Pemohon memiliki opsi pengajuan Banding. Hal ini akan saya tambahkan ke halaman `Dashboard` pemohon sebagai langkah akhir.
> - **Flow Asesmen**: Ada "Pra Asesmen/Desk Evaluation" oleh Asesor sebelum "Asesmen Tahap 2". Mohon konfirmasi apakah status-status ini cukup dimunculkan sebagai step di progress bar dashboard Pemohon?

## Perubahan yang Diusulkan

### 1. Landing Page & Registrasi Akun
Pembaruan telah dilakukan secara real-time pada `c:\SIRPL\frontend\src\app\page.tsx`.
- Telah menyesuaikan copywriting ke "RPL Tipe A1".
- Pada proses **Registrasi Akun (`app/(auth)/register/page.tsx`)**, pengguna sekarang **DIWAJIBKAN untuk memilih Program Studi (Prodi) di awal**. Hal ini menjadi pintu pemisah logika agar data Asesmen Mandiri (Mata Kuliah) yang muncul dapat disesuaikan otomatis dengan Prodi yang dipilih Pemohon.

### 2. Global State & Data Mock
- Menyiapkan Data Statis JSON (Hardcoded) per Prodi untuk daftar Mata Kuliah dan Indikator Capaian Pembelajarannya (karena Backend API belum ada). Mock data ini digunakan untuk merender baris-baris pada Borang Asesmen Mandiri.
- Zustand store (`usePendaftaranStore.ts` & `useBorangStore.ts`) disesuaikan untuk menyimpan ID Prodi dan mengatur alur pendaftaran.

### 3. Borang Pemohon (Refaktorisasi Guided Entry)

Berdasarkan *Master Form*, kita merevisi file-file seksi pada Borang Panjang:

#### [MODIFY] `c:\SIRPL\frontend\src\components\pemohon\borang\SectionB.tsx` & `SectionC.tsx`
- Menangani form Riwayat Pendidikan, Pengalaman Kerja, Pelatihan Profesional, Konferensi/Seminar, Organisasi Profesi, dan Penghargaan (sesuai Form 16 Daftar Riwayat Hidup).

#### [MODIFY] `c:\SIRPL\frontend\src\components\pemohon\borang\SectionD.tsx` (Asesmen Mandiri)
- Diubah total dari *checkbox* menjadi **Radio Button Skala Level Profisiensi (1, 2, 4, 5)** mengacu pada Form 03.
- Menggunakan data statis mata kuliah berdasarkan pilihan Prodi sewaktu registrasi. Pemohon mengevaluasi tiap *Indikator*, lalu menyisipkan *Kode Bukti Dokumen*.

#### [MODIFY] `c:\SIRPL\frontend\src\components\pemohon\borang\SectionE.tsx` (Dokumen Portofolio)
- Tabel unggahan berkas persyaratan dan bukti-bukti asesmen mandiri.

### 4. Dashboard Pemohon (Monitoring & Sanggah)

Ketika berstatus selesai dikirim (dan sudah bayar), Pemohon akan memonitor di dashboard. 

#### [MODIFY] `c:\SIRPL\frontend\src\app\pemohon\dashboard\page.tsx`
- Memperbarui timeline/stepper langkah-langkah:
  1. *Menunggu Verifikasi Administrasi*
  2. *Pra Asesmen (Menunggu/Melihat Jadwal Wawancara Offline dari Admin)*
  3. *Asesmen Tahap 2*
  4. *Sidang Pleno*
- Jika status berada di "Pra Asesmen" atau "Asesmen Tahap 2", UI akan menampilkan kartu **Informasi Penjadwalan** (meskipun yang mengatur jadwal adalah Admin Prodi, Pemohon butuh kotak informasi jadwal agar mereka tahu kapan harus hadir tatap muka/offline).
- **Masa Sanggah Modal/View**: Jika SK tahap akhir keluar dengan sebagian/seluruh penolakan, sediakan form *Surat Pengajuan Banding* (seperti Form 17).

## Verification Plan

### Manual Verification
- Cek Form Registrasi: Pastikan opsi pilihan Program Studi muncul dan validasinya berjalan.
- Cek Form Asesmen Mandiri: Verifikasi interaksi Skala Penilaian dengan *Mock Data* Matkul (Mata Kuliah) per Prodi berjalan lancar.
- Cek Dashboard: Pastikan kartu Informasi Penjadwalan offline (Pra Asesmen) tampil, dan tombol ajukan Banding ada bagi Pemohon berstatus Pleno Final.
