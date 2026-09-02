# How to Use - Dashboard (Keuangan Kelas)

> Berlaku untuk versi Kalivergo saat ini. Dashboard adalah **ringkasan keuangan kelas** (uang kas), bukan dashboard tugas/seminar.

## 1. Apa itu Dashboard

Halaman `/{slug}/dashboard` menampilkan monitoring uang kas dan transaksi keuangan kelas. Halaman ini bisa diakses oleh anggota kelas yang sudah login.

Data yang ditampilkan:

- Header kelas dalam format `Universitas - Program Studi - Kelas`.
- **Cash Flow Chart**: grafik arus kas (pemasukan dan pengeluaran) kelas.
- **Arrears List**: daftar tunggakan uang kas per anggota.

## 2. Komponen Utama

### 2.1 Cash Flow Chart

- Menampilkan grafik pemasukan (`INCOME`) dan pengeluaran (`EXPENSE`).
- Sumber data adalah seluruh transaksi kelas yang tercatat di modul finance.
- Berguna untuk melihat tren saldo kelas.

### 2.2 Arrears List (Daftar Tunggakan)

- Setiap anggota dihitung dari jadwal uang kas (`UangKasSchedule`) dan pembayaran yang sudah tercatat (pembayaran tunai `CashPayment` atau transaksi terkait).
- Kolom yang ditampilkan: nama anggota, total iuran yang seharusnya dibayar, total yang sudah dibayar, dan besar tunggakan.
- Status **lunas** muncul ketika total pembayaran sudah menutupi seluruh jadwal.
- Data tanggal yang belum dibayar turut ditampilkan.

### 2.3 Pengaturan Uang Kas

- Pengaturan jadwal uang kas (tanggal dan nominal) dilakukan melalui `/{slug}/cms/finance` oleh pengurus yang memiliki akses finance.
- Dashboard hanya menampilkan hasil dari pengaturan tersebut.

## 3. Cara Menggunakan

1. Login ke akun yang menjadi anggota kelas.
2. Buka `/{slug}/dashboard` (slug adalah nama kelas).
3. Periksa grafik arus kas untuk melihat pemasukan/pengeluaran.
4. Periksa `ArrearsList` untuk mengetahui siapa yang belum membayar uang kas.
5. Jika ada data yang salah, hubungi pengurus kelas yang memiliki akses `cms/finance` agar memperbaiki transaksi atau jadwal uang kas.

## 4. Tips

- Cek dashboard secara rutin agar tunggakan terpantau lebih awal.
- Pastikan transaksi dan jadwal uang kas selalu diinput di CMS finance agar perhitungan dashboard akurat.
- Data dashboard selalu dimuat dari database terbaru (tidak di-cache).

---

**Last Updated:** September 2026
