# Perbaikan & Fitur Baru: Audit, Tasks, dan Task Tracker

## Ringkasan
Berisi perbaikan logika audit, penambahan fitur edit dan search pada tasks, serta perbaikan filter tanggal di Task Tracker.

## Perubahan Utama

### 1. Audit Module
- **People Audit Metadata**: Metadata audit log sekarang merepresentasikan data perubahan aktual (misal: `oldRole`, `newRole`, `membershipAction`, dll) bukan sekadar metadata tabel user
- **Finance Audit User**: Kolom user pada audit log finance kini menampilkan nama CMS actor yang menginput, bukan nama anggota transaksi
- **Export PDF Audit**: Menambahkan tombol Export PDF di card Filter Audit Log dengan template standar (nama website, universitas, program, kelas)

### 2. CMS Tasks
- **Edit Task**: Menambahkan fitur edit tugas yang sudah dibuat melalui modal dialog
- **Search Task**: Menambahkan fitur pencarian tugas di Daftar Tugas berdasarkan judul, deskripsi, dan kategori

### 3. Home Tasks (Task Tracker)
- **Search Task**: Menambahkan fitur pencarian tugas di Task Tracker
- **Date Range Fix**: Memperbaiki logika filter tanggal menggunakan overlap interval agar tugas yang sedang berjalan tetap tampil
- **Mobile Layout**: Memindahkan dropdown kategori ke samping heading dan memastikan TGL. SELESAI tidak overflow di mobile

## File yang Diubah
- `src/actions/cms/people.ts`
- `src/actions/cms/finance.ts`
- `src/actions/cms/audit.ts`
- `src/actions/cms.ts`
- `src/app/[slug]/cms/audit/page.tsx`
- `src/app/[slug]/cms/tasks/page.tsx`
- `src/app/[slug]/tasks/page.tsx`
- `src/components/cms/AuditExportButton.tsx`
- `src/components/cms/EditTaskButton.tsx`
- `src/components/cms/TaskListWithSearch.tsx`
- `src/components/home/TaskTracker.tsx`
- `src/features/cms/services/people.service.ts`
- `src/features/finance/actions/create-transaction.action.ts`
- `src/features/task/actions/task.action.ts`
- `src/features/task/repositories/task.repository.ts`
- `src/features/task/services/task.service.ts`

## Testing
- [x] TypeScript check lolos
- [x] Manual testing pada halaman yang affected
