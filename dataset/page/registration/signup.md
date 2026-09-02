# How to Use - Registrasi Kelas / Owner

Bagaimana cara registrasi kelas? Bagaimana cara daftar kelas? Cara registrasi kelas di Kalivergo: buka /signup, isi data diri, data kelas, upload selfie dan KTM, lalu ajukan kelas. Proses verifikasi platform memakan waktu 1x24 jam.

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu Registrasi Kelas

Registrasi kelas adalah proses pembuatan **kelas baru di platform Kalivergo**. Calon owner mengisi data diri, data kelas, dan mengunggah dokumen KYC (selfie dan KTM). Pengajuan akan diverifikasi oleh tim platform dalam waktu 1x24 jam.

Cara registrasi kelas di Kalivergo:
1. Buka `/signup`.
2. Isi nama lengkap, NIM, email, nomor telepon, dan password.
3. Masukkan **nama website kelas** (slug) yang unik.
4. Isi nama universitas, program studi, dan nama kelas.
5. Unggah foto selfie dan foto KTM.
6. Klik **Ajukan Kelas**.
7. Tunggu verifikasi platform dalam 1x24 jam.
8. Setelah disetujui, email verifikasi dikirim ke Gmail Anda.
9. Verifikasi email dan kelas menjadi aktif di `/{slug}`.

## 2. Syarat dan Persyaratan Registrasi Kelas

- Memiliki **NIM** mahasiswa aktif.
- Memiliki **Gmail** aktif untuk verifikasi.
- Memiliki **nomor telepon** aktif.
- Memiliki **selfie** dan **foto KTM** yang jelas.
- Siap membuat **slug kelas** unik (nama website kelas).
- **Satu orang hanya boleh menjadi owner satu kelas**. Kombinasi universitas, program studi, dan nama kelas yang sama tidak bisa diajukan kembali.

## 3. Data yang Diperlukan untuk Daftar Kelas

| Field | Keterangan |
|-------|------------|
| Nama Lengkap | Nama sesuai identitas |
| NIM | Nomor Induk Mahasiswa |
| Email (Gmail) | Email aktif untuk verifikasi dan login |
| Nomor Telepon | Nomor HP aktif (minimal 10 digit) |
| Password | Minimal 6 karakter |
| Ulangi Password | Harus sama dengan password |
| Nama Website Kelas (Slug) | Nama unik untuk URL kelas, contoh: `techfourma` |
| Nama Universitas | Nama universitas asal |
| Program Studi | Nama program studi |
| Nama Kelas | Nama kelas, contoh: `03TPLE004` |
| Upload Selfie | Foto selfie jelas, format JPG/PNG, maksimal 5MB |
| Upload Foto KTM | Foto Kartu Tanda Mahasiswa, format JPG/PNG/WebP, maksimal 5MB |

## 4. Alur Pendaftaran Kelas

1. Buka `/signup`.
2. Isi nama lengkap, NIM, email, nomor telepon, dan password.
3. Masukkan **nama website kelas** (slug) yang unik.
4. Isi nama universitas, program studi, dan nama kelas.
5. Unggah foto selfie dan foto KTM.
6. Klik **Ajukan Kelas**.
7. Sistem memeriksa:
   - Email dan NIM belum terdaftar/terverifikasi sebelumnya.
   - Slug kelas belum digunakan oleh kelas lain yang aktif.
   - Kombinasi universitas, program studi, dan nama kelas belum ada yang mengajukan atau aktif.
8. Jika berhasil, pengajuan masuk dengan status **PENDING_EMAIL**.
9. Tim platform melakukan review KYC dalam **1x24 jam**.
10. Setelah disetujui, **email autentikasi** dikirim ke Gmail owner.
11. Owner membuka email dan melakukan verifikasi.
12. Kelas menjadi aktif dan dapat diakses via `/{slug}`.

## 5. Catatan Penting

- **Satu owner untuk satu kelas**. Kombinasi universitas + program studi + nama kelas yang sama tidak bisa diajukan oleh orang lain.
- Slug kelas hanya boleh huruf kecil, angka, dan tanda hubung (`-`). Tidak boleh ada spasi atau karakter khusus.
- Contoh slug: `techfourma` → URL kelas menjadi `kalivergo.com/techfourma`.
- Jika slug sudah digunakan, pilih nama yang berbeda.
- Proses verifikasi biasanya selesai dalam **1 hari kerja**.
- Periksa email secara berkala untuk notifikasi verifikasi.

## 6. Troubleshooting

- **"Email sudah digunakan"**: Gunakan email lain yang belum terdaftar/terverifikasi.
- **"NIM sudah digunakan"**: Gunakan NIM yang berbeda.
- **"Slug kelas sudah digunakan"**: Pilih nama website kelas yang lain.
- **"Kelas sudah memiliki owner"**: Kelas tersebut sudah terdaftar dan aktif, tidak bisa mendaftar lagi.
- **"Kelas dengan kombinasi yang sama sudah terdaftar"**: Sudah ada pengajuan atau kelas aktif dengan universitas/program/kelas yang sama.

---

**Last Updated:** September 2026
