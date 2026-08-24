"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSessionUser } from "@/server/auth/session";
import { requireTenantRole } from "@/lib/tenant/require-tenant-access";
import { CmsAccessService } from "@/features/cms/services/cms-access.service";
import { resolveTenantFromRoute } from "@/lib/tenant";
import { CmsRole } from "@prisma/client";

const cmsAccessService = new CmsAccessService();

export interface CmsAccessUpdate {
  role: CmsRole;
  modules: string[];
}

export async function updateCmsAccessAction(
  university: string,
  program: string,
  className: string,
  updates: CmsAccessUpdate[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const tenant = await resolveTenantFromRoute({
      university,
      program,
      class: className,
    });

    if (!tenant) {
      return { success: false, error: "Tenant not found" };
    }

    await requireTenantRole(session.id, tenant.tenantId, "OWNER");

    for (const update of updates) {
      await cmsAccessService.setPermissionsForRole(
        tenant.tenantId,
        update.role,
        update.modules
      );
    }

    revalidatePath(`/${university}/${program}/${className}/cms/access`);
    return { success: true };
  } catch (error) {
    console.error("Error updating CMS access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update access",
    };
  }
}

export async function getCmsAccessAction(
  university: string,
  program: string,
  className: string
): Promise<{
  success: boolean;
  data?: Record<CmsRole, string[]>;
  error?: string;
}> {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const tenant = await resolveTenantFromRoute({
      university,
      program,
      class: className,
    });

    if (!tenant) {
      return { success: false, error: "Tenant not found" };
    }

    const membership = await requireTenantRole(
      session.id,
      tenant.tenantId,
      "OWNER"
    ).catch(() => null);

    if (!membership) {
      return { success: false, error: "Only tenant owners can manage CMS access" };
    }

    const roles = cmsAccessService.getCmsRoles();
    const result: Record<CmsRole, string[]> = {} as Record<CmsRole, string[]>;

    for (const role of roles) {
      const modules = await cmsAccessService.getPermissionsForRole(
        tenant.tenantId,
        role
      );
      result[role] = modules;
    }

    return { success: true,  result };
  } catch (error) {
    console.error("Error getting CMS access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get access",
    };
  }
}

export async function initializeCmsAccessAction(
  university: string,
  program: string,
  className: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const tenant = await resolveTenantFromRoute({
      university,
      program,
      class: className,
    });

    if (!tenant) {
      return { success: false, error: "Tenant not found" };
    }

    await requireTenantRole(session.id, tenant.tenantId, "OWNER");

    await cmsAccessService.initializeDefaultPermissions(tenant.tenantId);

    revalidatePath(`/${university}/${program}/${className}/cms/access`);
    return { success: true };
  } catch (error) {
    console.error("Error initializing CMS access:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initialize access",
    };
  }
}
