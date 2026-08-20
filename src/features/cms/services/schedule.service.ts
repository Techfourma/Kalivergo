import "server-only";

import {
  createSchedule,
  deleteScheduleById,
  findScheduleById,
} from "@/features/cms/repositories/schedule.repository";
import { createAuditLog } from "@/server/audit";

export async function createScheduleForTenant(input: {
  tenantId: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  type: string;
}) {
  const schedule = await createSchedule(input);
  await createAuditLog("SCHEDULE", "CREATE", `Menambahkan jadwal: ${input.title}`, "System", {
    scheduleId: schedule.id,
    title: input.title,
    date: input.date.toISOString(),
    location: input.location,
    type: input.type,
    tenantId: input.tenantId,
  });
  return schedule;
}

export async function deleteScheduleForTenant(id: string, tenantId: string) {
  const schedule = await findScheduleById(id);
  if (!schedule) return { error: "Jadwal tidak ditemukan" } as const;
  if (schedule.tenantId !== tenantId) {
    return { error: "Akses ditolak: Jadwal bukan milik kelas Anda" } as const;
  }

  await deleteScheduleById(id);
  await createAuditLog("SCHEDULE", "DELETE", `Menghapus jadwal: ${schedule.title}`, "System", {
    scheduleId: id,
    title: schedule.title,
    tenantId,
  });
  return { success: true } as const;
}