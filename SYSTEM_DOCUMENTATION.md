# Kalivergo: System Documentation

> Audit dan dokumentasi teknis berdasarkan source code pada branch `development`. Dokumen ini menjelaskan perilaku yang teridentifikasi saat audit; rekomendasi keamanan dan refactoring diberi label secara eksplisit. *(Diperbarui 2026-09-02 — penambahan halaman tasks/schedule/information/statistics, model `Pertemuan`, dan dataset AI.)*

## 1. Tech Stack & Architecture

### Stack

- **Framework:** Next.js dengan App Router (`src/app`); tidak ditemukan `pages/` atau Pages Router.
- **Language:** TypeScript dan React.
- **Styling/UI:** Tailwind CSS melalui `tailwind.config.ts`, CSS global di `src/styles/global.css`, dan komponen UI bersama di `src/components/ui` serta `src/shared/components`.
- **State:** Zustand store yang teridentifikasi di `src/stores/theme.ts`; state lokal React dipakai pada komponen interaktif.
- **Database:** PostgreSQL melalui Prisma (`prisma/schema.prisma`). Prisma client dipusatkan di `src/server/db/prisma`; `src/lib/db.ts` dan `src/lib/prisma.ts` adalah facade tambahan.
- **Storage/email/integrations:** Cloudinary untuk media, provider email di `src/lib/email.ts` dan `src/lib/email-config.ts`, serta Gemini pada server AI assistant.
- **Validation:** Zod dipakai pada sebagian action dan endpoint, tetapi belum konsisten di seluruh API.

### Application layers

```text
src/app (pages, layouts, route handlers)
  -> src/components, src/features/*/components
  -> Server Actions atau /api route handlers
  -> feature services / repositories
  -> Prisma / Cloudinary / email / Gemini
  -> PostgreSQL atau external service
```

Sebagian besar halaman tenant, CMS, dan platform adalah async Server Components. Form, upload, chart, modal, navbar, AI widget, dan halaman interaktif tertentu adalah Client Components dengan `"use client"`. Server Actions ditandai `"use server"` dan tersebar di `src/actions`, `src/features/*/actions`, serta service owner application.

Tenant routes menggunakan `dynamic = "force-dynamic"` pada entry point yang relevan. Dengan demikian, halaman tersebut mengambil data saat request, bukan hasil build statis.

## 2. Routing & Data Fetching

### Page routes

| Area | Routes |
|---|---|
| Public/auth | `/`, `/login`, `/auth/login`, `/signup`, `/member-signup`, `/forgot-password`, `/verify-forgot-password`, `/callback`, `/terms`, `/privacy`, `/unauthorized` |
| Platform | `/platform`, `/platform/login`, `/platform/register`, `/platform/kyc`, `/platform/kyc-audit` |
| Tenant | `/:slug`, `/:slug/home`, `/:slug/tasks`, `/:slug/schedule`, `/:slug/information`, `/:slug/dashboard`, `/:slug/statistics`, `/:slug/profil`, `/:slug/seminar`, `/:slug/portofolio/:username` |
| Tenant CMS | `/:slug/cms`, `/:slug/cms/access`, `/:slug/cms/audit`, `/:slug/cms/finance`, `/:slug/cms/information`, `/:slug/cms/people`, `/:slug/cms/schedule`, `/:slug/cms/seminar`, `/:slug/cms/tasks` |

`(protected)` pada route group platform tidak menjadi bagian URL publik.

### Internal API route handlers

| Endpoint | Methods | Ringkasan |
|---|---|---|
| `/api/access` | `GET`, `PUT` | Membaca/mengelola akses owner tenant. |
| `/api/ai-assistant/chat` | `POST` | Mengirim percakapan ke AI server-side. |
| `/api/auth/logout` | `GET` | Menghapus session custom. |
| `/api/auth/[...nextauth]` | `GET`, `POST` | Handler NextAuth; terpisah dari alur custom session utama. |
| `/api/finance` | `GET`, `POST` | Data/summary finance dan pembuatan transaksi/payment. |
| `/api/member` | `GET` | Membaca membership dengan query `tenantId`. |
| `/api/portofolio/get` | `GET` | Membaca portfolio berdasarkan identifier publik. |
| `/api/portofolio/update` | `POST` | Memperbarui portfolio. |
| `/api/seminar` | `GET`, `POST` | Membaca dan membuat seminar. |
| `/api/tasks` | `GET`, `POST` | Membaca dan membuat task. |
| `/api/tasks/[id]/submissions` | `GET`, `POST` | Membaca/mengelola submission task. |
| `/api/upload-profile` | `POST`, `DELETE` | Upload atau penghapusan gambar profil. |
| `/api/verify-email` | `GET` | Verifikasi email dengan token. |
| `/api/verify-forgot-password` | `POST` | Verifikasi token reset password. |

