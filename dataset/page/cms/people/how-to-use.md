# How to Use - CMS People (Kelola Anggota)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu CMS People

`/{slug}/cms/people` adalah halaman untuk mengelola anggota kelas. Pengurus dapat menyetujui atau menolak pendaftaran anggota, serta mengubah jabatan/role anggota yang sudah aktif.

## 2. Fitur Utama

### 2.1 Daftar Anggota Aktif

- Menampilkan tabel anggota: Nama, NIM, Email, Jabatan, dan Status.
- **Jabatan** dapat diubah melalui dropdown untuk setiap anggota (kecuali Owner).
- Role yang tersedia:
  - Anggota
  - Ketua Kelas
  - Wakil Ketua
  - Bendahara
  - Wakil Bendahara
  - Sekretaris
- Anggota yang masih menunggu approval ditandai status **Menunggu Approval**.

### 2.2 Review Pendaftaran Anggota

- Menampilkan daftar pendaftaran anggota baru yang berstatus `PENDING_APPROVAL`.
- Setiap review menampilkan:
  - Nama lengkap dan NIM
  - Email
  - Foto profil
  - Foto KTM
- Aksi yang tersedia:
  - **Setujui**: anggotaditerima dan dapat login.
  - **Tolak**: pendaftaran ditolak.

### 2.3 Hapus Anggota

- Tombol hapus tersedia untuk anggota yang sudah aktif (kecuali Owner).
- Hanya pengurus dengan akses yang dapat menghapus anggota.

## 3. Hak Akses

- OWNER memiliki akses penuh.
- Role CMS lain umumnya dapat mengakses People Management, tetapi akses dapat dibatasi melalui modul Access.

## 4. Cara Menggunakan

1. Login sebagai pengurus/owner.
2. Buka `/{slug}/cms/people`.
3. Tinjau daftar pendaftaran menunggu approval.
4. Periksa foto profil dan KTM sebelum menyetujui.
5. Ubah jabatan anggota jika diperlukan melalui dropdown pada tabel.
6. Hapus anggota hanya jika memang perlu dan data sudah benar.

## 5. Tips

- Selalu verifikasi foto KTM dan data diri sebelum menyetujui pendaftaran.
- Berikan jabatan dengan hak akses minimum yang diperlukan.

---

**Last Updated:** September 2026
