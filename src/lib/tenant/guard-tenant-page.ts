import "server-only";

import { redirect } from "next/navigation";

import { getCurrentSessionUser } from "@/server/auth/session";
import { requireTenantMembership } from "@/lib/tenant/require-tenant-access";
import { prisma } from "@/lib/prisma";

export class TenantSubscriptionExpiredError extends Error {}

export async function requireTenantPageAccess(tenantId: string): Promise<void> {
  const session = await getCurrentSessionUser();

  if (!session?.id) {
    redirect("/login");
  }

  try {
    await requireTenantMembership(session.id, tenantId);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionGraceEndsAt: true },
    });
    if (tenant?.subscriptionGraceEndsAt && tenant.subscriptionGraceEndsAt <= new Date()) {
      throw new TenantSubscriptionExpiredError("Subscription grace period has ended");
    }
  } catch {
    if (session.id && await isSubscriptionExpired(tenantId)) {
      redirect(`/unauthorized?reason=subscription-expired`);
    }
    redirect("/unauthorized");
  }
}

async function isSubscriptionExpired(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionGraceEndsAt: true },
  });
  return Boolean(tenant?.subscriptionGraceEndsAt && tenant.subscriptionGraceEndsAt <= new Date());
}