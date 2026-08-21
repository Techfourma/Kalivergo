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
  id: string
): Promise<UangKasSchedule | null> {
  return prisma.uangKasSchedule.findUnique({ where: { id } });
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

export async function deleteUangKasScheduleById(id: string): Promise<UangKasSchedule> {
  return prisma.uangKasSchedule.delete({
    where: { id },
  });
}