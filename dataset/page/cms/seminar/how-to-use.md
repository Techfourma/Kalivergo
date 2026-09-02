# How to Use - CMS Seminar (Kelola Seminar)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu CMS Seminar

`/{slug}/cms/seminar` adalah halaman untuk mengelola seminar kelas, termasuk mengelola submission peserta.

## 2. Fitur Utama

### 2.1 Tambah Seminar

- **Judul Seminar**: nama seminar, misal "Seminar AI & Machine Learning".
- **Tanggal**: tanggal pelaksanaan seminar.
- **Lokasi**: tempat pelaksanaan.
- **Deskripsi**: penjelasan singkat tentang seminar.
- **URL**: tautan eksternal seminar (opsional).

### 2.2 Daftar Seminar

- Menampilkan semua seminar yang sudah dibuat.
- Setiap seminar menampilkan: judul, deskripsi, tanggal, lokasi, dan URL.
- Aksi yang tersedia:
  - **Kelola Submission**: lihat dan kelola daftar peserta yang sudah/belum mendaftar.
  - **Hapus Seminar**: hapus seminar dari daftar.

### 2.3 Submission Manager

- Menampilkan daftar semua anggota kelas.
- Tandai anggota yang sudah/belum melakukan submission/pendaftaranseminar.
- Berguna untuk follow-up kehadiran.

## 3. Hak Akses

- OWNER memiliki akses penuh.
- Role CMS lain memerlukan permission module **seminar** untuk mengakses halaman ini.

## 4. Cara Menggunakan

1. Login sebagai pengurus/owner dengan akses seminar.
2. Buka `/{slug}/cms/seminar`.
3. Isi formulir tambah seminar dengan lengkap.
4. Klik **+ Tambah Seminar**.
5. Kelola submission peserta untuk setiap seminar.
6. Hapus seminar jika dibatalkan.

## 5. Tips

- Isi URL seminar jika ada tautan pendaftaran eksternal.
- Pantau daftar belum mendaftar untuk melakukan follow-up.
- Gunakan CMS Seminar untuk sync dengan halaman `/{slug}/seminar` yang dilihat anggota.

---

**Last Updated:** September 2026
