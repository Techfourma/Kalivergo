"use server";

import { revalidatePath } from "next/cache";
import { requireCmsActor, resolveTenantId } from "@/actions/cms/role-model";
import {
  replaceSeminarSubmissionsForTenant,
  resolveTenantRouteSlugForTenant,
} from "@/features/seminar/services/update-seminar-submissions.service";
import { createAuditLog } from "@/server/audit";

export async function updateSeminarSubmissionsAction(
  seminarId: string,
  userIds: string[]
) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
    }

    const actorId = await requireCmsActor(tenantId);
    if (!actorId) return { error: "Akses ditolak: hanya OWNER atau role CMS." };

    const result = await replaceSeminarSubmissionsForTenant(seminarId, tenantId, userIds);
    if ("error" in result) return result;

    await createAuditLog("SEMINAR", "UPDATE", "Memperbarui submission seminar", actorId, {
      seminarId,
      tenantId,
      count: result.count,
    });

    const slug = await resolveTenantRouteSlugForTenant(tenantId);
    if (slug) {
      revalidatePath(`/${slug}/cms/seminar`);
      revalidatePath(`/${slug}/seminar`);
    }

    return { success: "Submission seminar berhasil diperbarui" };
  } catch (error: any) {
    console.error("Error updating seminar submissions:", error);
    return { error: error.message || "Gagal memperbarui submission seminar" };
  }
}