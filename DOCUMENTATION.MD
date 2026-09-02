# Dokumentasi Kalivergo

Branch acuan `development`  
Jenis aplikasi aplikasi web multi-tenant berbasis Next.js App Router  
Bahasa dokumentasi Bahasa Indonesia  

Dokumen ini menjelaskan struktur teknis, fitur, alur kerja, dan cara penggunaan Kalivergo berdasarkan source code pada branch `development`. Detail dapat berubah ketika branch mengalami pengembangan lebih lanjut.

> **Pembaruan 2026-09-02:** diselaraskan dengan implementasi saat ini (halaman `tasks`, `schedule`, `information`, `statistics`, model `Pertemuan`, feed informasi, dan knowledge base AI).

## Daftar Isi

1. [Latar Belakang](#1-latar-belakang)
2. [Arsitektur](#2-arsitektur)
3. [Struktur Folder](#3-struktur-folder)
4. [Fitur](#4-fitur)
5. [Cara Kerja Sistem](#5-cara-kerja-sistem)
6. [Cara Penggunaan Laman dan Fitur](#6-cara-penggunaan-laman-dan-fitur)
7. [Konfigurasi dan Menjalankan Aplikasi](#7-konfigurasi-dan-menjalankan-aplikasi)
8. [Kebijakan dan Privasi](#8-kebijakan-dan-privasi)
9. [Lisensi](#9-lisensi)
10. [Pengujian dan Batasan Dokumentasi](#10-pengujian-dan-batasan-dokumentasi)

## 1. Latar Belakang

Kalivergo dirancang sebagai platform pengelolaan aktivitas organisasi atau kelas yang membutuhkan pemisahan data berdasarkan tenant (konteks organisasi). Aplikasi menggabungkan laman publik, autentikasi anggota, dashboard operasional, CMS, manajemen keuangan, portfolio, seminar, tugas, jadwal, informasi, serta bantuan AI.

Kebutuhan utama yang dilayani

- menyediakan laman publik yang dapat disesuaikan untuk setiap tenant;
- mengelola anggota, peran, akses, dan profil secara terpusat;
- memisahkan data antar universitas, program studi, atau kelas melalui route tenant;
- mendukung proses pendaftaran, verifikasi email, reset password, dan KYC;
- membantu administrator mengelola konten, aktivitas, keuangan, dan audit;
- menyediakan antarmuka yang responsif dengan dukungan tema terang dan gelap.

## 2. Arsitektur

### 2.1 Gambaran lapisan

```text
Browser
  
  v
Next.js App Router (src/app)
  -- Server Components membaca data dan merender laman
  -- Client Components formulir, widget, modal, state interaktif
  -- Route Handlers endpoint HTTP di src/app/api
  -- Server Actions mutasi dari src/actions
  
  v
Domain/Feature Layer (src/features, src/services, src/server)
  -- validasi schema
  -- service dan akses data
  -- autentikasi, tenant, KYC, email, storage, audit
  
  v
Prisma ORM (prisma/schema.prisma)
  
  v
Database dan layanan eksternal
  -- email
  -- Cloudinary storage
  -- penyedia AI
```

### 2.2 Prinsip arsitektur

1. App Router sebagai entry point. File `page.tsx`, `layout.tsx`, dan route handler menentukan laman serta endpoint.
2. Server-first. Laman yang membaca database umumnya berupa Server Component. Komponen diberi directive `use client` hanya ketika memerlukan state, event browser, modal, atau interaksi langsung.
3. Multi-tenancy berbasis route. Segmen dinamis `[slug]` membawa konteks tenant. Resolver tenant menerjemahkan parameter route menjadi `tenantId`, lalu service mengambil data menggunakan tenant tersebut.
4. Mutasi terkontrol. Operasi createupdatedelete diletakkan pada Server Actions atau route handler, bukan langsung dari komponen presentasi.
5. Pemisahan domain. Fitur seperti auth, finance, KYC, portfolio, seminar, task, tenant, owner, member, platform, dan ai-assistant memiliki validator, service, action, atau komponen masing-masing.
6. ORM terpusat. Prisma digunakan sebagai batas akses database. `src/lib/prisma.ts` dan `src/server/db/prisma.ts` menyediakan client atau helper database.
7. Authorization berlapis. Middleware, helper autentikasi, pemeriksaan role, dan pembatasan tenant digunakan untuk mencegah akses tanpa sesi atau lintas tenant.

## 3. Struktur Folder

### 3.1 Root dan konfigurasi

 Folderfile  Fungsi 
------
 `package.json`  Dependensi, script pengembangan, build, lint, dan pengujian. 
 `next.config.mjs`  Konfigurasi framework Next.js (gambar, server actions, dan header cache). 
 `tsconfig.json`  Konfigurasi TypeScript dan alias import. 
 `tailwind.config.ts`  Token dan konfigurasi Tailwind CSS. 
 `postcss.config.js`  Pipeline PostCSS. 
 `next-env.d.ts`  Deklarasi tipe otomatis Next.js. 
 `.env.example`  Daftar contoh variabel lingkungan; salin dan isi secara lokal tanpa memasukkan secret ke git. 
 `prisma`  Skema database dan seed. 
 `public`  Asset statis yang disajikan langsung oleh Next.js. 
 `dataset`  Knowledge base internal untuk asisten AI. 
 `ai-assistant`  Layanan AI assistant berbasis Python (opsional, FastAPI). 
 `tests`  Setup test, contract test, security test, dan unit test. 

### 3.2 `src/app` route dan komposisi laman

`src/app` adalah routing utama App Router. `layout.tsx` menyediakan shell global, metadata, provider, dan style. `page.tsx` merender route. Folder dalam tanda kurung seperti `(protected)` adalah route group dan tidak menjadi bagian URL.

#### Route publik dan autentikasi

 Route  Kegunaan 
------
 ``  Entry point atau landing utama aplikasi. 
 `login`  Login pengguna. 
 `signup`  Pendaftaran akun umum. 
 `member-signup`  Alur pendaftaran anggota. 
 `forgot-password`  Memulai pemulihan password. 
 `verify-forgot-password`  Verifikasi token pemulihan password. 
 `callback`  Halaman callback proses autentikasi. 
 `privacy`  Laman kebijakan privasi. 
 `terms`  Laman syarat dan ketentuan. 
 `unauthorized`  Laman ketika pengguna tidak memiliki izin. 

#### Route platform

 Route  Kegunaan 
------
 `/platform/login`  Login administrator platform. 
 `/platform/register`  Registrasi owner platform. 
 `/platform/(protected)`  Area platform yang dilindungi sesi dan otorisasi (route group tidak menjadi bagian URL). 

#### Route tenant

Route tenant menggunakan pola `[slug]`, sehingga URL aktual bergantung pada slug tenant. Laman yang tersedia meliputi

 Route relatif  Kegunaan 
------
 `[slug]`  Layout dan konteks tenant. 
 `[slug]home`  Beranda tenant atau kelas. 
 `[slug]tasks`  Daftar tugas dan Task Tracker. 
 `[slug]schedule`  Jadwal kegiatan kelas. 
 `[slug]information`  Feed informasi, komentar, dan reaksi. 
 `[slug]dashboard`  Ringkasan keuangan kelas (arus kas dan tunggakan). 
 `[slug]statistics`  Statistik progres pengerjaan tugas per anggota. 
 `[slug]seminar`  Informasi seminar dan submission peserta. 
 `[slug]profil`  Profil anggota atau tenant. 
 `[slug]portofolio/[username]`  Portfolio dan karya anggota. 
 `[slug]cms`  Area administrasi konten tenant. 
 `[slug]cms/audit`  Riwayat audit aktivitas. 
 `[slug]cms/finance`  Pengelolaan transaksi/keuangan. 
 `[slug]cms/people`  Pengelolaan anggota dan akses. 
 `[slug]cms/schedule`  Pengelolaan jadwal. 
 `[slug]cms/seminar`  Menambah, melihat, dan menghapus seminar. 
 `[slug]cms/information`  Kelola postingan informasi kelas. 
 `[slug]cms/tasks`  Kelola tugas dan submission. 
 `[slug]cms/access`  Kelola hak akses modul CMS. 

 Route yang benar membutuhkan konteks tenant yang valid. Contoh implementasi halaman CMS seminar memanggil resolver tenant, mengambil `tenantId`, lalu mengembalikan pesan kesalahan jika konteks tidak ditemukan.

#### Route API

`src/app/api` berisi Route Handler HTTP untuk kebutuhan yang tidak dilayani langsung oleh Server Action, antara lain

- `access` pemeriksaan akses;
- `ai-assistant/chat` komunikasi dengan asisten AI;
- `auth` endpoint autentikasi;
- `finance` endpoint keuangan;
- `member` operasi anggota;
- `portofolio/get` dan `portofolio/update` operasi portfolio;
- `seminar` operasi seminar;
- `tasks` dan `tasks/[id]/submissions` operasi tugas dan submission;
- `upload-profile` upload foto profil;
- `upload-kyc` upload dokumen KYC;
- `verify-email` verifikasi email;
- `verify-forgot-password` verifikasi pemulihan password.

### 3.3 `src/actions` Server Actions

Berisi fungsi mutasi yang dipanggil dari formulir atau komponen server/client. Area yang terlihat pada struktur proyek mencakup

- `cms.ts` aksi CMS generik (beberapa aksi lama);
- `cms/` subfolder aksi CMS: audit, auth-helper, categories, cms-access, finance, information, people, role-model, dan schedule;
- `registration.ts` proses pendaftaran;
- `owner-registration.ts` pendaftaran owner;
- `platform-auth.ts` autentikasi platform;
- `platform-owners.ts` pengelolaan data owner di platform;
- `platform-kyc.ts` proses KYC platform;
- `universal-auth.ts` helper autentikasi lintas area.

Komponen `ActionFeedback` memetakan aksi seperti `task`, `schedule`, `seminar`, `people`, `finance`, `transaction`, `profile`, `portfolio`, dan `category` ke Server Action yang sesuai. Komponen ini juga mengelola loading, pesan sukses/gagal, reset formulir, dan refresh data.

### 3.4 `src/features` modul berdasarkan domain

Setiap feature menjadi tempat kode domain yang berkaitan. Modul yang tersedia mencakup

- `ai-assistant` widget dan integrasi asisten AI;
- `auth` schema validasi autentikasi;
- `cms` kebutuhan CMS;
- `finance` domain keuangan;
- `kyc` verifikasi identitas;
- `member` domain anggota;
- `owner` proses owner;
- `platform` domain platform;
- `portfolio` portfolio;
- `seminar` validator, service, action, dan komponen seminar;
- `task` (termasuk model `Pertemuan`) tugas;
- `tenant` konteks dan domain tenant.

Pola yang digunakan pada feature dapat mencakup `actions`, `components`, `services`, `validators`, dan `repositories`. Tidak semua feature wajib memiliki seluruh subfolder tersebut.

### 3.5 `src/server`, `src/services`, dan `src/lib`

- `src/server` implementasi sisi server untuk AI, audit, auth, database, email, KYC, storage, dan tenant.
- `src/services` service aplikasi lintas domain, termasuk `owner-application.service.ts`.
- `src/lib` utilitas inti seperti session, Prisma, tenant context, auth, email, Cloudinary, audit, KYC, tanggal/waktu (WIB), dan helper umum.
- `src/lib/tenant-context.ts` serta `src/server/tenant` bagian penting untuk menjaga konteks tenant.

### 3.6 `src/components`, `src/shared`, `src/stores`, `src/styles`, dan `src/types`

- `src/components` komponen UI dan komposisi layar; dikelompokkan menjadi `landing`, `home`, `dashboard`, `cms`, `information`, `statistics`, `platform`, `layout`, `security`, `unauthorized`, dan `ui`.
- `src/components/ui` komponen dasar reusable seperti card, button, modal, badge, avatar, background, dan elemen presentasi.
- `src/shared` kontrak/utilitas bersama untuk auth, kategori tugas, dan komponen shared.
- `src/stores/theme.ts` state tema (Zustand).
- `src/styles/global.css` dan `src/styles/themes` style global dan tema.
- `src/types` tipe bersama, termasuk tenant, index umum, dan deklarasi SDK.

### 3.7 `prisma/` dan database

- `prisma/schema.prisma` sumber kebenaran model dan relasi database.
- `prisma/seed.ts` data awal untuk lingkungan pengembangan atau pengujian.
- `src/lib/prisma.ts`, `src/lib/db.ts`, dan `src/server/db/prisma.ts` akses Prisma dari kode aplikasi.

Model yang perlu diperhatikan saat mengubah skema meliputi identitas pengguna, tenant, role/access, KYC, portfolio, seminar, task (beserta `Pertemuan` dan `Submission`), schedule, transaction/finance, information feed, dan audit. Nama field serta relasi harus selalu dirujuk langsung dari `schema.prisma` sebelum membuat migrasi atau fitur baru.

## 4. Fitur

### 4.1 Identitas dan akses

- Login, signup, member signup, serta login platform.
- Verifikasi email dan reset password.
- Pengelolaan sesi pengguna.
- Pembatasan akses berdasarkan role dan tenant.
- Laman `unauthorized` untuk akses yang ditolak.
- Pendaftaran owner dan KYC platform.

### 4.2 Pengelolaan tenant

Tenant direpresentasikan oleh slug pada URL. Resolver tenant mencari konteks yang cocok, dan operasi pembacaan/mutasi menggunakan `tenantId`. Pendekatan ini membuat satu instalasi dapat melayani beberapa organisasi, universitas, program studi, atau kelas dengan data yang terisolasi.

### 4.3 CMS dan aktivitas akademik/organisasi

CMS mendukung pengelolaan anggota, role model, kategori, tugas (termasuk kategori & pertemuan), jadwal, seminar, informasi, dan data terkait kelas. Modul CMS yang tersedia: tasks, people, finance, schedule, seminar, information, access, dan audit. Contoh halaman CMS seminar menyediakan formulir judul, tanggal, lokasi, deskripsi, dan URL; daftar seminar menampilkan data yang ada, pengelolaan submission, serta tombol penghapusan.

### 4.4 Dashboard dan beranda

Beranda menampilkan ringkasan aktivitas kelas: kartu keuangan (`HomeFinanceCard`), informasi terbaru (`HomeInfoCard`), tugas mingguan (`WeeklyTasks`), dan seminar 7 hari ke depan (`HomeUpcomingSeminars`). Halaman `home` membaca data tenant di server lalu mengirimnya ke komponen presentasi.

### 4.5 Portfolio

Modul portfolio menyediakan area untuk menyimpan serta menampilkan karya anggota. Data portofolio (bio, pengalaman, keahlian, tautan sosial, foto) dikelola lewat halaman profil dan ditampilkan publik pada `[slug]/portofolio/[username]`. Tidak ada modul `project` terpisah pada implementasi saat ini.

### 4.6 Keuangan

Area finance menyediakan pengelolaan transaksi. Pada komponen feedback CMS, operasi pembuatan transaksi menggunakan action finance dan penghapusan transaksi menggunakan action transaction.

### 4.7 AI assistant

`src/features/ai-assistant` dan `api/ai-assistant/chat` menyediakan widget serta jalur komunikasi asisten AI. Server AI (`src/server/ai/*`) memuat knowledge base dari `dataset/` dan meneruskan pertanyaan ke Gemini. Konfigurasi diatur via env `GEMINI_API_KEY`, `GEMINI_MODEL`, `KNOWLEDGE_BASE_DIR`, dan varian `AI_*` (lihat `.env.example`).

### 4.8 Upload profile dan storage

Endpoint `upload-profile` dan `upload-kyc`, `src/lib/cloudinary.ts`, serta `src/server/storage` menangani upload dan penyimpanan asset profil/dokumen KYC ke Cloudinary. Secret layanan storage hanya boleh disimpan pada environment, bukan pada source code atau dokumentasi.

### 4.9 Audit dan keamanan

Modul audit tersedia di `src/actions/cms/audit.ts`, `src/lib/audit`, `src/server/audit`, serta halaman CMS audit dan platform KYC audit. Test keamanan juga tersedia di `tests/security/authorization.test.ts`.

### 4.10 Tema dan pengalaman pengguna

`ThemeProvider`, store tema (Zustand), global CSS, dan folder themes menyediakan dukungan tema terang/gelap. Komponen loading menampilkan indikator proses, sedangkan `ActionFeedback` menampilkan state loading, sukses, dan error setelah mutasi.

## 5. Cara Kerja Sistem

### 5.1 Membuka laman tenant

1. Pengguna membuka URL dengan slug tenant, misalnya `/{customSlug}` sesuai `customSlug` kelas yang digunakan aplikasi.
2. Next.js mencocokkan segmen route dinamis `[slug]` dan layout terkait.
3. Server memanggil resolver tenant untuk mendapatkan konteks tenant.
4. Bila tenant tidak ditemukan atau tidak memiliki akses, aplikasi menampilkan errorunauthorized sesuai route.
5. Bila valid, Server Component mengambil data menggunakan `tenantId` dan merender laman.

### 5.2 Membaca data

1. Page atau service menerima konteks sesi dan tenant.
2. Service meneruskan parameter terverifikasi ke Prismarepository.
3. Database mengembalikan data domain.
4. Server Component mengirim data yang diperlukan ke komponen presentasi.
5. Komponen client menangani interaksi tanpa memindahkan akses database ke browser.

### 5.3 Menyimpan atau menghapus data

1. Pengguna mengisi formulir pada CMS.
2. Formulir mengirim `FormData` ke Server Action atau endpoint API.
3. Validator memeriksa bentuk dan isi input.
4. Helper autentikasi memeriksa sesi, role, dan tenant.
5. Service menjalankan operasi database dengan filter tenant yang sesuai.
6. Audit dicatat bila operasi termasuk aktivitas yang diaudit.
7. UI menampilkan loading, sukses, atau error; setelah sukses data dapat di-refresh melalui `router.refresh()`.

### 5.4 Alur autentikasi dan pemulihan password

1. Pengguna mengirim kredensial melalui laman auth.
2. Server memvalidasi input dan memeriksa akun.
3. Jika berhasil, sesi dibuat dan route terlindungi dapat diakses.
4. Pada verifikasi email atau forgot password, token dikirim melalui konfigurasi email.
5. Token diverifikasi oleh endpoint terkait sebelum akun atau password diubah.

## 6. Cara Penggunaan Laman dan Fitur

### 6.1 Pengguna baru

1. Buka `signup` atau `member-signup` sesuai jenis akun.
2. Isi data yang diminta dan kirim formulir.
3. Buka tautan verifikasi email jika diminta.
4. Login melalui `login`.
5. Setelah sesi aktif, buka URL tenant yang diberikan administrator.

### 6.2 Pengguna yang lupa password

1. Buka `forgot-password`.
2. Masukkan email akun.
3. Ikuti tautan yang dikirim ke email.
4. Selesaikan verifikasi di `verify-forgot-password`.
5. Login kembali menggunakan password baru.

### 6.3 Mengakses dashboard, tasks, schedule, dan statistics

1. Pastikan sudah login.
2. Buka route tenant, kemudian pilih `home`, `dashboard`, `tasks`, `schedule`, `information`, atau `statistics` pada navbar.
3. `dashboard` menampilkan ringkasan keuangan kelas; `tasks` menampilkan task tracker & anggota yang belum mengumpulkan; `statistics` menampilkan progres pengerjaan per anggota; `schedule` menampilkan jadwal kelas.
4. Bila route menampilkan konteks tidak ditemukan, periksa kembali slug dan URL tenant.

### 6.4 Mengelola anggota dan role

1. Buka `{slug}/cms/people`.
2. Tinjau pendaftaran anggota baru dan setujui/tolak dengan memeriksa data serta dokumen (foto profil & KTM).
3. Ubah role/jabatan anggota melalui dropdown pada tabel.
4. Berikan akses minimum yang diperlukan melalui `{slug}/cms/access`.
5. Verifikasi bahwa anggota hanya dapat melihat tenant dan menu yang diizinkan.

### 6.5 Mengelola tugas

1. Buka `{slug}/cms/tasks`.
2. Isi nama tugas, kategori, satu pertemuan, start date time, deadline, deskripsi, dan URL (opsional).
3. Simpan tugas; sistem melakukan upsert berdasarkan judul & pertemuan yang sama.
4. Kelola submission per anggota pada daftar tugas.
5. Pantau tugas pada halaman `tasks` (Task Tracker) dan widget `Tugas Minggu Ini` di `home`.

### 6.6 Mengelola jadwal dan seminar

1. Buka `{slug}/cms/schedule` untuk jadwal atau `{slug}/cms/seminar` untuk seminar.
2. Isi data formulir yang diwajibkan (judul, tanggal, lokasi, dan lain-lain).
3. Kirim formulir dan tunggu feedback sukses.
4. Gunakan daftar data untuk memastikan hasil tersimpan.
5. Untuk seminar, kelola submission peserta dan gunakan tombol hapus hanya setelah memeriksa judul dan record yang dipilih.

### 6.7 Mengelola informasi kelas

1. Buka `{slug}/cms/information` untuk membuat/menghapus postingan informasi kelas.
2. Pilih tipe konten: teks, gambar, video, atau PDF.
3. Anggota dapat melihat feed pada `{slug}/information`, memberi reaksi, dan berkomentar.
4. Simpan perubahan; pantau jumlah pembaca (`readMarks`) pada CMS.
5. Kelola data portofolio melalui `{slug}/profil` dan lihat publik di `{slug}/portofolio/[username]`.

### 6.8 Mengelola transaksi keuangan

1. Buka `{slug}/cms/finance`.
2. Isi tipe (INCOME/EXPENSE), nominal, deskripsi, tanggal, dan bukti (opsional).
3. Simpan dan tunggu notifikasi hasil; hanya OWNER atau role CMS yang memiliki akses finance.
4. Periksa daftar transaksi, kategori, dan pengaturan uang kas.
5. Hapus transaksi hanya bila memiliki izin dan data yang benar.

### 6.9 Melihat audit

1. Buka `{slug}/cms/audit`.
2. Gunakan filter modul dan rentang tanggal, lalu ekspor laporan PDF bila diperlukan.
3. Saat menyelidiki perubahan data, cocokkan waktu, pengguna, tenant, dan jenis tindakan.

### 6.10 Menggunakan asisten AI

1. Buka laman yang menampilkan widget asisten.
2. Masukkan pertanyaan atau instruksi yang relevan dengan konteks aplikasi.
3. Jangan kirim password, token, data KYC, atau informasi rahasia.
4. Perlakukan jawaban AI sebagai bantuan dan verifikasi hasil sebelum mengambil keputusan.

### 6.11 Mengubah tema

Gunakan kontrol tema yang tersedia pada shell aplikasi. Tema dikelola oleh `ThemeProvider` dan store tema. Jika tema tidak berubah, pastikan provider terpasang pada layout yang menaungi laman tersebut.

## 7. Konfigurasi dan Menjalankan Aplikasi

### Prasyarat

- Node.js sesuai versi yang didukung dependency lockfile.
- Database yang sesuai dengan provider Prisma.
- Environment variable untuk database, authsession, email, storage, KYC, dan AI sesuai kebutuhan fitur.

### Instalasi

```bash
npm install
```

Salin `.env.example` menjadi `.env.local`, kemudian isi nilainya di mesin pengembangan. Jangan menyalin kredensial produksi ke repository.

### Database

Gunakan workflow Prisma yang disepakati tim, misalnya

```bash
npx prisma generate
npx prisma db push   # atau: npx prisma migrate dev
npx prisma db seed
```

Script seed didefinisikan di `package.json` (`prisma.seed`) dan mengisi akun platform (Super Admin KYC & Admin KYC) untuk development. Periksa `package.json` dan `prisma/schema.prisma` sebelum menjalankan migrasi pada database bersama.

### Pengembangan

```bash
npm run dev
```

Buka URL lokal yang ditampilkan Next.js. Untuk verifikasi branch, gunakan branch `development` sebelum menjalankan perubahan yang didokumentasikan di sini.

### Build dan pengujian

```bash
npm run build
npm run test:security
npm run test:ai
```

`test:security` menjalankan contract test authorization; `test:ai` memverifikasi knowledge base dan retrieval AI. Script agregat `test` belum didefinisikan; gunakan `npm run` untuk melihat daftar script yang tersedia pada checkout saat ini.

## 8. Kebijakan dan Privasi

### 8.1 Rujukan kebijakan aplikasi

Aplikasi menyediakan laman `privacy` dan `terms`. Kedua laman tersebut adalah sumber kebijakan yang ditampilkan kepada pengguna dan harus diperbarui bersama perubahan praktik data, provider, atau fitur.

Dokumen ini bukan pengganti kebijakan hukum aplikasi. Isi final harus ditinjau oleh pemilik produk dan penasihat hukum yang relevan.

### 8.2 Data yang berpotensi diproses

Bergantung pada fitur yang digunakan, aplikasi dapat memproses

- identitas akun dan data kontak;
- data organisasitenant dan keanggotaan;
- data profil dan asset upload;
- data autentikasi, verifikasi email, dan pemulihan akun;
- data KYC;
- data tugas, pertemuan, jadwal, seminar, informasi/feed, portfolio, dan transaksi;
- log audit;
- pertanyaan yang dikirim ke asisten AI.

### 8.3 Prinsip perlindungan

- Simpan secret pada environment variable atau secret manager.
- Batasi data berdasarkan sesi, role, dan `tenantId`.
- Validasi input server-side; validasi client-side tidak cukup sebagai kontrol keamanan.
- Jangan mencatat password, token, atau data KYC sensitif ke log.
- Batasi hak akses database dan provider eksternal.
- Tinjau retensi data, penghapusan akun, ekspor data, dan notifikasi insiden pada kebijakan resmi.
- Pastikan provider email, storage, KYC, dan AI mematuhi persyaratan pemrosesan data organisasi.

### 8.4 Tanggung jawab pengguna

Pengguna wajib menjaga kerahasiaan kredensial, memakai data yang memiliki dasar pemrosesan yang sah, dan tidak mengunggah informasi sensitif ke fitur yang tidak ditujukan untuk data tersebut. Konten AI harus ditinjau sebelum digunakan sebagai keputusan resmi.

## 9. Lisensi

Proprietary & Confidential
Hak Cipta © 2026 Kalivergo. 
Semua hak dilindungi undang-undang.

Kode sumber dan aplikasi ini bersifat rahasia dan merupakan hak milik. Dilarang keras untuk menyalin, mendistribusikan, memodifikasi, merekayasa balik (reverse engineering), atau menggunakan sebagian maupun seluruh kode ini tanpa izin tertulis yang sah dari pemilik hak cipta.
