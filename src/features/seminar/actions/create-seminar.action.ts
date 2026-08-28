"use server";

import { revalidatePath } from "next/cache";
import { requireCmsActor, resolveTenantId } from "@/actions/cms/role-model";
import { createSeminarForTenant } from "@/features/seminar/services/create-seminar.service";
import { resolveTenantRouteSlugForTenant } from "@/features/seminar/services/update-seminar-submissions.service";
import { createSeminarSchema } from "@/features/seminar/validators/seminar.schema";

export async function createSeminar(formData: FormData) {
  try {
    const parsed = createSeminarSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      date: formData.get("date"),
      location: formData.get("location"),
    });

    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Data seminar tidak valid" };
    }

    const { title, description, date, location } = parsed.data;

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
    if (!(await requireCmsActor(tenantId))) return { error: "Akses ditolak: hanya OWNER atau role CMS." };

    await createSeminarForTenant({ tenantId, title, description, date, location });
    const slug = await resolveTenantRouteSlugForTenant(tenantId);
    if (slug) {
      revalidatePath(`/${slug}/cms/seminar`);
      revalidatePath(`/${slug}/seminar`);
    }
    return { success: "Seminar berhasil ditambahkan" };
  } catch (error: any) {
    console.error("Error creating seminar:", error);
    return { error: error.message || "Gagal menambahkan seminar" };
  }
}