import "server-only";

import { createAuditLog } from "@/server/audit";
import {
  createUangKasSchedule as createScheduleRepo,
  deleteUangKasScheduleById,
  findDuplicateUangKasSchedule,
  findUangKasScheduleById,
  findUangKasSchedulesByTenantId,
} from "../repositories/uang-kas-schedule.repository";
import { prisma } from "@/lib/db";

export async function getUangKasSchedules(tenantId: string) {
  return findUangKasSchedulesByTenantId(tenantId);
}

export async function saveUangKasSettings(input: {
  tenantId: string;
  dates: Date[];
  amount: number;
}) {
  const schedules = await prisma.$transaction(async (tx) => {
    await tx.uangKasSchedule.deleteMany({ where: { tenantId: input.tenantId } });
    return Promise.all(input.dates.map((date) => tx.uangKasSchedule.create({
      data: { tenantId: input.tenantId, date, amount: input.amount, description: "Uang kas" },
    })));
  });

  const category = await prisma.category.findFirst({
    where: { tenantId: input.tenantId, type: "INCOME", name: "Uang kas" },
  });
  if (!category) {
    await prisma.category.create({
      data: { tenantId: input.tenantId, type: "INCOME", name: "Uang kas" },
    });
  }

  return schedules;
}

export async function createUangKasScheduleService(input: {
  tenantId: string;
  date: Date;
  amount: number;
  description: string;
}) {
  const existing = await findDuplicateUangKasSchedule(input.tenantId, input.date);
  if (existing) {
    return {
      success: false,
      error: "Tanggal uang kas sudah ada dalam jadwal",
    };
  }

  const schedule = await createScheduleRepo(input);

  await createAuditLog(
    "FINANCE",
    "CREATE",
    `Menambahkan jadwal uang kas: ${input.description} (${input.date.toISOString().split("T")[0]})`,
    undefined,
    {
      module: "UANG_KAS_SCHEDULE",
      date: input.date.toISOString(),
      amount: input.amount,
      description: input.description,
      tenantId: input.tenantId,
    }
  );

  return { success: true, schedule };
}

export async function deleteUangKasScheduleService(
  id: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const schedule = await findUangKasScheduleById(id, tenantId);
  if (!schedule) {
    return { success: false, error: "Jadwal uang kas tidak ditemukan" };
  }

  await deleteUangKasScheduleById(id, tenantId);

  await createAuditLog(
    "FINANCE",
    "DELETE",
    `Menghapus jadwal uang kas: ${schedule.description || schedule.date.toISOString().split("T")[0]}`,
    undefined,
    {
      module: "UANG_KAS_SCHEDULE",
      id,
      date: schedule.date.toISOString(),
      amount: schedule.amount,
      tenantId,
    }
  );

  return { success: true };
}