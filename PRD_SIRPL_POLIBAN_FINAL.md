PRODUCT REQUIREMENTS DOCUMENT
SISTEM REKOGNISI PEMBELAJARAN LAMPAU (RPL)
POLITEKNIK NEGERI BANJARMASIN (POLIBAN)

Versi: v4.1 — MASTER FINAL
Status: Production-Ready — Semua 19 Formulir Terpetakan + Arsitektur UX Guided Entry
Target Platform: Web App (Next.js 15 + Laravel 13)
Ditujukan Untuk: AI Agent / Vibe Coding

Dokumen ini adalah referensi tunggal (Single Source of Truth) untuk seluruh proses pembangunan sistem RPL POLIBAN. Menggabungkan kelengkapan teknis v2, penambahan 19-formulir dari v3, dan spesifikasi arsitektur UX guided entry pemohon (Bab 3A).

---

BAB 1 — RINGKASAN EKSEKUTIF & TUJUAN SISTEM

1.1 Latar Belakang

Sistem RPL POLIBAN adalah platform web enterprise yang memfasilitasi pengakuan kredit akademik dari pengalaman belajar sebelumnya. Menggantikan proses manual berbasis kertas yang rawan kesalahan, lambat, dan sulit diaudit menjadi alur digital terstruktur, transparan, dan dapat dilacak penuh. Melibatkan empat aktor utama: Pemohon, Admin Prodi, Asesor 1 & 2, dan Super Admin Pusat.

1.2 Tujuan Produk

Menyediakan antarmuka pendaftaran digital intuitif dengan panduan terstruktur. Mengotomasi verifikasi dokumen, pra asesmen (Form 02), penugasan asesor, blind review, dan pleno nilai. Mengimplementasikan evaluasi portofolio 10-jenis-dokumen (Form 04) dan penilaian CP 3-dimensi Kognitif/Skill/Afektif (Form 05). Menyediakan perangkat asesmen tulis dengan soal, lembar jawaban, dan skoring per soal (Form 09, 10, 11). Menghasilkan Matriks Alih Kredit (Form 12) dan Matriks Asesmen MK (Form 13) secara formal. Memastikan integritas data melalui audit trail lengkap, validasi tiga lapis, dan enkripsi dokumen sensitif. Menghasilkan semua 19 dokumen legal (PDF) secara otomatis dengan format konsisten.

1.3 Ruang Lingkup

Mencakup: registrasi, pembayaran, borang multi-seksi, pra asesmen, verifikasi admin, evaluasi portofolio, penilaian blind review (wawancara/tulis/praktek), pleno, sanggahan (internal ke asesor dan eksternal ke Pimpinan PT), hingga SK final.
Tidak mencakup: manajemen perkuliahan pasca-RPL, SIAKAD, integrasi PDDikti (versi pertama).

---

BAB 2 — AKTOR SISTEM & HAK AKSES (RBAC)

Empat role hierarkis dan eksklusif. Setiap user hanya memiliki SATU role aktif. Pengecualian: fitur Impersonate Super Admin menciptakan sesi sementara; audit log tetap mencatat Super Admin sebagai pelaku dengan flag impersonated_by.

Role       | Kode Internal | Lingkup Data
-----------|---------------|-------------------------------
Pemohon    | pemohon       | Data milik sendiri saja
Admin Prodi| admin_prodi   | Semua pendaftar di prodinya
Asesor     | asesor        | Pendaftar yang ditugaskan padanya
Super Admin| super_admin   | Seluruh sistem lintas prodi

2.1 Pemohon

Akun dibuat mandiri via registrasi publik; tidak bisa dibuatkan Admin. Setelah Final Submit, form terkunci (is_locked=true), beralih ke mode read-only kecuali fitur sanggahan. Hak akses: registrasi & login mandiri, pengisian borang lengkap (identitas, riwayat hidup, transkrip, asesmen mandiri, portofolio), melihat status alur real-time, unduh dokumen, konfirmasi kehadiran Uji Lanjutan, isi jawaban ujian tulis, lihat hasil pleno, ajukan sanggahan.

2.2 Admin Prodi

Dibuat oleh Super Admin, dipetakan ke satu Program Studi. Tidak bisa melihat data pendaftar prodi lain. Hak akses: verifikasi berkas, kelola kurikulum RPL (termasuk CP 3-dimensi, indikator kinerja, level KKNI, Matriks Asesmen MK/Form 13), pra-pemetaan MK (opsional), tugaskan dua asesor, pimpin pleno, kelola Matriks Alih Kredit, upload SK bertanda tangan basah, publikasi hasil.

2.3 Asesor

Dibuat Super Admin, dipetakan ke satu Prodi. Hanya akses berkas yang ditugaskan padanya. Blind Review dijaga: Asesor 1 tidak bisa melihat penilaian Asesor 2 sampai keduanya submit final. Hak akses: lakukan pra asesmen (Form 02), evaluasi portofolio (Form 04), penilaian CP 3-dimensi (Form 05), buat soal tulis (Form 09), nilai jawaban tulis (Form 10), buat pertanyaan lisan (Form 11), isi Matriks Alih Kredit (Form 12), putus sanggahan.

2.4 Super Admin

Akses penuh ke semua data tanpa batasan prodi. Idealnya hanya 1-2 akun. Hak akses: kelola gelombang & biaya, kelola prodi, buat & kelola akun staf, dashboard analitik eksekutif, monitor & ekspor audit log, kelola sesi aktif, fitur Impersonate.

---

BAB 3 — ALUR BISNIS SISTEM (END-TO-END FLOW)

3.1 Alur Utama Pendaftaran

Setiap transisi status dicatat di audit_logs dengan timestamp, user_id pelaku, dan IP address.

No | Status                  | Pelaku          | Aksi Pemicu                                        | Status Berikutnya
---|-------------------------|-----------------|----------------------------------------------------|------------------
1  | pre_submit              | Pemohon         | Registrasi akun berhasil                           | waiting_payment
2  | waiting_payment         | Sistem/Gateway  | Webhook konfirmasi pembayaran lunas                | waiting_verification
3  | waiting_verification    | Admin Prodi     | Checklist verifikasi + Tugaskan Asesor             | pra_asesmen
4  | pra_asesmen             | Asesor          | Asesor submit Form 02 Pra Asesmen (8 langkah)      | assessment_in_progress
5  | assessment_in_progress  | Kedua Asesor    | Kedua asesor submit final penilaian                | waiting_pleno
6  | waiting_pleno           | Admin Prodi     | Sahkan nilai pleno                                 | selesai (draft)
7  | selesai (draft)         | Admin Prodi     | Publikasi arsip SK bertanda tangan basah           | selesai (final)

3.2 Sub-Alur Pra Asesmen — Form 02 (WAJIB)

Tahap konsultasi wajib antara Asesor dan Pemohon sebelum penilaian formal. 8 langkah formal harus didokumentasikan: (1) Pembukaan & Penjelasan Tujuan, (2) Konfirmasi Identitas Pemohon, (3) Kaji Bukti Portofolio Awal, (4) Konfirmasi Tujuan Asesmen, (5) Jelaskan Metode & Prosedur, (6) Identifikasi Kebutuhan Khusus, (7) Perjanjian Kerahasiaan, (8) Kesepakatan Jadwal. Asesor mengisi checklist, catatan per langkah, dan rekomendasi (Lanjut Penuh / Lanjut dengan Catatan / Tidak Memenuhi Syarat). Setelah submit, status berubah ke assessment_in_progress.

ATURAN KRITIS: Asesor DILARANG akses Workspace Blind Review sebelum Form 02 di-submit. Endpoint GET /asesor/tugas/{pendaftaran_id} wajib HTTP 403 jika pra_asesmen.submitted_at masih NULL.

3.3 Sub-Alur Uji Lanjutan (Opsional)

Asesor dapat mengaktifkan untuk MK tertentu jika self-rating perlu diverifikasi. Jenis: Wawancara (Form 11), Ujian Tulis (Form 09+10), atau Ujian Praktek. Tidak menghentikan alur utama; MK lain tetap diproses. Untuk Ujian Tulis: Asesor buat soal per pertanyaan dengan kunci jawaban dan bobot penilaian (bobot_persen per soal). Pemohon isi jawaban via portal digital. Asesor beri skor 1-5 per soal; nilai rata-rata dihitung otomatis berbobot. Untuk Wawancara: Asesor buat daftar pertanyaan lisan dengan panduan penilaian, isi jawaban pemohon saat wawancara, dan skor 1-5 per pertanyaan.

3.4 Sub-Alur Sanggahan (Dua Jalur)

Dibuka setelah Admin publikasi hasil pleno. Batas waktu sanggah = kolom deadline_sanggah pada tabel gelombang; lewat deadline tombol otomatis nonaktif. Sebelum form aktif, sistem tampilkan briefing prosedur sanggah; pemohon klik "Saya Mengerti" terlebih dahulu.

Jalur 1 (Internal): Sanggahan ke Asesor via sistem. Pemohon pilih MK (multi-select), isi alasan per MK, unggah bukti tambahan (opsional). Asesor putuskan: Terima (nilai diperbarui) atau Tolak (nilai tetap). Keputusan MUTLAK, tidak bisa diubah; kolom diputus_at menjadi kunci penolakan request berikutnya (HTTP 403).

Jalur 2 (Eksternal): Jika pemohon tidak puas dengan keputusan Asesor, bisa ajukan banding ke Pimpinan PT. Admin mencatat dan memproses via tabel banding_eksternal.

---

BAB 3A — ARSITEKTUR UX GUIDED ENTRY (PENGALAMAN PEMOHON END-TO-END)

Bab ini menjelaskan filosofi dan mekanisme teknis pengalaman pemohon dari pertama kali mengakses sistem hingga transisi ke Panel Mode. Tujuan utama: pemohon selalu tahu di mana mereka berada, apa yang harus dilakukan selanjutnya, dan tidak pernah kehilangan data yang sudah diisi.

3A.1 Filosofi Guided Entry

Sistem dirancang agar pemohon tidak pernah menghadapi halaman kosong atau kebingungan tentang langkah berikutnya. Setiap state pemohon memiliki satu halaman tunggal yang jelas dengan satu aksi utama yang menonjol. Pemohon tidak bisa melompat ke fase yang belum terbuka; sistem secara aktif mengarahkan mereka ke aksi yang tepat sesuai status pendaftaran saat itu.

3A.2 Peta State Pemohon & Halaman yang Ditampilkan

Setiap kali pemohon login, sistem membaca status_alur pendaftaran aktif dan langsung me-redirect ke halaman yang sesuai. Pemohon tidak pernah mendarat di halaman yang salah.

status_alur          | Halaman yang Ditampilkan     | Aksi Utama yang Tersedia
---------------------|------------------------------|------------------------------------------
(belum ada akun)     | Halaman 1.1 — Registrasi     | Isi form register → buat akun
pre_submit           | Halaman 1.1 — Login/Register | Login → masuk ke alur selanjutnya
waiting_payment      | Halaman 1.2 — Pembayaran     | Selesaikan pembayaran
waiting_verification | Halaman 1.3 — Long Form      | Isi borang (form sudah terbuka)
pra_asesmen          | Halaman 1.3 — Long Form      | Isi borang (menunggu pra asesmen)
assessment_in_progress| Halaman 1.4 — Dashboard     | Pantau status penilaian
waiting_pleno        | Halaman 1.4 — Dashboard      | Pantau status pleno
selesai (draft)      | Halaman 1.4 — Dashboard      | Tunggu publikasi SK
selesai (final)      | Halaman 1.7 — Hasil Akhir    | Lihat hasil, ajukan sanggahan (jika perlu)

ATURAN KRITIS: Endpoint GET /auth/me wajib mengembalikan status_alur aktif pemohon. Frontend melakukan redirect otomatis berdasarkan mapping di atas setiap kali halaman dimuat. Pemohon tidak bisa mengakses URL halaman lain secara manual jika status_alur belum sesuai; middleware frontend memblokir dan redirect.

3A.3 Fase 1: Registrasi & Login (Halaman 1.1)

Halaman ini adalah titik masuk tunggal ke sistem. Tidak ada sidebar, tidak ada menu navigasi. Fokus penuh pada dua aksi: daftar akun baru atau masuk dengan akun yang sudah ada.

Setelah registrasi berhasil: sistem melakukan auto-login dan langsung redirect ke Halaman 1.2 (Pembayaran) tanpa perlu klik apapun lagi. Pemohon tidak pernah "terjebak" di halaman registrasi setelah sukses.

Setelah login berhasil: sistem membaca status_alur dan redirect ke halaman yang sesuai (lihat tabel 3A.2). Pemohon yang sudah di tengah pengisian form langsung kembali ke tempat mereka berhenti.

3A.4 Fase 2: Gerbang Pembayaran (Halaman 1.2)

Selama status = waiting_payment, pemohon HANYA bisa melihat Halaman 1.2. Halaman ini adalah satu-satunya konten yang ditampilkan; tidak ada form pengisian di bawahnya, tidak ada preview section A–E, tidak ada navigasi ke halaman lain.

Struktur Halaman 1.2:
- Header kecil: nama pemohon, program studi tujuan, nama gelombang.
- Blok utama: nominal pembayaran (format Rupiah besar dan jelas), instruksi metode pembayaran yang dipilih (VA per bank atau QRIS).
- Badge status dinamis: "Menunggu Pembayaran" (amber) atau "Pembayaran Terverifikasi" (hijau).
- Setelah pembayaran dikonfirmasi via webhook: badge berubah hijau, muncul pesan "Pembayaran berhasil! Anda akan diarahkan ke formulir pendaftaran..." dan sistem otomatis redirect ke Halaman 1.3 dalam 3 detik tanpa perlu klik apapun.
- Tombol "Cek Status" tersedia sebagai fallback manual jika WebSocket terputus.

Mengapa form tidak ditampilkan sama sekali: mencegah pemohon mengisi data panjang lalu kehilangan motivasi membayar, memastikan urutan yang benar (bayar dulu baru isi), dan menghindari kebingungan "sudah isi form tapi belum bisa submit".

3A.5 Fase 3: Guided Entry Long Form (Halaman 1.3)

Ini adalah inti pengalaman pemohon. Seluruh halaman menggunakan full-screen tanpa sidebar. Tujuan: pemohon fokus penuh pada pengisian data tanpa distraksi navigasi atau informasi lain.

3A.5.1 Progress Indicator — Sidebar Section Mini

Di sisi kiri layar (lebar ~200px, collapsed di mobile), terdapat daftar section yang berfungsi ganda sebagai progress indicator dan navigasi in-page. Ini bukan sidebar aplikasi utama; hanya navigation anchor khusus untuk long form ini.

Section     | Label                        | Status Indikator
------------|------------------------------|------------------
A           | Identitas Diri               | ○ Belum / ◑ Sebagian / ✓ Lengkap
A.2         | Pelatihan & Sertifikat       | ○ / ◑ / ✓ (opsional, selalu bisa ✓ jika dikosongkan)
A.3         | Pengalaman Kerja             | ○ / ◑ / ✓ (opsional)
B           | Riwayat Hidup Lengkap        | ○ / ◑ / ✓
C           | Asesmen Mandiri              | ○ / ◑ / ✓ (progress: X dari Y MK sudah dirating)
D           | Portofolio                   | ○ / ◑ / ✓ (opsional per dokumen)
E           | Pernyataan & Submit          | Terkunci hingga A–C lengkap

Status indikator per section dihitung real-time dari data yang tersimpan di server (bukan hanya dari state lokal browser), sehingga akurat meski pemohon login dari perangkat berbeda.

Klik pada label section di sidebar mini → smooth scroll ke section tersebut di halaman. Pemohon bebas berpindah antar section kapan saja; tidak ada pembatasan urutan pengisian. Namun tombol FINAL SUBMIT di Section E tidak aktif sampai semua field wajib di section A, B, dan C terisi lengkap.

3A.5.2 Perilaku Navigasi Antar Section

Bebas loncat: pemohon dapat mengklik section mana saja di sidebar mini dan langsung scroll ke sana. Section tidak dikunci berdasarkan urutan.

Validasi saat submit (bukan saat navigasi): error validasi hanya muncul saat pemohon mencoba klik FINAL SUBMIT, bukan saat berpindah section. Ini mengurangi gangguan dan memungkinkan pemohon mengisi data tidak berurutan sesuai dokumen yang tersedia di tangan mereka saat itu.

3A.5.3 Auto-Save dengan Indikator Visual

Auto-save dipicu oleh dua mekanisme: (1) react-intersection-observer mendeteksi pemohon melewati batas antar section → auto-save section yang baru ditinggalkan, (2) timer setiap 60 detik untuk semua data yang belum tersimpan.

Indikator auto-save ditampilkan di pojok kanan atas area form (bukan di navbar global):
- Saat menyimpan: spinner kecil + teks "Menyimpan..." (warna slate-400)
- Setelah tersimpan: ikon centang + teks "Tersimpan ✓" (warna emerald-600), hilang setelah 2 detik
- Jika gagal simpan (network error): ikon warning + teks "Gagal menyimpan. Coba lagi." (warna amber-600) dengan tombol "Coba Lagi" kecil

Data draft selalu dipulihkan dari database (bukan LocalStorage) sehingga aman dari browser crash, clear cache, atau perpindahan perangkat.

3A.5.4 Mekanisme Kunci Section E (Pernyataan & Submit)

Section E secara visual ditampilkan namun tombol FINAL SUBMIT dalam kondisi disabled dengan tooltip "Lengkapi semua bagian wajib terlebih dahulu" selama masih ada field wajib yang kosong. Ketika semua section A, B, C sudah lengkap, tombol aktif secara otomatis tanpa perlu reload halaman.

Sebelum checkbox pernyataan dicentang, tombol FINAL SUBMIT tetap disabled meski semua section sudah lengkap.

Alur FINAL SUBMIT:
1. Pemohon centang checkbox pernyataan keabsahan.
2. Tombol FINAL SUBMIT menjadi aktif (bg-blue-800).
3. Pemohon klik FINAL SUBMIT.
4. Dialog konfirmasi pertama muncul: "Apakah Anda yakin ingin mengirimkan pendaftaran? Data tidak dapat diubah setelah ini." Tombol: "Ya, Kirim Sekarang" dan "Batal".
5. Jika klik "Ya, Kirim Sekarang": dialog kedua muncul sebagai checkpoint terakhir: "Konfirmasi Terakhir: Pastikan seluruh data sudah benar. Klik Konfirmasi untuk melanjutkan." Tombol: "Konfirmasi" dan "Kembali".
6. Jika klik "Konfirmasi": sistem memanggil PATCH /pendaftaran/{id}/final-submit.
7. Loading state: tombol disabled, teks berubah "Memproses..." selama API dipanggil.
8. Setelah sukses: muncul halaman transisi sepentar (2–3 detik) dengan pesan "Pendaftaran berhasil dikirim! Menyiapkan dashboard Anda..." lalu redirect ke Fase 2 Panel Mode (Halaman 1.4).