### Rendering and data flow

- **Server-side:** page/layout tenant dan CMS menyelesaikan tenant, session, membership, dan data server sebelum render.
- **Client-side:** komponen interaktif memanggil Server Action atau endpoint internal setelah interaksi pengguna.
- **Dynamic request:** route tenant yang memakai `force-dynamic` tidak mengandalkan cache hasil build.
- **Persistence:** service/repository meneruskan operasi ke Prisma; operasi media, email, dan AI diteruskan ke adapter masing-masing.

Contoh alur tenant: `src/app/[slug]/page.tsx` -> `resolveTenantFromRoute` -> `requireTenantMembership` -> `TenantLanding`. Contoh alur task: UI/API -> `src/app/api/tasks/route.ts` atau `src/features/task/actions/task.action.ts` -> task service/repository -> Prisma. Portfolio menggunakan route handler dan service portfolio, dengan Cloudinary untuk gambar.

## 3. Data Models & Types

### Identity, organization, and access

`User`, `University`, `StudyProgram`, `Tenant`, `TenantMembership`, `OwnerApplication`, `MemberApplication`, `KycReview`, dan `AuditLog` membentuk identity, organisasi, onboarding, KYC, serta audit trail.

### Tenant operations

- `Task` dan `Submission`: tugas serta pengumpulan hasil; `Submission` kini menyimpan `pertemuanId` untuk pelacakan per pertemuan.
- `Pertemuan`: sub-bagian tugas (`taskId`, `name`); setiap tugas umumnya memiliki satu pertemuan (`upsertTaskWithPertemuanForTenant`).
- `Seminar` dan `SeminarSubmission`: seminar (termasuk `url`) dan pendaftaran/hasil terkait.
- `Schedule`: jadwal tenant (judul, tanggal, waktu, lokasi, tipe).
- `Transaction`, `CashPayment`, `UangKasSchedule`, dan `Category`: finance, kas, kategori, serta jadwal pembayaran.

### Content and interaction

`Information`, `Comment`, `Reaction`, dan `ReadMark` mendukung konten, komentar, reaksi, dan status baca. `CmsAccessPermission` menyimpan permission CMS. `VerificationToken` mendukung verifikasi dan reset credential.

### Enums and shared types

Schema memiliki enum seperti `PlatformRole`, `CmsRole`, `TenantRole`, `TenantStatus`, status aplikasi KYC, `InformationType`, dan `ReactionType`. `src/types/index.ts` mengekspos `CmsRole`, `TaskStatus`, `TransactionType`, `User`, `Task`, `TaskSubmission`, `Transaction`, `MemberArrears`, `Session`, `CMS_ROLE_HIERARCHY`, dan `FINANCE_ROLES`.

Audit menemukan type drift yang perlu diselaraskan: `TaskSubmission.fileUrl` tidak cocok dengan model `Submission`, type `CashPayment` memakai `month`/`paidAt` sedangkan Prisma memakai `date`, `Task.description` wajib pada type tetapi nullable di Prisma, dan type `Session` mengasumsikan model yang tidak ada di schema.

## 4. Feature Glossary & Component Flow

### Authentication and authorization

Login, signup, email verification, reset password, logout, platform auth, KYC, dan CMS access diimplementasikan melalui kombinasi Server Actions, route handlers, session helpers, dan database checks. Middleware menangani redirect awal untuk platform, CMS, dan tenant; setiap API tetap harus melakukan authorization sendiri karena middleware melewati API routes.

### Tenant and CMS

Tenant resolver membaca slug/context, lalu membership menentukan apakah pengguna dapat mengakses area tenant. CMS menyediakan access management, audit, finance, information, people, schedule, seminar, dan task workflows. CMS action/service meneruskan mutasi ke repository/Prisma dan biasanya melakukan revalidation setelah sukses.

### Finance

Finance route membaca transaksi/summary dan menerima mutasi transaksi atau cash payment. Detail izin berbeda menurut method: `POST` menggunakan actor CMS, sementara audit menemukan `GET` belum konsisten memakai guard CMS. Invoice pada route finance membentuk URL dari nama file; implementasinya belum menunjukkan upload storage yang lengkap.

### Tasks and submissions

Task page/API membaca task berdasarkan tenant. Action task membuat/update task dan menangani submission/revalidation. Jalur `POST /api/tasks` saat audit hanya memeriksa session dan tenant context, belum melakukan CMS access check yang setara dengan jalur CMS.

### Seminar and schedule

Seminar route membaca dan membuat seminar melalui schema/service/repository. Schedule dan seminar CMS dikelola melalui halaman/actions tenant yang sesuai.

### Portfolio and profile media

