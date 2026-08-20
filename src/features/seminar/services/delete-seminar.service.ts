import "server-only";

import {
  deleteSeminarById,
  findSeminarById,
} from "@/features/seminar/repositories/seminar.repository";
import { createAuditLog } from "@/server/audit";

export async function deleteSeminarForTenant(id: string, tenantId: string) {
  const seminar = await findSeminarById(id);
  if (!seminar) return { error: "Seminar tidak ditemukan" } as const;
  if (seminar.tenantId !== tenantId) {
    return { error: "Akses ditolak: Seminar bukan milik kelas Anda" } as const;
  }

  await deleteSeminarById(id);
  await createAuditLog("SEMINAR", "DELETE", `Menghapus seminar: ${seminar.title}`, "System", {
    seminarId: id,
    title: seminar.title,
    tenantId,
  });
  return { success: true } as const;
}