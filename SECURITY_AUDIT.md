# Audit Keamanan Kalivergo

**Branch:** `development`  
**Tanggal:** 2026-08-27  
**Cakupan:** `src/app/api/**`, `src/middleware.ts`, Server Actions, session/token, tenant authorization, form input, upload, dan output rendering.

> Audit ini bersifat read-only. Patch di bawah adalah rekomendasi spesifik dan belum diterapkan.

## Ringkasan Risiko

Risiko tertinggi berada pada mekanisme session custom dan kontrol tenant. Aplikasi mempercayai JSON cookie `kalivergo_user` sebagai identitas, sementara cookie tersebut tidak ditandatangani dan tidak diverifikasi ulang ke database. Karena endpoint API menggunakan `session.id` untuk memilih resource, masalah ini dapat berkembang menjadi impersonasi dan akses lintas akun.

Prioritas remediation:

1. Migrasikan session custom ke NextAuth server session atau opaque session token yang disimpan server-side.
2. Hilangkan ketergantungan pada `tenantId` dari cookie/request; resolve tenant dari route lalu validasi membership server-side.
3. Tambahkan guard CMS pada semua operasi mutasi dan akses data sensitif.
4. Seragamkan validasi Zod pada seluruh JSON/FormData dan perketat upload.
5. Perbaiki token reset password, rate limiting, CSRF defense, dan test regresi authorization.

## Temuan Terverifikasi

### SEC-01 - Critical: session identity dapat dipalsukan

**Lokasi:** [src/server/auth/session.ts](src/server/auth/session.ts), [src/shared/auth/session.ts](src/shared/auth/session.ts), [src/middleware.ts](src/middleware.ts)

`setCurrentSessionUser()` menaruh object user lengkap ke cookie `kalivergo_user`. `parseSessionCookie()` hanya menjalankan `JSON.parse()` lalu memeriksa `id` adalah string. Tidak ada signature, token expiry yang diverifikasi, atau lookup database untuk memastikan identitas dan role masih valid.

`httpOnly: true` membantu mencegah pembacaan cookie dari JavaScript, tetapi tidak menjadikan isi cookie trusted. Client yang dapat mengirim request dapat mencoba mengirim cookie dengan `id`, role, atau memberships yang dimanipulasi.

**Dampak:** impersonasi, akses resource berdasarkan user lain, kemungkinan melewati pemeriksaan role yang membaca `platformRole`, `role`, atau `memberships` dari cookie.

**Patch yang direkomendasikan:** gunakan NextAuth `getServerSession(authOptions)` secara konsisten, atau buat opaque token acak yang hanya memuat session ID. Simpan session di database/Redis dan jangan jadikan role pada cookie sebagai sumber kebenaran.

```ts
// server/auth/session.ts - arah implementasi dengan opaque token
import { randomBytes } from "node:crypto";

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getCurrentSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  return session?.user ?? null;
}
```

Tambahkan migration untuk tabel session, rotasi session setelah login, dan revocation saat logout/password change. Perlu dilakukan juga pada `middleware`: middleware tidak boleh autorisasi hanya dengan `parseSessionCookie()`.

### SEC-02 - High: `POST /api/tasks` tidak memeriksa CMS authorization

**Lokasi:** [src/app/api/tasks/route.ts](src/app/api/tasks/route.ts)

Handler `POST` memeriksa sesi dan tenant, tetapi tidak memanggil `requireTenantCmsAccess()`. Handler lalu meneruskan input ke `createTaskForTenant()`. Anggota biasa yang memiliki membership berpotensi membuat task.

**Patch:**

```ts
import { requireTenantCmsAccess } from "@/lib/tenant";
import { createTaskSchema } from "@/features/task/validators/task.schema";

// setelah tenantId ditemukan
try {
  await requireTenantCmsAccess(session.id, tenantId);
} catch {
  return NextResponse.json({ error: "CMS access required" }, { status: 403 });
}

const parsed = createTaskSchema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json({ error: "Data tugas tidak valid" }, { status: 400 });
}

const task = await createTaskForTenant({
  tenantId,
  ...parsed.data,
});
```

Guard harus tetap berada di action/service boundary. Jangan mengandalkan middleware karena `middleware` sengaja melewati `/api`.

### SEC-03 - High: tenant context dapat salah dan bergantung pada cookie/client choice