3A.6 Transisi ke Fase 2: Panel Mode (Halaman 1.4 dst.)

Setelah FINAL SUBMIT berhasil, seluruh antarmuka berubah. Ini bukan perpindahan halaman biasa — ini adalah perubahan paradigma UI dari "focused entry" ke "monitoring dashboard".

Perubahan yang terjadi:
- Background berubah dari #FFFFFF ke #F8FAFC (sedikit abu-abu, memberi kesan "ruang kerja").
- Sidebar navigasi utama muncul di sisi kiri dengan menu-menu yang relevan.
- Sidebar mini progress indicator (dari long form) menghilang sepenuhnya.
- Konten utama berubah ke Dashboard Status Pendaftaran (Halaman 1.4) dengan Stepper Visual 6 tahap.

3A.7 Arsip Borang — Panel Read-Only (Halaman 1.5)

Setelah FINAL SUBMIT, pemohon dapat mengakses Halaman 1.5 untuk melihat kembali seluruh data yang sudah mereka isi. Halaman ini bersifat read-only sempurna: tidak ada satupun elemen yang bisa diklik untuk mengedit, tidak ada input field aktif, tidak ada tombol "Edit".

Tampilan: lima tab/akordion yang mencerminkan lima section long form.
- Tab 1: Identitas Diri + Pelatihan + Pengalaman Kerja (Section A, A.2, A.3)
- Tab 2: Riwayat Hidup Lengkap — CV (Section B)
- Tab 3: Transkrip Akademik — PT Asal + Tabel MK (Section B.1)
- Tab 4: Asesmen Mandiri — Self-Rating per MK (Section C)
- Tab 5: Portofolio — Daftar dokumen yang diunggah (Section D)

Semua nilai ditampilkan sebagai teks label–nilai. File yang diunggah ditampilkan sebagai nama file + tombol "Lihat" (membuka file di tab baru via signed URL).

3A.8 Mekanisme Koreksi Data Setelah Submit

Karena FINAL SUBMIT mengunci form (is_locked=true), pemohon tidak bisa mengedit data sendiri. Jika ada kesalahan yang terdeteksi setelah submit, tersedia dua jalur koreksi:

Jalur 1 — Pemohon menghubungi Admin Prodi secara mandiri: pemohon mengidentifikasi kesalahan di Halaman 1.5, lalu menghubungi Admin Prodi (via kontak yang tersedia, di luar sistem) untuk meminta pembukaan akses perbaikan.

Jalur 2 — Admin Prodi membuka gembok form (Unlock): Admin Prodi membuka Halaman 2.1 (Antrean Pendaftar), menemukan data pemohon tersebut, klik tombol "Buka Gembok Form". Dialog konfirmasi muncul: "Anda akan membuka akses pengeditan form untuk [Nama Pemohon]. Status akan dikembalikan ke pre_submit dan pemohon akan menerima notifikasi. Lanjutkan?" Setelah konfirmasi: status berubah ke pre_submit, is_locked=false, pemohon menerima notifikasi push + email bahwa form sudah dibuka kembali dan bisa diisi ulang. Pemohon login → sistem redirect ke Halaman 1.3 (form terbuka kembali) → pemohon lakukan perbaikan → FINAL SUBMIT ulang.

CATATAN PENTING: Tombol "Buka Gembok Form" di Halaman 2.1 hanya muncul jika status pendaftaran = waiting_verification (belum masuk ke tahap asesor). Jika sudah melewati tahap verifikasi, unlock tidak tersedia melalui antarmuka dan harus ditangani secara manual di luar sistem.

Tidak tersedia fitur Admin Prodi mengedit langsung data pemohon melalui antarmuka sistem. Alasannya: menjaga integritas dan akuntabilitas data (hanya pemohon yang bisa menyatakan data mereka benar), menjaga jejak audit yang jelas tentang siapa yang mengisi data.

---

BAB 4 — SPESIFIKASI UI/UX PER HALAMAN

4.1 ROLE PEMOHON — Fase 1: Focused Mode (Tanpa Sidebar)

Halaman 1.1–selesai Final Submit menggunakan full-screen tanpa sidebar. Background #FFFFFF. Tidak ada elemen navigasi yang tidak berkaitan proses pendaftaran.

Halaman 1.1 — Registrasi & Login

Field                          | Tipe            | Wajib | Validasi & Keterangan
-------------------------------|-----------------|-------|------------------------------------------------------
Nama Lengkap (Sesuai Ijazah)   | Text Input      | Ya    | Min 3 karakter. Nama resmi di seluruh dokumen PDF.
NIK                            | Number Input    | Ya    | Tepat 16 digit. Unique di tabel users.
Email                          | Text Input      | Ya    | Format RFC 5322. Unique di tabel users. Untuk notifikasi.
Password                       | Password Input  | Ya    | Min 8 karakter. Tampilkan indikator kekuatan. Bcrypt.
Program Studi Tujuan           | Dropdown        | Ya    | Hanya is_active=true. GET /api/v1/prodi. Menentukan kurikulum Section C.
Tombol "Daftar Akun"           | Button Primary  | -     | POST /api/v1/auth/register. Sukses → login otomatis → redirect 1.2.
Tombol "Masuk Sistem"          | Button Secondary| -     | POST /api/v1/auth/login. Redirect sesuai status & role.

Halaman 1.2 — Portal Pembayaran

Hanya akses jika status=waiting_payment; selain itu auto-redirect. Menampilkan: ringkasan tagihan (nama, prodi, gelombang, nominal Rupiah), metode (QRIS + Virtual Account BCA/BNI/BRI/Mandiri/Permata), badge status dinamis (amber=Menunggu, hijau=Lunas). Mekanisme real-time via WebSocket (bukan polling): gateway POST ke /webhook/pembayaran → Laravel broadcast ke Redis → frontend auto-redirect ke 1.3. Fallback: tombol "Cek Status Pembayaran" memanggil GET /api/v1/pembayaran/{pendaftaran_id}/status.

Halaman 1.3 — Guided Entry Long Form (Borang Pendaftaran)

Full-screen tanpa sidebar. Form lima seksi (A–E) dengan auto-save background menggunakan react-intersection-observer. Data draft dipulihkan dari database (bukan hanya LocalStorage). WAJIB: Form tidak di-reset jika user refresh; data aman dari browser crash.

Section A — Identitas Diri (Form 01)

Field                          | Tipe          | Wajib | Validasi & Keterangan
-------------------------------|---------------|-------|----------------------------------------------
Tempat Lahir                   | Text          | Ya    | Min 2 karakter. Huruf & spasi.
Tanggal Lahir                  | Date Picker   | Ya    | Tidak boleh < 17 tahun dari hari ini.
Jenis Kelamin                  | Radio         | Ya    | L / P.
Agama                          | Dropdown      | Ya    | ENUM: Islam, Kristen, Katolik, Hindu, Buddha, Konghucu.
Kebangsaan                     | Text          | Ya    | Default "Indonesia". Dapat diubah.
Alamat Lengkap                 | Textarea      | Ya    | Max 255 karakter (jalan, RT/RW, kelurahan, kecamatan, kota, provinsi).
Kode Pos                       | Number        | Ya    | Tepat 5 digit.
Nomor Telepon Rumah/Kantor     | Text          | Tidak | Format: area code + nomor. Opsional.
Nomor HP/WA Aktif              | Text          | Ya    | Diawali 08 atau +62. Min 10, max 15 digit.
Nama Instansi/Perusahaan       | Text          | Tidak | Opsional.
Upload KTP                     | File Upload   | Ya    | PDF atau JPG/PNG. Max 2 MB. Upload via POST /api/v1/upload → kembalikan file_path.

Section A.2 — Daftar Pelatihan & Sertifikat (Form 01) — Tabel Berulang

Field                | Wajib per baris | Keterangan
---------------------|-----------------|-------------------------------------------
Nama Pelatihan       | Ya              | Nama lengkap pelatihan/kursus.
Penyelenggara        | Ya              | Nama lembaga penyelenggara.
Tahun                | Ya              | Tahun penyelenggaraan.
Nomor Sertifikat     | Tidak           | Jika ada.
Lama Pelatihan       | Tidak           | Contoh: 40 jam / 5 hari.

Section A.3 — Pengalaman Kerja Rinci (Form 01) — Tabel Berulang

Field                    | Wajib per baris | Keterangan
-------------------------|-----------------|-------------------------------------------
Nama Perusahaan/Instansi | Ya              | Nama lengkap.
Bidang Usaha/Pekerjaan   | Ya              | Deskripsi bidang.
Jabatan/Posisi           | Ya              | Posisi yang dipegang.
Periode Dari (MM/YYYY)   | Ya              | Format bulan/tahun.
Periode Sampai (MM/YYYY) | Tidak           | Kosong jika masih bekerja.
Status Kepegawaian       | Ya              | Dropdown: Tetap / Kontrak / Freelance / Magang.

Section B — Riwayat Hidup Lengkap (Form 16)

Section B.1 — Riwayat Pendidikan Formal

Field                     | Tipe          | Wajib | Keterangan
--------------------------|---------------|-------|-------------------------------------------
Nama PT Asal              | Text          | Ya    | Nama lengkap perguruan tinggi.
Program Studi Asal        | Text          | Ya    | Nama prodi di PT asal.
Jenjang Pendidikan Asal   | Dropdown      | Ya    | D1/D2/D3/D4/S1/S2/S3.
Tahun Masuk - Lulus       | Year Range    | Ya    | Format: YYYY - YYYY.
IPK                       | Decimal       | Tidak | Format 0.00 - 4.00.
Upload File Transkrip     | File Upload   | Ya    | PDF saja. Max 5 MB. Via POST /api/v1/upload.
Tabel MK Asal (Berulang)  | -             | Ya    | Per baris: Semester (1-14), Kode MK, Nama MK, SKS (1-6), Nilai Huruf. Min 1 baris.

Tombol "Tambah Baris MK" menambah baris baru. Tombol trash di setiap baris untuk hapus. Tombol "Simpan Batch" via POST /pendaftaran/{id}/transkrip/item/bulk.

Section B.2 — Pelatihan Profesional (Form 16) — Tabel Berulang: Tahun, Jenis Pelatihan, Penyelenggara, Durasi (Jam, opsional), Nomor Sertifikat (opsional).

Section B.3 — Konferensi/Seminar/Lokakarya (Form 16) — Tabel Berulang: Tahun, Nama Kegiatan, Penyelenggara, Peran (Peserta/Pembicara/Panitia/Moderator).

Section B.4 — Penghargaan & Piagam (Form 16) — Tabel Berulang: Tahun, Nama Penghargaan, Pemberi Penghargaan.

Section B.5 — Keanggotaan Organisasi Profesi (Form 16) — Tabel Berulang: Nama Organisasi, Nomor Anggota (opsional), Jabatan di Organisasi (opsional), Tahun Bergabung.

Section C — Asesmen Mandiri (Form 03)

Menampilkan seluruh MK kurikulum RPL prodi yang dipilih (is_active=true), urut per semester. Setiap baris tampilkan: Kode MK, Nama MK, SKS, Semester, Capaian Pembelajaran (CP Sikap/Pengetahuan/Keterampilan dari kurikulum_rpl), dan Indikator Kinerja.

Field                   | Tipe          | Wajib       | Keterangan
------------------------|---------------|-------------|----------------------------------------------------------
Self Rating (Skala 1/2/4/5) | Radio    | Ya (semua MK) | 1=Tidak Mampu, 2=Kurang Mampu, 4=Mampu, 5=Sangat Mampu. NILAI 3 TIDAK VALID.
Kode & Nomor Bukti      | Text          | Tidak       | Kode/nomor dokumen bukti yang mendukung pernyataan.

ATURAN KRITIS: self_rating WAJIB IN (1, 2, 4, 5). Nilai 3 tidak valid di semua lapisan.

Section D — Upload & Deskripsi Portofolio (Form 04)

Pemohon unggah dan deskripsikan setiap dari 10 jenis dokumen portofolio.

Kode | Jenis Dokumen               | Field                          | Keterangan
-----|-----------------------------|--------------------------------|-----------------------------------
P01  | Uraian Tugas (Job Desc)     | Upload PDF + Textarea deskripsi | Dokumen uraian tugas resmi.
P02  | SOP                         | Upload PDF + Textarea deskripsi | SOP yang pernah dibuat/digunakan.
P03  | Laporan Kerja/Proyek        | Upload PDF + Textarea deskripsi | Laporan pekerjaan atau proyek.
P04  | Hasil Penilaian Atasan      | Upload PDF + Textarea deskripsi | Dokumen penilaian kinerja atasan.
P05  | Sertifikat Kompetensi       | Upload PDF + Textarea deskripsi | Sertifikat kompetensi berlaku.
P06  | Sertifikat Pelatihan        | Upload PDF + Textarea deskripsi | Sertifikat kelulusan pelatihan.
P07  | Karya Ilmiah/Publikasi      | Upload PDF + Textarea deskripsi | Artikel, paper, karya ilmiah.
P08  | Portofolio Proyek/Desain    | Upload PDF/ZIP + Textarea deskripsi | Kumpulan karya relevan.
P09  | Penghargaan/Piagam Profesi  | Upload PDF/JPG + Textarea deskripsi | Sertifikat penghargaan profesi.
P10  | Dokumen Pendukung Lainnya   | Upload PDF + Textarea deskripsi | Dokumen lain relevan dengan CP MK.

Upload portofolio: max 10 MB per file (PDF/JPG/PNG/ZIP).

Section E — Pernyataan Keabsahan & Finalisasi (Form 01 + Form 16)

Pernyataan mencakup dua aspek: keabsahan data identitas, riwayat hidup, dan CV (Form 16), serta keabsahan asesmen mandiri dan dokumen portofolio (Form 01). Checkbox wajib dicentang sebelum tombol FINAL SUBMIT aktif. FINAL SUBMIT memiliki dialog konfirmasi dua langkah. Setelah konfirmasi: PATCH /pendaftaran/{id}/final-submit → is_locked=true, status→waiting_verification, trigger generate PDF Tanda Terima (Form 06) + PDF Form 16, alihkan ke Fase 2 (Panel Mode).

4.2 ROLE PEMOHON — Fase 2: Panel Mode (Dengan Sidebar)

Background #F8FAFC. Sidebar: avatar/nama, status ringkas, menu navigasi.

Menu Sidebar           | Halaman | Visibilitas
-----------------------|---------|-------------------------------------------------------
Status Pendaftaran     | 1.4     | Selalu tampil (halaman default)
Arsip Borang Saya      | 1.5     | Selalu tampil
Ruang Uji Lanjutan     | 1.6     | Hanya jika ada MK dengan status Uji Lanjutan
Lembar Jawaban Tulis   | 1.6a    | Hanya jika Asesor finalisasi soal ujian tulis
Hasil Akhir & Sanggahan| 1.7     | Hanya setelah status = selesai

Halaman 1.4 — Dashboard Status Pendaftaran

Stepper Visual 6 tahap: (1) Verifikasi Admin → (2) Pra Asesmen → (3) Penilaian Asesor → (4) Rapat Pleno → (5) Penerbitan SK → (6) Selesai. Tahap selesai: emerald-600. Tahap aktif: blue-800 + animasi pulse. Tahap belum: slate-200. Panel notifikasi: pesan status terkini dari tabel notifikasi. Tombol "Unduh Tanda Terima (Form 06)" selalu tersedia.

Halaman 1.5 — Arsip Borang (Read-Only)

Empat tab/akordion read-only sempurna: (1) Identitas Diri + Pelatihan + Pengalaman Kerja, (2) Riwayat Hidup Lengkap (CV: pelatihan profesi, konferensi, penghargaan, organisasi), (3) Transkrip Akademik (header + tabel MK asal + link file), (4) Asesmen Mandiri (tabel MK POLIBAN + self-rating + kode bukti).

Halaman 1.6 — Ruang Uji Lanjutan

Muncul di sidebar jika ada MK dengan keputusan Uji Lanjutan. Menampilkan detail undangan (Form 08): nama mahasiswa, MK yang diuji, jenis ujian, tanggal/jam (dengan timezone), lokasi/link, nama asesor. Tombol "Konfirmasi Kehadiran Saya" → POST /pemohon/uji-lanjutan/{id}/konfirmasi. Setelah klik, berubah jadi badge "Kehadiran Dikonfirmasi" (hijau), tidak bisa diklik lagi; asesor terima notifikasi real-time.

Halaman 1.6a — Lembar Jawaban Ujian Tulis (Form 10)

Muncul jika jenis ujian = Tulis. Menampilkan setiap soal (nomor soal, teks pertanyaan) dengan textarea jawaban. Auto-save setiap 30 detik. Tombol "Submit Jawaban" mengunci semua jawaban (is_submitted=true); halaman berubah ke read-only. ATURAN KRITIS: Setelah submit, endpoint PUT jawaban-tulis wajib HTTP 403.

Halaman 1.7 — Hasil Akhir & Masa Sanggah

Tiga bagian: (1) Tabel Hasil (Form 15): Kode MK, Nama MK, SKS Diakui, Nilai Mutu, CP MK, Keterangan. Baris tidak diakui: latar red-50. Total SKS di bawah tabel. (2) Panel Briefing Sanggah: prosedur, timeline, dua jalur banding. Pemohon klik "Saya Mengerti" sebelum form sanggahan terbuka. (3) Form Sanggahan (Form 17): multi-select MK, alasan per MK (wajib), file bukti (opsional, PDF max 5 MB), informasi jalur banding ke Pimpinan PT (kontak/email). Countdown deadline sanggah atau teks "Masa sanggahan telah berakhir."

4.3 ROLE ADMIN PRODI

Menu Sidebar              | Halaman | Deskripsi Singkat
--------------------------|---------|--------------------------------------
Antrean Pendaftar         | 2.1     | Dashboard utama — semua pendaftar masuk
Manajemen Kurikulum RPL   | 2.2     | Kelola MK dan Matriks Asesmen MK (Form 13)
Verifikasi & Penugasan    | 2.3     | Review berkas split-screen + plot asesor
Dashboard Pleno           | 2.4     | Sinkronisasi & pengesahan nilai (Form 14)
Matriks Alih Kredit       | 2.5a    | Kelola dan cetak Form 12
Loker Arsip Fisik         | 2.5     | Upload SK tanda tangan basah + publikasi

Halaman 2.1 — Antrean Pendaftar

