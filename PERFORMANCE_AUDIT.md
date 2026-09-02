# Performance Audit

Tanggal audit: 2026-08-28  
Branch: `development`  
Scope: rendering Next.js, Server/Client Components, database/API fetching, caching, dan invalidation.

## Executive Summary

Audit statis menemukan bahwa sebagian besar komponen Client memang membutuhkan state, event handler, router, atau browser API. Namun terdapat beberapa page-level Client Components yang membawa markup statis ke client bundle. Risiko performa terbesar berada pada pengambilan data keuangan: dashboard mengambil seluruh transaksi, seluruh anggota, seluruh pembayaran, dan seluruh jadwal, kemudian menghitung data per anggota di memory.

Strategi `no-store` pada halaman privat dan API berbasis session sudah tepat dari sisi keamanan. Namun aplikasi belum memanfaatkan cache Data/Full Route Next.js untuk data yang aman dicache, dan beberapa `revalidatePath` tidak menyertakan prefix `/{slug}` dari route tenant.

## Update Audit (2026-09-02)

Pembaruan berikut mencatat status temuan pada branch `development` (commit `b1dcadb`).

### Perubahan sejak audit awal

1. **P1 - Fetch anggota landing: sebagian diperbaiki.** `src/app/[slug]/page.tsx` kini meresolusi anggota tenant di Server Component dan mengirimnya sebagai prop `members` ke `TenantLanding`. Namun `TenantLanding` masih menjalankan fetch client ke `/api/member` secara tidak bersyarat di `useEffect`, serta tetap mem-fetch ulang pada event `visibilitychange`, `focus`, dan `pageshow`. Rekomendasi: batasi fetch client hanya saat `serverMembers` kosong, atau hapus event listener yang tidak diperlukan.
2. **P1 - Dashboard over-fetch: masih berlaku.** Dashboard masih mengambil seluruh transaksi, seluruh anggota beserta `cashPayments`, dan seluruh jadwal uang kas tanpa batas periode/`select` minimal.
3. **P1 - CMS overview: masih berlaku.** `src/app/[slug]/cms/page.tsx` masih `findMany` seluruh transaksi lalu menghitung income/expense di JavaScript.
4. **P2 - `force-dynamic` luas: masih berlaku.**
5. **Perbaikan parsial `revalidatePath`.** `POST /api/finance` kini memanggil `revalidatePath(\`/${slug}/cms/finance\`)` dengan menyertakan slug tenant.
6. **Penambahan pagination.** Feed informasi menggunakan cursor-based pagination (`InformationFeed`), pola yang baik untuk data yang terus bertambah.

### Tambahan temuan

- `src/app/[slug]/statistics/page.tsx` dan `src/app/[slug]/schedule/page.tsx` mengambil seluruh task/schedule tenant; untuk tenant besar, pertimbangkan `select` minimal dan agregasi.
- CMS tasks memakai `getTaskManagementData` yang mengambil seluruh tugas + seluruh anggota per request; untuk kelas besar pertimbangkan pagination.

## Findings

### P1 - Fetch anggota landing dilakukan di client dan berulang

