import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenantForUser } from "@/lib/tenant-context";
import { getCurrentSessionUser } from "@/server/auth/session";
import { requireTenantCmsAccess } from "@/lib/tenant";
import {
  listSeminars,
  listUpcomingSeminars,
} from "@/features/seminar/services/list-seminars.service";
import { createSeminarForTenant } from "@/features/seminar/services/create-seminar.service";
import { createSeminarSchema } from "@/features/seminar/validators/seminar.schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get("upcoming");

    const tenantContext = await getCurrentTenantForUser(session.id);
    if (!tenantContext) {
      return NextResponse.json({ error: "Tenant access denied" }, { status: 403 });
    }

    const seminars = upcoming === "true"
      ? await listUpcomingSeminars(tenantContext.tenantId)
      : await listSeminars(tenantContext.tenantId);

    return NextResponse.json(seminars);
  } catch (error) {
    console.error("Error fetching seminars:", error);
    return NextResponse.json({ error: "Failed to fetch seminars" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSeminarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Data seminar tidak valid" },
        { status: 400 }
      );
    }

    const { title, description, date, location } = parsed.data;

    const tenantContext = await getCurrentTenantForUser(session.id);
    const tenantId = tenantContext?.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Konteks tenant tidak ditemukan. Buka kelas melalui URL /[universitas]/[prodi]/[kelas]." },
        { status: 400 }
      );
    }

    try {
      await requireTenantCmsAccess(session.id, tenantId);
    } catch {
      return NextResponse.json(
        { error: "Akses ditolak: hanya OWNER atau role CMS." },
        { status: 403 }
      );
    }

    const seminar = await createSeminarForTenant({
      tenantId,
      title,
      description,
      date,
      location,
    });

    return NextResponse.json(seminar, { status: 201 });
  } catch (error) {
    console.error("Error creating seminar:", error);
    return NextResponse.json({ error: "Failed to create seminar" }, { status: 500 });
  }
}