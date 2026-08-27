# Audit Kualitas Kode Kalivergo

**Branch audit:** `development`  
**Tanggal audit:** 2026-08-27  
**Cakupan:** `src/`, `prisma/`, `tests/`, dan konfigurasi root  
**Metode:** pembacaan source, pencarian pola, pemeriksaan diagnostik workspace, serta eksekusi command yang tersedia.

> Laporan ini adalah code review read-only. Contoh di bawah adalah usulan perbaikan dan belum diterapkan ke source.

## Ringkasan Eksekutif

Temuan paling penting ada pada autentikasi dan otorisasi. Aplikasi memakai cookie JSON sebagai sumber identitas sesi tanpa signature atau validasi ulang identitas pengguna. Karena banyak endpoint menggunakan `session.id` untuk mengambil atau mengubah data, ini dapat memungkinkan impersonasi apabila penyerang dapat menulis cookie request.

Prioritas perbaikan:

1. Ganti cookie identitas buatan sendiri dengan session token yang ditandatangani atau NextAuth session yang diverifikasi server.
2. Satukan resolver tenant agar selalu bersumber dari route yang tervalidasi, bukan membership pertama atau cookie client.
3. Tambahkan authorization CMS pada `POST /api/tasks` dan batasi `GET /api/finance` sesuai kebijakan akses.
4. Tambahkan validasi schema untuk semua body API dan validasi file yang lebih ketat.
5. Perbaiki transaksi database, audit actor, type safety, dan toolchain test/lint.

## Temuan Prioritas Tinggi

### [CRITICAL] Identitas sesi dapat dipalsukan

**File:** [src/server/auth/session.ts](src/server/auth/session.ts), [src/shared/auth/session.ts](src/shared/auth/session.ts), [src/app/api/upload-profile/route.ts](src/app/api/upload-profile/route.ts), [src/app/api/portofolio/update/route.ts](src/app/api/portofolio/update/route.ts)

`setCurrentSessionUser()` menyimpan seluruh object user sebagai JSON cookie, sedangkan `parseSessionCookie()` hanya melakukan `JSON.parse()` dan memeriksa bahwa `id` berupa string. Tidak ada signature, encryption, expiry yang diverifikasi server, atau lookup user untuk memastikan cookie diterbitkan server.

Endpoint upload profile dan update portfolio memakai `session.id`. Akibatnya, cookie dengan `id` pengguna lain berpotensi membuat request diproses sebagai pengguna tersebut. `httpOnly` mencegah JavaScript browser membaca cookie, tetapi tidak mencegah cookie request dipalsukan oleh client yang mengendalikan request.

**Perbaikan yang disarankan:** gunakan NextAuth `getServerSession()` atau token opaque acak yang disimpan server-side. Minimal, gunakan cookie bertanda tangan dan jangan menyimpan role/membership sebagai sumber kebenaran.

```ts
// Contoh arah perbaikan, bukan implementasi final.
import { createHmac, timingSafeEqual } from "node:crypto";

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifySessionToken(raw: string | undefined): { userId: string } | null {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, env.sessionSecret);
  if (signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (typeof parsed.userId !== "string" || parsed.exp < Date.now()) return null;
  return { userId: parsed.userId };
}
```

Implementasi produksi sebaiknya memakai library/session provider yang sudah teruji, melakukan rotasi secret, dan mengambil role/membership terbaru dari database.

### [HIGH] `POST /api/tasks` tidak memeriksa role CMS

**File:** [src/app/api/tasks/route.ts](src/app/api/tasks/route.ts)

`POST` memeriksa sesi dan keberadaan tenant, lalu langsung memanggil `createTaskForTenant()`. Berbeda dengan `POST /api/seminar`, endpoint ini tidak memanggil `requireTenantCmsAccess()` atau helper setara. Anggota biasa yang memiliki membership dapat membuat tugas.

**Perbaikan:** letakkan guard sebelum membaca/mutasi data, dan gunakan validator schema.

