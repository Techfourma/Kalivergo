# How to Use - CMS (Content Management System)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu CMS

CMS (Content Management System) adalah area pengelolaan kelas yang hanya bisa diakses oleh pengurus/owner kelas. Di sini, pengurus dapat mengatur tugas, keuangan, jadwal, seminar, informasi, anggota, dan hak akses.

## 2. Membuka CMS

1. Login ke akun yang memiliki role CMS atau OWNER.
2. Buka `/{slug}/cms` untuk melihat ringkasan CMS Dashboard.
3. Dari CMS Dashboard, pilih modul yang ingin dikelola.

## 3. Modul CMS yang Tersedia

| Modul | Rute | Fungsi Utama |
|-------|------|--------------|
| Tasks | `/{slug}/cms/tasks` | Buat, edit, dan kelola tugas kelas termasuk submission anggota. |
| Finance | `/{slug}/cms/finance` | Input transaksi pemasukan/pengeluaran, kelola kategori, dan atur jadwal uang kas. |
| Schedule | `/{slug}/cms/schedule` | Tambah dan hapus jadwal kegiatan kelas. |
| Seminar | `/{slug}/cms/seminar` | Kelola seminar dan submission peserta. |
| Information | `/{slug}/cms/information` | Buat dan hapus postingan informasi kelas (teks/gambar/video/PDF). |
| People | `/{slug}/cms/people` | Approve/reject pendaftaran anggota dan ubah jabatan. |
| Access | `/{slug}/cms/access` | Kelola hak akses modul CMS per role (hanya untuk OWNER). |
| Audit | `/{slug}/cms/audit` | Lihat dan ekspor log aktivitas/audit kelas. |

## 4. Hak Akses

- OWNER memiliki akses penuh ke semua modul CMS.
- Role CMS lain (PRESIDENT, VICE_PRESIDENT, TREASURER, VICE_TREASURER, SECRETARY) mendapatkan akses sesuai permission yang diberikan di modul Access.
- Anggota biasa (MEMBER) tidak dapat mengakses CMS kecuali diberi permission khusus.

## 5. Tips

- Selalu periksa permission di modul Access sebelum menambahkan role baru.
- Gunakan modul Audit untuk melacak perubahan data penting.
- Pastikan transaksi dan jadwal uang kas selalu diinput di CMS finance agar dashboard akurat.

---

**Last Updated:** September 2026