**Lokasi:** [src/features/task/actions/task.action.ts](src/features/task/actions/task.action.ts), [src/server/tenant/context.ts](src/server/tenant/context.ts), [src/middleware.ts](src/middleware.ts)

`getTenantIdFromCookie()` mengambil `session.memberships[0].tenantId`. Pada user multi-tenant, task dapat dibuat pada tenant pertama walaupun user sedang berada di tenant lain. `kalivergo_tenant` juga diset `httpOnly: false`, dan `getValidatedCurrentTenant()` menerima `tenantId` dari cookie tersebut.

Membership check memang mengurangi akses lintas tenant, tetapi tidak menjamin operasi mengikuti route aktif. Ini merupakan bug authorization/context yang serius pada aplikasi multi-tenant.

**Patch:** route page/action harus meneruskan `slug`; tenant harus di-resolve dari `slug` dan status aktif, lalu membership diverifikasi terhadap hasil itu.

```ts
export async function createTaskAction(
  tenantSlug: string,
  formData: FormData,
) {
  const session = await requireSessionUser();
  const tenant = await resolveTenantFromRoute({ slug: tenantSlug });
  if (!tenant) return { error: "Tenant tidak ditemukan" };

  await requireTenantCmsAccess(session.id, tenant.tenantId);
  const input = createTaskSchema.parse(Object.fromEntries(formData));

  return createTaskForTenant({
    tenantId: tenant.tenantId,
    ...input,
  });
}
```

Untuk API, gunakan route seperti `/api/tenants/[tenantSlug]/tasks` atau derive slug dari URL yang telah divalidasi; jangan menerima tenant ID arbitrary sebagai sumber otorisasi.

### SEC-04 - High: finance GET mengembalikan data sensitif ke member biasa

**Lokasi:** [src/app/api/finance/route.ts](src/app/api/finance/route.ts)

Handler `GET` hanya memastikan sesi memiliki tenant context. Tidak ada `requireTenantCmsAccess()`, padahal response berisi daftar transaksi dan summary pemasukan/pengeluaran. Bila finance hanya untuk pengurus, setiap member tenant dapat membacanya.

**Patch:**

```ts
const session = await getCurrentSessionUser();
if (!session?.id) return jsonError("Unauthorized", 401);

const tenant = await getCurrentTenantForUser(session.id);
if (!tenant) return jsonError("Tenant access denied", 403);

try {
  await requireTenantCmsAccess(session.id, tenant.tenantId);
} catch {
  return jsonError("Finance access denied", 403);
}
```

Jika member memang boleh melihat ringkasan, buat endpoint terpisah yang hanya mengirim aggregate tanpa description, invoice, creator, atau detail transaksi.

### SEC-05 - High: portfolio API dapat mengekspos PII dan query lintas tenant

**Lokasi:** [src/app/api/portofolio/get/route.ts](src/app/api/portofolio/get/route.ts), [src/features/portfolio/services/portfolio.service.ts](src/features/portfolio/services/portfolio.service.ts), [src/features/portfolio/repositories/portfolio.repository.ts](src/features/portfolio/repositories/portfolio.repository.ts)

Endpoint GET tidak membutuhkan autentikasi dan menerima `userId` arbitrer. `portfolioSelect` mengembalikan `email` dan `nim`. Query username menggunakan substring pada email atau nama dan tidak memastikan tenant aktif.

**Dampak:** enumeration user, kebocoran email/NIM, dan response profile yang tidak sesuai tenant.

**Patch:** pisahkan DTO public dan private, gunakan exact identifier, serta scope tenant.

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

const user = await prisma.user.findFirst({
  where: {
    name: username,
    tenantMemberships: { some: { tenantId } },
  },
  select: publicPortfolioSelect,
});
```

### SEC-06 - High: upload image hanya memercayai MIME client

**Lokasi:** [src/features/portfolio/services/profile-image.service.ts](src/features/portfolio/services/profile-image.service.ts), [src/lib/kyc/validation.ts](src/lib/kyc/validation.ts), [src/app/api/upload-profile/route.ts](src/app/api/upload-profile/route.ts)

Validasi memakai `file.type` dan ukuran. MIME adalah metadata dari client dan bukan bukti bahwa bytes file benar-benar image. Belum terlihat pemeriksaan magic bytes, dimensi, rate limit, atau quota per user.

Untuk KYC, `validateSelfieFile()` memakai allowlist MIME yang lebih baik, tetapi tetap belum memverifikasi signature file. Untuk invoice pada [src/app/api/finance/route.ts](src/app/api/finance/route.ts), file hanya dibaca sebagai object dan URL lokal dibentuk dari filename; file tidak benar-benar di-upload melalui storage service.

**Patch:** gunakan image parser/server-side sanitizer, allowlist format, batas dimensi, dan upload ke storage dengan object key acak.

```ts
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 2 * 1024 * 1024;