```ts
const session = await getCurrentSessionUser();
if (!session?.id) return jsonError("Unauthorized", 401);

const tenant = await getCurrentTenantForUser(session.id);
if (!tenant) return jsonError("Tenant access denied", 403);

try {
  await requireTenantCmsAccess(session.id, tenant.tenantId);
} catch {
  return jsonError("CMS access required", 403);
}

const parsed = createTaskSchema.safeParse(await request.json());
if (!parsed.success) return jsonError("Invalid task data", 400);
```

Guard yang sama harus tetap ada di Server Action/service boundary, bukan hanya di middleware.

### [HIGH] Resolver tenant memilih membership pertama

**File:** [src/features/task/actions/task.action.ts](src/features/task/actions/task.action.ts), [src/server/tenant/context.ts](src/server/tenant/context.ts)

`getTenantIdFromCookie()` mengambil `session.memberships[0]?.tenantId`. Pada pengguna yang memiliki beberapa tenant, operasi CMS dapat diarahkan ke tenant pertama walaupun pengguna sedang membuka tenant lain. Ini menyebabkan perilaku salah tenant dan menyulitkan audit.

Selain itu, `getValidatedCurrentTenant()` menerima `tenantId` dari cookie `kalivergo_tenant` yang diset `httpOnly: false`. Membership check mencegah akses ke tenant yang sama sekali tidak dimiliki, tetapi cookie tetap menjadi sumber pilihan konteks yang tidak terikat langsung dengan route yang sedang dibuka.

**Perbaikan:** kirim `params.slug` dari route ke action, resolve tenant dari database, lalu validasi membership terhadap tenant hasil route. Untuk API, gunakan route segment atau header/context server yang ditetapkan server, bukan membership index.

```ts
export async function createTaskAction(
  tenantSlug: string,
  formData: FormData,
) {
  const session = await requireSessionUser();
  const tenant = await resolveTenantFromRoute({ slug: tenantSlug });
  if (!tenant) return { error: "Tenant tidak ditemukan" };

  await requireTenantCmsAccess(session.id, tenant.tenantId);
  // validate input, lalu createTaskForTenant({ tenantId: tenant.tenantId, ... })
}
```

### [HIGH] Data keuangan dapat dibaca semua member tenant

**File:** [src/app/api/finance/route.ts](src/app/api/finance/route.ts)

`GET` hanya memeriksa bahwa user memiliki membership melalui `getCurrentTenantForUser()`. Tidak ada `requireTenantCmsAccess()` atau kebijakan eksplisit bahwa seluruh member boleh melihat transaksi, padahal endpoint mengembalikan transaksi dan summary keuangan.

**Perbaikan:** gunakan guard CMS bila data finance hanya untuk pengurus. Bila dashboard memang membutuhkan ringkasan publik, buat DTO terbatas yang tidak memuat detail transaksi dan pisahkan endpoint publik dari endpoint administrasi.

```ts
await requireTenantCmsAccess(session.id, tenantId);
const { transactions, summary } = await getTransactionsWithSummary(tenantId);
return NextResponse.json({ transactions, summary });
```

### [HIGH] Endpoint portfolio membocorkan data berdasarkan `userId`

**File:** [src/app/api/portofolio/get/route.ts](src/app/api/portofolio/get/route.ts), [src/features/portfolio/repositories/portfolio.repository.ts](src/features/portfolio/repositories/portfolio.repository.ts)

Endpoint menerima `userId` arbitrer tanpa autentikasi dan mengembalikan `portfolioSelect`, yang mencakup `email`, `nim`, dan profile fields. `findPortfolioByUsername()` juga melakukan pencarian substring pada email atau nama, sehingga hasil dapat ambigu dan data kontak mudah terekspos.

**Perbaikan:** tentukan kontrak public portfolio secara eksplisit, jangan masukkan `email`/`nim` ke DTO publik, gunakan ID/username yang exact, dan bila route berada di tenant tertentu tambahkan filter membership tenant.

