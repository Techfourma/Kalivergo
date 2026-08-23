import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai mengisi database dengan data awal...');

  const superAdminPassword = await hash('superadmin123', 12);
  const adminKycPassword = await hash('adminkyc123', 12);

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
  console.log(' Super Admin KYC dibuat:', superAdminKyc.name);

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
  console.log('Admin KYC (Pending) dibuat:', adminKycPending.name);

  console.log('Seeding database berhasil!');
  console.log('Login SUPER_ADMIN_KYC: superadmin@kalivergo.id / superadmin123');
  console.log('Login ADMIN_KYC (pending): adminkyc@kalivergo.id / adminkyc123');
  console.log('Tidak ada tenant demo. Owner membuat kelas via signup & KYC approval.');
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });