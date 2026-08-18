import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to populate the database with initial data...');

  const memberPassword = await hash('password123', 12);
  const superAdminPassword = await hash('superadmin123', 12);
  const adminKycPassword = await hash('adminkyc123', 12);

  const university = await prisma.university.upsert({
    where: { slug: 'universitas-pamulang' },
    update: {},
    create: {
      name: 'Universitas Pamulang',
      slug: 'universitas-pamulang',
    },
  });

  const program = await prisma.studyProgram.upsert({
    where: {
      universityId_slug: { universityId: university.id, slug: 'teknik-informatika' },
    },
    update: {},
    create: {
      universityId: university.id,
      name: 'Teknik Informatika',
      slug: 'teknik-informatika',
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { programId_slug: { programId: program.id, slug: '03TPLE004' } },
    update: {},
    create: {
      universityId: university.id,
      programId: program.id,
      name: '03TPLE004',
      slug: '03TPLE004',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Kelas dibuat:', tenant.name);

  const superAdminKyc = await prisma.user.upsert({
    where: { email: 'superadmin@kalivergo.id' },
    update: {
      name: 'Super Admin KYC',
      nim: '0000000000',
      platformRole: 'SUPER_ADMIN_KYC',
      isVerified: true,
      kycStatus: 'APPROVED',
      password: superAdminPassword,
      address: 'Jl. Teknologi No. 1, Jakarta',
      phone: '081234567890',
    },
    create: {
      email: 'superadmin@kalivergo.id',
      name: 'Super Admin KYC',
      nim: '0000000000',
      platformRole: 'SUPER_ADMIN_KYC',
      isVerified: true,
      kycStatus: 'APPROVED',
      password: superAdminPassword,
      address: 'Jl. Teknologi No. 1, Jakarta',
      phone: '081234567890',
    },
  });
  console.log('Super Admin KYC dibuat:', superAdminKyc.name);

  const adminKycPending = await prisma.user.upsert({
    where: { email: 'adminkyc@kalivergo.id' },
    update: {
      name: 'Admin KYC Pending',
      nim: '0000000002',
      platformRole: 'ADMIN_KYC',
      isVerified: false,
      kycStatus: 'PENDING',
      password: adminKycPassword,
      address: 'Jl. Contoh No. 123, Bandung',
      phone: '081234567891',
    },
    create: {
      email: 'adminkyc@kalivergo.id',
      name: 'Admin KYC Pending',
      nim: '0000000002',
      platformRole: 'ADMIN_KYC',
      isVerified: false,
      kycStatus: 'PENDING',
      password: adminKycPassword,
      address: 'Jl. Contoh No. 123, Bandung',
      phone: '081234567891',
    },
  });
  console.log(' Admin KYC (Pending) created:', adminKycPending.name);

  const member = await prisma.user.upsert({
    where: { email: 'jundi@kalivergo.id' },
    update: {},
    create: {
      email: 'jundi@kalivergo.id',
      name: 'Jundi Lesmana',
      nim: '1234567890',
      isVerified: true,
      password: memberPassword,
    },
  });

  await prisma.tenantMembership.upsert({
    where: { userId_tenantId: { userId: member.id, tenantId: tenant.id } },
    update: { role: 'OWNER' },
    create: { userId: member.id, tenantId: tenant.id, role: 'OWNER' },
  });
  console.log(' Member created:', member.name);

  const cmsMember = await prisma.user.upsert({
    where: { email: 'bendahara@kalivergo.id' },
    update: {},
    create: {
      email: 'bendahara@kalivergo.id',
      name: 'Budi Bendahara',
      nim: '1111111111',
      isVerified: true,
      password: memberPassword,
    },
  });

  await prisma.tenantMembership.upsert({
    where: { userId_tenantId: { userId: cmsMember.id, tenantId: tenant.id } },
    update: { role: 'MEMBER', cmsRole: 'TREASURER' },
    create: { userId: cmsMember.id, tenantId: tenant.id, role: 'MEMBER', cmsRole: 'TREASURER' },
  });
  console.log('CMS member role (TREASURER) created.:', cmsMember.name);

  const secretaryMember = await prisma.user.upsert({
    where: { email: 'sekretaris@kalivergo.id' },
    update: {},
    create: {
      email: 'sekretaris@kalivergo.id',
      name: 'Sari Sekretaris',
      nim: '2222222222',
      isVerified: true,
      password: memberPassword,
    },
  });

  await prisma.tenantMembership.upsert({
    where: { userId_tenantId: { userId: secretaryMember.id, tenantId: tenant.id } },
    update: { role: 'MEMBER', cmsRole: 'SECRETARY' },
    create: { userId: secretaryMember.id, tenantId: tenant.id, role: 'MEMBER', cmsRole: 'SECRETARY' },
  });
  console.log('CMS member role (SECRETARY) created:', secretaryMember.name);

  await prisma.task.create({
    data: {
      tenantId: tenant.id,
      title: 'Tugas Setup Server & Database',
      description: 'Belajar setup PostgreSQL, Prisma, dan Next.js',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Task created');

  await prisma.seminar.create({
    data: {
      tenantId: tenant.id,
      title: 'Seminar AI & Machine Learning',
      description: 'Pengenalan dasar Artificial Intelligence dan implementasinya',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: 'Ruang Aula Utama',
    },
  });
  console.log('The seminar was organized.');

  await prisma.schedule.create({
    data: {
      tenantId: tenant.id,
      title: 'Rapat Koordinasi Bulanan',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: '19:00',
      location: 'Discord Server',
      type: 'MEETING',
    },
  });
  console.log('The schedule has been created.');

  await prisma.transaction.create({
    data: {
      tenantId: tenant.id,
      type: 'INCOME',
      amount: 500000,
      description: 'Kas Awal Kelas Bulan Ini',
      date: new Date(),
      createdBy: 'System',
    },
  });

  await prisma.transaction.create({
    data: {
      tenantId: tenant.id,
      type: 'EXPENSE',
      amount: 150000,
      description: 'Pembelian Spidol, Penghapus, dan ATK',
      date: new Date(),
      createdBy: 'System',
    },
  });
  console.log('Financial transaction created');

  const incomeCategories = [
    { name: 'Uang kas', type: 'INCOME' },
    { name: 'Kolektif', type: 'INCOME' },
    { name: 'Reimbuse', type: 'INCOME' },
    { name: 'Reward', type: 'INCOME' },
  ];

  const expenseCategories = [
    { name: 'Acara', type: 'EXPENSE' },
    { name: 'Representasi', type: 'EXPENSE' },
    { name: 'Operasional', type: 'EXPENSE' },
    { name: 'Lainnya', type: 'EXPENSE' },
  ];

  for (const cat of [...incomeCategories, ...expenseCategories]) {
    const exists = await prisma.category.findFirst({
      where: { tenantId: tenant.id, name: cat.name, type: cat.type },
    });
    if (!exists) {
      await prisma.category.create({
        data: { tenantId: tenant.id, name: cat.name, type: cat.type },
      });
    }
  }
  console.log(' Kategori Transaksi dibuat');

  const uangKasDateLabels = [
    '05 September',
    '12 September',
    '19 September',
    '26 September',
    '03 Oktober',
    '10 Oktober',
    '17 Oktober',
    '24 Oktober',
    '31 Oktober',
    '07 November',
    '14 November',
    '21 November',
    '28 November',
    '05 Desember',
    '12 Desember',
    '19 Desember',
  ];

  const monthMap: Record<string, string> = {
    januari: '01',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
  };

  const currentYear = new Date().getFullYear();


  for (const label of uangKasDateLabels) {
    const parts = label.split(' ');
    const day = parts[0].padStart(2, '0');
    const monthName = (parts[1] || '').toLowerCase();
    const month = monthMap[monthName] || '01';
    const iso = `${currentYear}-${month}-${day}`;
    const date = new Date(iso);

    const existing = await prisma.uangKasSchedule.findFirst({
      where: { date, tenantId: tenant.id },
    });
    if (!existing) {
      await prisma.uangKasSchedule.create({
        data: {
          tenantId: tenant.id,
          date,
          amount: 10000,
          description: `Uang kas - ${label}`,
        },
      });
    }
  }
  console.log('A cash schedule is prepared.');

  console.log('Database seeding successful!');
  console.log('Login member (OWNER): jundi@kalivergo.id');
  console.log(' Login CMS (TREASURER): bendahara@kalivergo.id');
  console.log(' Login CMS (SECRETARY): sekretaris@kalivergo.id');
  console.log(' Login SUPER_ADMIN_KYC: superadmin@kalivergo.id');
  console.log(' Login ADMIN_KYC (pending): adminkyc@kalivergo.id');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });