'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireCmsActor, resolveTenantId } from './role-model';
import { createAuditLog } from './audit';

export async function createSchedule(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const dateTimeStr = formData.get('dateTime') as string;
    const location = formData.get('location') as string;
    const type = formData.get('type') as string;

    const dateTime = dateTimeStr ? new Date(dateTimeStr) : new Date();
    const datePart = dateTimeStr ? dateTimeStr.split('T')[0] : '';
    const timePart = dateTimeStr ? dateTimeStr.split('T')[1]?.substring(0, 5) : '';

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const schedule = await prisma.schedule.create({
      data: { tenantId, title, date: dateTime, time: timePart, location, type },
    });

    await createAuditLog('SCHEDULE', 'CREATE', `Menambahkan jadwal: ${title}`, 'System', {
      scheduleId: schedule.id,
      title,
      date: dateTime.toISOString(),
      location,
      type,
      tenantId,
    });

    revalidatePath('/cms/schedule');
    return { success: 'Jadwal berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return { error: error.message || 'Gagal menambahkan jadwal' };
  }
}

export async function deleteSchedule(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const schedule = await prisma.schedule.findUnique({ where: { id } });
    if (!schedule) return { error: 'Jadwal tidak ditemukan' };
    if (schedule.tenantId !== tenantId) return { error: 'Akses ditolak: Jadwal bukan milik kelas Anda' };

    await prisma.schedule.delete({ where: { id } });
    await createAuditLog('SCHEDULE', 'DELETE', `Menghapus jadwal: ${schedule?.title}`, 'System', {
      scheduleId: id,
      title: schedule?.title,
      tenantId,
    });

    revalidatePath('/cms/schedule');
    return { success: 'Jadwal berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return { error: error.message || 'Gagal menghapus jadwal' };
  }
}