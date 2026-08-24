import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/server/auth/session";
import { requireTenantRole } from "@/lib/tenant/require-tenant-access";
import { resolveTenantFromRoute } from "@/lib/tenant";
import { CmsAccessService } from "@/features/cms/services/cms-access.service";
import { CmsRole } from "@prisma/client";

const cmsAccessService = new CmsAccessService();

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const university = searchParams.get("university");
    const program = searchParams.get("program");
    const className = searchParams.get("class");

    if (!university || !program || !className) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const tenant = await resolveTenantFromRoute({
      university,
      program,
      class: className,
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 }
      );
    }

    const membership = await requireTenantRole(
      session.id,
      tenant.tenantId,
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
        tenant.tenantId,
        role
      );
      result[role] = modules;
    }

    return NextResponse.json({ success: true,  result });
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

    const searchParams = request.nextUrl.searchParams;
    const university = searchParams.get("university");
    const program = searchParams.get("program");
    const className = searchParams.get("class");

    if (!university || !program || !className) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const tenant = await resolveTenantFromRoute({
      university,
      program,
      class: className,
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant not found" },
        { status: 404 }
      );
    }

    await requireTenantRole(session.id, tenant.tenantId, "OWNER");

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
        tenant.tenantId,
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
