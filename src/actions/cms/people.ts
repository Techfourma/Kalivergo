'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { CLASS_ROLES, readSessionUser, resolveTenantId, hasCmsAccess } from './role-model';
import { createAuditLog } from './audit';
import { deleteKtmFromKYC, deleteSelfieFromKYC } from '@/features/kyc/services/kyc-storage.service';
import { generateVerificationToken, hashToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { CmsRole } from '@prisma/client';
import { env } from '@/config/env';

export async function addUser(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    const nim = (formData.get('nim') as string)?.trim();
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const role = formData.get('role') as string;

    if (!name || !nim || !email) {
      return { error: 'Nama, NIM, dan email wajib diisi.' };
    }

    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }

    const session = await readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menambah anggota.' };
    }

    const cmsRole: CmsRole | null = CLASS_ROLES.includes(role as any) && role !== 'MEMBER' ? (role as CmsRole) : null;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'Email sudah terdaftar' };
    }

    const user = await prisma.user.create({
      data: {
        name,
        nim,
        email,
        isVerified: false,
      },
    });

    await prisma.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId,
        role: 'MEMBER',
        cmsRole,
      },
    });

    await createAuditLog(
      'PEOPLE',
      'CREATE',
      `Menambahkan anggota: ${name} ke kelas`,
      undefined,
      { userId: user.id, name, nim, email, cmsRole, tenantId }
    );

    revalidatePath('/cms/people');
    return { success: 'User berhasil ditambahkan' };
  } catch (error) {
    console.error('Error adding user:', error);
    return { error: 'Gagal menambahkan user' };
  }
}

export async function acceptUser(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    if (!userId) return;

    const tenantId = (formData.get('tenantId') as string)?.trim() || await resolveTenantId();
    if (!tenantId) return;

    const session = await readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return;
    }

    const application = await prisma.memberApplication.findFirst({
      where: { userId, tenantId, status: 'PENDING_APPROVAL' },
    });
    if (!application) return;

    await prisma.tenantMembership.upsert({
      where: {
        userId_tenantId: { userId, tenantId },
      },
      update: { role: 'MEMBER', cmsRole: null },
      create: { userId, tenantId, role: 'MEMBER', cmsRole: null },
    });

    const cloudName = env.cloudinaryCloudName;
    if (application.profilePhotoStorageKey && cloudName) {
      const profilePhotoUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${application.profilePhotoStorageKey}`;
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });
      if (existingUser && !existingUser.image) {
        await prisma.user.update({
          where: { id: userId },
          data: { image: profilePhotoUrl },
        });
      }
    }

    await prisma.memberApplication.update({
      where: { id: application.id },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: session.id },
    });

    const memberEmail = application.email || null;
    if (memberEmail) {
      const plainToken = generateVerificationToken();
      const tokenHash = hashToken(plainToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.verificationToken.deleteMany({ where: { email: memberEmail } });
      await prisma.verificationToken.create({
        data: { tokenHash, email: memberEmail, expiresAt },
      });

      await sendVerificationEmail(memberEmail, application.fullName, plainToken);
    }

    await createAuditLog(
      'PEOPLE',
      'APPROVE',
      `Menerima anggota dengan ID: ${userId}`,
      session.id,
      { userId, tenantId }
    );

    revalidatePath('/cms/people');
  } catch (error) {
    console.error('Error accepting user:', error);
  }
}

export async function rejectUser(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    if (!userId) return;

    const tenantId = (formData.get('tenantId') as string)?.trim() || await resolveTenantId();
    if (!tenantId) return;

    const session = await readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return;
    }

    const application = await prisma.memberApplication.findFirst({
      where: { userId, tenantId },
      select: {
        id: true,
        profilePhotoStorageKey: true,
        ktmPhotoStorageKey: true,
      },
    });

    const membership = await prisma.tenantMembership.findFirst({ where: { userId, tenantId } });

    if (application) {
      await prisma.memberApplication.delete({ where: { id: application.id } });
    }

    if (membership) {
      await prisma.tenantMembership.delete({ where: { id: membership.id } });
    }

    await prisma.user.delete({ where: { id: userId } });

    if (application) {
      await deleteSelfieFromKYC(application.profilePhotoStorageKey);
      await deleteKtmFromKYC(application.ktmPhotoStorageKey);
    }

    await createAuditLog(
      'PEOPLE',
      'REJECT',
      `Menolak anggota dengan ID: ${userId}`,
      session.id,
      { userId, tenantId }
    );

    revalidatePath('/cms/people');
  } catch (error) {
    console.error('Error rejecting user:', error);
  }
}

export async function updateUserRole(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const role = formData.get('role') as string;

    if (!userId || !role) {
      return;
    }

    const tenantId = (formData.get('tenantId') as string)?.trim() || await resolveTenantId();
    if (!tenantId) return;

    const session = await readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return;
    }

    const membership = await prisma.tenantMembership.findFirst({
      where: { userId, tenantId },
      include: { user: true }
    });
    if (!membership) return;

    const cmsRole: CmsRole | null =
      (CLASS_ROLES as readonly string[]).includes(role) && role !== 'MEMBER'
        ? (role as CmsRole)
        : null;

    await prisma.tenantMembership.update({
      where: { id: membership.id },
      data: { cmsRole },
    });

    await createAuditLog(
      'PEOPLE',
      'UPDATE_ROLE',
      `Mengubah jabatan ${membership.user.name} menjadi ${role}`,
      session.id,
      { userId, tenantId, newRole: role }
    );

    revalidatePath('/cms/people');
  } catch (error) {
    console.error('Error updating user role:', error);
  }
}