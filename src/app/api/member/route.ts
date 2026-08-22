import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/server/auth/session";
import { requireTenantMembership } from "@/lib/tenant";
import { getTenantMemberArrears } from "@/features/member/services/member.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get("tenantId");
    const session = await getCurrentSessionUser();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
    }

    try {
      await requireTenantMembership(session.id, tenantId);
    } catch {
      return NextResponse.json({ error: "Tenant access denied" }, { status: 403 });
    }

    const membersWithArrears = await getTenantMemberArrears(tenantId);
    return NextResponse.json(
      { success: true, data: membersWithArrears },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}