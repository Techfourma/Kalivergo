# How to Use - Login (Masuk ke Kalivergo)

Bagaimana cara login? Buat /login, masukkan NIM/email dan password, klik Masuk Sekarang. Kenapa saya tidak bisa login? Penyebab umum: password salah, email belum diverifikasi, akun belum disetujui admin, atau pendaftaran member masih menunggu persetujuan.

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu Halaman Login

Halaman login adalah pintu masuk untuk mengakses kelas di Kalivergo. Ada beberapa jenis login:
- **Login Member/Owner** (`/login`) — untuk anggota kelas dan owner kelas.
- **Login Admin Platform** (`/platform/login`) — untuk admin KYC platform.
- **Login Demo** (`/auth/login`) — untuk preview UI lokal tanpa autentikasi.

## 2. Login Member/Owner (`/login`)

### 2.1 Cara Login

1. Buka `/login`.
2. Masukkan **NIM** atau **email** di kolom identifier.
3. Masukkan **password**.
4. Klik **Masuk Sekarang**.

### 2.2 Setelah Login

- Jika berhasil, Anda akan diarahkan ke `/{slug}/home` kelas Anda.
- Jika Anda memiliki beberapa kelas, Anda akan diarahkan ke kelas dengan prioritas tertinggi.

## 3. Mengapa Saya Tidak Bisa Login?

Berikut adalah penyebab umum login gagal dan cara mengatasinya:

### 3.1 "Email/NIM atau password salah"

- **Penyebab**: NIM/email atau password yang dimasukkan tidak sesuai dengan data terdaftar.
- **Solusi**:
  - Pastikan NIM/email benar dan tidak ada typo.
  - Password bersifat case-sensitive.
  - Gunakan email yang sama saat pendaftaran.

### 3.2 "Email belum diverifikasi. Silakan cek inbox Anda."

- **Penyebab**: Akun Anda belum melakukan verifikasi email.
- **Solusi**:
  - Cek inbox email yang digunakan saat pendaftaran.
  - Ikuti tautan verifikasi yang dikirimkan.
  - Jika email tidak ditemukan, cek folder spam/promosi.

### 3.3 "Akun belum disetujui oleh SUPER_ADMIN_KYC. Harap tunggu verifikasi."

- **Penyebab**: Ini terjadi untuk akun **Admin Platform**. Akun belum disetujui oleh Super Admin.
- **Solusi**:
  - Tunggu hingga verifikasi selesai (biasanya 1x24 jam).
  - Hubungi admin platform jika sudah terlalu lama.

### 3.4 "Tenant belum memiliki Nama Website yang valid."

- **Penyebab**: Kelas yang Anda miliki belum memiliki `customSlug` yang valid.
- **Solusi**:
  - Pastikan kelas telah di-setup dengan nama website (slug) yang benar.
  - Hubungi owner kelas atau admin untuk memastikan konfigurasi kelas.

### 3.5 "Akun anda sudah pernah terdaftar, silahkan login menggunakan akun terkait."

- **Penyebab**: Anda sudah memiliki akun terdaftar dengan NIM/email yang sama.
- **Solusi**:
  - Login langsung dengan akun yang sudah ada.
  - Jangan mendaftar ulang dengan email/NIM yang sama.

### 3.6 Akun belum aktif / pendaftaran ditolak

- **Penyebab**: Pendaftaran member masih menunggu persetujuan admin/owner kelas.
- **Solusi**:
  - Tunggu persetujuan dari admin/owner kelas.
  - Cek status pendaftaran di CMS People jika memiliki akses.

## 4. Jenis-Jenis Login

### 4.1 Login Member/Owner

- **URL**: `/login`
- **Identifier**: NIM atau email
- **Password**: password akun
- **Catatan**: Member perlu menunggu persetujuan admin/owner kelas setelah mendaftar.

### 4.2 Login Admin Platform

- **URL**: `/platform/login`
- **Identifier**: email admin KYC
- **Password**: password akun admin
- **Catatan**: Akun admin harus sudah disetujui oleh SUPER_ADMIN_KYC.

### 4.3 Login Demo

- **URL**: `/auth/login`
- **Catatan**: Hanya untuk preview UI lokal, tidak menggunakan database atau autentikasi sungguhan.

## 5. Tips

- Gunakan NIM atau email yang sama saat pendaftaran dan login.
- Jika lupa password, gunakan fitur **Lupa password?** di halaman login.
- Pastikan akun sudah terverifikasi email sebelum mencoba login.
- Untuk member, pastikan pendaftaran sudah disetujui oleh admin/owner kelas.
- Untuk owner, pastikan pengajuan kelas sudah disetujui oleh platform.
- Jika mengalami kendala, hubungi admin kelas atau platform.

## 6. Lupa Password

1. Buka `/login`.
2. Klik **Lupa password?**.
3. Masukkan email akun Anda.
4. Ikuti tautan yang dikirim ke email untuk mengatur password baru.
5. Login kembali dengan password baru.

---

**Last Updated:** September 2026
