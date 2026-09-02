# How to Use - Registrasi Member (Bergabung ke Kelas)

Bagaimana cara registrasi member? Bagaimana cara daftar member? Cara registrasi member di Kalivergo: buka /member-signup, isi nama, NIM, email, password, pilih universitas/program/kelas, upload foto profil dan KTM, lalu daftar member. Tunggu persetujuan admin/owner kelas.

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu Registrasi Member

Registrasi member adalah proses pendaftaran untuk **bergabung ke kelas yang sudah ada**. Member mendaftar melalui halaman `/member-signup`, kemudian menunggu persetujuan dari admin/owner kelas.

Cara registrasi member di Kalivergo:
1. Buka `/member-signup`.
2. Isi nama lengkap, NIM, email, dan password.
3. Pilih universitas, program studi, dan kelas dari dropdown.
4. Unggah foto profil dan foto KTM.
5. Klik **Daftar Member**.
6. Tunggu persetujuan admin/owner kelas di CMS People.
7. Setelah disetujui, akun langsung aktif dan bisa login di `/login`.

## 2. Syarat dan Persyaratan Registrasi Member

- Memiliki **NIM** dan **Gmail** aktif.
- Memiliki **foto profil** dan **foto KTM** yang jelas.
- Mengetahui **universitas, program studi, dan kelas** yang ingin diikuti.
- Kelas harus dalam status **ACTIVE** dan sudah memiliki owner yang disetujui platform.

## 3. Data yang Diperlukan untuk Daftar Member

| Field | Keterangan |
|-------|------------|
| Nama Lengkap | Nama sesuai identitas |
| NIM | Nomor Induk Mahasiswa |
| Email (Gmail) | Email aktif untuk login dan notifikasi |
| Password | Minimal 6 karakter |
| Ulangi Password | Harus sama dengan password |
| Universitas | Pilih dari daftar universitas |
| Program Studi | Pilih dari daftar program studi |
| Kelas | Pilih kelas yang ingin diikuti |
| Foto Profil | Format JPG/PNG, maksimal 5MB |
| Foto KTM | Format JPG/PNG, maksimal 5MB |

## 4. Alur Pendaftaran Member

1. Buka `/member-signup`.
2. Isi nama lengkap, NIM, email, dan password.
3. Pilih universitas, program studi, dan kelas dari dropdown.
4. Unggah foto profil dan foto KTM.
5. Klik **Daftar Member**.
6. Sistem memeriksa data:
   - Nama, NIM, dan email harus sesuai dengan data yang ada.
   - Email belum terdaftar atau terverifikasi sebelumnya.
7. Jika berhasil, pendaftaran masuk dengan status **PENDING_APPROVAL**.
8. Admin/owner kelas meninjau pendaftaran di `/{slug}/cms/people`.
9. Setelah disetujui, akun langsung aktif dan bisa login di `/login`.

## 5. Catatan Penting

- Setelah disetujui, **tidak perlu verifikasi email tambahan**. Akun langsung aktif.
- Jika data Nama/NIM/Email tidak sesuai dengan data terdaftar, pendaftaran ditolak.
- Satu email/NIM hanya bisa digunakan untuk satu akun.
- Foto profil dan KTM harus jelas terbaca untuk mempercepat proses approval.

## 6. Troubleshooting

- **"Nama tidak terdaftar"**: Pastikan nama sesuai dengan data resmi kampus.
- **"NIM tidak sesuai"**: Periksa kembali NIM yang diinput.
- **"Email sudah digunakan"**: Gunakan email lain yang belum terdaftar.
- **"Kelas tidak ditemukan"**: Pastikan kelas sudah aktif dan memiliki owner yang disetujui.

---

**Last Updated:** September 2026
