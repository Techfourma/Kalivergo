# How to Use - CMS Finance (Kelola Keuangan)

> Berlaku untuk versi Kalivergo saat ini.

## 1. Apa itu CMS Finance

`/{slug}/cms/finance` adalah halaman untuk mengelola keuangan kelas. Halaman ini mencakup input transaksi, pengelolaan kategori, dan pengaturan uang kas.

## 2. Fitur Utama

### 2.1 Ringkasan Keuangan

- Menampilkan **Total Pemasukan**, **Total Pengeluaran**, dan **Saldo Saat Ini**.
- Ringkasan dihitung dari seluruh transaksi kelas.

### 2.2 Input Transaksi

- Pilih tipe: **INCOME** (pemasukan) atau **EXPENSE** (pengeluaran).
- Isi nominal, deskripsi, tanggal, dan kategori.
- Unggah bukti transaksi (opsional).
- Simpan transaksi; data akan muncul di riwayat transaksi dan dashboard.

### 2.3 Kelola Kategori Kas

- Tambah atau hapus kategori pemasukan dan pengeluaran.
- Kategori digunakan untuk mengelompokkan transaksi.
- Hanya OWNER yang dapat mengelola kategori.

### 2.4 Pengaturan Uang Kas (UangKasSettingsCard)

- Atur tanggal-tanggal iuran uang kas dan nominal per tanggal.
- Jadwal ini digunakan untuk menghitung tunggakan di dashboard.

### 2.5 Riwayat Transaksi

- Daftar transaksi yang sudah tercatat, dapat difilter berdasarkan rentang tanggal.
- Setiap transaksi menampilkan deskripsi, kategori, bukti (jika ada), dan nominal.
- Transaksi dapat dihapus oleh pengguna yang memiliki akses.

## 3. Hak Akses

- OWNER memiliki akses penuh.
- Role CMS lain memerlukan permission module **finance** untuk mengakses halaman ini.

## 4. Cara Menggunakan

1. Login sebagai pengurus/owner dengan akses finance.
2. Buka `/{slug}/cms/finance`.
3. Tambahkan kategori terlebih dahulu jika belum ada.
4. Input transaksi pemasukan atau pengeluaran.
5. Atur jadwal uang kas jika diperlukan.
6. Periksa ringkasan dan riwayat transaksi untuk memastikan data akurat.

## 5. Tips

- Pastikan transaksi dan jadwal uang kas selalu diinput agar dashboard dan daftar tunggakan akurat.
- Gunakan kategori yang jelas untuk memudahkan pelacakan.

---

**Last Updated:** September 2026
