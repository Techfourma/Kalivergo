# FAQ Kalivergo (Knowledge Base)

Berikut pertanyaan umum beserta jawaban singkat. Asisten AI dapat merujuk bagian ini untuk menjawab pertanyaan pengguna.

## Akun dan Login

**Bagaimana cara login ke Kalivergo?**
Buka halaman `/login` (atau `/auth/login`), masukkan email/NIM dan password. Setelah login, Anda diarahkan ke kelas yang dapat diakses.

**Kenapa saya tidak bisa login?**
Penyebab umum:
- **Password salah**: pastikan NIM/email dan password benar dan sesuai data pendaftaran.
- **Email belum diverifikasi**: cek inbox email dan ikuti tautan verifikasi.
- **Akun belum disetujui**: untuk admin platform, tunggu verifikasi SUPER_ADMIN_KYC. Untuk member, tunggu persetujuan admin/owner kelas.
- **Pendaftaran ditolak**: pastikan data pendaftaran sesuai dan disetujui.
- **Tenant belum valid**: kelas belum memiliki nama website (slug) yang valid.

**Lupa password?**
Buka `/forgot-password`, masukkan email, lalu ikuti tautan di email ke `/verify-forgot-password` untuk mengatur password baru.

**Bagaimana cara mendaftar?**
Gunakan `/signup` untuk mendaftar sebagai pengguna umum/owner, atau `/member-signup` untuk mendaftar sebagai anggota kelas tertentu (perlu persetujuan pengurus).

## Kelas (Tenant)

**Apa itu kelas/tenant?**
Kelas (tenant) adalah ruang kerja terpisah untuk satu organisasi/kelas. Setiap kelas memiliki slug unik (`/{slug}`) dan data yang terisolasi antar kelas.

**Bagaimana pemilik membuat kelas?**
Owner mendaftar melalui `/signup`, melengkapi data kelas (universitas, program studi, nama kelas, slug), mengunggah selfie dan dokumen, lalu menunggu verifikasi KYC oleh admin platform.

**Bagaimana anggota bergabung ke kelas?**
Anggota mendaftar melalui `/member-signup` dengan foto profil dan KTM, lalu menunggu persetujuan pengurus di CMS People.

## Fitur Utama

**Apa yang bisa dilakukan di Home?**
`/{slug}/home` adalah beranda kelas yang menampilkan ringkasan: keuangan (HomeFinanceCard), informasi terbaru (HomeInfoCard), tugas minggu ini (WeeklyTasks), dan seminar 7 hari ke depan (HomeUpcomingSeminars).

**Apa yang bisa dilakukan di Dashboard?**
`/{slug}/dashboard` menampilkan monitoring uang kas: grafik arus kas (Cash Flow Chart) dan daftar tunggakan per anggota (Arrears List).

**Bagaimana cara melihat/mengerjakan tugas?**
Buka `/{slug}/tasks` untuk melihat Task Tracker (tugas yang belum dikerjakan) dan siapa yang belum mengumpulkan. Pengurus membuat tugas di `/{slug}/cms/tasks`.

**Bagaimana cara melihat jadwal kelas?**
Buka `/{slug}/schedule`. Pengurus mengelola jadwal di `/{slug}/cms/schedule`.

**Apa itu Information feed?**
`/{slug}/information` adalah feed pengumuman kelas. Anggota dapat membuat postingan (teks/gambar/video/PDF), memberi reaksi, dan berkomentar.

**Apa itu Statistics?**
`/{slug}/statistics` menampilkan statistik progres pengerjaan tugas per anggota. Ada filter anggota dan rentang tanggal.

**Apa itu modul Seminar?**
`/{slug}/seminar` menampilkan seminar kelas dan siapa yang belum mendaftar. Pengurus mengelolanya di `/{slug}/cms/seminar`.

## CMS (Content Management System)

**Apa itu CMS?**
CMS adalah area pengelolaan kelas untuk pengurus/owner. Diakses via `/{slug}/cms`.

**Modul apa saja yang ada di CMS?**
- Tasks: kelola tugas dan submission.
- Finance: input transaksi, kelola kategori, atur uang kas.
- Schedule: kelola jadwal kegiatan.
- Seminar: kelola seminar dan submission peserta.
- Information: buat/hapus postingan informasi kelas.
- People: approve/reject pendaftaran anggota dan ubah jabatan.
- Access: kelola hak akses modul CMS per role (hanya OWNER).
- Audit: lihat dan ekspor log aktivitas kelas.