```ts
const publicPortfolioSelect = {
  id: true,
  name: true,
  image: true,
  bio: true,
  workExperience: true,
  skills: true,
  instagramUrl: true,
  githubUrl: true,
  linkedinUrl: true,
  websiteUrl: true,
} as const;

return prisma.user.findFirst({
  where: {
    name: username,
    tenantMemberships: { some: { tenantId } },
  },
  select: publicPortfolioSelect,
});
```

### [HIGH] File upload hanya memeriksa MIME dan ukuran

**File:** [src/features/portfolio/services/profile-image.service.ts](src/features/portfolio/services/profile-image.service.ts), [src/app/api/upload-profile/route.ts](src/app/api/upload-profile/route.ts)

Validasi `file.type.startsWith("image/")` dapat menerima content yang tidak sesuai deklarasi MIME. Tidak ada pemeriksaan dimensi, magic bytes, atau rate limit. Untuk upload invoice, [src/app/api/finance/route.ts](src/app/api/finance/route.ts) bahkan hanya membentuk URL `/uploads/...` dan tidak menyimpan file ke storage.

**Perbaikan:** batasi MIME allowlist, ukuran, dimensi, dan validasi magic bytes dengan library image processing; upload melalui satu storage service. Jangan membangun URL dari nama file user.

```ts
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
if (!allowed.has(file.type) || file.size > 2 * 1024 * 1024) {
  return { error: "Format atau ukuran file tidak valid" };
}

const bytes = Buffer.from(await file.arrayBuffer());
// validasi signature/dimensi menggunakan image parser sebelum upload.
const uploaded = await uploadToCloudinary(bytes, { folder: "kalivergo/profiles" });
```

## Temuan Prioritas Menengah

### [MEDIUM] Operasi uang kas tidak atomic

**File:** [src/features/finance/services/transaction.service.ts](src/features/finance/services/transaction.service.ts)

Transaksi utama dibuat lebih dahulu, lalu `CashPayment` dibuat terpisah. Jika pembuatan cash payment gagal, error hanya dicatat dan transaksi tetap berhasil. Data finance dan tunggakan dapat menjadi tidak konsisten.

**Perbaikan:** gunakan `prisma.$transaction()` untuk operasi database yang harus berhasil bersama, dan biarkan error menggagalkan transaksi.

```ts
return prisma.$transaction(async (tx) => {
  const transaction = await tx.transaction.create({ data: transactionData });
  if (isUangKas && input.userId) {
    await tx.cashPayment.create({ data: cashPaymentData });
  }
  return { transaction, isUangKas };
});
```

### [MEDIUM] Replace submission menghapus data sebelum insert baru

**File:** [src/features/task/repositories/task.repository.ts](src/features/task/repositories/task.repository.ts)

`replaceTaskSubmissions()` menjalankan `deleteMany`, kemudian `createMany` tanpa transaction. Kegagalan pada tahap kedua meninggalkan task tanpa submission.

**Perbaikan:** bungkus kedua operasi dalam `prisma.$transaction()` dan validasi duplikasi/ukuran array di boundary.

```ts
return prisma.$transaction(async (tx) => {
  await tx.submission.deleteMany({ where: { taskId } });
  if (userIds.length) {
    await tx.submission.createMany({
      data: [...new Set(userIds)].map((userId) => ({ taskId, userId, status: "SUBMITTED" })),
      skipDuplicates: true,
    });
  }
  return tx.submission.count({ where: { taskId } });
});
```

### [MEDIUM] Audit log tidak menyimpan actor secara relasional

**File:** [src/actions/cms/audit.ts](src/actions/cms/audit.ts), [src/lib/audit/index.ts](src/lib/audit/index.ts), [prisma/schema.prisma](prisma/schema.prisma)

`AuditLog` memiliki `actorUserId`, tetapi `createAuditLog()` selalu mengisi `actorUserId: null` dan memasukkan `userName` ke JSON metadata. Nama dapat berubah dan tidak dapat menjadi referensi actor yang konsisten. Query tenant juga mengandalkan JSON path `metadata.tenantId`.

