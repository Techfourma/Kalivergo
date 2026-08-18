'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireCmsActor, resolveTenantId } from './role-model';
import { createAuditLog } from './audit';

export async function createSeminar(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = new Date(formData.get('date') as string);
    const location = formData.get('location') as string;

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const seminar = await prisma.seminar.create({
      data: { tenantId, title, description, date, location },
    });

    await createAuditLog('SEMINAR', 'CREATE', `Menambahkan seminar: ${title}`, 'System', {
      seminarId: seminar.id,
      title,
      date: date.toISOString(),
      location,
      tenantId,
    });

    revalidatePath('/cms/seminar');
    return { success: 'Seminar berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating seminar:', error);
    return { error: error.message || 'Gagal menambahkan seminar' };
  }
}

export async function deleteSeminar(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const seminar = await prisma.seminar.findUnique({ where: { id } });
    if (!seminar) return { error: 'Seminar tidak ditemukan' };
    if (seminar.tenantId !== tenantId) return { error: 'Akses ditolak: Seminar bukan milik kelas Anda' };

    await prisma.seminar.delete({ where: { id } });
    await createAuditLog('SEMINAR', 'DELETE', `Menghapus seminar: ${seminar?.title}`, 'System', {
      seminarId: id,
      title: seminar?.title,
      tenantId,
    });

    revalidatePath('/cms/seminar');
    return { success: 'Seminar berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting seminar:', error);
    return { error: error.message || 'Gagal menghapus seminar' };
  }
}