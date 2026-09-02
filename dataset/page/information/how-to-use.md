# How to Use - Information (Feed Informasi Kelas)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu Halaman Information

`/{slug}/information` adalah feed pengumuman dan informasi kelas. Anggota dapat membaca postingan, memberi reaksi, dan berkomentar.

## 2. Komponen Utama

### 2.1 Membuat Postingan (CreatePostForm)

- Membuat postingan baru dengan judul, konten, dan tipe.
- Tipe konten: **TEXT**, **IMAGE**, **VIDEO**, atau **PDF**.
- Konten teks dibatasi hingga 5000 karakter.

### 2.2 Feed dan Interaksi (InformationFeed)

- Menampilkan daftar postingan dengan informasi pembuat dan waktu (zona WIB).
- **Reaksi**: LIKE, LOVE, LAUGH, WOW, SAD, ANGRY (satu reaksi per pengguna per postingan).
- **Komentar**: tambah komentar, tampilkan semua komentar, dan balasan.
- **Status baca (read marks)**: melacak postingan yang sudah dibaca.
- **Load more**: feed memuat lebih banyak data saat scroll (paginasi cursor).

## 3. Cara Menggunakan

1. Login ke kelas, buka `/{slug}/information`.
2. Untuk membuat postingan, klik area tulis, pilih tipe, isi konten, lalu **Post**.
3. Untuk memberi reaksi, pilih emoji pada postingan.
4. Untuk berkomentar, ketik pada kolom komentar lalu **Post**/Enter.

## 4. Pengelolaan oleh Pengurus

- Pengurus dapat membuat dan menghapus postingan melalui `/{slug}/cms/information`.
- Halaman CMS menampilkan jumlah pembaca, komentar, dan reaksi per postingan.

---

**Last Updated:** September 2026