**Perbaikan:** ambil user ID dari session server, simpan `actorUserId`, tambahkan `tenantId` sebagai kolom/index, dan gunakan tipe `Prisma.InputJsonValue` untuk metadata.

```ts
await prisma.auditLog.create({
  data: {
    actorUserId: session.id,
    tenantId,
    action,
    entityType,
    entityId,
    metadata,
  },
});
```

### [MEDIUM] Server Action task memakai helper tenant yang berbeda dari page/API

**File:** [src/features/task/actions/task.action.ts](src/features/task/actions/task.action.ts), [src/actions/cms/role-model.ts](src/actions/cms/role-model.ts), [src/server/tenant/context.ts](src/server/tenant/context.ts)

Repository memiliki beberapa cara memperoleh tenant: resolver route, cookie context, dan membership pertama. Duplikasi ini membuat aturan authorization sulit diaudit dan meningkatkan risiko bug saat fitur multi-tenant berkembang.

**Perbaikan:** buat satu `requireTenantContext({ userId, routeSlug })` di server layer, gunakan pada page, action, dan API. Service menerima `tenantId` yang sudah tervalidasi dan tidak membaca cookie sendiri.

### [MEDIUM] Revalidation memakai path statis yang tidak mencakup route dinamis

**File:** [src/features/seminar/actions/delete-seminar.action.ts](src/features/seminar/actions/delete-seminar.action.ts), [src/features/task/actions/task.action.ts](src/features/task/actions/task.action.ts), [src/actions/cms/finance.ts](src/actions/cms/finance.ts)

Banyak action memanggil `revalidatePath("/cms/seminar")`, `/cms/tasks`, atau `/dashboard`, sementara laman aktual berada di bawah `/<slug>/cms/...` dan `/<slug>/dashboard`. Ini dapat meninggalkan UI stale jika cache aktif.

**Perbaikan:** revalidate path konkret dengan slug atau gunakan `revalidateTag()` berbasis tenant.

```ts
revalidatePath(`/${tenantSlug}/cms/seminar`);
revalidateTag(`tenant:${tenantId}:seminars`);
```

### [MEDIUM] Error handling mengubah kegagalan internal menjadi data kosong

**File:** [src/lib/audit/index.ts](src/lib/audit/index.ts), [src/lib/tenant/require-tenant-access.ts](src/lib/tenant/require-tenant-access.ts), beberapa page dashboard/home

Beberapa fungsi menangkap semua exception, menulis log, lalu mengembalikan `[]` atau `null`. Ini membuat database outage tampak seperti tidak ada data dan menyulitkan monitoring serta diagnosis.

**Perbaikan:** bedakan `not found`, `forbidden`, dan `dependency failure`; lempar typed error ke boundary atau kembalikan result yang memuat status.

```ts
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; code: "NOT_FOUND" | "FORBIDDEN" | "DEPENDENCY_FAILURE"; cause?: unknown };
```

### [MEDIUM] Type safety melemah karena banyak `any`

**File:** [src/actions/cms/audit.ts](src/actions/cms/audit.ts), [src/actions/platform-kyc.ts](src/actions/platform-kyc.ts), [src/app/[slug]/dashboard/page.tsx](src/app/[slug]/dashboard/page.tsx), [src/app/[slug]/home/page.tsx](src/app/[slug]/home/page.tsx), [src/components/landing/TenantLanding.tsx](src/components/landing/TenantLanding.tsx), [src/components/dashboard/ArrearsList.tsx](src/components/dashboard/ArrearsList.tsx), [src/components/dashboard/CashFlowChart.tsx](src/components/dashboard/CashFlowChart.tsx), [src/components/about/OrgStructure.tsx](src/components/about/OrgStructure.tsx), [src/lib/cloudinary.ts](src/lib/cloudinary.ts)

