import "server-only";

import { prisma } from "@/lib/db";
import type { UangKasSchedule } from "@prisma/client";

export async function findUangKasSchedulesByTenantId(
  tenantId: string
): Promise<UangKasSchedule[]> {
  return prisma.uangKasSchedule.findMany({
    where: { tenantId },
    orderBy: { date: "asc" },
  });
}

export async function findUangKasScheduleById(
  id: string,
  tenantId: string
): Promise<UangKasSchedule | null> {
  return prisma.uangKasSchedule.findFirst({ where: { id, tenantId } });
}

export async function findDuplicateUangKasSchedule(
  tenantId: string,
  date: Date
): Promise<UangKasSchedule | null> {
  return prisma.uangKasSchedule.findFirst({
    where: { tenantId, date },
  });
}

export async function createUangKasSchedule(input: {
  tenantId: string;
  date: Date;
  amount: number;
  description: string;
}): Promise<UangKasSchedule> {
  return prisma.uangKasSchedule.create({
    data: input,
  });
}

export async function deleteUangKasScheduleById(id: string, tenantId: string): Promise<{ count: number }> {
  return prisma.uangKasSchedule.deleteMany({
    where: { id, tenantId },
  });
}