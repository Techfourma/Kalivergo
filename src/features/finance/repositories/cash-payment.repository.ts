import "server-only";

import { prisma } from "@/lib/db";
import type { CashPayment } from "@prisma/client";

export async function findCashPaymentsByUserId(
  userId: string,
  tenantId: string
): Promise<CashPayment[]> {
  return prisma.cashPayment.findMany({
    where: { userId, tenantId },
  });
}

export async function createCashPayment(input: {
  tenantId: string;
  userId: string;
  amount: number;
  description: string;
  date: Date;
}): Promise<CashPayment> {
  return prisma.cashPayment.create({
    data: input,
  });
}

export async function deleteCashPaymentsByUserIdAndDate(
  userId: string,
  tenantId: string,
  date: Date
): Promise<number> {
  const result = await prisma.cashPayment.deleteMany({
    where: { userId, tenantId, date },
  });
  return result.count;
}