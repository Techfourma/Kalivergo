import "server-only";

import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionExpiredEmail, sendFreeTierExpiredEmail } from "@/lib/email";

export const SUBSCRIPTION_GRACE_MONTHS = 3;
export const FREE_TIER_MONTHS = 1;

export function getSubscriptionGraceEnd(expiresAt: Date): Date {
  return addMonths(expiresAt, SUBSCRIPTION_GRACE_MONTHS);
}

export function isTenantLocked(subscriptionGraceEndsAt: Date | null): boolean {
  return Boolean(subscriptionGraceEndsAt && subscriptionGraceEndsAt <= new Date());
}

export async function processSubscriptionLifecycle(now = new Date()): Promise<{
  notified: number;
  deleted: number;
}> {
  const expiring = await prisma.tenant.findMany({
    where: {
      subscriptionEndsAt: { not: null, lte: now },
      subscriptionGraceEndsAt: null,
    },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      subscriptionEndsAt: true,
      memberships: {
        where: { role: "OWNER" },
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });

  let notified = 0;
  for (const tenant of expiring) {
    const expiresAt = tenant.subscriptionEndsAt!;
    const graceEndsAt = getSubscriptionGraceEnd(expiresAt);
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionGraceEndsAt: graceEndsAt,
        subscriptionExpiredNoticeSentAt: now,
      },
    });
    const owner = tenant.memberships[0]?.user;
    if (owner?.email) {
      try {
        if (tenant.subscriptionPlan === "FREE") {
          await sendFreeTierExpiredEmail(owner.email, owner.name, tenant.name, graceEndsAt);
        } else {
          await sendSubscriptionExpiredEmail(owner.email, owner.name, tenant.name, graceEndsAt);
        }
        notified++;
      } catch (error) {
        console.error("Failed to send subscription expiry email:", error);
      }
    }
  }

  const expired = await prisma.tenant.findMany({
    where: { subscriptionGraceEndsAt: { lte: now } },
    select: { id: true },
  });
  for (const tenant of expired) {
    await prisma.$transaction(async (transaction) => {
      await transaction.ownerApplication.deleteMany({ where: { tenantId: tenant.id } });
      await transaction.memberApplication.deleteMany({ where: { tenantId: tenant.id } });
      await transaction.tenant.delete({ where: { id: tenant.id } });
    });
  }

  return { notified, deleted: expired.length };
}