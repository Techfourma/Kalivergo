# How to Use - Profil Pengguna

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu Halaman Profil

`/{slug}/profil` adalah tempat anggota mengelola data diri dan portofolio publik. Perubahan yang disimpan akan tampil pada portofolio publik `/{slug}/portofolio/[username]` (bila dibuka melalui route portofolio).

## 2. Komponen Utama

### 2.1 Foto Profil

- Menampilkan foto profil anggota.
- Foto dapat diunggah/diganti; file disimpan melalui Cloudinary.

### 2.2 Informasi Dasar

- Nama, email, dan NIM ditampilkan dari data akun.

### 2.3 Bio

- Deskripsi singkat tentang anggota, misalnya bidang minat.

### 2.4 Pengalaman Kerja

- Anggota dapat menambahkan pengalaman (posisi, perusahaan/organisasi, periode, deskripsi).
- Disimpan sebagai teks terstruktur pada field `workExperience`.

### 2.5 Keahlian (Skills)

- Daftar keahlian yang ditambahkan sebagai tag/chips (dipisahkan koma saat disimpan).

### 2.6 Tautan Sosial

- Instagram, GitHub, LinkedIn, dan Website/portofolio pribadi.

## 3. Cara Menggunakan

1. Login ke kelas, lalu buka `/{slug}/profil`.
2. Isi atau perbarui bio, pengalaman, keahlian, dan tautan sosial.
3. Klik **Simpan Perubahan**; gunakan **Batal** untuk membatalkan.
4. Foto profil diunggah melalui kontrol upload pada halaman ini.

## 4. Tips

- Isi keahlian dan tautan dengan data yang benar agar portofolio publik terlihat profesional.
- Jangan mengunggah dokumen pribadi (KTP/KTM) di halaman profil; gunakan alur member-signup/KYC yang sesuai.

---

**Last Updated:** September 2026
