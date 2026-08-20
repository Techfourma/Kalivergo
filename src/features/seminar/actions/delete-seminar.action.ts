"use server";

import { revalidatePath } from "next/cache";
import { requireCmsActor, resolveTenantId } from "@/actions/cms/role-model";
import { deleteSeminarForTenant } from "@/features/seminar/services/delete-seminar.service";

export async function deleteSeminar(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
    if (!(await requireCmsActor(tenantId))) return { error: "Akses ditolak: hanya OWNER atau role CMS." };

    const result = await deleteSeminarForTenant(id, tenantId);
    if ("error" in result) return result;

    revalidatePath("/cms/seminar");
    return { success: "Seminar berhasil dihapus" };
  } catch (error: any) {
    console.error("Error deleting seminar:", error);
    return { error: error.message || "Gagal menghapus seminar" };
  }
}