Portfolio publik dibaca lewat `/api/portofolio/get`; update memakai `/api/portofolio/update`. Profile image memakai `/api/upload-profile` dan service Cloudinary. Public DTO dan tenant scoping perlu diperketat sebelum portfolio dianggap aman untuk exposure lintas tenant.

### AI assistant

`ChatWindow` mengirim message ke `POST /api/ai-assistant/chat`. Endpoint memvalidasi tipe/panjang input, memerlukan login, lalu server AI client (`src/server/ai/*`) meneruskan request ke Gemini sehingga credential provider tetap server-side. Knowledge base diambil dari folder internal `dataset/` (`src/server/ai/knowledgeBase.ts`): memuat file `.md`/`.txt`, membangun indeks, dan me-retrieve konteks relevan berbasis term-overlap. Konfigurasi diatur lewat `GEMINI_API_KEY`, `GEMINI_MODEL`, `KNOWLEDGE_BASE_DIR`, `AI_MAX_OUTPUT_TOKENS`, `AI_MAX_INPUT_CHARS`, `AI_MAX_HISTORY_MESSAGES`, `AI_MAX_RETRIES`, dan `AI_REQUEST_TIMEOUT_MS`. Unit test tersedia melalui `npm run test:ai`.

## 5. Audit Findings & Recommendations

### Critical/high priority

1. **Custom session cookie unsigned.** `kalivergo_user` berisi object user dan hanya diparse/cek `id`; tidak ada signature, expiry verification, atau lookup identitas terbaru. Karena middleware/API mengandalkan session ini, cookie berpotensi dipalsukan. Gunakan NextAuth secara konsisten atau opaque random token yang disimpan server-side, dengan expiry dan rotation.
2. **Tenant context tidak selalu terikat pada `/:slug`.** Cookie tenant dapat diubah client dan beberapa action mengambil `memberships[0]`. Resolve tenant dari route params pada setiap server boundary dan validasi membership terhadap tenant tersebut.
3. **Authorization API tidak konsisten.** `POST /api/tasks` belum CMS-protected; `GET /api/finance` mengembalikan data finance tanpa guard yang konsisten; portfolio update mempercayai role dari session cookie. Terapkan policy helper yang sama di setiap method.
4. **Portfolio publik terlalu longgar.** Batasi query ke DTO publik eksplisit, jangan expose email/NIM, scope ke tenant, dan hindari identifier/query substring yang dapat mengakses data arbitrer.
5. **Reset token dan upload.** Reset password memakai `Math.random()` dan token plaintext pada implementasi yang teridentifikasi; gunakan `crypto.randomBytes`, hash token, expiry, invalidasi, dan konsumsi atomic. Upload memercayai MIME client; tambahkan magic-byte/decode validation, dimensi, quota/rate limit, dan re-encode.

### Validation and edge cases

Tambahkan schema Zod untuk JSON, FormData, query params, enum, ID, tanggal, array length, dan upload metadata. Saat ini task memakai `new Date(deadline)` tanpa validasi memadai, finance melakukan cast FormData, access menerima role/module arbitrary, submission hanya memeriksa array, dan malformed JSON reset dapat berakhir sebagai 500. Invalid date range dan request body kosong juga perlu menghasilkan 4xx yang terukur.

### Maintainability and data integrity

- Satukan custom auth dan NextAuth menjadi satu sumber identitas.
- Pilih satu facade Prisma dan satu tenant resolver.
- Selaraskan shared types dengan Prisma dan aktifkan `strict` secara bertahap.
- Perbaiki `revalidatePath` task agar menyertakan `/:slug`.
- Pertimbangkan `Decimal(19,2)` untuk uang, unique constraint pada `Tenant.customSlug`, relation/FK audit actor dan creator, serta constraint tenant pada submission.
- Audit README yang memiliki merge-conflict markers dan dokumen audit yang masih menyebut branch `development`.

## 6. Dead Code / Redundancy Notes

Confidence tinggi: dua facade Prisma, dua mekanisme auth, beberapa implementasi auth/reset password, dan beberapa tenant resolver hidup berdampingan. `src/actions/cms.ts` juga menjadi barrel campuran action lama dan feature action.

Confidence sedang: `Session` type serta sebagian export `src/features/*/index.ts` tampak tidak dipakai. Konfirmasi dengan dependency graph (`ts-prune`/`knip`) dan coverage runtime sebelum menghapus. Jangan menghapus berdasarkan nama file saja.

## 7. Verification Notes

Dokumen ini adalah hasil audit source-level. Audit dead code belum dibuktikan dengan runtime tracing atau coverage. Sebelum perubahan keamanan dipromosikan, jalankan test suite, typecheck/build, dan tambahkan regression tests untuk forged session, cross-tenant access, unauthorized task creation, finance read policy, public portfolio DTO, malformed payload, dan upload content validation.
