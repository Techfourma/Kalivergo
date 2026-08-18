'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { CLASS_ROLES, readSessionUser, resolveTenantId, hasCmsAccess } from './role-model';
import { createAuditLog } from './audit';

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

    const session = readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menambah anggota.' };
    }

    const cmsRole = CLASS_ROLES.includes(role as any) && role !== 'MEMBER' ? (role as any) : null;

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

export async function acceptUser(userId: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan.' };

    const session = readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menerima anggota.' };
    }

    const membership = await prisma.tenantMembership.findFirst({ where: { userId, tenantId } });
    if (!membership) return { error: 'Anggota tidak ditemukan dalam kelas ini.' };

    await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
    revalidatePath('/cms/people');
    return { success: 'User diterima' };
  } catch (error: any) {
    console.error('Error accepting user:', error);
    return { error: error.message || 'Gagal menerima user' };
  }
}

export async function rejectUser(userId: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan.' };

    const session = readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menolak anggota.' };
    }

    const membership = await prisma.tenantMembership.findFirst({ where: { userId, tenantId } });
    if (!membership) return { error: 'Anggota tidak ditemukan dalam kelas ini.' };

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/cms/people');
    return { success: 'User ditolak' };
  } catch (error: any) {
    console.error('Error rejecting user:', error);
    return { error: error.message || 'Gagal menolak user' };
  }
}