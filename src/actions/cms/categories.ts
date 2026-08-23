'use server';

import { revalidatePath } from 'next/cache';
import { requireOwner, resolveTenantId } from './role-model';
import {
  createCategoryForTenant,
  deleteCategoryForTenant,
  updateCategoryForTenant,
} from '@/features/cms/services/category.service';

function validateType(type: string): boolean {
  return type === 'INCOME' || type === 'EXPENSE';
}

export async function createCategory(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    const type = formData.get('type') as string;
    if (!name) return { error: 'Nama kategori wajib diisi.' };
    if (!validateType(type)) return { error: 'Tipe kategori tidak valid. Pilih Pemasukan atau Pengeluaran.' };

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireOwner(tenantId))) return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };

    const result = await createCategoryForTenant({ tenantId, name, type });
    if ('error' in result) return result;
    revalidatePath('/cms/finance');
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
    if (!validateType(type)) return { error: 'Tipe kategori tidak valid. Pilih Pemasukan atau Pengeluaran.' };

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireOwner(tenantId))) return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };

    const result = await updateCategoryForTenant({ id, tenantId, name, type });
    if ('error' in result) return result;
    revalidatePath('/cms/finance');
    return { success: 'Kategori berhasil diubah' };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { error: error.message || 'Gagal mengubah kategori' };
  }
}

export async function deleteCategory(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireOwner(tenantId))) return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };

    const result = await deleteCategoryForTenant(id, tenantId);
    if ('error' in result) return result;
    revalidatePath('/cms/finance');
    return { success: 'Kategori berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { error: error.message || 'Gagal menghapus kategori' };
  }
}