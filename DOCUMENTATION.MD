# Dokumentasi Kalivergo

Branch acuan `development`  
Jenis aplikasi aplikasi web multi-tenant berbasis Next.js App Router  
Bahasa dokumentasi Bahasa Indonesia  

Dokumen ini menjelaskan struktur teknis, fitur, alur kerja, dan cara penggunaan Kalivergo berdasarkan source code pada branch `development`. Detail dapat berubah ketika branch mengalami pengembangan lebih lanjut.

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

Kalivergo dirancang sebagai platform pengelolaan aktivitas organisasi atau kelas yang membutuhkan pemisahan data berdasarkan tenantkonteks organisasi. Aplikasi menggabungkan laman publik, autentikasi anggota, dashboard operasional, CMS, manajemen keuangan, portfolio, proyek, seminar, tugas, jadwal, serta bantuan AI.

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
Next.js App Router (srcapp)
  -- Server Components membaca data dan merender laman
  -- Client Components formulir, widget, modal, state interaktif
  -- Route Handlers endpoint HTTP di srcappapi
  -- Server Actions mutasi dari srcactions
  
  v
DomainFeature Layer (srcfeatures, srcservices, srcserver)
  -- validasi schema
  -- service dan akses data
  -- autentikasi, tenant, KYC, email, storage, audit
  
  v
Prisma ORM (prismaschema.prisma)
  
  v
Database dan layanan eksternal
  -- email
  -- Cloudinarystorage
  -- penyedia AI
