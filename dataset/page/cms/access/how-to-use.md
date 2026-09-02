# How to Use - CMS Access (Kelola Hak Akses)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu CMS Access

`/{slug}/cms/access` adalah halaman khusus untuk OWNER kelas mengelola hak akses modul CMS untuk setiap role CMS.

## 2. Fitur Utama

### 2.1 Role CMS yang Dapat Diberi Akses

- President (Ketua Kelas)
- Vice President (Wakil Ketua)
- Treasurer (Bendahara)
- Vice Treasurer (Wakil Bendahara)
- Secretary (Sekretaris)
- Member (Anggota)

### 2.2 Modul CMS yang Dapat Diatur

- Tasks
- Finance
- Schedule
- Seminar
- Information
- People Management
- Access Control (hanya untuk OWNER)

### 2.3 Cara Kerja Permission

- OWNER memiliki akses penuh ke semua modul.
- Role CMS lain hanya dapat mengakses modul yang diizinkan oleh OWNER.
- Jika seorang anggota diberi role CMS tanpa permission apapun, mereka tidak dapat mengakses CMS kecuali diizinkan.

## 3. Hak Akses

- Hanya **OWNER** yang dapat mengakses dan mengubah halaman ini.
- Pengurus dengan role CMS lain tidak dapat mengakses halaman Access.

## 4. Cara Menggunakan

1. Login sebagai OWNER kelas.
2. Buka `/{slug}/cms/access`.
3. Pilih role CMS yang ingin diatur.
4. Aktifkan/nonaktifkan permission untuk setiap modul.
5. Simpan perubahan.

## 5. Tips

- Berikan hak akses minimum yang diperlukan untuk setiap role.
- Periksa permission secara berkala, terutama setelah ada perubahan organisasi.
- Kombinasikan dengan CMS People untuk menyinkronkan role dan akses anggota.

---

**Last Updated:** September 2026
