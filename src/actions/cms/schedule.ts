'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireCmsActor, resolveTenantId } from './role-model';
import { createAuditLog } from './audit';

export async function createSchedule(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const type = formData.get('type') as string;

    const dateTime = time ? new Date(`${date}T${time}`) : new Date(date);

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const schedule = await prisma.schedule.create({
      data: { tenantId, title, date: dateTime, time, location, type },
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