if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_SIZE) {
  return { error: "Format atau ukuran file tidak valid" };
}

const bytes = Buffer.from(await file.arrayBuffer());
// Verifikasi magic bytes + decode/re-encode memakai image library.
const uploaded = await uploadProfileToStorage(bytes, userId);
```

Jangan memakai `file.name` sebagai path atau public ID. Terapkan antivirus/content scanning untuk dokumen KYC bila kebutuhan compliance mengharuskannya.

### SEC-07 - High: reset password memakai token yang lemah/plaintext

**Lokasi:** [src/actions/cms/auth-helper.ts](src/actions/cms/auth-helper.ts), [src/app/api/verify-forgot-password/route.ts](src/app/api/verify-forgot-password/route.ts)

`requestPasswordReset()` membuat token dengan `Math.random().toString(36).substring(2)` dan menyimpan nilai tersebut langsung sebagai `tokenHash`. `Math.random()` bukan CSPRNG, token pendek/variable, dan database leak dapat langsung dipakai untuk reset password.

Selain itu, `verify-forgot-password` menganggap request JSON selalu valid; malformed JSON jatuh ke catch umum dan menghasilkan 500. Flow reset juga perlu invalidasi semua token lama, one-time use yang atomic, dan rate limiting.

**Patch:**

```ts
const plainToken = generateVerificationToken(); // crypto.randomBytes
const tokenHash = hashToken(plainToken);

await prisma.verificationToken.deleteMany({ where: { email } });
await prisma.verificationToken.create({
  data: { email, tokenHash, newPasswordHash, expiresAt },
});
```

Pada verifikasi, hash token yang diterima sebelum query dan konsumsi token dalam transaction:

```ts
let body: unknown;
try {
  body = await request.json();
} catch {
  return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
}

const parsed = z.object({ token: z.string().min(32).max(256) }).safeParse(body);
if (!parsed.success) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

const tokenHash = hashToken(parsed.data.token);
const result = await prisma.$transaction(async (tx) => {
  const token = await tx.verificationToken.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
  });
  if (!token?.newPasswordHash) return false;

  await tx.user.update({
    where: { email: token.email },
    data: { password: token.newPasswordHash },
  });
  await tx.verificationToken.delete({ where: { id: token.id } });
  return true;
});
```

### SEC-08 - Medium: reset/registration dapat melakukan account enumeration

**Lokasi:** [src/actions/cms/auth-helper.ts](src/actions/cms/auth-helper.ts), [src/actions/registration.ts](src/actions/registration.ts)

Response membedakan email tidak terdaftar, NIM tidak cocok, akun sudah terverifikasi, nama tidak terdaftar, dan kondisi lain. Penyerang dapat mengirim banyak request untuk memetakan akun yang valid. Tidak ada rate limit yang terlihat pada login, reset, verify, atau registration.

**Patch:** untuk password reset, selalu kembalikan pesan generik dan waktu respons yang relatif seragam. Tambahkan rate limit per IP + identifier, cooldown email, dan audit event.

```ts
return {
  success: true,
  message: "Jika data cocok, instruksi akan dikirim ke email terdaftar.",
};
```

### SEC-09 - Medium: API JSON/FormData belum konsisten divalidasi

**Lokasi:** [src/app/api/tasks/route.ts](src/app/api/tasks/route.ts), [src/app/api/access/route.ts](src/app/api/access/route.ts), [src/app/api/tasks/[id]/submissions/route.ts](src/app/api/tasks/[id]/submissions/route.ts), [src/app/api/finance/route.ts](src/app/api/finance/route.ts), [src/actions/cms/finance.ts](src/actions/cms/finance.ts), [src/actions/cms/people.ts](src/actions/cms/people.ts)

Sebagian route memakai Zod untuk seminar, tetapi task/access/submissions/finance banyak melakukan cast langsung: `as string`, `parseFloat(...) || 10000`, `new Date(...)`, dan menerima array/user IDs tanpa batas panjang atau format ID. `parseFloat(...) || 10000` sangat berbahaya secara bisnis karena input nominal invalid diam-diam menjadi 10.000.

**Patch:** semua boundary harus memakai schema.

```ts
const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().finite().positive(),
  description: z.string().trim().min(1).max(500),
  date: z.coerce.date(),
  categoryId: z.string().cuid(),
  userId: z.string().cuid(),
});