Tabel: No, Tanggal Masuk (DD/MM/YYYY HH:mm WIB), Nama Pendaftar, Asal PT, Status Alur (Badge: Baru=amber, Verifikasi=blue, Asesmen=purple, Pleno=orange, Selesai=green), Aksi. Filter dropdown Status Alur. Search bar nama/asal PT. Pagination 20 baris/halaman. Aksi per baris: "Buka Berkas" → Halaman 2.3. "Buka Gembok Form" (hanya jika status=waiting_verification) → PATCH /pendaftaran/{id}/unlock, dialog konfirmasi, status→pre_submit, notifikasi ke mahasiswa.

Halaman 2.2 — Manajemen Kurikulum RPL & Matriks Asesmen MK (Form 13)

Tabel kurikulum: Kode MK, Nama MK, SKS, Semester, Status (toggle Aktif/Nonaktif). Baris nonaktif: teks abu-abu + latar stripe. Toggle Aktif/Nonaktif tidak menghapus data penilaian historis.

Form Tambah/Edit MK:

Field                        | Tipe     | Wajib | Keterangan
-----------------------------|----------|-------|--------------------------------------
Kode MK                      | Text     | Ya    | Unique per prodi.
Nama MK                      | Text     | Ya    |
SKS                          | Number   | Ya    | 1-6.
Semester                     | Number   | Ya    | 1-8.
Deskripsi CPMK (umum)        | Textarea | Ya    | Capaian pembelajaran umum.
Deskripsi CP Sikap           | Textarea | Tidak |
Deskripsi CP Pengetahuan     | Textarea | Ya    |
Deskripsi CP Keterampilan    | Textarea | Ya    |
Indikator Kinerja            | Textarea | Ya    |
Level KKNI                   | Dropdown | Ya    | 1-9.
Profil Lulusan               | Text     | Tidak |

Import Excel via POST /prodi/{prodi_id}/kurikulum/import. Kolom: Kode MK | Nama MK | SKS | Semester | Deskripsi CPMK. Sistem tampilkan preview sebelum konfirmasi.

Tab "Matriks Asesmen MK" (Form 13): tabel MK vs. 11 metode asesmen (C1=Sertifikat, C2=Observasi, C3=Lisan, C4=Praktek, C5=Tulis, C6=Portofolio, C7=Simulasi, C8=Proyek, C9=Presentasi, C10=Studi Kasus, C11=Lainnya). Admin centang metode per MK. Tampilkan Profil Lulusan dan Level KKNI. Tombol "Generate PDF Form 13".

Halaman 2.3 — Verifikasi Berkas & Penugasan Asesor (Split-Screen)

Panel kiri (55%): PDF viewer inline (react-pdf + signed URL expiry 15 menit). Tab KTP, Tab Transkrip Asal. Panel kanan (45%): area kerja Admin.

Checklist verifikasi (dua checkbox wajib): "KTP Valid dan Terbaca" + "Transkrip Terbaca dan Lengkap". Keduanya harus dicentang sebelum tombol penugasan aktif.

Pra-Pemetaan (OPSIONAL): Admin buat usulan pemetaan MK asal → MK POLIBAN sebagai saran untuk asesor. Bukan keputusan final. Boleh dikosongkan. Disimpan sebagai JSON di pra_pemetaan_payload.

Penugasan Asesor: Dropdown Asesor 1 (daftar asesor prodi sama). Dropdown Asesor 2 (otomatis exclude pilihan Asesor 1; constraint asesor_1_id <> asesor_2_id). Tombol "Tugaskan Asesor" → POST /admin/pendaftaran/{id}/plotting.

Halaman 2.4 — Dashboard Pleno

Diakses setelah status=waiting_pleno. Tabel Komparasi (Form 14): Nama MK, Keputusan Asesor 1, Nilai Mutu Asesor 1, SKS Asesor 1, Keputusan Asesor 2, Nilai Mutu Asesor 2, SKS Asesor 2, Rata-rata Bobot Sistem, Flag Selisih. Baris dengan selisih bobot > 1.0 poin: latar amber-50 (perlu diskusi). Jika satu asesor "Diakui" dan satunya "Tidak Diakui": status "Perlu Keputusan Manual", Admin wajib pilih eksplisit.

Kalkulasi rata-rata: bobot numerik dari nilai_mutu_ref, rata-rata dikonversi ke nilai huruf terdekat. Tombol "Sahkan Nilai Pleno": dialog konfirmasi dua langkah → kunci data pleno → generate Berita Acara (Form 15) via background job → status→selesai (draft). Tombol "Generate Draft SK" → POST /admin/pleno/{pendaftaran_id}/generate-sk → PDF Form 18 draft.

Halaman 2.5a — Matriks Alih Kredit (Form 12)

Matriks memetakan MK asal → MK POLIBAN beserta analisa gap.

Kolom Matriks       | Sumber Data          | Dapat Diedit | Keterangan
--------------------|----------------------|--------------|----------------------------------
Kode MK Asal        | transkrip_asal_item  | Tidak        | Kode dari transkrip PT asal.
Nama MK Asal        | transkrip_asal_item  | Tidak        |
SKS Asal            | transkrip_asal_item  | Tidak        |
CP MK Asal          | Input Asesor         | Ya           | Asesor isi deskripsi CP dari MK asal.
MK POLIBAN dipetakan| kurikulum_rpl        | Ya (Dropdown)|
CP MK POLIBAN       | kurikulum_rpl        | Tidak (auto) | Auto-terisi dari kurikulum.
Analisa Gap         | Input Asesor         | Ya           | Asesor deskripsikan gap CP asal vs POLIBAN.
Catatan Asesor      | Input Asesor         | Ya           |
Rekomendasi         | Input Asesor         | Ya           | Diakui Penuh / Diakui Sebagian / Tidak Diakui.

Halaman 2.5 — Loker Arsip Fisik

Daftar semua 19 dokumen (F01-F19) beserta status tersedia/belum dan status tanda tangan basah. Upload scan SK bertanda tangan (is_signed_basah→true). Tombol "Publikasi Hasil ke Mahasiswa" → PATCH /admin/arsip/{pendaftaran_id}/publikasi → status→selesai (final), aktifkan Halaman 1.7, kirim notifikasi push/email ke mahasiswa.

4.4 ROLE ASESOR 1 & ASESOR 2

Menu Sidebar                  | Halaman | Deskripsi Singkat
------------------------------|---------|------------------------------------------
Daftar Tugas Asesmen          | 3.1     | Kotak masuk berkas ditugaskan
Form Pra Asesmen              | 3.1a    | Form 02: 8 langkah pra asesmen
Workspace Blind Review        | 3.2     | Penilaian split-screen utama
Evaluasi Portofolio           | 3.2a    | Form 04: evaluasi 10 jenis portofolio
Penilaian CP (3-Dimensi)      | 3.2b    | Form 05: Kognitif/Skill/Afektif per MK
Matriks Alih Kredit           | 3.2c    | Form 12: isi matriks alih kredit
Manajemen Uji Lanjutan        | 3.3     | Jadwal dan berita acara uji
Perangkat Asesmen Tulis       | 3.3a    | Form 09: buat soal + kunci jawaban
Lembar Pertanyaan Lisan       | 3.3b    | Form 11: daftar pertanyaan wawancara terstruktur
Penilaian Jawaban Tulis       | 3.3c    | Form 10: nilai jawaban per soal
Tinjauan Sanggahan            | 3.4     | Ruang banding dan keputusan final sanggah

Halaman 3.1 — Daftar Tugas Asesmen

Tabel: No, Nama Mahasiswa, Asal PT, Program Studi, Tanggal Masuk Penugasan, Status Penilaian (Badge: Belum Dinilai=red, Sedang Dinilai=amber, Submit Final=green). Tombol "Mulai/Lanjutkan Penilaian" per baris.

Halaman 3.1a — Form Pra Asesmen (Form 02)

No | Langkah                          | Field yang Diisi                     | Wajib
---|----------------------------------|--------------------------------------|------
1  | Pembukaan & Penjelasan Tujuan    | Checkbox + Catatan                   | Ya
2  | Konfirmasi Identitas Pemohon     | Checkbox + NIK & nama dikonfirmasi   | Ya
3  | Kaji Bukti Portofolio Awal       | Checkbox + Catatan observasi awal    | Ya
4  | Konfirmasi Tujuan Asesmen        | Checkbox + Catatan diskusi           | Ya
5  | Jelaskan Metode & Prosedur       | Checkbox + Metode yang digunakan     | Ya
6  | Identifikasi Kebutuhan Khusus    | Checkbox + Catatan kebutuhan         | Ya
7  | Perjanjian Kerahasiaan           | Checkbox persetujuan                 | Ya
8  | Kesepakatan Jadwal               | Tanggal & waktu disepakati           | Ya

Bagian bawah: Rekomendasi (Lanjut Penuh / Lanjut dengan Catatan / Tidak Memenuhi Syarat) + Textarea Catatan Umum. Tombol "Simpan & Kirim" → submit Form 02 → status→assessment_in_progress → notifikasi Admin & Pemohon.

Halaman 3.2 — Workspace Blind Review (Split-Screen)

Menggunakan react-resizable-panels; pemisah dapat digeser bebas. Panel kiri memiliki 5 tab referensi:
- Tab 1: Transkrip Asal — tabel MK asal (nama, SKS, nilai).
- Tab 2: Asesmen Mandiri — self-rating pemohon (skala 1/2/4/5) + kode bukti.
- Tab 3: Evaluasi Portofolio — hasil Form 04 (V/A/T/C per dokumen).
- Tab 4: Penilaian CP — form Form 05 (Kognitif/Skill/Afektif per MK).
- Tab 5: Usulan Pra-Pemetaan Admin — saran admin (opsional).

Panel kanan — Form Penilaian Per MK. Field per MK: (1) Keputusan: Dropdown [Diakui / Tidak Diakui / Uji Lanjutan] — WAJIB. (2) Nilai Mutu: Dropdown [A, A-, B+, B, B-, C+, C, D, E] — WAJIB jika Keputusan=Diakui. (3) SKS Diakui: Number (default dari kurikulum, dapat diubah) — WAJIB jika Diakui. (4) Catatan Asesor: Textarea — WAJIB jika Tidak Diakui atau Uji Lanjutan.

Tombol "Simpan Progress" — simpan draf, bisa berkali-kali. Tombol "SUBMIT FINAL" — kunci semua penilaian (is_final=true), dialog konfirmasi dua langkah, tidak bisa diubah. Jika kedua asesor sudah submit: status→waiting_pleno, notifikasi ke Admin.

Halaman 3.2a — Evaluasi Portofolio (Form 04)

Asesor evaluasi 10 jenis dokumen portofolio yang diunggah pemohon.

Kode | Jenis Dokumen         | Field Evaluasi              | Nilai (VATC)
-----|-----------------------|-----------------------------|----------------------------------------------
P01  | Uraian Tugas          | Textarea catatan evaluasi   | V=Valid, A=Autentik, T=Terkini, C=Cukup, N/A
P02  | SOP                   | Textarea catatan evaluasi   | V/A/T/C/N/A
P03  | Laporan Kerja         | Textarea catatan evaluasi   | V/A/T/C/N/A
P04  | Penilaian Atasan      | Textarea catatan evaluasi   | V/A/T/C/N/A
P05  | Sertifikat Kompetensi | Textarea catatan evaluasi   | V/A/T/C/N/A
P06  | Sertifikat Pelatihan  | Textarea catatan evaluasi   | V/A/T/C/N/A
P07  | Karya Ilmiah          | Textarea catatan evaluasi   | V/A/T/C/N/A
P08  | Portofolio Proyek     | Textarea catatan evaluasi   | V/A/T/C/N/A
P09  | Penghargaan           | Textarea catatan evaluasi   | V/A/T/C/N/A
P10  | Dokumen Lainnya       | Textarea catatan evaluasi   | V/A/T/C/N/A

Bagian bawah: tindak lanjut ke asesmen tahap 2 — Asesor centang MK mana yang perlu uji lanjutan berdasarkan evaluasi portofolio.

Halaman 3.2b — Penilaian CP 3-Dimensi (Form 05)

Per MK POLIBAN:

Dimensi          | Skala              | Wajib | Keterangan
-----------------|---------------------|-------|--------------------------------
Kognitif         | 1-4 (TM/C/B/SB)    | Ya    | Pengetahuan & pemahaman teori.
Skill/Psikomotor | 1-4 (TM/C/B/SB)    | Ya    | Keterampilan teknis & praktik.
Afektif/Sikap    | 1-4 (TM/C/B/SB)    | Tidak | Sikap profesional & etos kerja.

Field tambahan: "Dokumen Yang Relevan Dengan CP MK" (multi-select dari daftar portofolio pemohon) + "Catatan Asesor per MK". Keputusan akhir: Diakui / Belum Diakui / Uji Lanjutan. Nilai mutu wajib jika Diakui.

Halaman 3.3 — Manajemen Uji Lanjutan

Form Jadwal Ujian (Form 07/08): Pilih MK (hanya dengan keputusan Uji Lanjutan), Jenis Ujian (Wawancara/Ujian Tulis/Ujian Praktek), Tanggal & Jam (date-time picker, timezone default Asia/Makassar), Lokasi/Link (wajib salah satu). Tombol "Kirim Undangan (Form 08)" → notifikasi ke dashboard mahasiswa → aktifkan menu Ruang Uji Lanjutan di sidebar pemohon. Tab terpisah "Biodata Asesor (Form 07)" untuk asesor isi/perbarui profil lengkap.

Halaman 3.3a — Perangkat Asesmen Tulis (Form 09)

Field                      | Tipe          | Wajib     | Keterangan
---------------------------|---------------|-----------|-------------------------------------------
Pilih MK yang Diuji        | Dropdown multi| Ya        | Hanya MK dengan keputusan Uji Lanjutan.
Metode Asesmen             | Dropdown      | Ya        | Ujian Tulis / Wawancara / Praktek.
Waktu Pelaksanaan (Menit)  | Number        | Ya        | Durasi ujian.
Pertanyaan No.[N] Teks     | Textarea      | Ya per soal|
Kunci Jawaban No.[N]       | Textarea      | Ya per soal| Untuk penilaian oleh Asesor.
Bobot Nilai No.[N] (%)     | Number 1-100  | Ya per soal| Bobot persentase terhadap total nilai.
Tombol "Tambah Soal"       | Button        | -          | Menambah baris soal baru.

Endpoint soal tulis hanya bisa diakses jika uji_lanjutan.jenis_ujian = 'Tulis'.

Halaman 3.3b — Lembar Pertanyaan Lisan (Form 11)

Field                    | Tipe          | Wajib          | Keterangan
-------------------------|---------------|----------------|-------------------------------------------
Pilih MK                 | Dropdown      | Ya             | Hanya MK Uji Lanjutan.
Durasi Wawancara (Menit) | Number        | Ya             | Default 30.
Teks Pertanyaan No.[N]   | Textarea      | Ya per pertanyaan|
Panduan Penilaian No.[N] | Textarea      | Ya per pertanyaan| Indikator menilai jawaban lisan.
Jawaban Pemohon No.[N]   | Textarea      | Ya (saat wawancara) | Diisi Asesor saat/setelah wawancara.
Skor per Pertanyaan (1-5)| Radio         | Ya             | 1=Sangat Kurang, 5=Sangat Baik.

Endpoint pertanyaan lisan hanya bisa diakses jika uji_lanjutan.jenis_ujian = 'Wawancara'.

Halaman 3.3c — Penilaian Jawaban Tulis (Form 10)

Asesor menilai jawaban tulis pemohon. Per soal: tampilkan Teks Soal, Kunci Jawaban (dari Form 09), Jawaban Pemohon (read-only). Asesor beri Skor per Soal (1-5): 1=Tidak Tepat, 5=Sangat Tepat. Nilai rata-rata dihitung otomatis berbobot. Textarea "Catatan Penilai" (opsional). Tombol "Simpan Penilaian" integrasikan hasil ke penilaian akhir MK.

Halaman 3.4 — Tinjauan Sanggahan

Daftar sanggahan masuk ke asesor yang login. Per item: Nama Mahasiswa, MK yang disanggah, Alasan per MK, Bukti tambahan (link unduh), Nilai lama, Waktu pengajuan. Form keputusan: Radio Terima/Tolak. Jika Terima: Nilai Mutu Baru + SKS Baru wajib diisi. Textarea Alasan Keputusan wajib di semua kondisi. Tombol "Finalisasi Sanggah" mutlak tidak bisa diubah; dialog konfirmasi muncul.

4.5 Biodata Asesor (Form 07)

Di halaman profil asesor:

Field                       | Tipe     | Wajib | Keterangan
----------------------------|----------|-------|---------------------------
Nama Lengkap                | Text     | Ya    | Sudah ada di v2.
NIP                         | Text     | Ya    | Sudah ada di v2.
Email                       | Email    | Ya    | Sudah ada di v2.
Jabatan Fungsional          | Text     | Tidak | Lektor, Lektor Kepala, dll.
Bidang Keilmuan             | Text     | Ya    | Bidang keahlian utama.
Keanggotaan Asosiasi Profesi| Text     | Tidak | Nama organisasi profesi.
Nomor Anggota Asosiasi      | Text     | Tidak |
Alamat Kantor               | Textarea | Tidak |
No. Telepon Kantor          | Text     | Tidak |
Pendidikan Terakhir         | Dropdown | Tidak | S1/S2/S3/Profesi.

4.6 ROLE SUPER ADMIN

Menu Sidebar                  | Halaman | Deskripsi Singkat
------------------------------|---------|---------------------------------------------
Dashboard Eksekutif & Analitik| 4.1     | Metrik agregat seluruh sistem
Manajemen Gelombang & Biaya   | 4.2     | Buka/tutup periode pendaftaran
Manajemen Program Studi       | 4.3     | Kelola daftar prodi aktif di RPL
User Access Control (UAC)     | 4.4     | Buat dan kelola akun staf
System Audit Log              | 4.5     | Rekaman forensik seluruh aktivitas

Halaman 4.1 — Dashboard Eksekutif

Card Stats: Total Pendaftar Aktif, Total Pendaftar Lulus RPL (status=selesai), Total SKS Direkognisi (SUM sks_diakui_final), Total Pendapatan (SUM nominal pembayaran success). Grafik batang: distribusi pendaftar per prodi. Grafik garis: tren pendaftar per gelombang. Tabel breakdown per prodi: Total Pendaftar, Total Diakui, Total SKS, Total Pendapatan.

Halaman 4.2 — Manajemen Gelombang & Biaya

Tabel: Nama Gelombang, Tanggal Buka, Tanggal Tutup, Deadline Sanggah, Biaya, Total Pendaftar, Status. Form Tambah/Edit: Nama Gelombang, Tanggal Buka, Tanggal Tutup (harus setelah Buka), Deadline Sanggah (harus >= Tutup, wajib), Biaya (Rupiah). Validasi: tidak overlap gelombang aktif lain. ATURAN KRITIS: hanya satu gelombang is_active=true sekaligus. PATCH toggle-aktif menggunakan atomic transaction.

