'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { CLASS_ROLES, readSessionUser, resolveTenantId, hasCmsAccess } from './role-model';
import { createAuditLog } from './audit';
import { deleteKtmFromKYC, deleteSelfieFromKYC } from '@/features/kyc/services/kyc-storage.service';
import { sendMemberApprovalEmail } from '@/lib/email';
import { CmsRole } from '@prisma/client';
import { env } from '@/config/env';
import { deleteFromCloudinary, extractPublicIdFromUrl } from '@/server/storage/cloudinary';

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
    const profilePhotoUrl =
      application.profilePhotoStorageKey && cloudName
        ? `https://res.cloudinary.com/${cloudName}/image/upload/${application.profilePhotoStorageKey}`
        : null;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, image: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        ...(existingUser && !existingUser.image && profilePhotoUrl
          ? { image: profilePhotoUrl }
          : {}),
      },
    });

    await prisma.memberApplication.update({
      where: { id: application.id },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: session.id },
    });

    try {
      const memberEmail = application.email || null;
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, customSlug: true },
      });

      if (memberEmail && tenant?.customSlug) {
        const baseUrl = env.baseUrl ?? 'http://localhost:3000';
        const tenantUrl = `${baseUrl}/${tenant.customSlug}`;
        await sendMemberApprovalEmail(
          memberEmail,
          application.fullName || 'Anggota',
          tenant.name,
          tenantUrl
        );
      }
    } catch (emailError) {
      console.error('Error sending member approval email:', emailError);
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const application = await prisma.memberApplication.findFirst({
      where: { userId, tenantId },
      select: {
        id: true,
        profilePhotoStorageKey: true,
        ktmPhotoStorageKey: true,
      },
    });

    const membership = await prisma.tenantMembership.findFirst({ where: { userId, tenantId } });

    if (user?.email) {
      try {
        const { sendMemberRejectionEmail } = await import('@/lib/email');
        await sendMemberRejectionEmail(user.email, user.name || 'Anggota');
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
      }
    }

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

export async function deleteUser(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const tenantId = (formData.get('tenantId') as string)?.trim() || await resolveTenantId();
    if (!userId || !tenantId) return;

    const session = await readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menghapus anggota.' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        ktpStorageKey: true,
        tenantMemberships: {
          where: { tenantId },
          select: { role: true },
        },
        memberApplications: {
          where: { tenantId },
          select: {
            profilePhotoStorageKey: true,
            ktmPhotoStorageKey: true,
          },
        },
        ownerApplications: {
          select: {
            selfieStorageKey: true,
            ktmStorageKey: true,
          },
        },
      },
    });

    if (!user) {
      return { error: 'User tidak ditemukan' };
    }

    const isOwner = user.tenantMemberships.some(m => m.role === 'OWNER');
    if (isOwner) {
      return { error: 'Tidak dapat menghapus akun OWNER kelas.' };
    }

    if (user.id === session.id) {
      return { error: 'Tidak dapat menghapus akun sendiri.' };
    }

    const cloudName = env.cloudinaryCloudName;

    if (user.image && cloudName) {
      const publicId = extractPublicIdFromUrl(user.image);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId, 'image');
        } catch (err) {
          console.error('Failed to delete profile image from Cloudinary:', err);
        }
      }
    }

    if (user.ktpStorageKey && cloudName) {
      try {
        await deleteFromCloudinary(user.ktpStorageKey, 'image');
      } catch (err) {
        console.error('Failed to delete KTP from Cloudinary:', err);
      }
    }

    for (const app of user.memberApplications) {
      if (app.profilePhotoStorageKey && cloudName) {
        try {
          await deleteFromCloudinary(app.profilePhotoStorageKey, 'image');
        } catch (err) {
          console.error('Failed to delete member profile photo from Cloudinary:', err);
        }
      }
      if (app.ktmPhotoStorageKey && cloudName) {
        try {
          await deleteFromCloudinary(app.ktmPhotoStorageKey, 'image');
        } catch (err) {
          console.error('Failed to delete member KTM from Cloudinary:', err);
        }
      }
    }

    for (const app of user.ownerApplications) {
      if (app.selfieStorageKey && cloudName) {
        try {
          await deleteFromCloudinary(app.selfieStorageKey, 'image');
        } catch (err) {
          console.error('Failed to delete owner selfie from Cloudinary:', err);
        }
      }
      if (app.ktmStorageKey && cloudName) {
        try {
          await deleteFromCloudinary(app.ktmStorageKey, 'image');
        } catch (err) {
          console.error('Failed to delete owner KTM from Cloudinary:', err);
        }
      }
    }

    await prisma.transaction.deleteMany({
      where: { userId: user.id, tenantId },
    });

    await prisma.auditLog.deleteMany({
      where: { actorUserId: user.id },
    });

    await prisma.user.delete({
      where: { id: user.id },
    });

    await createAuditLog(
      'PEOPLE',
      'DELETE',
      `Menghapus anggota: ${user.name} (${user.email}) dari kelas`,
      session.id,
      { userId: user.id, tenantId }
    );

    revalidatePath('/cms/people');
    return { success: 'Akun berhasil dihapus beserta seluruh datanya.' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { error: 'Gagal menghapus akun. Silakan coba lagi.' };
  }
}