```

### 2.2 Prinsip arsitektur

1. App Router sebagai entry point. File `page.tsx`, `layout.tsx`, dan route handler menentukan laman serta endpoint.
2. Server-first. Laman yang membaca database umumnya berupa Server Component. Komponen diberi directive `use client` hanya ketika memerlukan state, event browser, modal, atau interaksi langsung.
3. Multi-tenancy berbasis route. Segmen dinamis `[slug]` membawa konteks tenant. Resolver tenant menerjemahkan parameter route menjadi `tenantId`, lalu service mengambil data menggunakan tenant tersebut.
4. Mutasi terkontrol. Operasi createupdatedelete diletakkan pada Server Actions atau route handler, bukan langsung dari komponen presentasi.
5. Pemisahan domain. Fitur seperti auth, finance, KYC, portfolio, project, seminar, task, dan tenant memiliki validator, service, action, atau komponen masing-masing.
6. ORM terpusat. Prisma digunakan sebagai batas akses database. `srclibprisma.ts` dan `srcserverdbprisma.ts` menyediakan client atau helper database.
7. Authorization berlapis. Middleware, helper autentikasi, pemeriksaan role, dan pembatasan tenant digunakan untuk mencegah akses tanpa sesi atau lintas tenant.

## 3. Struktur Folder

### 3.1 Root dan konfigurasi

 Folderfile  Fungsi 
------
 `package.json`  Dependensi, script pengembangan, build, lint, dan pengujian. 
 `next.config.js`  Konfigurasi framework Next.js. 
 `tsconfig.json`  Konfigurasi TypeScript dan alias import. 
 `tailwind.config.ts`  Token dan konfigurasi Tailwind CSS. 
 `postcss.config.js`  Pipeline PostCSS. 
 `next-env.d.ts`  Deklarasi tipe otomatis Next.js. 
 `.env.example`  Daftar contoh variabel lingkungan; salin dan isi secara lokal tanpa memasukkan secret ke git. 
 `prisma`  Skema database dan seed. 
 `public`  Asset statis yang disajikan langsung oleh Next.js. 
 `tests`  Setup test, contract test, security test, dan unit test. 

### 3.2 `srcapp` route dan komposisi laman

`srcapp` adalah routing utama App Router. `layout.tsx` menyediakan shell global, metadata, provider, dan style. `page.tsx` merender route. Folder dalam tanda kurung seperti `(protected)` adalah route group dan tidak menjadi bagian URL.

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
 `platformlogin`  Login administrator platform. 
 `platformregister`  Registrasi platformowner. 
 `platform(protected)`  Area platform yang dilindungi sesi dan otorisasi. 

#### Route tenant

Route tenant menggunakan pola `[slug]`, sehingga URL aktual bergantung pada slug tenant. Laman yang tersedia meliputi

 Route relatif  Kegunaan 
------
 `[slug]`  Layout dan konteks tenant. 
 `[slug]home`  Beranda tenant atau kelas. 
 `[slug]dashboard`  Ringkasan operasional dan metrik. 
 `[slug]profil`  Profil anggota atau tenant. 
 `[slug]portofolio`  Portfolio dan karya. 
 `[slug]project`  Daftardetail proyek. 
 `[slug]seminar`  Informasi seminar atau kegiatan. 
 `[slug]cms`  Area administrasi konten tenant. 
 `[slug]cmsaudit`  Riwayat audit aktivitas. 
 `[slug]cmscategories`  Pengelolaan kategori. 
 `[slug]cmsfinance`  Pengelolaan transaksi atau keuangan. 
 `[slug]cmspeople`  Pengelolaan anggota dan akses. 
 `[slug]cmsrole-model`  Pengelolaan model peran. 
 `[slug]cmsschedule`  Pengelolaan jadwal. 
 `[slug]cmsseminar`  Menambah, melihat, dan menghapus seminar. 

 Route yang benar membutuhkan konteks tenant yang valid. Contoh implementasi halaman CMS seminar memanggil resolver tenant, mengambil `tenantId`, lalu mengembalikan pesan kesalahan jika konteks tidak ditemukan.

#### Route API

`srcappapi` berisi Route Handler HTTP untuk kebutuhan yang tidak dilayani langsung oleh Server Action, antara lain

- `access` pemeriksaan akses;
- `ai-assistant` komunikasi dengan fitur asisten AI;
- `auth` endpoint autentikasi;
- `finance` endpoint keuangan;
- `member` operasi anggota;
- `portofolio` operasi portfolio;
- `seminar` operasi seminar;
- `tasks` operasi tugas;
- `upload-profile` upload fotoprofile;
- `verify-email` verifikasi email;
- `verify-forgot-password` verifikasi pemulihan password.

### 3.3 `srcactions` Server Actions

Berisi fungsi mutasi yang dipanggil dari formulir atau komponen serverclient. Area yang terlihat pada struktur proyek mencakup

- `cms.ts` aksi CMS seperti tugas, jadwal, seminar, anggota, kategori, dan transaksi;
- `registration.ts` proses pendaftaran;
- `owner-registration.ts` pendaftaran ownerplatform;
- `platform-auth.ts` autentikasi platform;
- `universal-auth.ts` helper autentikasi lintas area;
- `platform-kyc.ts` proses KYC platform;
- `cms` aksi CMS yang lebih khusus untuk audit, authorization helper, kategori, finance, people, role model, dan schedule.

Komponen `ActionFeedback` memetakan aksi seperti `task`, `schedule`, `seminar`, `people`, `finance`, `transaction`, `profile`, `portfolio`, dan `category` ke Server Action yang sesuai. Komponen ini juga mengelola loading, pesan suksesgagal, reset formulir, dan refresh data.

### 3.4 `srcfeatures` modul berdasarkan domain

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
- `project` proyek;
- `seminar` validator, service, action, dan komponen seminar;
- `task` tugas;
- `tenant` konteks dan domain tenant.

Pola yang digunakan pada feature dapat mencakup `actions`, `components`, `services`, `validators`, dan `repositories`. Tidak semua feature wajib memiliki seluruh subfolder tersebut.

### 3.5 `srcserver`, `srcservices`, dan `srclib`

- `srcserver` implementasi sisi server untuk AI, audit, auth, database, email, KYC, storage, dan tenant.
- `srcservices` service aplikasi lintas domain, termasuk `owner-application.service.ts`.
- `srclib` utilitas inti seperti session, Prisma, tenant context, auth, email, Cloudinary, audit, KYC, dan helper umum.
- `srclibtenant-context.ts` serta `srcservertenant` bagian penting untuk menjaga konteks tenant.

### 3.6 `srccomponents`, `srcshared`, `srcstores`, `srcstyles`, dan `srctypes`

- `srccomponents` komponen UI dan komposisi layar; dikelompokkan menjadi `landing`, `home`, `dashboard`, `cms`, `platform`, `layout`, `security`, `unauthorized`, dan `ui`.
- `srccomponentsui` komponen dasar reusable seperti card, button, modal, badge, background, dan elemen presentasi.
- `srcshared` komponenutilitas bersama untuk auth dan domain umum.
- `srcstorestheme.ts` state tema.
- `srcstylesglobal.css` dan `srcstylesthemes` style global dan tema.
- `srctypes` tipe bersama, termasuk tenant, index umum, dan deklarasi SDK.

### 3.7 `prisma` dan database

- `prismaschema.prisma` sumber kebenaran model dan relasi database.
- `prismaseed.ts` data awal untuk lingkungan pengembangan atau pengujian.
- `srclibprisma.ts` dan `srcserverdbprisma.ts` akses Prisma dari kode aplikasi.

Model yang perlu diperhatikan saat mengubah skema meliputi identitas pengguna, tenant, roleaccess, KYC, portfolio, project, seminar, task, schedule, transaksifinance, dan audit. Nama field serta relasi harus selalu dirujuk langsung dari `schema.prisma` sebelum membuat migrasi atau fitur baru.

## 4. Fitur

### 4.1 Identitas dan akses

- Login, signup, member signup, serta login platform.
- Verifikasi email dan reset password.
- Pengelolaan sesi pengguna.
- Pembatasan akses berdasarkan role dan tenant.
- Laman `unauthorized` untuk akses yang ditolak.
- Pendaftaran owner dan KYC platform.

### 4.2 Pengelolaan tenant

Tenant direpresentasikan oleh slug pada URL. Resolver tenant mencari konteks yang cocok, dan operasi pembacaanmutasi menggunakan `tenantId`. Pendekatan ini membuat satu instalasi dapat melayani beberapa organisasi, universitas, program studi, atau kelas dengan data yang terisolasi.

### 4.3 CMS dan aktivitas akademikorganisasi

CMS mendukung pengelolaan anggota, role model, kategori, tugas, jadwal, seminar, dan data terkait kelas. Contoh halaman CMS seminar menyediakan formulir judul, tanggal, lokasi, dan deskripsi; daftar seminar menampilkan data yang ada serta tombol penghapusan.

### 4.4 Dashboard dan beranda

Beranda menampilkan ringkasan aktivitas. Komponen `WeeklyTasks` mengurutkan tugas berdasarkan deadline dan memberi penanda status waktu terlambat, mendekati deadline, atau masih memiliki waktu.

### 4.5 Portfolio dan proyek

Modul portfolio dan project menyediakan area untuk menyimpan serta menampilkan karya atau proyek tenantanggota. Operasi detail bergantung pada implementasi feature dan schema yang aktif di branch.

### 4.6 Keuangan

Area finance menyediakan pengelolaan transaksi. Pada komponen feedback CMS, operasi pembuatan transaksi menggunakan action finance dan penghapusan transaksi menggunakan action transaction.

### 4.7 AI assistant

`srcfeaturesai-assistant` dan `apiai-assistant` menyediakan widget serta jalur komunikasi asisten AI. Konfigurasi URLclient AI mengikuti environment variable yang tersedia pada konfigurasi aplikasi.

### 4.8 Upload profile dan storage

Endpoint `upload-profile`, `srclibcloudinary.ts`, serta `srcserverstorage` menangani upload dan penyimpanan asset profil. Secret layanan storage hanya boleh disimpan pada environment, bukan pada source code atau dokumentasi.

### 4.9 Audit dan keamanan

Modul audit tersedia di `srcactionscmsaudit.ts`, `srclibaudit`, `srcserveraudit`, serta halaman CMS audit. Test keamanan juga tersedia di `testssecurityauthorization.test.ts`.

### 4.10 Tema dan pengalaman pengguna

`ThemeProvider`, store tema, global CSS, dan folder themes menyediakan dukungan tema. Komponen loading menampilkan indikator proses, sedangkan `ActionFeedback` menampilkan state loading, sukses, dan error setelah mutasi.

## 5. Cara Kerja Sistem

### 5.1 Membuka laman tenant

1. Pengguna membuka URL dengan slug tenant, misalnya `universitasprodikelas` sesuai struktur route yang digunakan aplikasi.
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

### 6.3 Mengakses dashboard tenant

1. Pastikan sudah login.
2. Buka route tenant, kemudian pilih `dashboard` atau `home`.
3. Gunakan ringkasan tugas, jadwal, seminar, portfolio, dan proyek sesuai hak akses.
4. Bila route menampilkan konteks tidak ditemukan, periksa kembali slug dan URL tenant.

### 6.4 Mengelola anggota dan role

1. Buka `slugcmspeople`.
2. Tambahkan atau perbarui anggota sesuai formulir yang tersedia.
3. Buka `slugcmsrole-model` untuk meninjau model peran.
4. Berikan akses minimum yang diperlukan.
5. Verifikasi bahwa anggota hanya dapat melihat tenant dan menu yang diizinkan.

### 6.5 Mengelola tugas

1. Buka menu CMS tugas atau dashboard yang menyediakan input tugas.
2. Pilih tambah tugas.
3. Isi judul, deskripsi, dan deadline.
4. Pilih Publish.
5. Pantau tugas pada widget `Tugas Minggu Ini`; status deadline ditampilkan berdasarkan sisa waktu.

### 6.6 Mengelola jadwal dan seminar

1. Buka `slugcmsschedule` untuk jadwal atau `slugcmsseminar` untuk seminar.
2. Isi data formulir yang diwajibkan.
3. Kirim formulir dan tunggu feedback sukses.
4. Gunakan daftar data untuk memastikan hasil tersimpan.
5. Untuk seminar, gunakan tombol hapus hanya setelah memeriksa judul dan record yang dipilih.

### 6.7 Mengelola kategori, portfolio, dan proyek

1. Buka menu CMS kategori untuk menyiapkan klasifikasi.
2. Buka laman portfolio atau project tenant.
3. Isi informasi karyaproyek dan kategori bila tersedia.
4. Simpan perubahan.
5. Periksa tampilan publik pada route portfolio atau project.

### 6.8 Mengelola transaksi keuangan

1. Buka `slugcmsfinance`.
2. Isi data transaksi.
3. Simpan dan tunggu notifikasi hasil.
4. Periksa daftar transaksi.
5. Hapus transaksi hanya bila memiliki izin dan data yang benar.

### 6.9 Melihat audit

1. Buka `slugcmsaudit`.
2. Gunakan halaman tersebut untuk meninjau aktivitas yang tercatat.
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
npx prisma migrate dev
npx prisma db seed
```

Periksa `package.json` dan `prismaschema.prisma` sebelum menjalankan migrasi pada database bersama.

### Pengembangan

```bash
npm run dev
```

Buka URL lokal yang ditampilkan Next.js. Untuk verifikasi branch, gunakan branch `development` sebelum menjalankan perubahan yang didokumentasikan di sini.

### Build dan pengujian

```bash
npm run build
npm test
```

Nama script dapat berubah; gunakan `npm run` untuk melihat daftar script yang tersedia pada checkout saat ini.

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
- data tugas, jadwal, seminar, proyek, portfolio, dan transaksi;
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