Pencarian menemukan banyak `any` pada data finance, audit metadata, konfigurasi icon, dan hasil API. Ini menghilangkan pemeriksaan kontrak dan membuat refactor berisiko.

**Perbaikan:** gunakan tipe Prisma payload, `unknown` di boundary, schema Zod, dan tipe icon React yang sesuai.

```ts
const body: unknown = await request.json();
const parsed = auditSchema.parse(body);

const metadata: Prisma.JsonObject = {
  description,
  userName,
};
```

### [MEDIUM] Logic page terlalu imperatif dan menyembunyikan error

**File:** [src/app/[slug]/dashboard/page.tsx](src/app/[slug]/dashboard/page.tsx), [src/app/[slug]/home/page.tsx](src/app/[slug]/home/page.tsx), [src/app/[slug]/profil/page.tsx](src/app/[slug]/profil/page.tsx)

Page menginisialisasi banyak variabel `any` ke `null`/array kosong, melakukan banyak query dan transformasi dalam satu fungsi, lalu memakai fallback ketika database error. Ini membuat page sulit diuji dan berpotensi merender dashboard parsial tanpa sinyal yang jelas.

**Perbaikan:** pindahkan query ke server service yang typed, gunakan `Promise.all` untuk query independen, dan gunakan `error.tsx`/observability untuk kegagalan fatal. Page sebaiknya terutama mengorkestrasi params, guard, dan komponen.

## Temuan Prioritas Rendah / Maintainability

### [LOW] Import tidak terpakai dan dead dependency di service finance

**File:** [src/features/finance/services/transaction.service.ts](src/features/finance/services/transaction.service.ts)

`createAuditLog` diimport tetapi tidak digunakan. Ini adalah indikasi drift setelah audit dipindahkan ke layer action dan menambah noise pada dependency graph.

**Perbaikan:** hapus import jika audit memang dilakukan di action; atau pindahkan audit ke service dengan actor yang eksplisit agar semua jalur mutasi tercatat konsisten.

### [LOW] Duplikasi adapter database

**File:** [src/lib/prisma.ts](src/lib/prisma.ts), [src/lib/db.ts](src/lib/db.ts), [src/server/db/prisma.ts](src/server/db/prisma.ts)

`lib/prisma.ts` dan `lib/db.ts` menjadi re-export/alias ke Prisma server layer, sementara sebagian modul mengimpor dari `@/lib/prisma` dan sebagian dari `@/lib/db`. Ini memperbesar permukaan migrasi dan menyulitkan aturan import.

**Perbaikan:** tetapkan satu public server-only import, misalnya `@/server/db/prisma`, lalu migrasikan import secara bertahap.

### [LOW] `useEffect` fetching di komponen/page client tanpa kontrak request terpusat

**File:** [src/app/[slug]/project/page.tsx](src/app/[slug]/project/page.tsx), [src/components/cms/CmsAccessPage.tsx](src/components/cms/CmsAccessPage.tsx), [src/features/ai-assistant/components/ChatWindow.tsx](src/features/ai-assistant/components/ChatWindow.tsx)

Fetching manual dalam `useEffect` perlu menangani loading, cancellation, retry, stale response, dan error secara konsisten. Untuk data yang cocok dirender server, pendekatan ini juga mengorbankan initial render dan cache App Router.

**Perbaikan:** gunakan Server Component untuk initial data; untuk client data yang benar-benar interaktif gunakan library data fetching atau helper typed dengan `AbortController`.

```ts
useEffect(() => {
  const controller = new AbortController();
  void fetch(url, { signal: controller.signal })
    .then(parseJson)
    .then(setData)
    .catch((error) => {
      if (error.name !== "AbortError") setError(error);
    });
  return () => controller.abort();
}, [url]);
```

### [LOW] Script lint tidak kompatibel dengan dependency Next saat ini

**File:** [package.json](package.json)

Dependency menggunakan `next: ^16.3.1`, sedangkan script masih `next lint`. Pada instalasi yang diaudit, command gagal karena executable Next belum tersedia, dan Next versi baru juga tidak sebaiknya bergantung pada command lint legacy. `eslint-config-next` masih versi `14.2.3`, tidak sejajar dengan Next 16.

