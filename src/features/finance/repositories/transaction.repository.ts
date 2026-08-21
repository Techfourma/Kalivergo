import "server-only";

import { prisma } from "@/lib/db";
import type { Transaction, Prisma } from "@prisma/client";

export async function findTransactionsByTenantId(
  tenantId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    type?: "INCOME" | "EXPENSE";
  }
): Promise<Transaction[]> {
  const where: Prisma.TransactionWhereInput = { tenantId };

  if (options?.startDate && options?.endDate) {
    where.date = {
      gte: options.startDate,
      lte: options.endDate,
    };
  }

  if (options?.type) {
    where.type = options.type;
  }

  return prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });
}

export async function findTransactionById(id: string): Promise<Transaction | null> {
  return prisma.transaction.findUnique({ where: { id } });
}

export async function createTransaction(input: {
  tenantId: string;
  userId: string | null;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: Date;
  invoiceUrl: string | null;
  createdBy: string;
  categoryId: string | null;
}): Promise<Transaction> {
  return prisma.transaction.create({
    data: input,
  });
}

export async function deleteTransactionById(id: string): Promise<Transaction> {
  return prisma.transaction.delete({
    where: { id },
  });
}

export async function countTransactionsByTenantId(tenantId: string): Promise<number> {
  return prisma.transaction.count({
    where: { tenantId },
  });
}