Halaman 4.3 — Manajemen Program Studi

Form Tambah/Edit: Nama Fakultas, Nama Program Studi, Kode Prodi Nasional (unique), Status toggle Aktif/Tutup. Prodi Tutup tidak muncul di form registrasi mahasiswa.

Halaman 4.4 — User Access Control (UAC)

Tabel User Staf: Nama, NIP, Email, Role, Prodi Induk, Status Akun, Aksi (Edit, Nonaktifkan, Impersonate, Reset Password). Form Tambah/Edit: Nama Lengkap, NIP (unique), Email POLIBAN (unique), Role (Admin Prodi/Asesor/Super Admin), Prodi Induk (jika role=Admin Prodi atau Asesor).

Fitur Impersonate: tombol "Login Sebagai" + dialog konfirmasi. Catat di audit_logs.impersonated_by. Banner kuning permanen di atas layar saat mode impersonate. Tombol "Kembali ke Akun Saya" → DELETE /users/impersonate.

Reset Password: POST /users/{id}/reset-password → password acak + kirim via email → catat di audit log.

Halaman 4.5 — System Audit Log

Tabel: Timestamp (DD/MM/YYYY HH:mm:ss WIB), Nama User (+ role), Action Type, Deskripsi Lengkap, IP Address, Flag Impersonated (Ya/Tidak). Filter: Role User, Action Type, Rentang Tanggal, IP Address. Search: nama user atau deskripsi. Pagination 50 baris/halaman. Ekspor CSV → GET /superadmin/audit-log/export. Rate limit: max 5 kali/jam/user.

---

BAB 5 — DESIGN SYSTEM & PANDUAN VISUAL

5.1 Teknologi UI

Shadcn/UI (komponen base) + Tailwind CSS v4 (styling engine). CSS-first configuration: semua token (warna, radius, spacing) didefinisikan sebagai CSS variables di global.css. Tidak menggunakan tailwind.config.js.

5.2 Tipografi

Elemen            | Font                | Ukuran   | Weight | Tracking    | Keterangan
------------------|---------------------|----------|--------|-------------|----------------------------
H1 Judul Halaman  | Inter / Geist Sans  | 24px     | 700    | -0.025em    | Header utama setiap halaman
H2 Sub-judul      | Inter / Geist Sans  | 20px     | 600    | -0.015em    | Pembagi antar seksi besar
H3 Sub-seksi      | Inter / Geist Sans  | 18px     | 600    | normal      | Card, panel, accordion
Body              | Inter / Geist Sans  | 16px     | 400    | normal      | Paragraf, konten
Label Form        | Inter / Geist Sans  | 14px     | 500    | normal      | Label input, kolom tabel
Helper/Teks Bantu | Inter / Geist Sans  | 14px     | 400    | normal      | Placeholder, error, caption
Kode/Monospace    | JetBrains Mono      | 14px     | 400    | normal      | Kode MK, API path, NIK, token

Tabular Numbers: aktifkan font-variant-numeric: tabular-nums untuk semua angka di tabel (SKS, nilai, Rupiah).

5.3 Geometri Komponen

Properti                | Nilai  | Tailwind       | Alasan
------------------------|--------|----------------|--------------------------------------------
Border Radius Komponen  | 8px    | rounded-lg     | Sweet spot enterprise
Box Shadow Card         | 0 1px 2px rgba(0,0,0,0.05) | shadow-sm | Hierarki visual tipis
Spacing Dasar           | 4px    | p-1, gap-1     | Seluruh spacing kelipatan 4px
Padding Card            | 24px   | p-6            |
Padding Cell Tabel      | 12px H, 8px V | px-3 py-2 |

5.4 Palet Warna — Light Mode (Default)

Token                          | Hex      | Tailwind Class   | Penggunaan
-------------------------------|----------|------------------|---------------------------------------
Background Focused Mode        | #FFFFFF  | bg-white         | Latar Fase 1 full-screen
Background Panel/Dashboard     | #F8FAFC  | bg-slate-50      | Latar dashboard semua role
Background Card                | #FFFFFF  | bg-white         | Card, form section, tabel
Primary (Tombol Utama)         | #1E40AF  | bg-blue-800      | Aksi utama, stepper aktif
Primary Hover                  | #1E3A8A  | bg-blue-900      | Hover tombol primary
Warning/Pending                | #F59E0B  | bg-amber-500     | Badge pending, peringatan non-kritis
Success                        | #059669  | bg-emerald-600   | Konfirmasi positif, status berhasil
Destructive                    | #DC2626  | bg-red-600       | Aksi destruktif, status ditolak
Teks Judul Utama               | #0F172A  | text-slate-900   | Heading, teks paling penting
Teks Konten Utama              | #1E293B  | text-slate-800   | Body text, konten tabel
Teks Sekunder/Label            | #475569  | text-slate-600   | Label form, deskripsi, caption
Teks Placeholder               | #94A3B8  | text-slate-400   | Placeholder, teks nonaktif
Border Komponen                | #E2E8F0  | border-slate-200 | Garis tepi card, divider, input
Border Input Focus             | #1E40AF  | border-blue-800  | Ring fokus pada input aktif

5.5 Palet Warna — Dark Mode

Diaktifkan via class="dark" pada <html>, dikelola next-themes.

Token                  | Hex      | Tailwind Dark Class     | Catatan
-----------------------|----------|-------------------------|-----------------------------
Background Utama       | #020617  | dark:bg-slate-950       | Hitam kebiruan, bukan pure #000
Background Card        | #0F172A  | dark:bg-slate-900       | Satu level lebih terang
Border                 | #1E293B  | dark:border-slate-800   |
Primary                | #2563EB  | dark:bg-blue-600        | Lebih terang untuk visibilitas gelap
Teks Judul             | #F8FAFC  | dark:text-slate-50      | Hampir putih
Teks Sekunder          | #94A3B8  | dark:text-slate-400     |

ATURAN MUTLAK PDF: Meskipun user aktifkan Dark Mode, SELURUH dokumen PDF yang dirender Spatie Browsershot di server WAJIB menggunakan stylesheet Light Mode secara paksa. Implementasi wajib di semua template Blade/HTML yang dirender Browsershot:

