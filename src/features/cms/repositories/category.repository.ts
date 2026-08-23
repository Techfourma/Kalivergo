import "server-only";

import { prisma } from "@/server/db/prisma";

export function findCategoryById(id: string, tenantId: string) {
  return prisma.category.findFirst({ where: { id, tenantId } });
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

export function updateCategory(id: string, tenantId: string, data: { name: string; type: string }) {
  return prisma.category.updateMany({ where: { id, tenantId }, data });
}

export function countCategoryTransactions(categoryId: string, tenantId: string) {
  return prisma.transaction.count({ where: { categoryId, tenantId } });
}

export function deleteCategoryById(id: string, tenantId: string) {
  return prisma.category.deleteMany({ where: { id, tenantId } });
}