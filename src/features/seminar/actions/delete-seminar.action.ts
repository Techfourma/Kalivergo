"use server";

import { revalidatePath } from "next/cache";
import { requireCmsActor, resolveTenantId } from "@/actions/cms/role-model";
import { deleteSeminarForTenant } from "@/features/seminar/services/delete-seminar.service";
import { resolveTenantRouteSlugForTenant } from "@/features/seminar/services/update-seminar-submissions.service";

export async function deleteSeminar(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
    if (!(await requireCmsActor(tenantId))) return { error: "Akses ditolak: hanya OWNER atau role CMS." };

    const result = await deleteSeminarForTenant(id, tenantId);
    if ("error" in result) return result;

    const slug = await resolveTenantRouteSlugForTenant(tenantId);
    if (slug) {
      revalidatePath(`/${slug}/cms/seminar`);
      revalidatePath(`/${slug}/seminar`);
    }
    return { success: "Seminar berhasil dihapus" };
  } catch (error: any) {
    console.error("Error deleting seminar:", error);
    return { error: error.message || "Gagal menghapus seminar" };
  }
}