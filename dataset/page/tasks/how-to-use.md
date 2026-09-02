# How to Use - Tasks (Daftar Tugas)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu Halaman Tasks

`/{slug}/tasks` menampilkan tugas kelas untuk anggota yang login. Halaman ini membantu memantau tugas yang belum dikerjakan dan siapa saja yang belum mengumpulkan.

## 2. Komponen Utama

### 2.1 Task Tracker

- Menampilkan tugas yang belum dikerjakan oleh pengguna (belum ada submission berstatus `SUBMITTED`).
- Menampilkan tugas yang sudah **terlambat** (deadline lewat) atau akan jatuh tempo dalam **7 hari ke depan**.
- Tugas yang sudah dikerjakan tidak ditampilkan di tracker.

### 2.2 UnsubmittedList (Belum Mengumpulkan)

- Untuk setiap tugas, menampilkan daftar anggota yang belum mengumpulkan (status `PENDING`).
- Data submission dihitung per pertemuan tugas.

## 3. Cara Menggunakan

1. Login ke kelas, buka `/{slug}/tasks`.
2. Periksa Task Tracker untuk tugas yang perlu dikerjakan.
3. Kumpulkan tugas sesuai instruksi pengurus (submission diatur oleh pengurus CMS).
4. Pengurus dapat membuat/mengelola tugas dan submission di `/{slug}/cms/tasks`.

## 4. Detail Tugas di CMS

- Setiap tugas memiliki: judul, kategori, satu **pertemuan**, `startDate`, `deadline`, deskripsi, dan URL opsional.
- Submission dilacak per pertemuan (`Pertemuan`).

---

**Last Updated:** September 2026