File: [src/components/landing/TenantLanding.tsx](src/components/landing/TenantLanding.tsx#L131-L177)

`TenantLanding` melakukan fetch `/api/member` setelah hydration dengan `cache: "no-store"`. Fetch diulang pada event `visibilitychange`, `focus`, dan `pageshow`. Effect memakai dependency array kosong sehingga `tenantId` baru tidak menjadi dependency ketika terjadi navigasi client antar-tenant.

Dampak:

- HTML awal tidak berisi data anggota dan menampilkan loading tambahan.
- Request dan database hit terjadi setiap tab kembali aktif atau window mendapat focus.
- Data anggota dari tenant sebelumnya berpotensi dipertahankan ketika props tenant berubah.

Rekomendasi:

1. Ambil data anggota di Server Component [src/app/[slug]/page.tsx](src/app/%5Bslug%5D/page.tsx#L22-L60).
2. Kirim data yang sudah diserialisasi sebagai props ke client island yang hanya menangani carousel dan navigasi.
3. Jika refresh live wajib dipertahankan, gunakan dependency `[tenantId]`, AbortController, dan interval/debounce yang terkontrol.

### P1 - Dashboard over-fetch dan komputasi di memory

File: [src/app/[slug]/dashboard/page.tsx](src/app/%5Bslug%5D/dashboard/page.tsx#L57-L96)

Dashboard mengambil seluruh transaksi tenant, seluruh anggota dengan seluruh `cashPayments`, dan seluruh jadwal. Query menggunakan `include` luas tanpa batas periode, pagination, atau `select` minimal. Data kemudian diproses dengan kombinasi `filter`, `find`, dan `some` untuk setiap anggota dan jadwal ([dashboard/page.tsx](src/app/%5Bslug%5D/dashboard/page.tsx#L120-L175)).

Kompleksitas dapat mendekati $O(M \\times S \\times (T + P))$, dengan `M` anggota, `S` jadwal, `T` transaksi, dan `P` pembayaran.

Rekomendasi:

- Batasi transaksi dan pembayaran berdasarkan periode dashboard.
- Gunakan `select` eksplisit.
- Gunakan `aggregate` atau `groupBy` Prisma untuk total income/expense dan payment summary.
- Agregasikan payment per `userId` dan tanggal di database, bukan dengan pencarian berulang di Node.js.
- Tambahkan indeks berdasarkan pola query, misalnya `(tenantId, date)` untuk transaksi dan `(tenantId, userId, date)` untuk pembayaran setelah memverifikasi query plan.

### P1 - CMS overview mengambil seluruh transaksi untuk summary

File: [src/app/[slug]/cms/page.tsx](src/app/%5Bslug%5D/cms/page.tsx#L29-L60)

Halaman CMS mengambil `transaction.findMany({ where: { tenantId } })`, lalu menghitung income dan expense menggunakan `filter` dan `reduce` di JavaScript.

Gunakan `prisma.transaction.aggregate()` atau agregasi berdasarkan tipe transaksi. Ini mengurangi payload database ke Node.js dan penggunaan memory.

### P2 - `force-dynamic` terlalu luas

Contoh utama:

- [src/app/[slug]/layout.tsx](src/app/%5Bslug%5D/layout.tsx#L7)
- [src/app/[slug]/page.tsx](src/app/%5Bslug%5D/page.tsx#L11)
- [src/app/[slug]/home/page.tsx](src/app/%5Bslug%5D/home/page.tsx#L16)
- [src/app/[slug]/cms/layout.tsx](src/app/%5Bslug%5D/cms/layout.tsx#L21)

Halaman privat yang membaca cookies/session memang perlu dynamic rendering. Masalahnya, flag pada layout dapat membuat seluruh subtree kehilangan peluang Full Route Cache, termasuk markup publik atau data tenant yang tidak sensitif.

Rekomendasi:

- Pertahankan dynamic rendering pada boundary yang membaca session/cookies.
- Pisahkan konten publik dari area privat.
- Cache metadata dan konten tenant non-sensitif dengan key berbasis tenant.
- Jangan menggunakan cache global untuk data yang dipengaruhi session atau authorization.

### P2 - Resolusi tenant diulang dalam satu request

Lookup tenant terjadi di beberapa boundary:

- Middleware: [src/middleware.ts](src/middleware.ts#L27-L53)
- Tenant layout: [src/app/[slug]/layout.tsx](src/app/%5Bslug%5D/layout.tsx#L20-L40)
- Tenant page: [src/app/[slug]/page.tsx](src/app/%5Bslug%5D/page.tsx#L22-L45)
- Metadata: [src/app/[slug]/page.tsx](src/app/%5Bslug%5D/page.tsx#L64-L78)

Dampak utamanya adalah database round-trip tambahan pada navigasi, terutama karena subtree tenant bersifat dynamic.

Rekomendasi:

- Gunakan satu helper server untuk resolve tenant context per request.
- Hindari query database di middleware kecuali diperlukan untuk redirect/security.
- Pisahkan lookup metadata yang dapat dicache dari validasi akses yang harus dynamic.
- Bila tetap memakai beberapa call site, pertimbangkan request memoization atau cache function yang tidak membawa data session sensitif.

### P2 - Invalidasi cache tidak sesuai route tenant

Contoh:

- [src/features/finance/actions/manage-uang-kas.action.ts](src/features/finance/actions/manage-uang-kas.action.ts#L27-L28)
- [src/features/task/actions/task.action.ts](src/features/task/actions/task.action.ts#L55-L107)
- [src/features/finance/actions/create-transaction.action.ts](src/features/finance/actions/create-transaction.action.ts#L66-L116)

Action memanggil path seperti `/cms/finance`, `/dashboard`, atau `/home`, sedangkan route aktual berada di `/{slug}/cms/finance`, `/{slug}/dashboard`, dan `/{slug}/home`.

Saat ini dampaknya terbatas karena halaman memakai `force-dynamic`/`no-store`, tetapi invalidasi akan gagal menargetkan halaman yang benar ketika caching diaktifkan.

Rekomendasi:

```ts
revalidatePath("/[slug]/cms/finance", "page");
revalidatePath("/[slug]/dashboard", "page");
```

Untuk granularitas yang lebih baik, gunakan tag berbasis tenant, misalnya `tenant:${tenantId}:finance`.

### P2 - Header cache di `next.config.js` tidak mencakup URL tenant

File: [next.config.js](next.config.js#L14-L24)

Matcher hanya mencakup path yang diawali `/dashboard`, `/profil`, atau `/cms`. URL tenant aktual diawali `/{slug}/...`, sehingga policy tersebut tidak mencakup route utama tenant. Middleware juga memiliki policy `no-store` sendiri ([src/middleware.ts](src/middleware.ts#L11-L16)), sehingga terdapat dua sumber policy cache yang berpotensi tidak konsisten.

Rekomendasi:

- Pusatkan kebijakan cache di level route/server response.
- Jika header config tetap diperlukan, gunakan matcher yang mencakup struktur `/:slug/(dashboard|profil|cms|home)/:path*`.
- Pastikan response privat selalu `private, no-store` dan tidak dapat disimpan proxy/CDN.

## Review `use client`

Inventarisasi menemukan 61 file dengan direktif `use client`. Sebagian besar valid karena memakai state, event handler, router, portal, chart, form, atau browser API.

### Kandidat yang dapat dipecah

- [src/app/privacy/page.tsx](src/app/privacy/page.tsx#L1): konten kebijakan privasi statis dapat menjadi Server Component. Pindahkan TOC, scroll tracking, dan back-to-top ke client island.
- [src/app/terms/page.tsx](src/app/terms/page.tsx#L1): pola sama; konten syarat dapat tetap server-rendered.
- [src/app/[slug]/project/page.tsx](src/app/%5Bslug%5D/project/page.tsx#L1): mock data dan markup dapat menjadi server; router dan parallax tetap client.
- [src/components/about/page.tsx](src/components/about/page.tsx#L1): pisahkan konten statis dari `OrgStructure` atau fetch interaktif.
- [src/app/page.tsx](src/app/page.tsx#L1): landing platform dapat menjadi Server Component dengan client island untuk menu mobile, loading navigasi, dan scroll.

### Komponen yang wajar tetap Client

- `ThemeProvider`, `ThemeToggle`, navbar/sidebar interaktif.
- Form, modal, tombol action, upload, dan komponen yang memakai `useState`/`useEffect`.
- `CashFlowChart` dan `ArrearsList` bila filter, export, atau chart interaction berjalan di browser.
- `AssistantWidget` dan `ChatWindow` karena menyimpan state percakapan dan melakukan POST AI.

## Caching dan Data Fetching

### Kondisi saat ini

- Tidak ditemukan penggunaan `unstable_cache`, `cache`, `revalidateTag`, atau `updateTag`.
- `noStore()` dan `force-dynamic` digunakan pada halaman privat, dan secara prinsip sesuai.
- API anggota menggunakan `force-dynamic` serta header `Cache-Control: no-store`, sesuai untuk data berbasis authorization ([src/app/api/member/route.ts](src/app/api/member/route.ts#L1-L35)).
- Fetch AI menggunakan POST dan tidak seharusnya dicache.
- Query server sudah memakai `Promise.all` di beberapa halaman.
- Sebagian query sudah menggunakan `select` minimal.

### Strategi yang disarankan

1. Data privat berbasis session: tetap dynamic dan `no-store`.
2. Data tenant publik/non-sensitif: gunakan `unstable_cache` atau cache function dengan key tenant dan TTL yang jelas.
3. Mutasi: invalidasi tag tenant yang spesifik setelah transaksi berhasil.
4. Daftar panjang: gunakan pagination/cursor dan `take`/`skip` atau cursor Prisma.
5. Summary: gunakan agregasi database, bukan mengambil seluruh row.
6. Validasi: ukur query count, payload size, response time, dan cache hit rate sebelum dan sesudah perubahan.

## Prioritized Action Plan

1. Refactor dashboard dan CMS summary menjadi agregasi database.
2. Pindahkan fetch anggota landing ke Server Component dan perbaiki lifecycle refresh.
3. Perbaiki indeks berdasarkan query plan database.
4. Kurangi tenant lookup duplikat dan kecilkan `include` menjadi `select`.
5. Koreksi `revalidatePath` atau migrasikan ke tag invalidation berbasis tenant.
6. Pecah halaman privacy, terms, project, about, dan platform landing menjadi server markup plus client islands.
7. Lazy-load AI widget agar tidak menjadi bagian dari bundle global halaman.
8. Tambahkan test untuk jumlah query, over-fetching, route invalidation, dynamic rendering, dan perpindahan tenant.

## Test Gaps

Belum tersedia test yang memverifikasi:

- jumlah query dan ukuran payload dashboard/CMS;
- tidak adanya fetch berulang saat focus/page visibility;
- perubahan `tenantId` saat client navigation;
- penggunaan `revalidatePath`/cache tags untuk route tenant;
- regresi bundle akibat page-level `use client`.

Contract test saat ini masih merujuk struktur route lama `[university]/[program]/[class]`, sedangkan implementasi memakai `[slug]`; coverage route tenant perlu diperbarui sebelum dijadikan guard performa.

## Limitations

Audit ini berbasis inspeksi kode. Runtime profiling, query plan database, ukuran bundle production, dan cache hit/miss belum diukur. Temuan P1 sebaiknya divalidasi dengan dataset tenant berukuran besar dan tracing query Prisma sebelum menentukan indeks final.
