import "server-only";

import { redirect } from "next/navigation";

import { getCurrentSessionUser } from "@/server/auth/session";
import { requireTenantMembership } from "@/lib/tenant/require-tenant-access";

export async function requireTenantPageAccess(tenantId: string): Promise<void> {
  const session = await getCurrentSessionUser();

  if (!session?.id) {
    redirect("/login");
  }

  try {
    await requireTenantMembership(session.id, tenantId);
  } catch {
    redirect("/unauthorized");
  }
}