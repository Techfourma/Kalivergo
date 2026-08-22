import "server-only";

import { createAuditLog } from "@/server/audit";
import {
  createUangKasSchedule as createScheduleRepo,
  deleteUangKasScheduleById,
  findDuplicateUangKasSchedule,
  findUangKasScheduleById,
  findUangKasSchedulesByTenantId,
} from "../repositories/uang-kas-schedule.repository";

export async function getUangKasSchedules(tenantId: string) {
  return findUangKasSchedulesByTenantId(tenantId);
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
  const schedule = await findUangKasScheduleById(id);
  if (!schedule) {
    return { success: false, error: "Jadwal uang kas tidak ditemukan" };
  }

  if (schedule.tenantId !== tenantId) {
    return {
      success: false,
      error: "Akses ditolak: Jadwal uang kas bukan milik kelas Anda",
    };
  }

  await deleteUangKasScheduleById(id);

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