import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenantForUser } from "@/lib/tenant-context";
import { getCurrentSessionUser } from "@/server/auth/session";
import {
  createTaskForTenant,
  findTasksForTenant,
} from "@/features/task/services/task.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const weekly = searchParams.get("weekly");

    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantForUser(session.id);
    if (!tenantContext) {
      return NextResponse.json({ error: "Tenant access denied" }, { status: 403 });
    }
    const tenantId = tenantContext?.tenantId;

    const tasks = await findTasksForTenant(tenantId, {
      weekly: weekly === "true",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, startDate, deadline } = body;

    const tenantContext = await getCurrentTenantForUser(session.id);
    const tenantId = tenantContext?.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Konteks tenant tidak ditemukan. Buka kelas melalui URL /[universitas]/[prodi]/[kelas]." },
        { status: 400 }
      );
    }

    const task = await createTaskForTenant({
      tenantId,
      title,
      description,
      startDate: startDate ? new Date(startDate) : new Date(),
      deadline: new Date(deadline),
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}