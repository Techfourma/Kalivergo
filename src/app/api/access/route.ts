import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/server/auth/session";
import { requireTenantRole } from "@/lib/tenant/require-tenant-access";
import { getCurrentTenantForUser } from "@/lib/tenant-context";
import { CmsAccessService } from "@/features/cms/services/cms-access.service";
import { CmsRole } from "@prisma/client";

const cmsAccessService = new CmsAccessService();

export async function GET() {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantForUser(session.id);
    if (!tenantContext) {
      return NextResponse.json(
        { success: false, error: "Konteks kelas tidak ditemukan." },
        { status: 400 }
      );
    }
    const tenantId = tenantContext.tenantId;

    const membership = await requireTenantRole(
      session.id,
      tenantId,
      "OWNER"
    ).catch(() => null);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Only tenant owners can manage CMS access" },
        { status: 403 }
      );
    }

    const roles: CmsRole[] = [
      "PRESIDENT",
      "VICE_PRESIDENT",
      "TREASURER",
      "VICE_TREASURER",
      "SECRETARY",
    ];

    const result: Record<CmsRole, string[]> = {} as Record<CmsRole, string[]>;

    for (const role of roles) {
      const modules = await cmsAccessService.getPermissionsForRole(
        tenantId,
        role
      );
      result[role] = modules;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error getting CMS access:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get access",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantForUser(session.id);
    if (!tenantContext) {
      return NextResponse.json(
        { success: false, error: "Konteks kelas tidak ditemukan." },
        { status: 400 }
      );
    }
    const tenantId = tenantContext.tenantId;

    await requireTenantRole(session.id, tenantId, "OWNER");

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: "Invalid updates format" },
        { status: 400 }
      );
    }

    for (const update of updates) {
      if (!update.role || !Array.isArray(update.modules)) {
        continue;
      }
      await cmsAccessService.setPermissionsForRole(
        tenantId,
        update.role,
        update.modules
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating CMS access:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update access",
      },
      { status: 500 }
    );
  }
}
