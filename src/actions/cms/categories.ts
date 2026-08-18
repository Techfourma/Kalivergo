'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireOwner, resolveTenantId } from './role-model';
import { createAuditLog } from './audit';

function isUangKasName(name: string): boolean {
  return name.toLowerCase().includes('uang kas');
}

export async function createCategory(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    const type = formData.get('type') as string;

    if (!name) return { error: 'Nama kategori wajib diisi.' };
    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return { error: 'Tipe kategori tidak valid. Pilih Pemasukan atau Pengeluaran.' };
    }

    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }
    if (!(await requireOwner(tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };
    }

    const typeLabel = type === 'INCOME' ? 'pemasukan' : 'pengeluaran';
    const duplicate = await prisma.category.findFirst({ where: { tenantId, name, type } });
    if (duplicate) {
      return { error: `Kategori "${name}" (${typeLabel}) sudah ada.` };
    }

    const category = await prisma.category.create({ data: { tenantId, name, type } });

    await createAuditLog('FINANCE', 'CREATE', `Menambahkan kategori ${typeLabel}: ${name}`, undefined, {
      module: 'CATEGORY',
      categoryId: category.id,
      name,
      type,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/cms/categories');
    return { success: 'Kategori berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { error: error.message || 'Gagal menambahkan kategori' };
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const type = formData.get('type') as string;

    if (!id) return { error: 'Kategori tidak ditemukan.' };
    if (!name) return { error: 'Nama kategori wajib diisi.' };
    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return { error: 'Tipe kategori tidak valid. Pilih Pemasukan atau Pengeluaran.' };
    }

    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }
    if (!(await requireOwner(tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: 'Kategori tidak ditemukan.' };
    if (category.tenantId !== tenantId) {
      return { error: 'Akses ditolak: Kategori bukan milik kelas Anda.' };
    }

    const typeLabel = type === 'INCOME' ? 'pemasukan' : 'pengeluaran';

    if (isUangKasName(category.name) && !isUangKasName(name)) {
      return {
        error: 'Nama kategori "Uang kas" tidak dapat diubah karena merupakan kategori khusus sistem. Silakan tambahkan kategori baru.',
      };
    }

    const duplicate = await prisma.category.findFirst({
      where: { tenantId, name, type, NOT: { id } },
    });
    if (duplicate) {
      return { error: `Kategori "${name}" (${typeLabel}) sudah ada.` };
    }

    await prisma.category.update({ where: { id }, data: { name, type } });

    await createAuditLog('FINANCE', 'UPDATE', `Mengubah kategori ${typeLabel}: ${category.name} menjadi ${name}`, undefined, {
      module: 'CATEGORY',
      categoryId: id,
      name,
      type,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/cms/categories');
    return { success: 'Kategori berhasil diubah' };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { error: error.message || 'Gagal mengubah kategori' };
  }
}

export async function deleteCategory(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }
    if (!(await requireOwner(tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: 'Kategori tidak ditemukan.' };
    if (category.tenantId !== tenantId) {
      return { error: 'Akses ditolak: Kategori bukan milik kelas Anda.' };
    }

    if (isUangKasName(category.name)) {
      return {
        error: 'Kategori "Uang kas" adalah kategori khusus sistem untuk pencatatan iuran dan tidak dapat dihapus.',
      };
    }

    const inUse = await prisma.transaction.count({ where: { categoryId: id } });
    if (inUse > 0) {
      return {
        error: `Tidak dapat menghapus kategori "${category.name}" karena masih digunakan oleh ${inUse} transaksi.`,
      };
    }

    await prisma.category.delete({ where: { id } });

    const typeLabel = category.type === 'INCOME' ? 'pemasukan' : 'pengeluaran';
    await createAuditLog('FINANCE', 'DELETE', `Menghapus kategori ${typeLabel}: ${category.name}`, undefined, {
      module: 'CATEGORY',
      categoryId: id,
      name: category.name,
      type: category.type,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/cms/categories');
    return { success: 'Kategori berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { error: error.message || 'Gagal menghapus kategori' };
  }
}