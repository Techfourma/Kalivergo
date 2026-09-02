# How to Use - CMS Schedule (Kelola Jadwal)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu CMS Schedule

`/{slug}/cms/schedule` adalah halaman untuk mengelola jadwal kegiatan kelas. Pengurus dapat menambah dan menghapus jadwal.

## 2. Fitur Utama

### 2.1 Tambah Jadwal

- **Judul Kegiatan**: nama kegiatan, misal "Rapat Koordinasi".
- **Waktu Kegiatan (WIB)**: tanggal dan waktu dalam format datetime-local.
- **Tipe**: pilih tipe kegiatan:
  - Perkuliahan (`LECTURE`)
  - Rapat (`MEETING`)
  - Kegiatan (`EVENT`)
  - Lainnya (`OTHER`)
- **Lokasi**: tempat pelaksanaan kegiatan.

### 2.2 Daftar Jadwal

- Menampilkan semua jadwal yang sudah dibuat, diurutkan berdasarkan tanggal.
- Setiap jadwal menampilkan: judul, tipe, tanggal, waktu (WIB), dan lokasi.
- Jadwal dapat dihapus melalui tombol delete.

## 3. Hak Akses

- OWNER memiliki akses penuh.
- Role CMS lain memerlukan permission module **schedule** untuk mengakses halaman ini.

## 4. Cara Menggunakan

1. Login sebagai pengurus/owner dengan akses schedule.
2. Buka `/{slug}/cms/schedule`.
3. Isi formulir tambah jadwal dengan lengkap.
4. Klik **+ Tambah Jadwal**.
5. Lihat daftar jadwal untuk memastikan tersimpan.
6. Hapus jadwal jika diperlukan.

## 5. Tips

- Gunakan tipe yang sesuai agar jadwal mudah dikategorikan.
- Periksa waktu (WIB) dan lokasi dengan benar sebelum menyimpan.
- Konfirmasi jadwal kepada anggota jika ada perubahan.

---

**Last Updated:** September 2026
