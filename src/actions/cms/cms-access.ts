"use server";

import { revalidatePath } from "next/cache";
import { requireOwner, resolveTenantId } from "./role-model";
import { CmsAccessService } from "@/features/cms/services/cms-access.service";
import { CmsRole } from "@prisma/client";
import { createAuditLog } from "./audit";

const cmsAccessService = new CmsAccessService();

export interface CmsAccessUpdate {
  role: CmsRole;
  modules: string[];
}

export async function updateCmsAccessAction(
  updates: CmsAccessUpdate[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { success: false, error: "Konteks kelas tidak ditemukan." };
    }

    if (!(await requireOwner(tenantId))) {
      return { success: false, error: "Only tenant owners can manage CMS access" };
    }

    for (const update of updates) {
      await cmsAccessService.setPermissionsForRole(
        tenantId,
        update.role,
        update.modules
      );
    }

    await createAuditLog(
      "ACCESS",
      "UPDATE",
      "Memperbarui pengaturan akses CMS",
      undefined,
      { updates, tenantId }
    );

    revalidatePath("/cms/access");
    return { success: true };
  } catch (error) {
    console.error("Error updating CMS access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update access",
    };
  }
}

export async function getCmsAccessAction(): Promise<{
  success: boolean;
  data?: Record<CmsRole, string[]>;
  error?: string;
}> {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { success: false, error: "Konteks kelas tidak ditemukan." };
    }

    if (!(await requireOwner(tenantId))) {
      return { success: false, error: "Only tenant owners can manage CMS access" };
    }

    const roles = cmsAccessService.getCmsRoles();
    const result: Record<CmsRole, string[]> = {} as Record<CmsRole, string[]>;

    for (const role of roles) {
      const modules = await cmsAccessService.getPermissionsForRole(
        tenantId,
        role
      );
      result[role] = modules;
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting CMS access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get access",
    };
  }
}

export async function initializeCmsAccessAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { success: false, error: "Konteks kelas tidak ditemukan." };
    }

    if (!(await requireOwner(tenantId))) {
      return { success: false, error: "Only tenant owners can manage CMS access" };
    }

    await cmsAccessService.initializeDefaultPermissions(tenantId);

    revalidatePath("/cms/access");
    return { success: true };
  } catch (error) {
    console.error("Error initializing CMS access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize access",
    };
  }
}
