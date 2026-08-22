"use server";

import { revalidatePath } from "next/cache";
import { requireCmsActor, resolveTenantId } from "@/actions/cms/role-model";
import { createUangKasScheduleService, deleteUangKasScheduleService } from "../services/uang-kas.service";

export async function createUangKasSchedule(formData: FormData) {
  try {
    const date = new Date(formData.get("date") as string);
    const amount = parseFloat(formData.get("amount") as string) || 10000;
    const description = (formData.get("description") as string) || "Uang kas";

    if (isNaN(date.getTime())) return { error: "Tanggal tidak valid" };

    const tenantId = await resolveTenantId();
    if (!tenantId)
      return {
        error:
          "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].",
      };
    if (!(await requireCmsActor(tenantId)))
      return { error: "Akses ditolak: hanya OWNER atau role CMS." };

    const result = await createUangKasScheduleService({
      tenantId,
      date,
      amount,
      description,
    });

    if (!result.success) {
      return { error: result.error };
    }

    revalidatePath("/cms/finance");
    revalidatePath("/dashboard");
    return { success: "Jadwal uang kas berhasil ditambahkan" };
  } catch (error: any) {
    console.error("Error creating uang kas schedule:", error);
    return { error: error.message || "Gagal menambahkan jadwal uang kas" };
  }
}

export async function deleteUangKasSchedule(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: "Konteks kelas tidak ditemukan." };
    if (!(await requireCmsActor(tenantId)))
      return { error: "Akses ditolak: hanya OWNER atau role CMS." };

    const result = await deleteUangKasScheduleService(id, tenantId);
    if (!result.success) {
      return { error: result.error };
    }

    revalidatePath("/cms/finance");
    revalidatePath("/dashboard");
    return { success: "Jadwal uang kas berhasil dihapus" };
  } catch (error: any) {
    console.error("Error deleting uang kas schedule:", error);
    return { error: error.message || "Gagal menghapus jadwal uang kas" };
  }
}