**Bagaimana cara mengelola hak akses CMS?**
OWNER dapat mengatur permission modul CMS per role di `/{slug}/cms/access`. Berikan hak akses minimum yang diperlukan.

**Bagaimana cara melihat audit log?**
Buka `/{slug}/cms/audit`, pilih module dan rentang tanggal, lalu ekspor PDF jika diperlukan.

## Keuangan

**Bagaimana cara mencatat transaksi?**
Pengurus dengan akses finance membuka `/{slug}/cms/finance` untuk mencatat pemasukan/pengeluaran, kategori, dan bukti.

**Bagaimana uang kas dihitung?**
Uang kas dihitung dari jadwal `UangKasSchedule` dibanding pembayaran yang tercatat. Dashboard menampilkan tunggakan per anggota.

**Bagaimana cara mengatur jadwal uang kas?**
Pengaturan jadwal uang kas (tanggal dan nominal) dilakukan melalui `/{slug}/cms/finance` oleh pengurus yang memiliki akses finance.

## Portofolio

**Apa itu portofolio?**
Portofolio adalah profil publik anggota yang menampilkan bio, pengalaman kerja, keahlian, dan tautan sosial. Diakses via `/{slug}/portofolio/[username]`.

**Bagaimana cara mengelola portofolio?**
Isi data di `/{slug}/profil` (bio, pengalaman, keahlian, tautan sosial). Perubahan akan langsung terlihat di portofolio publik.

## Platform (Admin)

**Apa peran platform?**
Ada `SUPER_ADMIN_KYC` dan `ADMIN_KYC`. Mereka meninjau aplikasi owner (KYC) melalui `/platform/kyc` dan melihat audit KYC di `/platform/kyc-audit`.

**Di mana melihat daftar owner?**
Di `/platform/user` (Data Owner Kelas).

## Kalivergo

**Apa itu Kalivergo?**
Kalivergo adalah platform manajemen kelas berbasis web untuk mengelola anggota, tugas, keuangan kelas, jadwal, seminar, dan portofolio anggota dalam konteks tenant kelas. Platform ini berbasis arsitektur multi-tenant dan menyediakan panel platform untuk verifikasi KYC serta pengelolaan aplikasi pembuatan kelas.

**Siapa yang membuat Kalivergo?**
Kalivergo dikembangkan oleh tim mahasiswa Universitas Pamulang, Prodi Teknik Informatika, semester 3, kelas 03TPLE004. Tim pengembang:
- Jundulloh Rizki Ananda (Jundi) — Lead Developer & Fullstack
- Alif Mas Sastro Nugroho (Alif) — Frontend Developer
- MUHAMAD IKHSAN (Ikhsan) — UI/UX & Frontend Developer
- Teuku Rendi Fahri Febrian Nanda (Rendi) — QA Engineer

## Registrasi

**Bagaimana cara registrasi member?**
Buka `/member-signup`. Isi nama lengkap, NIM, email, password, pilih universitas/program/kelas, lalu unggah foto profil dan KTM. Pendaftaran menunggu persetujuan admin/owner kelas. Setelah disetujui, akun langsung aktif dan bisa login.

**Bagaimana cara registrasi kelas?**
Buka `/signup`. Isi nama lengkap, NIM, email, nomor telepon, password, nama website kelas (slug), universitas, program studi, dan nama kelas. Unggah selfie dan KTM. Pengajuan diverifikasi platform dalam 1x24 jam. Setelah disetujui, email verifikasi dikirim ke Gmail Anda.

**Apa bedanya registrasi member dan registrasi kelas?**
Registrasi member (`/member-signup`) untuk bergabung ke kelas yang sudah ada dan memerlukan persetujuan admin/owner kelas. Registrasi kelas (`/signup`) untuk membuat kelas baru sebagai owner dan memerlukan verifikasi KYC oleh platform.

## AI Assistant

**Bagaimana cara menggunakan AI Assistant?**
Gunakan widget asisten di laman yang tersedia. Asisten menjawab berdasarkan knowledge base internal (`dataset/`) dan dapat membantu menjelaskan fitur Kalivergo.

**Apakah jawaban AI selalu akurat?**
Jawaban AI adalah bantuan; verifikasi informasi penting sebelum mengambil keputusan.

---

**Last Updated:** September 2026
