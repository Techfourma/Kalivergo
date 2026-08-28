# Database Schema Audit

Tanggal audit: 2026-08-28  
Branch: `development`  
Schema: [prisma/schema.prisma](prisma/schema.prisma)  
Database: PostgreSQL melalui Prisma

## Executive Summary

Struktur relasi utama sudah menggunakan foreign key dan beberapa composite unique constraint yang tepat, terutama untuk tenant membership, task submission, seminar submission, dan permission CMS. Namun indeks yang tersedia masih sangat umum: sebagian besar tabel hanya memiliki indeks `tenantId`. Seiring bertambahnya data, query yang memfilter tenant berdasarkan tanggal, user, status, atau kombinasi beberapa kolom akan membutuhkan composite index.

Temuan paling penting:

- kolom nominal keuangan menggunakan `Float`, yang tidak ideal untuk nilai uang;
- beberapa kolom status dan tipe masih berupa `String`, sehingga validasi database lemah;
- beberapa foreign key logis belum dimodelkan sebagai relation Prisma;
- indeks untuk query finance, payment, deadline, audit, application, dan permission belum lengkap;
- integritas lintas tenant pada submission dan transaction/category belum sepenuhnya dijamin oleh schema.

Indeks final tetap perlu divalidasi dengan `EXPLAIN (ANALYZE, BUFFERS)` pada dataset produksi atau staging yang representatif.

## Findings

### P1 - Kolom nominal menggunakan `Float`

Model terdampak:

