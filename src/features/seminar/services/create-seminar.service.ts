import "server-only";

import { createSeminar } from "@/features/seminar/repositories/seminar.repository";
import { createAuditLog } from "@/server/audit";

export async function createSeminarForTenant(input: {
  tenantId: string;
  title: string;
  description: string;
  url?: string | null;
  date: Date;
  location: string;
}) {
  const seminar = await createSeminar(input);
  await createAuditLog("SEMINAR", "CREATE", `Menambahkan seminar: ${input.title}`, "System", {
    seminarId: seminar.id,
    title: input.title,
    date: input.date.toISOString(),
    location: input.location,
    tenantId: input.tenantId,
  });
  return seminar;
}