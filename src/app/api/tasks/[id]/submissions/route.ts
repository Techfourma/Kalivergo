import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/server/auth/session";
import { requireTenantCmsAccess } from "@/lib/tenant";
import {
  getTaskTenantId,
  getTaskSubmissionsForTenant,
  replaceTaskSubmissionsForTenant,
} from "@/features/task/services/task.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = await getTaskTenantId(id);
    if (!tenantId) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    try {
      await requireTenantCmsAccess(session.id, tenantId);
    } catch {
      return NextResponse.json({ error: "Tenant access denied" }, { status: 403 });
    }

    const result = await getTaskSubmissionsForTenant(id, tenantId);
    if ("error" in result) return NextResponse.json(result, { status: 404 });
    return NextResponse.json(result.submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const tenantId = await getTaskTenantId(id);
    if (!tenantId) return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
    try {
      await requireTenantCmsAccess(session.id, tenantId);
    } catch {
      return NextResponse.json({ error: "Tenant access denied" }, { status: 403 });
    }

    const { userIds } = await request.json();
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "userIds must be an array" }, { status: 400 });
    }

    const result = await replaceTaskSubmissionsForTenant(id, tenantId, userIds);
    if ("error" in result) return NextResponse.json(result, { status: 404 });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Error updating submissions:", error);
    return NextResponse.json({ error: "Failed to update submissions" }, { status: 500 });
  }
}