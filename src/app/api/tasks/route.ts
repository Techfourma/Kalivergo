import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenantForUser } from "@/lib/tenant-context";
import { getCurrentSessionUser } from "@/server/auth/session";
import {
  upsertTaskWithPertemuanForTenant,
  findTasksForTenant,
} from "@/features/task/services/task.service";
import {
  DEFAULT_TASK_CATEGORY,
  isTaskCategory,
} from "@/shared/task-category";
import { parseDateTimeLocalToWIB } from "@/lib/date-time";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const weekly = searchParams.get("weekly");
    const category = searchParams.get("category");

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
      category: category ? category : undefined,
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
    const { title, description, startDate, deadline, category, pertemuan } = body;

    const tenantContext = await getCurrentTenantForUser(session.id);
    const tenantId = tenantContext?.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Konteks tenant tidak ditemukan. Buka kelas melalui URL /[universitas]/[prodi]/[kelas]." },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Judul tugas (title) wajib diisi." },
        { status: 400 }
      );
    }

    const parsedStartDate = parseDateTimeLocalToWIB(startDate ?? "") ?? new Date();
    const parsedDeadline = parseDateTimeLocalToWIB(deadline ?? "");

    if (!parsedDeadline) {
      return NextResponse.json(
        { error: "Deadline harus diisi dengan waktu yang valid." },
        { status: 400 }
      );
    }

    const result = await upsertTaskWithPertemuanForTenant({
      tenantId,
      title,
      description: typeof description === "string" ? description : "",
      category: isTaskCategory(category) ? category : DEFAULT_TASK_CATEGORY,
      startDate: parsedStartDate,
      deadline: parsedDeadline,
      pertemuanName:
        typeof pertemuan === "string" && pertemuan.trim()
          ? pertemuan.trim()
          : undefined,
    });

    return NextResponse.json(result.task, { status: result.created ? 201 : 200 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}