class="light" pada elemen root HTML.
<style>
  * { color: #0F172A !important; background-color: transparent !important; }
  body { background-color: #FFFFFF !important; }
  @media (prefers-color-scheme: dark) {
    * { color: #0F172A !important; background-color: transparent !important; }
    body { background-color: #FFFFFF !important; }
  }
</style>

---

BAB 6 — SPESIFIKASI TECH STACK LENGKAP

6.1 Frontend

Teknologi              | Versi          | Peran                              | Justifikasi Teknis
-----------------------|----------------|------------------------------------|--------------------------------------------
Next.js                | 15 (App Router)| Framework utama frontend           | RSC kirim HTML statis, kurangi bundle JS; loading Halaman 1.1 dalam milidetik.
React                  | 19             | Library UI                         | React Compiler auto-memoization tanpa useMemo/useCallback manual; cegah lag tabel banyak baris.
Zustand                | latest (<2.0)  | State management global            | <2kb; kelola toggle sidebar, cache draft form, state UI global.
React Hook Form        | latest         | Form handling                      | Cegah re-render saat satu karakter diketik; esensial untuk form panjang Halaman 1.3.
Zod                    | latest         | Schema validation                  | Type-safe: NIK=16 digit, KTP=pdf/jpg. Validasi berlapis client sebelum menyentuh API.
react-intersection-observer | latest  | Sensor auto-save                   | Gunakan Intersection Observer API browser; trigger auto-save saat user lewati batas seksi; tanpa event scroll berat.
react-resizable-panels | latest         | Split-screen workspace             | Asesor geser pemisah panel kiri-kanan di Halaman 3.2 sesuai kebutuhan.
next-themes            | latest         | Dark/Light mode toggle             | Manipulasi class dark: mengikuti prefers-color-scheme OS.
Tailwind CSS           | v4             | Styling engine                     | CSS-first; token didefinisikan sebagai CSS variables di global.css.
Shadcn/UI              | latest         | Komponen UI base                   | Accessible, composable; kode komponen dimiliki project (bukan library opinionated).
react-pdf              | latest         | PDF viewer inline                  | Tampilkan PDF KTP dan transkrip langsung di browser; dipakai di split-screen 2.3.

6.2 Backend

Teknologi                   | Versi   | Peran                              | Justifikasi Teknis
----------------------------|---------|------------------------------------|--------------------------------------------
Laravel                     | 13      | Framework API backend              | Struktur API headless rapi.
PHP                         | 8.4+    | Runtime                            | Asymmetric visibility (public get, private set) untuk DTO type-safe tidak bisa dimutasi sembarangan.
Laravel Octane + FrankenPHP | latest  | Concurrency engine                 | Aplikasi di-boot sekali di RAM; respons API ~10-20ms; tahan banyak pendaftar bersamaan.
Laravel Sanctum             | latest  | Autentikasi API                    | Bearer Token stateless multi-role; mendukung token revocation dan impersonate.
Redis                       | 7.x     | Cache & Message Broker             | In-memory; tampung antrian background jobs dan broker real-time broadcast event.
Laravel Horizon             | latest  | Queue monitoring                   | Dashboard visual untuk pantau antrian Redis, failed jobs, dan throughput worker.
Laravel Echo + Reverb/Soketi| latest  | WebSocket server                   | Broadcast real-time event (status pembayaran, notifikasi) dari Laravel ke Next.js.
Spatie Browsershot          | latest  | PDF generator                      | Headless Chrome; render Tailwind CSS 100% fidelitas; WAJIB force light mode stylesheet.
knuckleswtf/scribe           | latest  | API documentation                  | Auto-generate openapi.json dari controller; AI Agent baca kontrak API tanpa penjelasan manual.
Spatie Laravel Permission   | latest  | Role & Permission                  | RBAC terintegrasi Eloquent.

6.3 Database & Infrastruktur

Teknologi                   | Versi        | Peran                  | Justifikasi Teknis
----------------------------|--------------|------------------------|--------------------------------------------
MySQL                       | 8.4 LTS (9.x)| Database relasional    | JSON path untuk audit log; InnoDB ACID; collation utf8mb4_0900_ai_ci untuk performa sorting tertinggi.
Eloquent ORM (Strict Mode)  | Laravel built-in| Database abstraction | Strict Mode cegah N+1 Query; eager loading wajib untuk semua relasi.
Laravel Storage (S3 compat) | -            | File storage           | Simpan KTP, transkrip, portofolio, bukti sanggahan, scan SK. Signed URL expiry 15 menit.

---

BAB 7 — SKEMA DATABASE LENGKAP (PRODUCTION-READY)

7.1 Konfigurasi Global

Seluruh tabel: ENGINE=InnoDB, CHARSET=utf8mb4, COLLATE=utf8mb4_0900_ai_ci, DATETIME untuk semua timestamp (cegah Year-2038 Bug), SET time_zone = "+07:00" (WIB).

7.2 Tabel Referensi Nilai Mutu — nilai_mutu_ref (KRITIS)

nilai_huruf (PK) | bobot_angka | keterangan
-----------------|-------------|-------------------
A                | 4.00        | Sangat Memuaskan
A-               | 3.75        | Memuaskan Plus
B+               | 3.50        | Baik Plus
B                | 3.00        | Baik
B-               | 2.75        | Cukup Baik
C+               | 2.50        | Cukup Plus
C                | 2.00        | Cukup
D                | 1.00        | Kurang
E                | 0.00        | Tidak Lulus

CREATE TABLE nilai_mutu_ref (
    nilai_huruf   CHAR(2)        NOT NULL,
    bobot_angka   DECIMAL(4,2)   NOT NULL,
    keterangan    VARCHAR(50)    NOT NULL,
    PRIMARY KEY (nilai_huruf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO nilai_mutu_ref VALUES
  ('A','4.00','Sangat Memuaskan'),('A-','3.75','Memuaskan Plus'),
  ('B+','3.50','Baik Plus'),('B','3.00','Baik'),('B-','2.75','Cukup Baik'),
  ('C+','2.50','Cukup Plus'),('C','2.00','Cukup'),('D','1.00','Kurang'),
  ('E','0.00','Tidak Lulus');

7.3 Grup 1: Core Entities

CREATE TABLE prodi (
    id            SMALLINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    fakultas      VARCHAR(100)       NOT NULL,
    nama_prodi    VARCHAR(100)       NOT NULL,
    kode_nasional VARCHAR(20)        NOT NULL,
    is_active     BOOLEAN            NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_prodi_kode (kode_nasional)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE users (
    id                   MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name                 VARCHAR(100)       NOT NULL,
    email                VARCHAR(100)       NOT NULL,
    password             VARCHAR(255)       NOT NULL,
    role                 ENUM('pemohon','admin_prodi','asesor','super_admin') NOT NULL,
    prodi_id             SMALLINT UNSIGNED      NULL DEFAULT NULL,
    is_active            BOOLEAN            NOT NULL DEFAULT TRUE,
    deleted_at           DATETIME               NULL DEFAULT NULL,
    -- Form 07 Biodata Asesor fields:
    jabatan_fungsional   VARCHAR(100)           NULL,
    bidang_keilmuan      VARCHAR(150)           NULL,
    asosiasi_profesi     VARCHAR(100)           NULL,
    no_anggota_asosiasi  VARCHAR(50)            NULL,
    alamat_kantor        VARCHAR(255)           NULL,
    no_telepon_kantor    VARCHAR(20)            NULL,
    pendidikan_terakhir  ENUM('S1','S2','S3','Profesi') NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT fk_users_prodi FOREIGN KEY (prodi_id) REFERENCES prodi (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE gelombang (
    id                SMALLINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    nama_gelombang    VARCHAR(50)        NOT NULL,
    tgl_buka          DATE               NOT NULL,
    tgl_tutup         DATE               NOT NULL,
    deadline_sanggah  DATE               NOT NULL,
    biaya_pendaftaran DECIMAL(10,2)      NOT NULL,
    is_active         BOOLEAN            NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    CONSTRAINT ck_gelombang_tanggal CHECK (tgl_tutup > tgl_buka),
    CONSTRAINT ck_gelombang_sanggah CHECK (deadline_sanggah >= tgl_tutup)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

7.4 Grup 2: Pendaftaran & Pembayaran

CREATE TABLE pendaftaran (
    id                  MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             MEDIUMINT UNSIGNED NOT NULL,
    gelombang_id        SMALLINT UNSIGNED  NOT NULL,
    prodi_id            SMALLINT UNSIGNED  NOT NULL,
    status_alur         ENUM('pre_submit','waiting_payment','waiting_verification',
                            'pra_asesmen','assessment_in_progress',
                            'waiting_pleno','selesai') NOT NULL DEFAULT 'pre_submit',
    is_locked           BOOLEAN            NOT NULL DEFAULT FALSE,
    is_statement_agreed BOOLEAN            NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pendaftaran (user_id, gelombang_id, prodi_id),
    KEY idx_pend_status (status_alur),
    CONSTRAINT fk_pend_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE,
    CONSTRAINT fk_pend_gelombang FOREIGN KEY (gelombang_id) REFERENCES gelombang (id) ON UPDATE CASCADE,
    CONSTRAINT fk_pend_prodi FOREIGN KEY (prodi_id) REFERENCES prodi (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pendaftar_profil (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    nik            CHAR(16)           NOT NULL,
    tempat_lahir   VARCHAR(50)        NOT NULL,
    tgl_lahir      DATE               NOT NULL,
    jenis_kelamin  ENUM('L','P')      NOT NULL,
    agama          ENUM('Islam','Kristen','Katolik','Hindu','Buddha','Konghucu') NOT NULL,
    kebangsaan     VARCHAR(50)        NOT NULL DEFAULT 'Indonesia',
    alamat         VARCHAR(255)       NOT NULL,
    kode_pos       CHAR(5)            NOT NULL,
    no_hp          VARCHAR(15)        NOT NULL,
    no_telepon     VARCHAR(20)            NULL,
    instansi_asal  VARCHAR(100)           NULL DEFAULT NULL,
    ktp_path       VARCHAR(255)       NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_profil_pendaftaran (pendaftaran_id),
    UNIQUE KEY uq_profil_nik (nik),
    CONSTRAINT fk_profil_pendaftaran FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pendaftar_pelatihan (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    nama_pelatihan VARCHAR(200)       NOT NULL,
    penyelenggara  VARCHAR(150)       NOT NULL,
    tahun          YEAR               NOT NULL,
    no_sertifikat  VARCHAR(100)           NULL,
    durasi         VARCHAR(50)            NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pp_pendaftaran FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pendaftar_pengalaman_kerja (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    nama_instansi  VARCHAR(150)       NOT NULL,
    bidang_usaha   VARCHAR(150)       NOT NULL,
    jabatan        VARCHAR(100)       NOT NULL,
    periode_dari   DATE               NOT NULL,
    periode_sampai DATE                   NULL,
    status_kepeg   ENUM('Tetap','Kontrak','Freelance','Magang') NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pek_pendaftaran FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pembayaran (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    trx_id         VARCHAR(64)        NOT NULL,
    nominal        DECIMAL(10,2)      NOT NULL,
    status         ENUM('pending','success','failed','expired') NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(30)        NOT NULL,
    webhook_payload JSON                  NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pembayaran_trx (trx_id),
    CONSTRAINT fk_bayar_pendaftaran FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

7.5 Grup 3: Kurikulum & Transkrip

CREATE TABLE kurikulum_rpl (
    id               MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    prodi_id         SMALLINT UNSIGNED  NOT NULL,
    kode_mk          VARCHAR(20)        NOT NULL,
    nama_mk          VARCHAR(100)       NOT NULL,
    sks              TINYINT UNSIGNED   NOT NULL,
    semester         TINYINT UNSIGNED   NOT NULL,
    deskripsi_cpmk   TEXT                   NULL,
    cp_sikap         TEXT                   NULL,
    cp_pengetahuan   TEXT                   NULL,
    cp_keterampilan  TEXT                   NULL,
    indikator_kinerja TEXT                  NULL,
    level_kkni       TINYINT UNSIGNED       NULL,
    profil_lulusan   VARCHAR(255)           NULL,
    is_active        BOOLEAN            NOT NULL DEFAULT TRUE,
    deleted_at       DATETIME               NULL DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_kurikulum_mk (prodi_id, kode_mk),
    CONSTRAINT fk_kurikulum_prodi FOREIGN KEY (prodi_id) REFERENCES prodi (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE matriks_metode_asesmen (
    id              MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    kurikulum_id    MEDIUMINT UNSIGNED NOT NULL,
    c1_sertifikat   BOOLEAN NOT NULL DEFAULT FALSE,
    c2_observasi    BOOLEAN NOT NULL DEFAULT FALSE,
    c3_lisan        BOOLEAN NOT NULL DEFAULT FALSE,
    c4_praktek      BOOLEAN NOT NULL DEFAULT FALSE,
    c5_tulis        BOOLEAN NOT NULL DEFAULT FALSE,
    c6_portofolio   BOOLEAN NOT NULL DEFAULT FALSE,
    c7_simulasi     BOOLEAN NOT NULL DEFAULT FALSE,
    c8_proyek       BOOLEAN NOT NULL DEFAULT FALSE,
    c9_presentasi   BOOLEAN NOT NULL DEFAULT FALSE,
    c10_studi_kasus BOOLEAN NOT NULL DEFAULT FALSE,
    c11_lainnya     BOOLEAN NOT NULL DEFAULT FALSE,
    catatan         TEXT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mma_kurikulum (kurikulum_id),
    CONSTRAINT fk_mma_kurikulum FOREIGN KEY (kurikulum_id)
        REFERENCES kurikulum_rpl (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE transkrip_asal (
    id                  MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id      MEDIUMINT UNSIGNED NOT NULL,
    pt_asal             VARCHAR(100)       NOT NULL,
    prodi_asal          VARCHAR(100)       NOT NULL,
    jenjang_asal        ENUM('D1','D2','D3','D4','S1','S2','S3') NULL,
    thn_masuk           YEAR               NULL,
    thn_lulus           YEAR               NULL,
    ipk                 DECIMAL(4,2)       NULL,
    file_transkrip_path VARCHAR(255)       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_transkrip_pendaftaran FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE transkrip_asal_item (
    id           MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    transkrip_id MEDIUMINT UNSIGNED NOT NULL,
    semester     TINYINT UNSIGNED   NOT NULL,
    kode_mk_asal VARCHAR(20)        NOT NULL,
    nama_mk_asal VARCHAR(100)       NOT NULL,
    sks          TINYINT UNSIGNED   NOT NULL,
    nilai_huruf  CHAR(2)            NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_item_transkrip FOREIGN KEY (transkrip_id)
        REFERENCES transkrip_asal (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE riwayat_pelatihan_profesi (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    tahun          YEAR               NOT NULL,
    jenis_pelatihan VARCHAR(200)      NOT NULL,
    penyelenggara  VARCHAR(150)       NOT NULL,
    durasi_jam     SMALLINT UNSIGNED      NULL,
    no_sertifikat  VARCHAR(100)           NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_rpp_pend FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE riwayat_konferensi (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    tahun          YEAR               NOT NULL,
    nama_kegiatan  VARCHAR(200)       NOT NULL,
    penyelenggara  VARCHAR(150)       NOT NULL,
    peran          ENUM('Peserta','Pembicara','Panitia','Moderator') NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_rk_pend FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE riwayat_penghargaan (
    id               MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id   MEDIUMINT UNSIGNED NOT NULL,
    tahun            YEAR               NOT NULL,
    nama_penghargaan VARCHAR(200)       NOT NULL,
    pemberi          VARCHAR(150)       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_rph_pend FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE riwayat_organisasi (
    id              MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id  MEDIUMINT UNSIGNED NOT NULL,
    nama_organisasi VARCHAR(200)       NOT NULL,
    no_anggota      VARCHAR(50)            NULL,
    jabatan_org     VARCHAR(100)           NULL,
    tahun_bergabung YEAR               NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ro_pend FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

7.6 Grup 4: Asesmen & Penilaian

CREATE TABLE asesmen_mandiri (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    kurikulum_id   MEDIUMINT UNSIGNED NOT NULL,
    self_rating    TINYINT UNSIGNED   NOT NULL,
    kode_bukti     VARCHAR(100)           NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_asesmen (pendaftaran_id, kurikulum_id),
    CONSTRAINT ck_self_rating CHECK (self_rating IN (1, 2, 4, 5)),
    CONSTRAINT fk_asesmen_pendaftaran FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE,
    CONSTRAINT fk_asesmen_kurikulum FOREIGN KEY (kurikulum_id) REFERENCES kurikulum_rpl (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE portofolio_dokumen (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    kode_portofolio ENUM('P01','P02','P03','P04','P05','P06','P07','P08','P09','P10') NOT NULL,
    nama_dokumen   VARCHAR(200)       NOT NULL,
    deskripsi      TEXT                   NULL,
    file_path      VARCHAR(255)       NOT NULL,
    uploaded_at    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_pd_pend FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pra_asesmen (
    id                  MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id      MEDIUMINT UNSIGNED NOT NULL,
    asesor_id           MEDIUMINT UNSIGNED NOT NULL,
    langkah_1_done      BOOLEAN NOT NULL DEFAULT FALSE,
    langkah_1_catatan   TEXT NULL,
    langkah_2_done      BOOLEAN NOT NULL DEFAULT FALSE,
    langkah_2_catatan   TEXT NULL,
    langkah_3_done      BOOLEAN NOT NULL DEFAULT FALSE,
    langkah_3_catatan   TEXT NULL,
    langkah_4_done      BOOLEAN NOT NULL DEFAULT FALSE,
    langkah_4_catatan   TEXT NULL,
    langkah_5_done      BOOLEAN NOT NULL DEFAULT FALSE,
    langkah_5_catatan   TEXT NULL,
    langkah_6_done      BOOLEAN NOT NULL DEFAULT FALSE,
    langkah_6_catatan   TEXT NULL,
    langkah_7_done      BOOLEAN NOT NULL DEFAULT FALSE,
    langkah_8_done      BOOLEAN NOT NULL DEFAULT FALSE,
    jadwal_disepakati   DATETIME NULL,
    rekomendasi         ENUM('Lanjut Penuh','Lanjut dengan Catatan','Tidak Memenuhi Syarat') NULL,
    catatan_umum        TEXT NULL,
    submitted_at        DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pa_pend_asesor (pendaftaran_id, asesor_id),
    CONSTRAINT fk_pa_pendaftaran FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE,
    CONSTRAINT fk_pa_asesor FOREIGN KEY (asesor_id) REFERENCES users (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE evaluasi_portofolio (
    id              MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id  MEDIUMINT UNSIGNED NOT NULL,
    asesor_id       MEDIUMINT UNSIGNED NOT NULL,
    kode_portofolio ENUM('P01','P02','P03','P04','P05','P06','P07','P08','P09','P10') NOT NULL,
    nilai_evaluasi  ENUM('V','A','T','C','N/A') NOT NULL DEFAULT 'N/A',
    catatan_evaluasi TEXT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ep (pendaftaran_id, asesor_id, kode_portofolio),
    CONSTRAINT fk_ep_pend FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE,
    CONSTRAINT fk_ep_asesor FOREIGN KEY (asesor_id) REFERENCES users (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE plotting_asesor (
    id                   MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id       MEDIUMINT UNSIGNED NOT NULL,
    asesor_1_id          MEDIUMINT UNSIGNED NOT NULL,
    asesor_2_id          MEDIUMINT UNSIGNED NOT NULL,
    pra_pemetaan_payload JSON                   NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_plotting_pendaftaran (pendaftaran_id),
    CONSTRAINT ck_plotting_asesor_beda CHECK (asesor_1_id <> asesor_2_id),
    CONSTRAINT fk_plotting_pendaftaran FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE,
    CONSTRAINT fk_plotting_asesor1 FOREIGN KEY (asesor_1_id) REFERENCES users (id) ON UPDATE CASCADE,
    CONSTRAINT fk_plotting_asesor2 FOREIGN KEY (asesor_2_id) REFERENCES users (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE penilaian_asesor (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    kurikulum_id   MEDIUMINT UNSIGNED NOT NULL,
    asesor_id      MEDIUMINT UNSIGNED NOT NULL,
    keputusan      ENUM('Diakui','Tidak Diakui','Uji Lanjutan') NOT NULL,
    nilai_mutu     CHAR(2)                NULL DEFAULT NULL,
    sks_diakui     TINYINT UNSIGNED       NULL DEFAULT NULL,
    catatan_asesor TEXT                   NULL,
    is_final       BOOLEAN            NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_penilaian (pendaftaran_id, kurikulum_id, asesor_id),
    CONSTRAINT fk_penilai_nilai FOREIGN KEY (nilai_mutu) REFERENCES nilai_mutu_ref (nilai_huruf) ON UPDATE CASCADE,
    CONSTRAINT fk_penilai_pendaftaran FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE,
    CONSTRAINT fk_penilai_kurikulum FOREIGN KEY (kurikulum_id) REFERENCES kurikulum_rpl (id) ON UPDATE CASCADE,
    CONSTRAINT fk_penilai_asesor FOREIGN KEY (asesor_id) REFERENCES users (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE penilaian_cp (
    id                  MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id      MEDIUMINT UNSIGNED NOT NULL,
    kurikulum_id        MEDIUMINT UNSIGNED NOT NULL,
    asesor_id           MEDIUMINT UNSIGNED NOT NULL,
    skor_kognitif       TINYINT UNSIGNED       NULL,
    skor_skill          TINYINT UNSIGNED       NULL,
    skor_afektif        TINYINT UNSIGNED       NULL,
    dokumen_relevan_ids JSON                   NULL,
    catatan_asesor      TEXT                   NULL,
    keputusan           ENUM('Diakui','Belum Diakui','Uji Lanjutan') NULL,
    nilai_mutu          CHAR(2)                NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pcp (pendaftaran_id, kurikulum_id, asesor_id),
    CONSTRAINT ck_cp_kognitif CHECK (skor_kognitif BETWEEN 1 AND 4),
    CONSTRAINT ck_cp_skill CHECK (skor_skill BETWEEN 1 AND 4),
    CONSTRAINT ck_cp_afektif CHECK (skor_afektif BETWEEN 1 AND 4),
    CONSTRAINT fk_pcp_pend FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE,
    CONSTRAINT fk_pcp_kur FOREIGN KEY (kurikulum_id) REFERENCES kurikulum_rpl (id) ON UPDATE CASCADE,
    CONSTRAINT fk_pcp_asesor FOREIGN KEY (asesor_id) REFERENCES users (id) ON UPDATE CASCADE,
    CONSTRAINT fk_pcp_nilai FOREIGN KEY (nilai_mutu) REFERENCES nilai_mutu_ref (nilai_huruf) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE uji_lanjutan (
    id                  MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    penilaian_asesor_id MEDIUMINT UNSIGNED NOT NULL,
    jenis_ujian         ENUM('Wawancara','Praktek','Tulis') NOT NULL,
    jadwal_ujian        DATETIME           NOT NULL,
    timezone_ujian      VARCHAR(50)        NOT NULL DEFAULT 'Asia/Makassar',
    lokasi_link         VARCHAR(150)       NOT NULL,
    status_konfirmasi   ENUM('Menunggu','Terkonfirmasi') NOT NULL DEFAULT 'Menunggu',
    confirmed_at        DATETIME               NULL DEFAULT NULL,
    log_wawancara       TEXT                   NULL,
    kesimpulan_hasil    ENUM('Lulus','Gagal')  NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_uji_penilaian FOREIGN KEY (penilaian_asesor_id)
        REFERENCES penilaian_asesor (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE soal_tulis (
    id              MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    uji_lanjutan_id MEDIUMINT UNSIGNED NOT NULL,
    nomor_soal      TINYINT UNSIGNED   NOT NULL,
    teks_soal       TEXT               NOT NULL,
    kunci_jawaban   TEXT               NOT NULL,
    bobot_persen    TINYINT UNSIGNED   NOT NULL DEFAULT 10,
    PRIMARY KEY (id),
    CONSTRAINT fk_st_uji FOREIGN KEY (uji_lanjutan_id)
        REFERENCES uji_lanjutan (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE jawaban_tulis (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    soal_tulis_id  MEDIUMINT UNSIGNED NOT NULL,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    teks_jawaban   TEXT               NOT NULL,
    skor           TINYINT UNSIGNED       NULL,
    catatan_penilai TEXT                  NULL,
    is_submitted   BOOLEAN            NOT NULL DEFAULT FALSE,
    submitted_at   DATETIME               NULL,
    dinilai_at     DATETIME               NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_jt (soal_tulis_id, pendaftaran_id),
    CONSTRAINT ck_jt_skor CHECK (skor BETWEEN 1 AND 5),
    CONSTRAINT fk_jt_soal FOREIGN KEY (soal_tulis_id) REFERENCES soal_tulis (id) ON UPDATE CASCADE,
    CONSTRAINT fk_jt_pend FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE pertanyaan_lisan (
    id               MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    uji_lanjutan_id  MEDIUMINT UNSIGNED NOT NULL,
    nomor_pertanyaan TINYINT UNSIGNED   NOT NULL,
    teks_pertanyaan  TEXT               NOT NULL,
    panduan_penilaian TEXT                  NULL,
    jawaban_pemohon  TEXT                   NULL,
    skor             TINYINT UNSIGNED       NULL,
    PRIMARY KEY (id),
    CONSTRAINT ck_pl_skor CHECK (skor BETWEEN 1 AND 5),
    CONSTRAINT fk_pl_uji FOREIGN KEY (uji_lanjutan_id)
        REFERENCES uji_lanjutan (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE matriks_alih_kredit (
    id                MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id    MEDIUMINT UNSIGNED NOT NULL,
    asesor_id         MEDIUMINT UNSIGNED NOT NULL,
    transkrip_item_id MEDIUMINT UNSIGNED     NULL,
    kurikulum_id      MEDIUMINT UNSIGNED     NULL,
    cp_mk_asal        TEXT                   NULL,
    analisa_gap       TEXT                   NULL,
    catatan_asesor    TEXT                   NULL,
    rekomendasi       ENUM('Diakui Penuh','Diakui Sebagian','Tidak Diakui') NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_mak_pend FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE,
    CONSTRAINT fk_mak_asesor FOREIGN KEY (asesor_id) REFERENCES users (id) ON UPDATE CASCADE,
    CONSTRAINT fk_mak_item FOREIGN KEY (transkrip_item_id) REFERENCES transkrip_asal_item (id) ON UPDATE CASCADE,
    CONSTRAINT fk_mak_kur FOREIGN KEY (kurikulum_id) REFERENCES kurikulum_rpl (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE penilaian_pleno (
    id                MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id    MEDIUMINT UNSIGNED NOT NULL,
    kurikulum_id      MEDIUMINT UNSIGNED NOT NULL,
    bobot_asesor_1    DECIMAL(4,2)           NULL,
    bobot_asesor_2    DECIMAL(4,2)           NULL,
    rata_rata_sistem  DECIMAL(4,2)       NOT NULL,
    nilai_mutu_final  CHAR(2)            NOT NULL,
    sks_diakui_final  TINYINT UNSIGNED   NOT NULL,
    override_manual   BOOLEAN            NOT NULL DEFAULT FALSE,
    catatan_pleno     TEXT                   NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pleno (pendaftaran_id, kurikulum_id),
    CONSTRAINT fk_pleno_nilai FOREIGN KEY (nilai_mutu_final) REFERENCES nilai_mutu_ref (nilai_huruf) ON UPDATE CASCADE,
    CONSTRAINT fk_pleno_pendaftaran FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran (id) ON UPDATE CASCADE,
    CONSTRAINT fk_pleno_kurikulum FOREIGN KEY (kurikulum_id) REFERENCES kurikulum_rpl (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

7.7 Grup 5: Sanggahan & Banding

CREATE TABLE sanggahan (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    status_sanggah ENUM('Pending','Sebagian Diputus','Selesai') NOT NULL DEFAULT 'Pending',
    submitted_at   DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_sanggah_pendaftaran FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sanggahan_item (
    id                     MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sanggahan_id           MEDIUMINT UNSIGNED NOT NULL,
    penilaian_pleno_id     MEDIUMINT UNSIGNED NOT NULL,
    alasan_mahasiswa       TEXT               NOT NULL,
    bukti_tambahan_path    VARCHAR(255)           NULL DEFAULT NULL,
    status_item            ENUM('Pending','Diterima','Ditolak') NOT NULL DEFAULT 'Pending',
    catatan_putusan_asesor TEXT                   NULL,
    nilai_mutu_baru        CHAR(2)                NULL DEFAULT NULL,
    sks_baru               TINYINT UNSIGNED       NULL DEFAULT NULL,
    diputus_at             DATETIME               NULL DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_item_sanggahan FOREIGN KEY (sanggahan_id) REFERENCES sanggahan (id) ON UPDATE CASCADE,
    CONSTRAINT fk_item_pleno FOREIGN KEY (penilaian_pleno_id) REFERENCES penilaian_pleno (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE banding_eksternal (
    id              MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sanggahan_id    MEDIUMINT UNSIGNED NOT NULL,
    alasan_banding  TEXT               NOT NULL,
    bukti_path      VARCHAR(255)           NULL,
    status          ENUM('Pending','Diproses','Diputus') NOT NULL DEFAULT 'Pending',
    catatan_pimpinan TEXT                  NULL,
    diputus_at      DATETIME               NULL,
    submitted_at    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_be_sanggahan FOREIGN KEY (sanggahan_id) REFERENCES sanggahan (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

7.8 Grup 6: Utilitas & Keamanan

CREATE TABLE arsip_dokumen (
    id             MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    pendaftaran_id MEDIUMINT UNSIGNED NOT NULL,
    jenis_dokumen  ENUM('F01_Form_Permohonan','F02_Daftar_Riwayat_Hidup',
                       'F03_Evaluasi_Diri','F04_Bukti_Portofolio',
                       'F05_Laporan_Evaluasi_Portofolio','F06_Bukti_Tambahan_Portofolio',
                       'F07_Form_Wawancara','F08_Form_Observasi_Praktek',
                       'F09_Form_Uji_Tulis','F10_Form_Laporan_Asesmen',
                       'F11_Rekomendasi_Asesor','F12_Persetujuan_Pelamar',
                       'F13_Form_Persetujuan_Asesor','F14_Berita_Acara_Asesmen',
                       'F15_Berita_Acara_Pleno','F16_Daftar_Hasil_Evaluasi',
                       'F17_Surat_Keterangan_Hasil','F18_SK_Penetapan_RPL',
                       'F19_Bukti_Transfer_SKS','Lainnya') NOT NULL,
    file_path      VARCHAR(255)       NOT NULL,
    is_signed_basah BOOLEAN           NOT NULL DEFAULT FALSE,
    uploaded_at    DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_arsip_pendaftaran FOREIGN KEY (pendaftaran_id)
        REFERENCES pendaftaran (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE audit_logs (
    id              BIGINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id         MEDIUMINT UNSIGNED     NULL DEFAULT NULL,
    impersonated_by MEDIUMINT UNSIGNED     NULL DEFAULT NULL,
    action_type     VARCHAR(30)        NOT NULL,
    description     VARCHAR(255)       NOT NULL,
    payload         JSON                   NULL,
    ip_address      VARCHAR(45)        NOT NULL,
    created_at      DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_user    (user_id),
    KEY idx_audit_created (created_at),
    KEY idx_audit_type    (action_type),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_audit_impersonated FOREIGN KEY (impersonated_by) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

---

BAB 8 — MASTER API ENDPOINT LIST

Base URL: /api/v1 | Auth: Bearer Token (Laravel Sanctum) kecuali [PUBLIC].
Response: { "success": true, "data": {...}, "message": "..." }
Error: { "success": false, "errors": {...}, "message": "..." }

Rate Limiting Global:
- POST /auth/login & /auth/register: max 10 req/menit per IP
- POST /upload: max 20 req/menit per user
- GET /superadmin/audit-log/export: max 5 req/jam per user
- POST /webhook/pembayaran: tidak dilimit (dilindungi IP whitelist)
- Endpoint umum terautentikasi: max 60 req/menit per user

8.1 Auth (7 Endpoints)

Method | Path                    | Deskripsi                                                           | Role
-------|-------------------------|---------------------------------------------------------------------|--------
POST   | /auth/register          | Registrasi pemohon. Buat record pendaftaran awal (pre_submit). NIK & email unik. [PUBLIC] | Public
POST   | /auth/login             | Login semua role. Return Bearer Token + role. Rate limit 10x/menit/IP. [PUBLIC] | Public
POST   | /auth/logout            | Revoke Bearer Token aktif.                                          | Semua
GET    | /auth/me                | Profil user + status pendaftaran aktif (jika pemohon).              | Semua
POST   | /auth/refresh           | Perbarui token hampir kedaluwarsa.                                  | Semua
POST   | /auth/forgot-password   | Kirim email link reset password. [PUBLIC]                           | Public
POST   | /auth/reset-password    | Proses penggantian password dengan token dari email. [PUBLIC]       | Public

8.2 Gelombang (7 Endpoints)

Method | Path                              | Deskripsi                                                   | Role
-------|-----------------------------------|-------------------------------------------------------------|-------------
GET    | /gelombang                        | Daftar semua gelombang + jumlah pendaftar.                  | Super Admin
GET    | /gelombang/aktif                  | Gelombang buka saat ini. Untuk landing page. [PUBLIC]       | Public
GET    | /gelombang/{id}                   | Detail satu gelombang.                                      | Super Admin
POST   | /gelombang                        | Buat gelombang. Wajib: nama, tgl_buka, tgl_tutup, deadline_sanggah, biaya. | Super Admin
PUT    | /gelombang/{id}                   | Update gelombang yang belum punya pendaftar.                | Super Admin
PATCH  | /gelombang/{id}/toggle-aktif      | Aktifkan/nonaktifkan. Hanya satu boleh aktif. Atomic transaction. | Super Admin
DELETE | /gelombang/{id}                   | Hapus gelombang tanpa pendaftar.                            | Super Admin

8.3 Program Studi (6 Endpoints)

Method | Path                        | Deskripsi                                        | Role
-------|-----------------------------|--------------------------------------------------|------------
GET    | /prodi                      | Daftar prodi (is_active=true untuk public). [PUBLIC] | Public
GET    | /prodi/{id}                 | Detail satu prodi.                               | Super Admin
POST   | /prodi                      | Tambah prodi baru.                               | Super Admin
PUT    | /prodi/{id}                 | Update nama fakultas, prodi, kode nasional.      | Super Admin
PATCH  | /prodi/{id}/toggle-aktif    | Aktifkan/nonaktifkan prodi tanpa hapus data.     | Super Admin
DELETE | /prodi/{id}                 | Hapus prodi yang belum pernah digunakan.         | Super Admin

8.4 User & Access Control (10 Endpoints)

Method | Path                          | Deskripsi                                                    | Role
-------|-------------------------------|--------------------------------------------------------------|------------
GET    | /users                        | Daftar user staf (filter role, prodi). Tidak tampilkan pemohon. | Super Admin
GET    | /users/{id}                   | Detail satu user staf.                                       | Super Admin
POST   | /users                        | Buat akun staf. Password acak digenerate + dikirim via email. | Super Admin
PUT    | /users/{id}                   | Update data staf: nama, email, role, prodi induk.            | Super Admin
PATCH  | /users/{id}/toggle-aktif      | Aktifkan/nonaktifkan akun staf. Data historis tetap.         | Super Admin
DELETE | /users/{id}                   | Soft delete akun staf yang belum terlibat penilaian.         | Super Admin
POST   | /users/{id}/reset-password    | Generate password acak baru + kirim via email + catat audit log. | Super Admin
POST   | /users/{id}/impersonate       | Login sebagai staf. Catat impersonated_by. Tampilkan banner. | Super Admin
DELETE | /users/impersonate            | Akhiri sesi impersonate.                                     | Super Admin
GET    | /users/asesor                 | Daftar asesor per prodi. Untuk dropdown plotting Halaman 2.3. | Admin Prodi

8.5 Upload File (2 Endpoints)

Method | Path    | Deskripsi                                                                       | Role
-------|---------|---------------------------------------------------------------------------------|--------
POST   | /upload | Upload file. Return file_path. KTP max 2MB (PDF/JPG/PNG), Transkrip max 5MB (PDF), Portofolio max 10MB (PDF/JPG/PNG/ZIP), Bukti sanggah max 5MB (PDF). | Pemohon
DELETE | /upload | Hapus file sementara yang belum terikat record (cleanup orphan).               | Pemohon

8.6 Pendaftaran (6 Endpoints)

Method | Path                                    | Deskripsi                                                        | Role
-------|-----------------------------------------|------------------------------------------------------------------|-------------------
GET    | /pendaftaran                            | Daftar pendaftaran lintas prodi + filter status (Super Admin) atau per prodi (Admin Prodi). | SA, Admin Prodi
GET    | /pendaftaran/{id}                       | Detail satu pendaftaran. Ownership middleware aktif.             | Semua (ownership)
GET    | /pendaftaran/saya                       | Shortcut pemohon: data pendaftaran milik sendiri.                | Pemohon
PATCH  | /pendaftaran/{id}/final-submit          | Kunci form, status→waiting_verification, trigger generate PDF Form 06 + Form 16. | Pemohon
PATCH  | /pendaftaran/{id}/unlock                | Admin buka gembok form. Status→pre_submit. Notifikasi ke mahasiswa. | Admin Prodi
GET    | /pendaftaran/{id}/status-lengkap        | Status alur lengkap untuk Stepper Visual Halaman 1.4.            | Pemohon

8.7 Pembayaran (4 Endpoints)

Method | Path                                  | Deskripsi                                                              | Role
-------|---------------------------------------|------------------------------------------------------------------------|------------
POST   | /pembayaran                           | Buat transaksi + dapatkan kode VA/QRIS dari gateway.                  | Pemohon
GET    | /pembayaran/{pendaftaran_id}/status   | Cek status manual (fallback WebSocket terputus).                       | Pemohon
POST   | /webhook/pembayaran                   | Penerima notifikasi gateway. Idempotent. IP whitelist (bukan Bearer Token). Auto-broadcast via Redis. | Gateway
GET    | /pembayaran/{pendaftaran_id}/riwayat  | Riwayat semua percobaan transaksi.                                     | SA, Admin Prodi

8.8 Profil Pendaftar — Form 01 (3 Endpoints)

Method | Path                          | Deskripsi                                  | Role
-------|-------------------------------|--------------------------------------------|---------------------
POST   | /pendaftaran/{id}/profil      | Simpan identitas pertama kali.             | Pemohon
PUT    | /pendaftaran/{id}/profil      | Update identitas (is_locked=false).        | Pemohon
GET    | /pendaftaran/{id}/profil      | Ambil data identitas.                      | Pemohon, Admin Prodi

8.9 Riwayat Pendaftar (Form 01 — Pelatihan & Pengalaman Kerja) (4 Endpoints)

Method | Path                                      | Deskripsi                              | Role
-------|-------------------------------------------|----------------------------------------|---------------------
POST   | /pendaftaran/{id}/pelatihan/bulk          | Simpan daftar pelatihan & sertifikat.  | Pemohon
GET    | /pendaftaran/{id}/pelatihan               | Ambil daftar pelatihan.                | Pemohon, Asesor
POST   | /pendaftaran/{id}/pengalaman-kerja/bulk   | Simpan daftar pengalaman kerja rinci.  | Pemohon
GET    | /pendaftaran/{id}/pengalaman-kerja        | Ambil daftar pengalaman kerja.         | Pemohon, Asesor

8.10 Transkrip Asal — Form 16 (7 Endpoints)

Method | Path                                      | Deskripsi                                          | Role
-------|-------------------------------------------|----------------------------------------------------|---------------------
POST   | /pendaftaran/{id}/transkrip               | Simpan header transkrip.                           | Pemohon
PUT    | /pendaftaran/{id}/transkrip               | Update header selama belum dikunci.                | Pemohon
GET    | /pendaftaran/{id}/transkrip               | Ambil header + semua item MK asal.                 | Pemohon, Asesor, Admin Prodi
POST   | /pendaftaran/{id}/transkrip/item          | Tambah satu baris MK asal.                         | Pemohon
PUT    | /transkrip/item/{item_id}                 | Edit satu baris MK asal.                           | Pemohon
DELETE | /transkrip/item/{item_id}                 | Hapus satu baris MK asal.                          | Pemohon
POST   | /pendaftaran/{id}/transkrip/item/bulk     | Simpan banyak baris MK sekaligus (auto-save batch).| Pemohon

8.11 Riwayat Hidup Lengkap — Form 16 (6 Endpoints)

Method | Path                                          | Deskripsi                             | Role
-------|-----------------------------------------------|---------------------------------------|---------------------
POST   | /pendaftaran/{id}/riwayat-pelatihan/bulk      | Simpan pelatihan profesional.         | Pemohon
POST   | /pendaftaran/{id}/riwayat-konferensi/bulk     | Simpan konferensi/seminar.            | Pemohon
POST   | /pendaftaran/{id}/riwayat-penghargaan/bulk    | Simpan penghargaan.                   | Pemohon
POST   | /pendaftaran/{id}/riwayat-organisasi/bulk     | Simpan organisasi profesi.            | Pemohon
GET    | /pendaftaran/{id}/riwayat-hidup               | Ambil semua data riwayat hidup.       | Pemohon, Asesor
GET    | /dokumen/{pendaftaran_id}/form-16             | Generate PDF Form 16 Daftar Riwayat Hidup. | Pemohon, Admin Prodi

8.12 Kurikulum RPL (7 Endpoints)

Method | Path                                  | Deskripsi                                              | Role
-------|---------------------------------------|--------------------------------------------------------|---------------------
GET    | /prodi/{prodi_id}/kurikulum           | Daftar semua MK prodi. Untuk form asesmen & workspace asesor. | Public (authed)
GET    | /kurikulum/{id}                       | Detail satu MK termasuk CP 3-dimensi dan KKNI.        | Public (authed)
POST   | /prodi/{prodi_id}/kurikulum           | Tambah satu MK baru.                                   | Admin Prodi
PUT    | /kurikulum/{id}                       | Update detail MK.                                      | Admin Prodi
PATCH  | /kurikulum/{id}/toggle-aktif          | Aktifkan/nonaktifkan MK. Data historis tidak terhapus. | Admin Prodi
DELETE | /kurikulum/{id}                       | Soft delete MK yang belum digunakan dalam penilaian.   | Admin Prodi
POST   | /prodi/{prodi_id}/kurikulum/import    | Bulk import MK dari Excel. Preview sebelum konfirmasi. | Admin Prodi

8.13 Matriks Asesmen MK — Form 13 (4 Endpoints)

Method | Path                                        | Deskripsi                              | Role
-------|---------------------------------------------|----------------------------------------|---------------------
GET    | /prodi/{prodi_id}/matriks-asesmen           | Tabel matriks metode asesmen per MK.   | Admin Prodi, Asesor
PUT    | /matriks-asesmen/{kurikulum_id}             | Update centang metode C1-C11 per MK.  | Admin Prodi
POST   | /prodi/{prodi_id}/matriks-asesmen/bulk      | Simpan matriks keseluruhan prodi.      | Admin Prodi
GET    | /dokumen/prodi/{prodi_id}/form-13           | Generate PDF Form 13.                  | Admin Prodi

8.14 Asesmen Mandiri — Form 03 (2 Endpoints)

Method | Path                                  | Deskripsi                                              | Role
-------|---------------------------------------|--------------------------------------------------------|---------------------
POST   | /pendaftaran/{id}/asesmen-mandiri     | Simpan/update semua self-rating (upsert batch). self_rating IN (1,2,4,5). | Pemohon
GET    | /pendaftaran/{id}/asesmen-mandiri     | Ambil seluruh data asesmen mandiri.                    | Pemohon, Asesor

8.15 Portofolio Pemohon — Form 04 (8 Endpoints)

Method | Path                                            | Deskripsi                              | Role
-------|-------------------------------------------------|----------------------------------------|---------------------
GET    | /pendaftaran/{id}/portofolio                    | Daftar semua dokumen portofolio.        | Pemohon, Asesor
POST   | /pendaftaran/{id}/portofolio                    | Upload satu dokumen portofolio.         | Pemohon
PUT    | /portofolio/{dok_id}                            | Update deskripsi dokumen.               | Pemohon
DELETE | /portofolio/{dok_id}                            | Hapus dokumen (selama belum dikunci).   | Pemohon
GET    | /asesor/evaluasi-portofolio/{pendaftaran_id}    | Ambil form evaluasi + dokumen pemohon.  | Asesor
POST   | /asesor/evaluasi-portofolio                     | Simpan evaluasi satu jenis portofolio.  | Asesor
PUT    | /asesor/evaluasi-portofolio/{id}                | Update evaluasi.                         | Asesor
GET    | /dokumen/{pendaftaran_id}/form-04               | Generate PDF Form 04.                   | Asesor, Admin Prodi

8.16 Verifikasi & Plotting Asesor (6 Endpoints)

Method | Path                                      | Deskripsi                                                   | Role
-------|-------------------------------------------|-------------------------------------------------------------|------------
GET    | /admin/pendaftaran                        | Antrean pendaftar di prodi Admin. Filter status.            | Admin Prodi
GET    | /admin/pendaftaran/{id}/berkas            | Buka berkas lengkap. Return signed URL (expire 15 menit) untuk KTP, transkrip, portofolio, riwayat hidup. | Admin Prodi
POST   | /admin/pendaftaran/{id}/verifikasi        | Simpan checklist verifikasi: KTP valid + transkrip terbaca. | Admin Prodi
POST   | /admin/pendaftaran/{id}/plotting          | Tugaskan Asesor 1 & 2 + opsional pra-pemetaan.              | Admin Prodi
PUT    | /admin/pendaftaran/{id}/plotting          | Ubah penugasan asesor (konflik kepentingan/berhalangan).    | Admin Prodi
GET    | /admin/pendaftaran/{id}/plotting          | Ambil data plotting asesor yang sudah ditetapkan.           | Admin Prodi

8.17 Pra Asesmen — Form 02 (6 Endpoints)

Method | Path                                        | Deskripsi                                           | Role
-------|---------------------------------------------|-----------------------------------------------------|---------------------
GET    | /asesor/pra-asesmen/{pendaftaran_id}        | Ambil data Form 02. Jika belum ada: template kosong. | Asesor
POST   | /asesor/pra-asesmen                         | Simpan draf Form 02.                                | Asesor
PUT    | /asesor/pra-asesmen/{id}                    | Update draf.                                        | Asesor
PATCH  | /asesor/pra-asesmen/{id}/submit             | Submit final Form 02. Status→assessment_in_progress. Notifikasi Admin & Pemohon. | Asesor
GET    | /pemohon/pra-asesmen                        | Pemohon lihat rekomendasi + jadwal yang disepakati. | Pemohon
GET    | /dokumen/{pendaftaran_id}/form-02           | Generate PDF Form 02.                               | Asesor, Admin Prodi

8.18 Penilaian Asesor (6 Endpoints)

Method | Path                                             | Deskripsi                                                   | Role
-------|--------------------------------------------------|-------------------------------------------------------------|--------
GET    | /asesor/tugas                                    | Daftar berkas yang ditugaskan. Status: Belum/Sedang/Final.  | Asesor
GET    | /asesor/tugas/{pendaftaran_id}                   | Workspace blind review: transkrip, asesmen, portofolio evaluasi, penilaian CP, pra-pemetaan admin. Hanya draf penilaian asesor yang login. HTTP 403 jika Form 02 belum submit. | Asesor
POST   | /asesor/penilaian                                | Simpan draf penilaian satu MK (keputusan, nilai_mutu FK ke nilai_mutu_ref, SKS, catatan). | Asesor
PUT    | /asesor/penilaian/{id}                           | Update draf penilaian MK.                                   | Asesor
POST   | /asesor/penilaian/bulk                           | Simpan banyak draf MK sekaligus (batch save).               | Asesor
PATCH  | /asesor/penilaian/{pendaftaran_id}/submit-final  | Kunci seluruh penilaian (is_final=true). Jika kedua asesor sudah submit: status→waiting_pleno + notifikasi Admin. Validasi: skor_kognitif & skor_skill wajib terisi. | Asesor

8.19 Penilaian CP 3-Dimensi — Form 05 (5 Endpoints)

Method | Path                                   | Deskripsi                                        | Role
-------|----------------------------------------|--------------------------------------------------|---------------------
GET    | /asesor/penilaian-cp/{pendaftaran_id}  | Ambil form penilaian CP per MK + deskripsi CP.  | Asesor
POST   | /asesor/penilaian-cp                   | Simpan penilaian CP satu MK.                     | Asesor
PUT    | /asesor/penilaian-cp/{id}              | Update penilaian CP.                              | Asesor
POST   | /asesor/penilaian-cp/bulk              | Batch save.                                       | Asesor
GET    | /dokumen/{pendaftaran_id}/form-05      | Generate PDF Form 05.                             | Asesor, Admin Prodi

8.20 Uji Lanjutan (8 Endpoints)

Method | Path                                         | Deskripsi                                          | Role
-------|----------------------------------------------|----------------------------------------------------|---------------------
GET    | /asesor/uji-lanjutan                         | Daftar semua jadwal uji yang dibuat asesor.        | Asesor
POST   | /asesor/uji-lanjutan                         | Buat jadwal uji.                                    | Asesor
PUT    | /asesor/uji-lanjutan/{id}                    | Ubah jadwal (sebelum dikonfirmasi mahasiswa).       | Asesor
POST   | /asesor/uji-lanjutan/{id}/kirim-undangan     | Kirim notifikasi undangan Form 08 ke mahasiswa.     | Asesor
GET    | /pemohon/uji-lanjutan                        | Pemohon ambil data undangan uji.                   | Pemohon
POST   | /pemohon/uji-lanjutan/{id}/konfirmasi        | Konfirmasi kehadiran. Update status_konfirmasi→Terkonfirmasi. Notifikasi asesor. | Pemohon
PUT    | /asesor/uji-lanjutan/{id}/hasil              | Simpan berita acara (log wawancara/praktek) + kesimpulan Lulus/Gagal. | Asesor
GET    | /asesor/uji-lanjutan/{id}                    | Detail satu sesi uji.                               | Asesor

8.21 Soal & Jawaban Tulis — Form 09 & 10 (10 Endpoints)

Method | Path                                             | Deskripsi                                          | Role
-------|--------------------------------------------------|----------------------------------------------------|---------------------
GET    | /asesor/soal-tulis/{uji_lanjutan_id}             | Daftar soal ujian tulis satu sesi.                 | Asesor
POST   | /asesor/soal-tulis                               | Tambah satu soal.                                   | Asesor
PUT    | /asesor/soal-tulis/{id}                          | Update soal.                                        | Asesor
DELETE | /asesor/soal-tulis/{id}                          | Hapus soal (selama belum ada jawaban).              | Asesor
GET    | /pemohon/soal-tulis/{uji_lanjutan_id}            | Pemohon ambil daftar soal (tanpa kunci jawaban).    | Pemohon
POST   | /pemohon/jawaban-tulis                           | Pemohon simpan draf jawaban (array of {soal_id, teks}). | Pemohon
PATCH  | /pemohon/jawaban-tulis/{uji_lanjutan_id}/submit  | Kunci semua jawaban. is_submitted=true. Tidak bisa diubah. | Pemohon
GET    | /asesor/jawaban-tulis/{uji_lanjutan_id}          | Asesor ambil semua jawaban untuk dinilai.           | Asesor
PUT    | /asesor/jawaban-tulis/{jawaban_id}               | Asesor beri skor (1-5) + catatan penilai.           | Asesor
GET    | /dokumen/{pendaftaran_id}/form-09-10             | Generate PDF Form 09+10.                            | Asesor

8.22 Pertanyaan Lisan — Form 11 (4 Endpoints)

Method | Path                                          | Deskripsi                             | Role
-------|-----------------------------------------------|---------------------------------------|---------------------
GET    | /asesor/pertanyaan-lisan/{uji_lanjutan_id}    | Daftar pertanyaan lisan.              | Asesor
POST   | /asesor/pertanyaan-lisan                      | Tambah pertanyaan lisan.              | Asesor
PUT    | /asesor/pertanyaan-lisan/{id}                 | Update pertanyaan / isi jawaban + skor. | Asesor
GET    | /dokumen/{pendaftaran_id}/form-11             | Generate PDF Form 11.                 | Asesor

8.23 Matriks Alih Kredit — Form 12 (5 Endpoints)

Method | Path                                          | Deskripsi                             | Role
-------|-----------------------------------------------|---------------------------------------|---------------------
GET    | /asesor/matriks-alih-kredit/{pendaftaran_id}  | Ambil matriks atau template kosong.   | Asesor
POST   | /asesor/matriks-alih-kredit                   | Simpan satu baris matriks.             | Asesor
PUT    | /asesor/matriks-alih-kredit/{id}              | Update baris matriks.                  | Asesor
POST   | /asesor/matriks-alih-kredit/bulk              | Simpan semua baris sekaligus.          | Asesor
GET    | /dokumen/{pendaftaran_id}/form-12             | Generate PDF Form 12.                  | Asesor, Admin Prodi

8.24 Pleno (5 Endpoints)

Method | Path                                       | Deskripsi                                                   | Role
-------|--------------------------------------------|-------------------------------------------------------------|------------
GET    | /admin/pleno/{pendaftaran_id}              | Data komparasi nilai A1 vs A2. Bobot numerik, rata-rata sistem, flag selisih. | Admin Prodi
GET    | /admin/pleno/{pendaftaran_id}/selisih      | Hanya MK dengan selisih bobot > 1.0 poin.                  | Admin Prodi
POST   | /admin/pleno/{pendaftaran_id}/sahkan       | Sahkan nilai, kunci pleno, trigger generate Berita Acara PDF Form 15. | Admin Prodi
POST   | /admin/pleno/bulk-sahkan                   | Sahkan banyak pendaftaran. Pre-check: semua harus selesai dinilai kedua asesor. | Admin Prodi
POST   | /admin/pleno/{pendaftaran_id}/generate-sk  | Trigger generate draft PDF SK Penetapan Form 18.            | Admin Prodi

8.25 Arsip Dokumen (5 Endpoints)

Method | Path                                       | Deskripsi                                          | Role
-------|--------------------------------------------|-----------------------------------------------------|------------
GET    | /admin/arsip/{pendaftaran_id}              | Daftar dokumen F01-F19 + status tanda tangan basah. | Admin Prodi
POST   | /admin/arsip/{pendaftaran_id}              | Upload scan dokumen bertanda tangan basah.          | Admin Prodi
PUT    | /admin/arsip/{arsip_id}                    | Ganti file arsip yang sudah diunggah.               | Admin Prodi
PATCH  | /admin/arsip/{pendaftaran_id}/publikasi    | Status→selesai (final). Aktifkan Halaman 1.7. Kirim notifikasi SK. | Admin Prodi
GET    | /pemohon/arsip-borang                      | Read-only seluruh isian form (Form 01, 16, 03).     | Pemohon

8.26 Sanggahan (7 Endpoints)

Method | Path                                | Deskripsi                                                              | Role
-------|-------------------------------------|------------------------------------------------------------------------|---------------------
GET    | /pemohon/hasil-akhir                | Tabel hasil akhir pleno (MK, nilai mutu, SKS diakui, CP MK).           | Pemohon
POST   | /pemohon/sanggahan                  | Kirim form sanggahan. Body: array of {penilaian_pleno_id, alasan, bukti?}. Validasi deadline_sanggah. | Pemohon
GET    | /pemohon/sanggahan                  | Pemohon lihat status sanggahan + keputusan asesor per item.             | Pemohon
GET    | /asesor/sanggahan                   | Daftar sanggahan masuk ke asesor yang login.                            | Asesor
GET    | /asesor/sanggahan/{id}              | Detail satu pengajuan sanggahan.                                        | Asesor
PUT    | /asesor/sanggahan/item/{item_id}    | Putuskan satu item (Diterima/Ditolak). Jika Diterima: update nilai_mutu_baru + sks_baru + update penilaian_pleno. Set diputus_at. | Asesor
GET    | /asesor/sanggahan/item/{item_id}    | Detail satu item sanggahan.                                             | Asesor

8.27 Banding Eksternal — Form 17 (4 Endpoints)

Method | Path                              | Deskripsi                                                    | Role
-------|-----------------------------------|--------------------------------------------------------------|---------------------
POST   | /pemohon/banding-eksternal        | Ajukan banding ke Pimpinan PT. Body: sanggahan_id, alasan, bukti. | Pemohon
GET    | /pemohon/banding-eksternal        | Status banding eksternal yang pernah diajukan.               | Pemohon
GET    | /admin/banding-eksternal          | Daftar semua banding eksternal di prodi admin.               | Admin Prodi
PUT    | /admin/banding-eksternal/{id}     | Admin/Pimpinan PT catat keputusan banding.                   | Admin Prodi, SA

8.28 PDF Generation (10 Endpoints)

Aturan PDF: force Light Mode wajib di semua template. Di-cache di storage selama data tidak berubah. Return file binary PDF atau redirect ke signed URL storage.

Method | Path                                         | Deskripsi                              | Role
-------|----------------------------------------------|----------------------------------------|---------------------
GET    | /dokumen/{pendaftaran_id}/tanda-terima       | PDF Tanda Terima Form 06.              | Pemohon
GET    | /dokumen/{pendaftaran_id}/form-02            | PDF Form 02 Pra Asesmen.               | Asesor, Admin Prodi
GET    | /dokumen/{pendaftaran_id}/form-04            | PDF Form 04 Evaluasi Portofolio.       | Asesor, Admin Prodi
GET    | /dokumen/{pendaftaran_id}/form-05            | PDF Form 05 Penilaian CP.              | Asesor, Admin Prodi
GET    | /dokumen/{pendaftaran_id}/form-09-10         | PDF Form 09+10 (soal + jawaban).       | Asesor
GET    | /dokumen/{pendaftaran_id}/form-11            | PDF Form 11 Pertanyaan Lisan.          | Asesor
GET    | /dokumen/{pendaftaran_id}/form-12            | PDF Form 12 Matriks Alih Kredit.       | Asesor, Admin Prodi
GET    | /dokumen/prodi/{prodi_id}/form-13            | PDF Form 13 Matriks Asesmen MK.        | Admin Prodi
GET    | /dokumen/{pendaftaran_id}/form-16            | PDF Form 16 Daftar Riwayat Hidup.      | Pemohon, Admin Prodi
GET    | /dokumen/{pendaftaran_id}/berita-acara-pleno | PDF Berita Acara Pleno Form 15.        | Admin Prodi
GET    | /dokumen/{pendaftaran_id}/sk-penetapan       | PDF SK Penetapan RPL final Form 18.    | Pemohon, Admin Prodi
GET    | /dokumen/{pendaftaran_id}/surat-undangan-uji | PDF Surat Undangan Uji Form 08.        | Asesor
GET    | /dokumen/{pendaftaran_id}/berita-acara-uji   | PDF Berita Acara Uji Form 09/10/11.    | Asesor

8.29 Dashboard & Analitik (3 Endpoints)

Method | Path                                      | Deskripsi                                    | Role
-------|-------------------------------------------|----------------------------------------------|------------
GET    | /superadmin/dashboard                     | Metrik eksekutif agregat: pendaftar, lulus, SKS, pendapatan, distribusi per prodi. | Super Admin
GET    | /superadmin/dashboard/per-prodi           | Breakdown metrik detail per prodi.           | Super Admin
GET    | /superadmin/dashboard/pendapatan          | Data pendapatan per gelombang untuk rekonsiliasi. | Super Admin

8.30 Notifikasi (4 Endpoints)

Method | Path                              | Deskripsi                                          | Role
-------|-----------------------------------|----------------------------------------------------|--------
GET    | /notifikasi                       | Daftar semua notifikasi user yang login.            | Semua
PATCH  | /notifikasi/{id}/baca             | Tandai satu notifikasi dibaca.                      | Semua
PATCH  | /notifikasi/baca-semua            | Tandai semua notifikasi dibaca.                     | Semua
GET    | /notifikasi/belum-baca/count      | Jumlah belum baca untuk badge navbar.               | Semua

8.31 Audit Log (2 Endpoints)

Method | Path                              | Deskripsi                                          | Role
-------|-----------------------------------|----------------------------------------------------|------------
GET    | /superadmin/audit-log             | Filter: user, action_type, rentang tanggal, IP, flag impersonated. Pagination 50/halaman. | Super Admin
GET    | /superadmin/audit-log/export      | Ekspor CSV. Throttle 5x/jam per user.               | Super Admin

8.32 Keamanan Tambahan (3 Endpoints)

Method | Path                              | Deskripsi                                          | Role
-------|-----------------------------------|----------------------------------------------------|------------
GET    | /superadmin/session-aktif         | Daftar semua sesi token aktif di seluruh sistem.   | Super Admin
DELETE | /superadmin/session/{token_id}    | Paksa logout satu sesi (akses tidak sah).           | Super Admin
POST   | /superadmin/audit-log/flush       | Arsipkan audit log lama ke cold storage.            | Super Admin

8.33 Health & System (3 Endpoints)

Method | Path       | Deskripsi                                               | Role
-------|------------|---------------------------------------------------------|--------
GET    | /health    | Cek kesehatan: database, Redis, queue worker. [PUBLIC]  | Public
GET    | /health/queue | Status antrian Horizon worker.                       | Super Admin
GET    | /version   | Versi API berjalan. Untuk debugging. [PUBLIC]           | Public

---

BAB 9 — ATURAN BISNIS MUTLAK (HARD CONSTRAINTS)

Seluruh aturan berikut NON-NEGOTIABLE. Tidak ada kondisi bisnis, permintaan user, atau kasus khusus yang memperbolehkan pelanggaran.

9.1 Aturan PDF Force Light Mode

Seluruh dokumen PDF yang dirender Spatie Browsershot (Form 02, 04, 05, 06, 08, 09/10, 11, 12, 13, 15, 16, 18, dan semua lainnya) WAJIB dirender dalam Light Mode. Implementasi wajib: class="light" pada root HTML + stylesheet override seperti di BAB 5.5.

9.2 Aturan Payment Gateway Webhook

Perubahan status pembayaran WAJIB melalui webhook dari gateway. DILARANG mengandalkan polling manual sebagai satu-satunya mekanisme. Alur wajib: gateway → POST /webhook/pembayaran → verifikasi signature HMAC (header X-Signature) → update MySQL → broadcast ke Redis → Echo/Reverb → frontend auto-update. Endpoint dilindungi: (1) whitelist IP gateway (bukan Bearer Token), (2) validasi signature HMAC-SHA256, (3) idempotency: jika trx_id yang sama dikirim dua kali, proses hanya sekali.

9.3 Aturan Blind Review Asesor

Selama assessment_in_progress, WAJIB dijaga isolasi data antar asesor. Endpoint GET /asesor/tugas/{pendaftaran_id} wajib filter penilaian berdasarkan asesor_id yang login. Query DILARANG mengembalikan penilaian asesor lain. Batas isolasi berakhir setelah kedua asesor submit final.

9.4 Aturan Finalisasi Sanggahan

Setelah Asesor finalisasi item sanggahan, keputusan MUTLAK TIDAK DAPAT DIUBAH melalui antarmuka sistem, termasuk oleh Super Admin. Perubahan hanya via akses langsung database oleh DBA. Endpoint PUT /asesor/sanggahan/item/{item_id} WAJIB HTTP 403 jika diputus_at sudah terisi.

9.5 Aturan Satu Gelombang Aktif

Hanya SATU gelombang boleh is_active=true. Endpoint PATCH /gelombang/{id}/toggle-aktif menggunakan atomic database transaction: (1) nonaktifkan semua gelombang aktif, (2) aktifkan yang diminta. Tidak boleh ada jeda antar dua operasi ini.

9.6 Aturan Dua Asesor Berbeda

Asesor 1 dan 2 WAJIB berbeda. Constraint CHECK (asesor_1_id <> asesor_2_id) ada di database. Validasi JUGA wajib dilakukan di level API (Laravel Request validation) sebelum query menyentuh database untuk memberikan pesan error informatif.

9.7 Aturan Soft Delete Data Kritis

Tabel users dan kurikulum_rpl menggunakan soft delete (kolom deleted_at). DILARANG hard delete. Gunakan Eloquent withTrashed() dan onlyTrashed() untuk manajemen data terhapus. Tabel lain tanpa deleted_at boleh hard delete.

9.8 Aturan Rate Limiting

Endpoint / Grup                    | Limit         | Window          | Catatan
-----------------------------------|---------------|-----------------|-----------------------------------
POST /auth/login                   | Max 10 req    | Per menit per IP | Cegah brute force
POST /auth/register                | Max 10 req    | Per menit per IP | Cegah spam akun
POST /upload                       | Max 20 req    | Per menit per user | Cegah abuse penyimpanan
GET /superadmin/audit-log/export   | Max 5 req     | Per jam per user | Cegah beban database
Endpoint umum terautentikasi       | Max 60 req    | Per menit per user | Throttle umum
POST /webhook/pembayaran           | Tidak dilimit | -               | Dilindungi IP whitelist

9.9 Aturan Audit Log Wajib

Wajib dicatat di audit_logs: (1) semua operasi CREATE/UPDATE/DELETE pada tabel inti (pendaftaran, penilaian_asesor, penilaian_pleno, penilaian_cp, sanggahan_item, plotting_asesor, arsip_dokumen, pra_asesmen, evaluasi_portofolio, matriks_alih_kredit), (2) semua login/logout, (3) reset password, (4) sesi impersonate mulai dan selesai, (5) semua generate dan download PDF dokumen legal. Jika aksi saat impersonate: kolom impersonated_by WAJIB diisi ID Super Admin.

9.10 Aturan Validasi Nilai Mutu

Kolom nilai_mutu pada penilaian_asesor, penilaian_cp, dan nilai_mutu_final pada penilaian_pleno WAJIB ada di tabel nilai_mutu_ref. FK constraint ada di database. Validasi JUGA wajib di level API sebelum query.

9.11 Aturan Urutan Pra Asesmen

Asesor DILARANG akses Workspace Blind Review (Halaman 3.2) sebelum Form 02 di-submit. Endpoint GET /asesor/tugas/{pendaftaran_id} WAJIB HTTP 403 jika pra_asesmen.submitted_at masih NULL untuk pendaftar tersebut.

9.12 Aturan Skala Asesmen Mandiri

Nilai self_rating WAJIB IN (1, 2, 4, 5). Nilai 3 tidak valid. CHECK constraint ada di database. Validasi JUGA wajib di Layer 2 (API).

9.13 Aturan Submit Jawaban Tulis Satu Kali

Setelah PATCH /pemohon/jawaban-tulis/{uji_lanjutan_id}/submit, semua jawaban dikunci (is_submitted=true). Endpoint PUT jawaban-tulis WAJIB HTTP 403 jika sudah dikunci.

9.14 Aturan Integritas Penilaian CP

skor_kognitif dan skor_skill WAJIB diisi (NOT NULL) sebelum Asesor submit final penilaian. skor_afektif opsional. Validasi di Layer 2 API saat PATCH /asesor/penilaian/{pendaftaran_id}/submit-final.

9.15 Aturan Briefing Sanggah

Sebelum Form Sanggahan aktif di Halaman 1.7, WAJIB tampilkan panel informasi prosedur sanggahan, timeline, dan dua jalur banding. Pemohon harus klik "Saya Mengerti" sebelum form terbuka.

---

BAB 10 — REAL-TIME COMMUNICATION & INTEGRASI EKSTERNAL

10.1 Arsitektur Real-Time

Stack: Laravel Broadcasting → Redis Pub/Sub → Laravel Reverb/Soketi (WebSocket Server) → Laravel Echo (Next.js Client)

Event Name                  | Channel                      | Dipicu Oleh                     | Diterima Oleh        | Aksi di Frontend
----------------------------|------------------------------|---------------------------------|----------------------|-----------------------------------------
PembayaranLunas             | private-pendaftaran.{id}     | Webhook payment gateway         | Halaman 1.2 Pemohon  | Badge→Lunas, auto-redirect ke 1.3
StatusPendaftaranBerubah    | private-pendaftaran.{id}     | Semua perubahan status_alur     | Dashboard Pemohon 1.4| Perbarui Stepper real-time
NotifikasiBaru              | private-user.{user_id}       | Semua aksi menghasilkan notifikasi | Semua user        | Badge navbar bertambah, toaster popup
UndanganUjiTerkirim         | private-pendaftaran.{id}     | Asesor kirim undangan           | Halaman 1.6 Pemohon  | Menu Ruang Uji muncul di sidebar, toaster
KonfirmasiKehadiranMasuk    | private-asesor.{asesor_id}   | Pemohon konfirmasi kehadiran    | Dashboard Asesor     | Notifikasi toaster konfirmasi
SanggahanBaru               | private-asesor.{asesor_id}   | Pemohon kirim sanggahan         | Dashboard Asesor     | Badge + muncul di Halaman 3.4
PraAsesmenSubmit            | private-pendaftaran.{id}     | Asesor submit Form 02           | Pemohon              | Notifikasi "penilaian formal dimulai"
SoalTulisReady              | private-pendaftaran.{id}     | Asesor finalisasi soal tulis    | Pemohon              | Menu Lembar Jawaban muncul di sidebar
JawabanTulisSubmit          | private-asesor.{asesor_id}   | Pemohon submit jawaban tulis    | Asesor               | Notifikasi untuk segera menilai

10.2 Integrasi Payment Gateway

Primary: Midtrans. Fallback: Xendit. Konfigurasi di environment variables, bukan database. Metode: QRIS (semua bank), Virtual Account BCA/BNI/BRI/Mandiri/Permata. Keamanan webhook: (1) whitelist IP resmi gateway di middleware Laravel, (2) verifikasi signature HMAC-SHA256 dari header, (3) jika gagal → HTTP 403 + catat audit log "Webhook tidak terautentikasi". Idempotency: cek trx_id sudah ada status=success sebelum memproses; jika sudah ada → HTTP 200 tanpa proses ulang.

10.3 Background Jobs (Queue — Laravel Horizon + Redis)

Job Name                  | Dipicu Oleh                    | Aksi                                      | Timeout
--------------------------|--------------------------------|-------------------------------------------|--------
GenerateTandaTerima       | Final Submit mahasiswa         | Render PDF Form 06 via Browsershot        | 60 detik
GenerateRiwayatHidup      | Final Submit mahasiswa         | Render PDF Form 16 lengkap                | 60 detik
GenerateFormPraAsesmen    | Asesor submit Form 02          | Render PDF Form 02                        | 60 detik
GenerateFormEvalPortofolio| Asesor simpan hasil Form 04    | Render PDF Form 04                        | 60 detik
GenerateMatriksAlihKredit | Asesor submit Form 12          | Render PDF Form 12                        | 60 detik
GenerateMatriksAsesmenMK  | Admin update Form 13           | Render PDF Form 13 per prodi              | 90 detik
GenerateBeritaAcaraPleno  | Admin sahkan pleno             | Render PDF Form 15                        | 120 detik
GenerateSKPenetapan       | Admin trigger generate SK      | Render PDF Form 18                        | 120 detik
BulkGenerateSK            | Admin bulk-sahkan pleno        | Loop generate SK banyak pendaftaran       | 300 detik
KirimEmailNotifikasi      | Semua trigger notifikasi       | Kirim email via SMTP/Mailgun + simpan notifikasi | 30 detik

---

BAB 11 — KEAMANAN SISTEM & STRATEGI VALIDASI

11.1 Lapisan Validasi (Defense in Depth)

Layer 1 — Frontend (Zod + React Hook Form): validasi format dan tipe data instan di browser. Tujuan: UX responsif, tidak perlu tunggu API untuk error sederhana.
Layer 2 — API (Laravel Form Request): validasi business rules di server. Tujuan: cegah data tidak valid menyentuh database, error terstandarisasi.
Layer 3 — Database (Constraint + CHECK + FK): validasi integritas relasional di level engine. Tujuan: backstop terakhir yang tidak bisa dilewati dari manapun.

11.2 Keamanan File Upload

Validasi wajib: tipe MIME divalidasi di server (bukan hanya ekstensi). KTP: image/jpeg, image/png, application/pdf. Transkrip: application/pdf. Portofolio: image/jpeg, image/png, application/pdf, application/zip. Ukuran maksimum diperiksa sebelum file disimpan. Penyimpanan: storage private, akses hanya via signed URL Laravel expiry 15 menit. Penamaan: UUID (bukan nama asli user) untuk cegah path traversal dan information disclosure.

11.3 Authorization Middleware

Middleware         | Diterapkan Pada                    | Fungsi
-------------------|------------------------------------|----------------------------------------
auth:sanctum       | Semua endpoint kecuali [PUBLIC]    | Bearer Token valid
role:pemohon       | Endpoint khusus pemohon            | Tolak jika bukan pemohon
role:admin_prodi   | Endpoint khusus admin              | Tolak jika bukan admin_prodi
role:asesor        | Endpoint khusus asesor             | Tolak jika bukan asesor
role:super_admin   | Endpoint khusus super admin        | Tolak jika bukan super_admin
ownership          | GET /pendaftaran/{id}              | Pemohon hanya akses data milik sendiri
prodi_scope        | Endpoint Admin Prodi               | Admin hanya akses data pendaftar prodinya
asesor_scope       | Endpoint Asesor                    | Asesor hanya akses berkas yang ditugaskan
webhook_ip         | POST /webhook/pembayaran           | Hanya terima request dari IP whitelist gateway

11.4 Validasi Tambahan

self_rating wajib IN (1,2,4,5) di semua lapisan. skor_kognitif dan skor_skill wajib BETWEEN 1 AND 4. skor di jawaban_tulis dan pertanyaan_lisan wajib BETWEEN 1 AND 5. Endpoint soal tulis hanya akses jika uji_lanjutan.jenis_ujian='Tulis'. Endpoint pertanyaan lisan hanya akses jika uji_lanjutan.jenis_ujian='Wawancara'.

---

BAB 12 — STRUKTUR FOLDER PROJECT (MONOREPO)

rpl-poliban/
├── frontend/          # Next.js 15 App
├── backend/           # Laravel 13 API
├── docker/            # Docker configs
├── docs/              # PRD, OpenAPI spec
└── README.md

Frontend (Next.js 15):
frontend/
├── app/
│   ├── (auth)/                    # login, register (no layout)
│   ├── (focused)/                 # pembayaran, form pendaftaran (no sidebar)
│   ├── (dashboard)/               # semua halaman dengan sidebar
│   │   ├── pemohon/
│   │   │   └── jawaban-tulis/     # Halaman 1.6a
│   │   ├── admin/
│   │   ├── asesor/
│   │   │   ├── pra-asesmen/       # Halaman 3.1a
│   │   │   ├── portofolio/        # Halaman 3.2a
│   │   │   ├── penilaian-cp/      # Halaman 3.2b
│   │   │   ├── soal-tulis/        # Halaman 3.3a
│   │   │   └── matriks-alih-kredit/ # Halaman 3.2c
│   │   └── superadmin/
│   ├── layout.tsx
│   └── globals.css                # Tailwind v4 CSS variables
├── components/
│   ├── ui/            # Shadcn/UI base
│   ├── forms/         # React Hook Form + Zod
│   ├── tables/        # Data table components
│   ├── pdf-viewer/    # react-pdf wrapper
│   └── layout/        # Sidebar, Header, Stepper, dll.
├── lib/
│   ├── api.ts         # API client (fetch wrapper)
│   ├── validations/   # Zod schemas
│   ├── store/         # Zustand stores
│   └── echo.ts        # Laravel Echo WebSocket setup
└── types/             # TypeScript type definitions

Backend (Laravel 13):
backend/
├── app/Http/
│   ├── Controllers/Api/   # API controllers per domain
│   │   ├── PraAsesmenController.php
│   │   ├── PortofolioController.php
│   │   ├── PenilaianCpController.php
│   │   ├── SoalTulisController.php
│   │   ├── JawabanTulisController.php
│   │   ├── MatriksAlihKreditController.php
│   │   ├── MatriksAsesmenController.php
│   │   └── BandingEksternalController.php
│   ├── Requests/          # Form Request validation
│   └── Middleware/        # ownership, prodi_scope, asesor_scope, webhook_ip
├── app/Models/            # Eloquent (Strict Mode)
├── app/Jobs/              # GeneratePDF, KirimEmail, dll.
├── app/Events/            # PembayaranLunas, PraAsesmenSubmit, dll.
├── app/Listeners/
├── app/Services/          # Business logic
├── app/DTOs/              # PHP 8.4 asymmetric visibility
├── database/
│   ├── migrations/        # Migration files
│   └── seeders/           # nilai_mutu_ref, dll.
├── routes/api.php
└── config/
    ├── sanctum.php
    ├── horizon.php
    └── broadcasting.php

---

BAB 13 — CHECKLIST IMPLEMENTASI UNTUK AI AGENT

Fase 0: Setup & Infrastruktur
- Setup monorepo structure (frontend/ + backend/)
- Install Next.js 15 App Router + TypeScript
- Install Laravel 13 + PHP 8.4
- Setup MySQL 8.4 + Redis 7.x
- Install & konfigurasi Laravel Octane dengan FrankenPHP
- Install & konfigurasi Laravel Horizon
- Setup Laravel Reverb atau Soketi untuk WebSocket
- Konfigurasi Tailwind CSS v4 dengan CSS variables di globals.css
- Install & konfigurasi Shadcn/UI
- Setup Spatie Browsershot + Headless Chrome di server

Fase 1: Database
- Buat migration: prodi, users (dengan kolom Form 07), gelombang, pendaftaran (ENUM pra_asesmen), pendaftar_profil (dengan no_telepon)
- Buat migration & seeder: nilai_mutu_ref (KRITIS — seed data wajib)
- Buat migration: pembayaran, pendaftar_pelatihan, pendaftar_pengalaman_kerja
- Buat migration: transkrip_asal (dengan jenjang, thn_masuk, thn_lulus, ipk), transkrip_asal_item
- Buat migration: riwayat_pelatihan_profesi, riwayat_konferensi, riwayat_penghargaan, riwayat_organisasi
- Buat migration: kurikulum_rpl (dengan cp_sikap, cp_pengetahuan, cp_keterampilan, indikator_kinerja, level_kkni, profil_lulusan), matriks_metode_asesmen
- Buat migration: asesmen_mandiri (TINYINT self_rating, CHECK IN(1,2,4,5), kode_bukti)
- Buat migration: portofolio_dokumen, plotting_asesor, pra_asesmen
- Buat migration: evaluasi_portofolio, penilaian_asesor (FK nilai_mutu ke nilai_mutu_ref, is_final)
- Buat migration: penilaian_cp (skor_kognitif, skor_skill, skor_afektif, CHECK constraints)
- Buat migration: uji_lanjutan (status_konfirmasi, confirmed_at), soal_tulis, jawaban_tulis, pertanyaan_lisan
- Buat migration: matriks_alih_kredit, penilaian_pleno (FK nilai_mutu_final, bobot_, override_manual)
- Buat migration: sanggahan (header), sanggahan_item, banding_eksternal
- Buat migration: arsip_dokumen, audit_logs (impersonated_by)

Fase 2: Backend API Core
- Implementasi Auth endpoints (register, login, logout, me, refresh, forgot, reset)
- Setup Laravel Sanctum multi-role
- Implementasi semua middleware (ownership, prodi_scope, asesor_scope, webhook_ip)
- Implementasi Gelombang CRUD
- Implementasi Prodi CRUD
- Implementasi User & UAC endpoints (termasuk impersonate + reset password)
- Implementasi Upload File dengan validasi MIME

Fase 3: Alur Pendaftaran
- Implementasi Pendaftaran endpoints + status machine (termasuk status pra_asesmen)
- Implementasi Pembayaran + payment gateway integration
- Implementasi Webhook (IP whitelist + signature HMAC + idempotency)
- Implementasi WebSocket broadcast PembayaranLunas
- Implementasi Profil Pendaftar (Form 01): profil + pelatihan (A.2) + pengalaman kerja (A.3)
- Implementasi Transkrip Asal (Form 16 B.1) termasuk bulk
- Implementasi Riwayat Hidup Lengkap (Form 16 B.2-B.5): pelatihan profesi, konferensi, penghargaan, organisasi
- Implementasi Kurikulum RPL + import Excel
- Implementasi Asesmen Mandiri (Form 03) upsert batch, validasi IN(1,2,4,5)
- Implementasi Portofolio Dokumen upload endpoints
- Implementasi Matriks Metode Asesmen (Form 13)

Fase 3.5: Pra Asesmen (KRITIS)
- Implementasi Form 02 Pra Asesmen endpoints
- Implementasi validasi: Asesor tidak bisa akses Workspace sebelum submit Form 02 (HTTP 403)
- Implementasi status machine: waiting_verification → pra_asesmen → assessment_in_progress

Fase 4: Alur Asesmen
- Implementasi Verifikasi & Plotting Asesor
- Implementasi Evaluasi Portofolio (Form 04)
- Implementasi Penilaian CP 3-dimensi (Form 05) dengan validasi skor
- Implementasi Matriks Alih Kredit (Form 12)
- Implementasi Penilaian Asesor dengan validasi nilai_mutu_ref FK, blind review isolasi
- Implementasi Uji Lanjutan (jadwal, undangan, konfirmasi)
- Implementasi Soal Tulis (Form 09): buat soal + kunci + bobot
- Implementasi Jawaban Tulis (Form 10): pemohon isi + kunci jawaban + penilaian asesor
- Implementasi Pertanyaan Lisan (Form 11): buat pertanyaan + isi jawaban + skor
- Implementasi logic: kedua asesor submit → auto transisi ke waiting_pleno
- Validasi submit final: skor_kognitif & skor_skill wajib terisi

Fase 5: Pleno & Finalisasi
- Implementasi kalkulasi rata-rata bobot dari nilai_mutu_ref
- Implementasi Dashboard Pleno dengan flag selisih > 1.0 poin
- Implementasi Pengesahan Pleno + trigger generate PDF Form 15
- Implementasi Generate SK PDF via Browsershot (force light mode)
- Implementasi Arsip Dokumen
- Implementasi Publikasi Hasil + notifikasi ke mahasiswa

Fase 6: Sanggahan & Banding
- Implementasi info-sanggahan endpoint + logika briefing sanggah
- Implementasi Sanggahan (header + item)
- Implementasi validasi deadline_sanggah
- Implementasi Tinjauan Sanggahan Asesor
- Implementasi logika finalisasi mutlak (check diputus_at sebelum update → HTTP 403)
- Implementasi Banding Eksternal ke Pimpinan PT

Fase 7: Super Admin & Monitoring
- Implementasi Dashboard Eksekutif dengan agregasi data
- Implementasi Audit Log dengan impersonated_by + semua trigger wajib
- Implementasi fitur Impersonate dengan banner UI
- Implementasi rate limiting sesuai tabel Bab 9.8
- Implementasi Health Check endpoints + version endpoint

Fase 8: Frontend
- Setup Next.js App Router dengan route groups (auth, focused, dashboard)
- Halaman 1.1: Registrasi & Login + Zod validation
- Halaman 1.2: Pembayaran + WebSocket listener + fallback manual
- Halaman 1.3: Long Form lima seksi (A+A.2+A.3, B.1-B.5, C skala 1/2/4/5, D portofolio, E) + react-intersection-observer auto-save
- Halaman 1.4: Status + Stepper 6 tahap + real-time
- Halaman 1.5: Arsip Borang 4 tab read-only
- Halaman 1.6: Ruang Uji Lanjutan + konfirmasi kehadiran
- Halaman 1.6a: Lembar Jawaban Ujian Tulis (BARU)
- Halaman 1.7: Hasil & Sanggahan + briefing panel + info banding eksternal
- Halaman 2.1: Antrean Pendaftar + filter + unlock form
- Halaman 2.2: Kurikulum + Tab Matriks Asesmen MK (Form 13)
- Halaman 2.3: Split-screen verifikasi berkas + plotting asesor
- Halaman 2.4: Dashboard Pleno + komparasi A1 vs A2 + flag selisih
- Halaman 2.5a: Matriks Alih Kredit (BARU)
- Halaman 2.5: Loker Arsip Fisik + publikasi
- Halaman 3.1: Daftar Tugas Asesmen
- Halaman 3.1a: Form Pra Asesmen 8 langkah (BARU)
- Halaman 3.2: Workspace Blind Review + react-resizable-panels + 5 tab referensi
- Halaman 3.2a: Evaluasi Portofolio Form 04 (BARU)
- Halaman 3.2b: Penilaian CP 3-Dimensi Form 05 (BARU)
- Halaman 3.2c: Matriks Alih Kredit Form 12 (BARU)
- Halaman 3.3: Manajemen Uji Lanjutan + Form 07 Biodata Asesor tab
- Halaman 3.3a: Perangkat Asesmen Tulis Form 09 (BARU)
- Halaman 3.3b: Lembar Pertanyaan Lisan Form 11 (BARU)
- Halaman 3.3c: Penilaian Jawaban Tulis Form 10 (BARU)
- Halaman 3.4: Tinjauan Sanggahan
- Halaman 4.1: Dashboard Eksekutif
- Halaman 4.2: Manajemen Gelombang + deadline_sanggah field
- Halaman 4.3: Manajemen Prodi
- Halaman 4.4: UAC + Impersonate + Reset Password
- Halaman 4.5: Audit Log + ekspor CSV
- Profil Asesor: field Form 07 (jabatan, asosiasi, dll.)
- Dark Mode dengan next-themes
- SEMUA PDF template: force Light Mode

Fase 9: PDF Templates (semua via Spatie Browsershot, force Light Mode)
- Form 02: Pra Asesmen (8 langkah + rekomendasi)
- Form 04: Evaluasi Portofolio (10 jenis + nilai V/A/T/C)
- Form 05: Penilaian CP 3-Dimensi per MK
- Form 06: Tanda Terima Pendaftaran
- Form 08: Surat Undangan Uji Lanjutan
- Form 09+10: Perangkat Asesmen Tulis + Lembar Jawaban + penilaian
- Form 11: Lembar Pertanyaan Lisan
- Form 12: Matriks Alih Kredit (MK asal → MK POLIBAN + gap)
- Form 13: Matriks Asesmen MK (MK vs C1-C11 + KKNI + profil lulusan)
- Form 15: Berita Acara Pleno
- Form 16: Daftar Riwayat Hidup Lengkap (pendidikan + pelatihan + konferensi + penghargaan + organisasi)
- Form 18: SK Penetapan RPL

---

POLITEKNIK NEGERI BANJARMASIN — KONFIDENSIAL
PRD Sistem RPL v4.0 — Gabungan v2 + v3 — Semua 19 Formulir Terpetakan
