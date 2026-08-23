import "server-only";

import {
  countCategoryTransactions,
  createCategory,
  deleteCategoryById,
  findCategoryById,
  findDuplicateCategory,
  updateCategory,
} from "@/features/cms/repositories/category.repository";
import { createAuditLog } from "@/server/audit";

function isUangKasName(name: string): boolean {
  return name.toLowerCase().includes("uang kas");
}

function typeLabel(type: string): string {
  return type === "INCOME" ? "pemasukan" : "pengeluaran";
}

export async function createCategoryForTenant(input: {
  tenantId: string;
  name: string;
  type: string;
}) {
  const duplicate = await findDuplicateCategory(input.tenantId, input.name, input.type);
  if (duplicate) return { error: `Kategori "${input.name}" (${typeLabel(input.type)}) sudah ada.` } as const;

  const category = await createCategory(input);
  await createAuditLog("FINANCE", "CREATE", `Menambahkan kategori ${typeLabel(input.type)}: ${input.name}`, undefined, {
    module: "CATEGORY",
    categoryId: category.id,
    name: input.name,
    type: input.type,
    tenantId: input.tenantId,
  });
  return { category } as const;
}

export async function updateCategoryForTenant(input: {
  id: string;
  tenantId: string;
  name: string;
  type: string;
}) {
  const category = await findCategoryById(input.id, input.tenantId);
  if (!category) return { error: "Kategori tidak ditemukan." } as const;
  if (isUangKasName(category.name) && !isUangKasName(input.name)) {
    return { error: 'Nama kategori "Uang kas" tidak dapat diubah karena merupakan kategori khusus sistem. Silakan tambahkan kategori baru.' } as const;
  }

  const duplicate = await findDuplicateCategory(input.tenantId, input.name, input.type, input.id);
  if (duplicate) return { error: `Kategori "${input.name}" (${typeLabel(input.type)}) sudah ada.` } as const;

  await updateCategory(input.id, input.tenantId, { name: input.name, type: input.type });
  await createAuditLog("FINANCE", "UPDATE", `Mengubah kategori ${typeLabel(input.type)}: ${category.name} menjadi ${input.name}`, undefined, {
    module: "CATEGORY",
    categoryId: input.id,
    name: input.name,
    type: input.type,
    tenantId: input.tenantId,
  });
  return { success: true } as const;
}

export async function deleteCategoryForTenant(id: string, tenantId: string) {
  const category = await findCategoryById(id, tenantId);
  if (!category) return { error: "Kategori tidak ditemukan." } as const;
  if (isUangKasName(category.name)) {
    return { error: 'Kategori "Uang kas" adalah kategori khusus sistem untuk pencatatan iuran dan tidak dapat dihapus.' } as const;
  }

  const inUse = await countCategoryTransactions(id, tenantId);
  if (inUse > 0) {
    return { error: `Tidak dapat menghapus kategori "${category.name}" karena masih digunakan oleh ${inUse} transaksi.` } as const;
  }

  await deleteCategoryById(id, tenantId);
  await createAuditLog("FINANCE", "DELETE", `Menghapus kategori ${typeLabel(category.type)}: ${category.name}`, undefined, {
    module: "CATEGORY",
    categoryId: id,
    name: category.name,
    type: category.type,
    tenantId,
  });
  return { success: true } as const;
}