- [CashPayment](prisma/schema.prisma#L248-L261): `amount Float`
- [Transaction](prisma/schema.prisma#L301-L320): `amount Float`
- [UangKasSchedule](prisma/schema.prisma#L331-L345): `amount Float`

`Float` menggunakan representasi floating point biner. Operasi penjumlahan dan perbandingan nominal dapat menghasilkan error presisi, terutama ketika data berkembang atau laporan melakukan agregasi dalam jumlah besar.

Rekomendasi:

```prisma
amount Decimal @db.Decimal(19, 2)
```

Gunakan `Prisma.Decimal` pada service layer dan konversi ke number hanya pada boundary presentation. Migrasi harus mencakup konversi data existing dan verifikasi seluruh agregasi/report.

### P1 - Indeks finance belum mengikuti pola query aktual

Model [Transaction](prisma/schema.prisma#L301-L320) hanya memiliki `@@index([tenantId])`, sementara aplikasi mengambil transaksi berdasarkan tenant dan mengurutkan atau memfilter tanggal. Query summary juga membedakan `type`.

Model [CashPayment](prisma/schema.prisma#L248-L261) hanya memiliki `@@index([tenantId])`, sedangkan dashboard memproses payment per tenant, user, dan tanggal.

Model [UangKasSchedule](prisma/schema.prisma#L331-L345) juga hanya memiliki `@@index([tenantId])`, sedangkan jadwal dicari berdasarkan tenant dan tanggal.

Kandidat indeks:

```prisma
model Transaction {
  @@index([tenantId, date])
  @@index([tenantId, type, date])
  @@index([tenantId, userId, date])
}

model CashPayment {
  @@index([tenantId, userId, date])
  @@index([tenantId, date])
}

model UangKasSchedule {
  @@unique([tenantId, date])
  @@index([tenantId, date])
}
```

Catatan: `@@index([tenantId, date])` pada `UangKasSchedule` tidak diperlukan jika `@@unique([tenantId, date])` ditambahkan, karena unique index sudah melayani lookup tersebut.

### P1 - Composite index untuk membership tenant belum optimal

Model [TenantMembership](prisma/schema.prisma#L137-L153) memiliki `@@unique([userId, tenantId])`. Index ini efisien untuk lookup berdasarkan `userId`, lalu `tenantId`, tetapi tidak optimal untuk query yang hanya memfilter `tenantId`, seperti daftar seluruh anggota tenant.

Tambahkan:

```prisma
@@index([tenantId])
@@index([tenantId, role])
```

`[tenantId, role]` berguna untuk query owner/CMS access dan daftar anggota berdasarkan role. Index role hanya perlu ditambahkan jika query tersebut sering dilakukan dan query plan membuktikan manfaatnya.

### P1 - Query task berdasarkan deadline membutuhkan composite index

Model [Task](prisma/schema.prisma#L218-L232) hanya memiliki `@@index([tenantId])`. Service task mendukung filter weekly atau rentang `deadline` dan mengurutkan task berdasarkan tanggal pada beberapa halaman.

Kandidat indeks:

```prisma
@@index([tenantId, deadline])
```

Model [Schedule](prisma/schema.prisma#L282-L300) dan [Seminar](prisma/schema.prisma#L264-L280) juga sering mengambil daftar tenant dengan urutan tanggal. Kandidatnya:

```prisma
Schedule:       @@index([tenantId, date])
Seminar:        @@index([tenantId, date])
```

### P2 - Foreign key pada tabel child belum semuanya memiliki index langsung

PostgreSQL tidak otomatis membuat index untuk setiap foreign key. Composite unique index memang sudah menutup sebagian kasus, tetapi beberapa FK masih membutuhkan index mandiri:

- `KycReview.applicationId` pada [KycReview](prisma/schema.prisma#L202-L216)
- `Submission.userId` pada [Submission](prisma/schema.prisma#L234-L247)
- `SeminarSubmission.userId` pada [SeminarSubmission](prisma/schema.prisma#L272-L281)
- `Transaction.categoryId` dan `Transaction.userId` pada [Transaction](prisma/schema.prisma#L301-L320)
- `OwnerApplication.userId`, `OwnerApplication.tenantId`, dan `OwnerApplication.status` pada [OwnerApplication](prisma/schema.prisma#L158-L180)
- `MemberApplication.tenantId` dan `MemberApplication.status` pada [MemberApplication](prisma/schema.prisma#L183-L200)

Kandidat indeks minimum:

```prisma
KycReview:          @@index([applicationId])
Submission:         @@index([userId])
SeminarSubmission:  @@index([userId])
Transaction:        @@index([tenantId, categoryId])
OwnerApplication:   @@index([userId])
OwnerApplication:   @@index([tenantId, status])
MemberApplication:  @@index([tenantId, status])
```

Jangan menambahkan semua kandidat secara otomatis. Prioritaskan index yang sesuai endpoint yang sering dipanggil, join yang besar, atau foreign key yang sering menjadi filter/delete target.

### P2 - Status dan tipe penting masih berupa `String`

Kolom berikut masih menggunakan `String`:

- `Submission.status`
- `SeminarSubmission.status`
- `Schedule.type`
- `Transaction.type`
- `Category.type`
- `AuditLog.action`
- `AuditLog.entityType`
- `CmsAccessPermission.module`

Dampak:

- typo dapat masuk ke database;
- query dan branching aplikasi menjadi lebih sulit dipastikan;
- index pada kolom status/type kurang efektif jika distribusi nilainya tidak terkendali;
- perubahan domain tidak terpusat pada enum Prisma.

Rekomendasi:

- Ganti domain yang stabil seperti transaction type, category type, submission status, dan schedule type menjadi enum Prisma.
- Pertahankan `String` untuk audit action/entity type bila nilainya sengaja extensible, tetapi tambahkan validation di service.
- Sebelum migrasi, lakukan data profiling untuk menemukan nilai invalid atau variasi casing.

### P2 - Foreign key logis belum dimodelkan sebagai relation

Beberapa kolom menyimpan ID tetapi tidak memiliki FK/relation Prisma:

- [AuditLog](prisma/schema.prisma#L202-L216): `actorUserId String?`
- [OwnerApplication](prisma/schema.prisma#L158-L180): `reviewedBy String?`
- [MemberApplication](prisma/schema.prisma#L183-L200): `reviewedBy String?`
- [Transaction](prisma/schema.prisma#L301-L320): `createdBy String?`, `userId String?`
- [CmsAccessPermission](prisma/schema.prisma#L348-L363): module sebagai string domain

Dampak:

- orphan ID dapat tertinggal ketika user dihapus;
- query harus melakukan lookup manual;
- referential integrity dan navigasi Prisma menjadi lebih lemah.

Rekomendasi:

- Modelkan `actorUserId`, `reviewedBy`, `createdBy`, dan `userId` sebagai relation bila memang mereferensikan `User`.
- Tentukan kebijakan `onDelete`: `SetNull` biasanya lebih sesuai untuk audit/history, sedangkan `Cascade` dapat menghapus histori secara tidak diinginkan.
- Bila `createdBy` menyimpan nama snapshot, rename menjadi `createdByName` agar tidak disalahartikan sebagai FK.

### P2 - Relasi submission belum menjamin user berasal dari tenant yang sama

`Submission` menghubungkan `Task` dan `User`, tetapi tidak memiliki `tenantId`. Secara schema, user dari tenant lain dapat direferensikan ke task tenant ini selama aplikasi tidak melakukan validasi.

Hal serupa berlaku pada `SeminarSubmission` dan transaksi yang memiliki `tenantId` serta `userId` terpisah. Query aplikasi perlu memvalidasi membership, tetapi database belum dapat menjamin invariant tersebut.

Pilihan perbaikan:

1. Pertahankan schema sekarang dan pastikan semua write service memvalidasi membership dalam transaction.
2. Tambahkan `tenantId` ke tabel child serta composite FK/constraint jika integritas tenant harus dijamin di database.
3. Untuk desain yang lebih ketat, gunakan composite key membership `(tenantId, userId)` dan referensikan pasangan tersebut dari tabel tenant-scoped.

Pilihan kedua/ketiga lebih kuat tetapi membutuhkan migrasi dan perubahan query yang lebih besar.

### P2 - Filter audit berbasis JSON berpotensi menjadi bottleneck

Audit tenant menggunakan metadata JSON untuk mencari `tenantId` (lihat query pada action audit). Model [AuditLog](prisma/schema.prisma#L202-L216) belum memiliki kolom tenant langsung dan belum memiliki index JSONB.

Dampak:

- filter tenant dapat melakukan scan besar ketika audit log bertambah;
- `createdAt` saja tidak cukup untuk selective filtering tenant;
- validasi tenant tidak terlihat jelas pada struktur schema.

Rekomendasi utama: tambahkan `tenantId String?` sebagai kolom nullable pada `AuditLog`, relation ke `Tenant` dengan kebijakan delete yang sesuai, lalu indeks:

```prisma
@@index([tenantId, createdAt])
@@index([tenantId, entityType, createdAt])
```

Jika metadata JSON harus dipertahankan sebagai sumber filter, pertimbangkan GIN index PostgreSQL melalui migration SQL manual, tetapi kolom tenant langsung lebih sederhana dan lebih mudah dipelihara.

### P2 - Application queue membutuhkan index tenant/status

`OwnerApplication` dan `MemberApplication` dipakai sebagai queue berdasarkan tenant dan status. Saat ini kedua model tidak memiliki index selain primary/unique yang diwariskan dari kolom lain.

Tambahkan kandidat berikut:

```prisma
OwnerApplication:  @@index([status, createdAt])
OwnerApplication:  @@index([tenantId, status, createdAt])
MemberApplication: @@index([tenantId, status, createdAt])
```

Gunakan index partial PostgreSQL jika queue hanya membaca status pending dan jumlah data historical sangat besar. Partial index memerlukan migration SQL manual atau konfigurasi migration yang sesuai.

### P2 - Permission CMS sudah memiliki unique index yang baik, tetapi index tambahan mungkin redundan

Model [CmsAccessPermission](prisma/schema.prisma#L348-L363) memiliki `@@unique([tenantId, cmsRole, module])`, yang sudah melayani lookup tenant + role + module dan secara prefix lookup tenant + role.

`@@index([tenantId])` kemungkinan redundan karena unique composite dimulai dengan `tenantId`. Index tersebut dapat dipertahankan demi kejelasan, tetapi sebaiknya diverifikasi dengan `pg_indexes` dan query plan sebelum menghapusnya. Hindari menambah index lain tanpa query yang jelas.

### P3 - Unique constraint tenant perlu ditinjau terhadap aturan bisnis

Model [Tenant](prisma/schema.prisma#L112-L135) memiliki `@@unique([programId, slug])`, tetapi `customSlug` tidak unique walaupun resolver tenant mencari berdasarkan `customSlug`.

Jika `customSlug` dimaksudkan sebagai URL publik unik, tambahkan:

```prisma
customSlug String? @unique
```

Atau gunakan unique partial index jika nilai nullable dan aturan bisnis hanya mewajibkan keunikan untuk tenant aktif. Tanpa constraint ini, `findFirst` dapat memilih tenant arbitrer ketika terjadi collision.

### P3 - Tipe string untuk URL, phone, dan storage key tidak menjadi masalah utama

Kolom seperti URL, phone, storage key, dan slug menggunakan `String`, yang umumnya tepat di PostgreSQL. Optimasi panjang tipe seperti `VARCHAR(n)` tidak otomatis meningkatkan performa berarti pada PostgreSQL.

Yang lebih penting:

- validasi format dan panjang di application/schema validation;
- unique index hanya pada identifier bisnis yang memang unik;
- jangan mengindeks kolom `Text` panjang seperti bio, description, atau metadata tanpa kebutuhan pencarian yang nyata.

## Relational Design Review

### Yang sudah baik

- Relasi tenant ke child menggunakan FK dan umumnya `onDelete: Cascade`.
- `TenantMembership` memiliki `@@unique([userId, tenantId])`, mencegah membership ganda.
- `Submission` memiliki `@@unique([taskId, userId])`.
- `SeminarSubmission` memiliki `@@unique([seminarId, userId])`.
- `CmsAccessPermission` memiliki composite unique constraint yang sesuai.
- `StudyProgram` memiliki `@@unique([universityId, slug])`.
- Tenant memakai `Restrict` ke university/program, yang membantu mencegah penghapusan parent yang masih dipakai.

### Risiko desain yang perlu dipantau

- Cascade delete pada user menghapus submission, payment, dan application; pastikan ini memang sesuai kebijakan retention.
- Cascade delete pada tenant menghapus seluruh data finance/task/seminar; operasi archive sebaiknya menjadi default untuk tenant bisnis.
- Tidak semua entitas history memiliki relation actor yang kuat.
- Denormalisasi nama universitas/program pada application memang berguna sebagai snapshot, tetapi jangan dipakai sebagai pengganti FK untuk query operasional.

## Prioritized Recommendations

### Prioritas segera

1. Ganti nominal `Float` menjadi `Decimal(19,2)`.
2. Tambahkan composite index finance: transaction tenant/date dan cash payment tenant/user/date.
3. Tambahkan `TenantMembership @@index([tenantId])`.
4. Tambahkan `Task @@index([tenantId, deadline])`.
5. Tambahkan index tenant/status untuk member application queue.
6. Evaluasi uniqueness `Tenant.customSlug`.

### Prioritas berikutnya

1. Tambahkan index tanggal pada schedule dan seminar.
2. Tambahkan index FK child yang benar-benar dipakai sebagai filter/join.
3. Tambahkan `tenantId` langsung ke `AuditLog` dan index tenant/createdAt.
4. Ubah status/type stabil dari `String` menjadi enum.
5. Modelkan FK logis ke `User` dengan `SetNull` untuk history.

### Sebelum migrasi

1. Ambil daftar query aktual dari production/staging.
2. Jalankan `EXPLAIN (ANALYZE, BUFFERS)` untuk dashboard, finance, audit, application queue, dan task list.
3. Periksa duplicate `customSlug` dan duplicate jadwal tenant/date.
4. Profil nilai `Transaction.type`, `Category.type`, submission status, dan schedule type.
5. Ukur ukuran index dan write overhead setelah menambah index.
6. Terapkan perubahan dalam migration kecil dan terpisah agar rollback mudah.

## Suggested Prisma Changes

Contoh baseline yang dapat dipertimbangkan setelah validasi query plan:

```prisma
model TenantMembership {
  @@unique([userId, tenantId])
  @@index([tenantId])
  @@index([tenantId, role])
}

model Task {
  @@index([tenantId, deadline])
}

model CashPayment {
  amount Decimal @db.Decimal(19, 2)
  @@index([tenantId, userId, date])
}

model Transaction {
  amount Decimal @db.Decimal(19, 2)
  @@index([tenantId, date])
  @@index([tenantId, type, date])
  @@index([tenantId, userId, date])
}

model UangKasSchedule {
  amount Decimal @default(10000) @db.Decimal(19, 2)
  @@unique([tenantId, date])
}

model Schedule {
  @@index([tenantId, date])
}

model Seminar {
  @@index([tenantId, date])
}

model MemberApplication {
  @@index([tenantId, status, createdAt])
}
```

Contoh ini bukan migration siap produksi. Perubahan tipe, enum, relation, dan constraint harus disertai update pada service, test, seed, dan serialization boundary.

## Validation and Test Gaps

Tambahkan validasi untuk:

- `customSlug` harus unik;
- satu jadwal uang kas per tenant/tanggal;
- user pada submission/transaction harus merupakan member tenant;
- status/type hanya menerima nilai domain yang valid;
- nominal tidak negatif dan memiliki skala maksimal dua desimal.

Tambahkan pengujian atau benchmark untuk:

- query dashboard dengan 10 ribu+ transaksi;
- query arrears dengan banyak anggota dan jadwal;
- audit tenant filter dengan data history besar;
- queue member/owner application berdasarkan status;
- query plan sebelum dan sesudah index;
- cascade delete dan retention history.

## Limitations

Audit ini berbasis inspeksi schema dan pola query yang tersedia di repository. Tidak ada koneksi database production, statistik cardinality, atau output `EXPLAIN ANALYZE` yang digunakan. Rekomendasi indeks harus dikonfirmasi terhadap workload aktual karena setiap index menambah storage dan biaya write.
