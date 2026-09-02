# How to Use - Home (Beranda Kelas)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu Halaman Home

`/{slug}/home` adalah beranda kelas yang menampilkan ringkasan aktivitas kelas untuk anggota yang sudah login. Halaman ini dibangun dari data server dan menampilkan empat kartu utama.

## 2. Komponen Utama

### 2.1 Header dan Navbar

- Menampilkan nama anggota yang login dan role-nya (Owner/Member/jabatan CMS).
- Navbar berisi menu: Home, Tasks, Schedule, Information, Dashboard, Statistics, Seminar, Profil, dan CMS (jika memiliki akses).

### 2.2 HomeFinanceCard (Ringkasan Keuangan)

- Menampilkan ringkasan saldo keuangan kelas dari seluruh transaksi.
- Sumber data: transaksi kelas (`Transaction`).

### 2.3 HomeInfoCard (Informasi Terbaru)

- Menampilkan postingan informasi/pengumuman terbaru dari kelas.
- Klik untuk membuka halaman `/{slug}/information`.

### 2.4 WeeklyTasks (Tugas Minggu Ini)

- Menampilkan tugas yang aktif pada minggu berjalan.
- Tugas ditentukan oleh rentang `startDate` sampai `deadline`.
- Widget memberikan indikasi waktu: masih ada waktu, mendekati deadline, atau sudah terlambat.

### 2.5 HomeUpcomingSeminars (Seminar Mendatang)

- Menampilkan seminar yang dijadwalkan dalam 7 hari ke depan.

## 3. Cara Menggunakan

1. Login ke kelas.
2. Buka `/{slug}/home`.
3. Lihat ringkasan keuangan, informasi terbaru, tugas minggu ini, dan seminar yang akan datang.
4. Gunakan menu navbar untuk membuka halaman detail masing-masing fitur.

## 4. Tips

- Pantau `WeeklyTasks` agar tidak melewatkan tugas yang mendekati deadline.
- Buka `Information` untuk membaca pengumuman lengkap dan memberi reaksi.

---

**Last Updated:** September 2026
