import "server-only";

import { prisma } from "@/server/db/prisma";

export function findCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export function findDuplicateCategory(
  tenantId: string,
  name: string,
  type: string,
  excludedId?: string
) {
  return prisma.category.findFirst({
    where: { tenantId, name, type, ...(excludedId ? { NOT: { id: excludedId } } : {}) },
  });
}

export function createCategory(data: { tenantId: string; name: string; type: string }) {
  return prisma.category.create({ data });
}

export function updateCategory(id: string, data: { name: string; type: string }) {
  return prisma.category.update({ where: { id }, data });
}

export function countCategoryTransactions(categoryId: string) {
  return prisma.transaction.count({ where: { categoryId } });
}

export function deleteCategoryById(id: string) {
  return prisma.category.delete({ where: { id } });
}