const parsed = transactionSchema.safeParse({
  type: formData.get("type"),
  amount: formData.get("amount"),
  description: formData.get("description"),
  date: formData.get("date"),
  categoryId: formData.get("categoryId"),
  userId: formData.get("userId"),
});
if (!parsed.success) return { error: "Data transaksi tidak valid" };
```

Validasi juga harus membatasi panjang string, jumlah array, enum role/module, tanggal, dan relasi object terhadap tenant.

### SEC-10 - Medium: userId/tenantId dari form menjadi authorization input

**Lokasi:** [src/actions/cms/people.ts](src/actions/cms/people.ts), [src/actions/cms/finance.ts](src/actions/cms/finance.ts), [src/app/api/member/route.ts](src/app/api/member/route.ts), [src/app/api/portofolio/update/route.ts](src/app/api/portofolio/update/route.ts)

Beberapa handler menerima `tenantId`, `userId`, atau target ID dari form/body. Sebagian sudah memeriksa membership/object tenant, tetapi pola ini harus dianggap tidak trusted. `acceptUser`, `rejectUser`, dan `updateUserRole` memakai tenant dari form bila tersedia sebelum fallback ke context. `finance POST` menerima `userId` lalu membuat transaksi setelah hanya memvalidasi category tenant; belum terlihat validasi bahwa user tersebut memang member tenant.

**Patch:** target tenant harus berasal dari route/context server. Untuk semua foreign key, lakukan query scoped:

```ts
const member = await prisma.tenantMembership.findUnique({
  where: { userId_tenantId: { userId, tenantId } },
});
if (!member) return { error: "Anggota bukan bagian dari tenant" };
```

Jangan memperbolehkan client mengubah owner/platform role melalui field form. Gunakan allowlist enum dan aturan transisi role.

### SEC-11 - Medium: CSRF defense untuk cookie-authenticated API belum eksplisit

**Lokasi:** seluruh `src/app/api/**` POST/PUT/DELETE dan Server Actions

API memakai cookie sebagai autentikasi. Cookie `sameSite: "lax"` memberi perlindungan sebagian, tetapi tidak menggantikan CSRF defense, terutama bila ada integrasi browser, subdomain, proxy, atau endpoint yang dapat dipanggil lewat navigasi/form. Tidak terlihat pemeriksaan `Origin`/`Referer` atau CSRF token pada mutasi API.

**Patch:** untuk mutasi browser, validasi `Origin` terhadap allowlist origin; untuk form/API yang cross-site legitimate, gunakan synchronizer token atau double-submit token. Terapkan helper bersama:

```ts
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    throw new Error("Invalid request origin");
  }
}
```

Jalankan sebelum body mutation dan tambahkan `Cache-Control: no-store` untuk response sensitif. Pastikan logout tidak hanya GET; gunakan POST untuk perubahan state.

### SEC-12 - Medium: logout state-changing menggunakan GET

**Lokasi:** [src/app/api/auth/logout/route.ts](src/app/api/auth/logout/route.ts)

Logout dilakukan melalui `GET`, menghapus cookie, lalu redirect. GET seharusnya safe/idempotent dari perspektif browser dan crawler. Walau dampak biasanya rendah, pola ini dapat membuat logout paksa melalui link eksternal dan tidak konsisten dengan CSRF policy.

**Patch:** sediakan `POST /api/auth/logout`, validasi origin/CSRF, lalu hapus kedua cookie (`kalivergo_user` dan `kalivergo_tenant`) melalui response cookie. Pertahankan GET hanya sebagai compatibility redirect bila benar-benar diperlukan.

## XSS dan Injection

### Hasil pemeriksaan

- Tidak ditemukan raw SQL atau interpolasi SQL; Prisma query memakai object filter. SQL injection belum terverifikasi.
- `dangerouslySetInnerHTML` ditemukan di [src/app/layout.tsx](src/app/layout.tsx) untuk script bootstrap tema yang statis. Ini bukan XSS langsung selama string tidak menerima input dinamis.
- Render React normal melakukan escaping secara default. Namun response AI, metadata audit, dan field profile harus dirender sebagai text/Markdown yang disanitasi, bukan HTML mentah.
- Jangan menambahkan `dangerouslySetInnerHTML` untuk description, bio, audit metadata, nama user, atau response AI. Bila rich text diperlukan, sanitasi allowlist server-side dengan library terpercaya sebelum render.

**Hardening CSP:** tambahkan Content-Security-Policy dengan nonce untuk inline bootstrap script, atau pindahkan bootstrap script ke file statis yang sesuai kebijakan CSP. Jangan menginterpolasikan `localStorage`, environment, atau user input ke `__html`.

## Middleware dan Routing

**Lokasi:** [src/middleware.ts](src/middleware.ts)

1. Middleware melewati semua `/api`; ini dapat diterima hanya jika setiap API route memiliki auth dan authorization sendiri. Buat contract test untuk memastikan setiap mutasi memiliki guard.
2. `resolveTenantFromPath()` melakukan query database untuk setiap request tenant dan menangkap error menjadi `null`. Saat database gagal, request dapat diperlakukan sebagai route publik/404. Bedakan dependency failure dari tenant tidak ditemukan.
3. `kalivergo_tenant` `httpOnly: false` memungkinkan JavaScript membaca konteks tenant. Jangan simpan authorization decision atau data sensitif di sana.
4. `isProtectedPath` memakai kondisi `!pathname.includes('/portofolio')`, sehingga aturan proteksi berdasarkan negasi substring sulit diprediksi. Gunakan allowlist route policy berbasis route segment.
5. Middleware memeriksa role dari session cookie, bukan database/session provider terverifikasi. Ini mengikuti masalah SEC-01.

## Rekomendasi Arsitektur Patch

Buat helper tunggal yang dipakai page, API, dan action:

```ts
export async function requireTenantCmsRequest(tenantSlug: string) {
  const session = await requireSessionUser();
  const tenant = await resolveTenantFromRoute({ slug: tenantSlug });
  if (!tenant) throw new NotFoundError("Tenant tidak ditemukan");

  await requireTenantCmsAccess(session.id, tenant.tenantId);
  return { session, tenant };
}
```

Kemudian setiap service menerima `tenantId` yang sudah tervalidasi, tidak membaca cookie, tidak menerima role dari body, dan melakukan object lookup dengan composite scope `{ id, tenantId }` atau query relation yang setara.

## Test Keamanan yang Wajib Ditambahkan

- Cookie session dengan `id` user lain ditolak.
- Cookie session dengan role `SUPER_ADMIN_KYC` buatan client ditolak.
- Member biasa tidak dapat `POST /api/tasks`.
- Member biasa tidak dapat membaca detail finance.
- User tenant A tidak dapat membaca/mengubah object tenant B memakai ID langsung.
- User multi-tenant selalu memakai tenant berdasarkan route aktif, bukan membership pertama.
- Portfolio publik tidak mengembalikan email/NIM.
- Token reset hanya dapat dipakai sekali, kedaluwarsa, dan disimpan sebagai hash.
- Malformed JSON/FormData menghasilkan 400, bukan 500 atau default bisnis.
- Upload file dengan MIME palsu, magic bytes salah, file terlalu besar, dan gambar berbahaya ditolak.
- Mutasi tanpa Origin/CSRF token ditolak sesuai kebijakan.
- Response error tidak membocorkan stack trace, token, password hash, KYC key, atau detail database.

## Status Verifikasi

- Branch aktif terkonfirmasi: `development`.
- Workspace diagnostics tidak melaporkan error pada file yang diperiksa.
- Audit ini tidak menjalankan penetration test eksternal atau mengirim request ke deployment produksi.
- Lint/test penuh belum dapat dijalankan pada lingkungan audit karena dependency/executable lokal belum tersedia dan script agregat `test` belum didefinisikan.
