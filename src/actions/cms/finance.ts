'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { readSessionUser, requireCmsActor, requireOwner, resolveTenantId } from './role-model';
import { createAuditLog } from './audit';

function isUangKasName(name: string): boolean {
  return name.toLowerCase().includes('uang kas');
}

async function isUangKasCategory(categoryId: string, tenantId: string): Promise<boolean> {
  try {
    const category = await prisma.category.findFirst({ where: { id: categoryId, tenantId } });
    return !!category && category.name.toLowerCase().includes('uang kas');
  } catch (e) {
    console.error('Error checking uang kas category:', e);
    return false;
  }
}

async function resolveCreatorName(): Promise<string> {
  return (await readSessionUser())?.name ?? 'System';
}

export async function createTransaction(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const type = formData.get('type') as string;
    let amount = parseFloat(formData.get('amount') as string) || 10000;
    const description = formData.get('description') as string;
    const date = new Date(formData.get('date') as string);
    const categoryId = formData.get('categoryId') as string;

    if (!userId) return { error: 'Pilih anggota terlebih dahulu' };
    if (!categoryId) return { error: 'Pilih kategori transaksi' };

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const category = await prisma.category.findFirst({ where: { id: categoryId, tenantId } });
    if (!category) return { error: 'Kategori bukan milik kelas aktif' };

    if (type === 'INCOME' && (await isUangKasCategory(categoryId, tenantId))) {
      amount = 10000;
    }

    const invoiceName = formData.get('invoiceName') as string | null;
    let invoiceUrl: string | null = null;
    if (invoiceName) {
      const safeFileName = `${Date.now()}-${invoiceName.replace(/\s+/g, '_')}`;
      invoiceUrl = `/uploads/${safeFileName}`;
    }

    const creatorName = await resolveCreatorName();

    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        userId,
        type,
        amount,
        description,
        date,
        invoiceUrl,
        createdBy: creatorName,
        categoryId,
      },
    });

    if (type === 'INCOME' && userId && (await isUangKasCategory(categoryId, tenantId))) {
      try {
        await prisma.cashPayment.create({
          data: {
            tenantId,
            userId,
            amount,
            description: description || 'Uang kas',
            date,
          },
        });
      } catch (e) {
        console.error('Error creating cash payment for uang kas:', e);
      }
    }

    let memberName: string | undefined;
    if (userId) {
      try {
        const member = await prisma.user.findUnique({ where: { id: userId } });
        memberName = member?.name;
      } catch (e) {
      }
    }

    const auditDescription = `Menambahkan transaksi ${type === 'INCOME' ? 'pemasukan' : 'pengeluaran'}: ${description}${memberName ? ` oleh ${memberName}` : ''}`;
    await createAuditLog('FINANCE', 'CREATE', auditDescription, undefined, {
      transactionId: transaction.id,
      amount,
      type,
      userId,
      userName: memberName,
      tenantId,
    });

    revalidatePath('/cms/finance');
    return { success: 'Transaksi berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return { error: error.message || 'Gagal menambahkan transaksi' };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }
    if (!(await requireCmsActor(tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menghapus transaksi.' };
    }

    const transaction = await prisma.transaction.findFirst({ where: { id, tenantId } });
    if (!transaction) return { error: 'Transaksi tidak ditemukan' };
    if (transaction.tenantId !== tenantId) return { error: 'Akses ditolak: Transaksi bukan milik kelas Anda' };

    if (transaction?.userId && transaction?.type === 'INCOME' && transaction?.categoryId) {
      try {
        const isUangKas = await isUangKasCategory(transaction.categoryId, tenantId);
        if (isUangKas) {
          await prisma.cashPayment.deleteMany({ where: { tenantId, userId: transaction.userId, date: transaction.date } });
        }
      } catch (e) {
        console.error('Error deleting cash payment for uang kas:', e);
      }
    }

    await prisma.transaction.deleteMany({ where: { id, tenantId } });

    let transactionOwnerName: string | undefined;
    if (transaction?.userId) {
      try {
        const member = await prisma.user.findUnique({ where: { id: transaction.userId } });
        transactionOwnerName = member?.name;
      } catch (e) {
      }
    }

    const delDescription = `Menghapus transaksi: ${transaction?.description}${transactionOwnerName ? ` oleh ${transactionOwnerName}` : ''}`;
    await createAuditLog('FINANCE', 'DELETE', delDescription, undefined, {
      transactionId: id,
      amount: transaction?.amount,
      type: transaction?.type,
      userId: transaction?.userId,
      userName: transactionOwnerName,
      tenantId,
    });

    revalidatePath('/cms/finance');
    return { success: 'Transaksi berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return { error: error.message || 'Gagal menghapus transaksi' };
  }
}

export async function createUangKasSchedule(formData: FormData) {
  try {
    const date = new Date(formData.get('date') as string);
    const amount = parseFloat(formData.get('amount') as string) || 10000;
    const description = (formData.get('description') as string) || 'Uang kas';

    if (isNaN(date.getTime())) return { error: 'Tanggal tidak valid' };

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const existing = await prisma.uangKasSchedule.findFirst({ where: { date, tenantId } });
    if (existing) return { error: 'Tanggal uang kas sudah ada dalam jadwal' };

    await prisma.uangKasSchedule.create({
      data: { tenantId, date, amount, description },
    });

    await createAuditLog('FINANCE', 'CREATE', `Menambahkan jadwal uang kas: ${description} (${date.toISOString().split('T')[0]})`, undefined, {
      module: 'UANG_KAS_SCHEDULE',
      date: date.toISOString(),
      amount,
      description,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/dashboard');
    return { success: 'Jadwal uang kas berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating uang kas schedule:', error);
    return { error: error.message || 'Gagal menambahkan jadwal uang kas' };
  }
}

export async function deleteUangKasSchedule(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan.' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const schedule = await prisma.uangKasSchedule.findFirst({ where: { id, tenantId } });
    if (!schedule) return { error: 'Jadwal uang kas tidak ditemukan' };
    if (schedule.tenantId !== tenantId) return { error: 'Akses ditolak: Jadwal uang kas bukan milik kelas Anda' };

    await prisma.uangKasSchedule.deleteMany({ where: { id, tenantId } });
    await createAuditLog('FINANCE', 'DELETE', `Menghapus jadwal uang kas: ${schedule.description || schedule.date.toISOString().split('T')[0]}`, undefined, {
      module: 'UANG_KAS_SCHEDULE',
      id,
      date: schedule.date.toISOString(),
      amount: schedule.amount,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/dashboard');
    return { success: 'Jadwal uang kas berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting uang kas schedule:', error);
    return { error: error.message || 'Gagal menghapus jadwal uang kas' };
  }
}
