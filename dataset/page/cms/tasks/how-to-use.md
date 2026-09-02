# How to Use - CMS Tasks (Kelola Tugas)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu CMS Tasks

`/{slug}/cms/tasks` adalah halaman untuk pengurus kelas membuat dan mengelola tugas, termasuk submission anggota.

## 2. Fitur Utama

### 2.1 Buat Tugas Baru

- **Nama Tugas**: judul tugas, misal "Algoritma Pemrograman II".
- **Kategori**: pilih `E_LEARNING` atau `TATAP_MUKA`.
- **Pertemuan**: satu pertemuan untuk tugas ini (misal "Pertemuan 1").
- **Start Date Time**: tanggal dan waktu mulai tugas.
- **Deadline**: tanggal dan waktu batas pengumpulan.
- **Deskripsi**: penjelasan tugas.
- **URL**: tautan eksternal tugas (opsional).

### 2.2 Daftar Tugas (TaskListWithSearch)

- Menampilkan semua tugas yang sudah dibuat.
- Fitur pencarian untuk menemukan tugas dengan cepat.
- Setiap tugas menampilkan: judul, kategori, pertemuan, start date, deadline, dan deskripsi.
- Aksi yang tersedia:
  - **Edit**: ubah data tugas.
  - **Hapus**: hapus tugas dari daftar.

### 2.3 Kelola Submission

- Untuk setiap tugas, lihat daftar anggota yang sudah/belum mengumpulkan.
- Update status submission anggota.
- Pantau siapa yang belum mengumpulkan untuk follow-up.

## 3. Hak Akses

- OWNER memiliki akses penuh.
- Role CMS lain memerlukan permission module **tasks** untuk mengakses halaman ini.

## 4. Cara Menggunakan

1. Login sebagai pengurus/owner dengan akses tasks.
2. Buka `/{slug}/cms/tasks`.
3. Isi formulir buat tugas dengan lengkap.
4. Klik **Simpan Tugas**.
5. Gunakan fitur pencarian untuk menemukan tugas.
6. Kelola submission anggota untuk setiap tugas.

## 5. Tips

- Isi pertemuan dengan benar agar submission terlacak per pertemuan.
- Gunakan URL jika tugas terkait dengan platform eksternal (misal e-learning).
- Pantau daftar belum mengumpulkan di halaman `/{slug}/tasks` (Task Tracker).

---

**Last Updated:** September 2026