**Perbaikan:** pasang dependency (`npm ci`), gunakan ESLint CLI/flat config yang sesuai, dan sejajarkan versi `eslint-config-next` dengan Next. Contoh:

```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "npm run test:security"
  }
}
```

Tambahkan config ESLint yang benar untuk versi yang dipilih sebelum mengubah script.

### [LOW] Test suite belum memiliki script agregat

**File:** [package.json](package.json), [tests/contracts/routes-and-pages.test.ts](tests/contracts/routes-and-pages.test.ts), [tests/unit/](tests/unit/)

Repository memiliki contract dan unit test, tetapi `package.json` hanya mendefinisikan `test:security`. `npm test` gagal dengan `Missing script: "test"`, sehingga CI atau developer dapat keliru mengira seluruh test sudah dijalankan.

**Perbaikan:** definisikan test runner eksplisit dan masukkan semua suite.

```json
{
  "scripts": {
    "test": "tsx --tsconfig tsconfig.json tests/run-all.ts",
    "test:security": "tsx --tsconfig tsconfig.json tests/security/authorization.test.ts"
  }
}
```

Atau gunakan runner yang sudah dipakai project dan buat command terpisah untuk contract/unit.

### [LOW] Root layout memakai `dangerouslySetInnerHTML`

**File:** [src/app/layout.tsx](src/app/layout.tsx)

Script tema inline saat ini statis dan tidak menerima input user, jadi bukan XSS langsung. Namun pola ini perlu dipertahankan sangat ketat karena CSP nonce, lint security, dan perubahan future yang menyisipkan nilai dinamis dapat membuatnya rawan.

**Perbaikan:** pertahankan script sebagai konstanta statis yang direview, atau gunakan mekanisme theme bootstrap resmi dengan nonce/CSP yang konsisten. Jangan interpolasikan environment atau data pengguna ke `__html`.

## Temuan yang Perlu Verifikasi Lanjutan

1. Kebijakan apakah member biasa memang boleh membaca seluruh finance harus diputuskan product owner; temuan tetap berisiko karena data transaksi sensitif.
2. Endpoint portfolio mungkin sengaja publik, tetapi kontrak publik harus memastikan `email` dan `nim` tidak keluar.
3. Pastikan route tenant yang sebenarnya konsisten antara `[slug]` dan pola URL universitas/program/kelas; beberapa pesan error masih menyebut format lama.
4. Tambahkan test integration untuk request dengan cookie sesi palsu, user multi-tenant, member tanpa CMS role, dan cross-tenant object ID.

## Hasil Validasi Audit

- Branch aktif: `development`.
- Workspace diagnostics: tidak melaporkan error pada folder yang diperiksa.
- `npm run lint`: tidak dapat dijalankan melalui PowerShell karena execution policy dan dependency/executable lokal belum siap; `npm.cmd run lint` kemudian gagal karena `next` tidak ditemukan.
- `npm test -- --runInBand`: gagal karena script `test` tidak didefinisikan.
- `npx tsc --noEmit`: tidak tervalidasi karena TypeScript lokal belum tersedia dan `npx` meminta instalasi paket `tsc`.

Kegagalan command di atas adalah gap tooling/environment yang harus dibereskan agar audit statis dan test dapat menjadi bagian CI yang dapat dipercaya.

## Urutan Remediasi yang Disarankan

1. Perbaiki session token dan tambahkan regression test impersonation.
2. Satukan tenant context dan tambahkan test multi-tenant.
3. Tutup authorization gap pada task dan finance.
4. Kunci DTO portfolio publik serta upload/storage.
5. Tambahkan transaction database untuk operasi multi-langkah.
6. Perbaiki audit actor dan tenant column.
7. Hilangkan `any`/unused import secara bertahap.
8. Benahi script lint, typecheck, dan test lalu pasang di CI.
