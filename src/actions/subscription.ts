"use server";

import { requireSuperAdminKyc } from "@/lib/tenant/require-tenant-access";
import { getCurrentSessionUserId } from "@/server/auth/session";
import { getSubscriptionGraceEnd } from "@/server/tenant/subscription";
import { prisma } from "@/lib/prisma";

export async function updateTenantSubscription(formData: FormData): Promise<void> {
  const adminId = await getCurrentSessionUserId();
  if (!adminId) throw new Error("Anda harus login terlebih dahulu.");
  try { await requireSuperAdminKyc(adminId); } catch { throw new Error("Akses hanya untuk superadmin."); }

  const tenantId = String(formData.get("tenantId") || "");
  const plan = String(formData.get("plan") || "FREE");
  const endDate = String(formData.get("subscriptionEndsAt") || "");
  if (!tenantId || !["FREE", "PAID"].includes(plan)) throw new Error("Data subscription tidak valid.");
  const subscriptionEndsAt = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;
  if (subscriptionEndsAt && Number.isNaN(subscriptionEndsAt.getTime())) throw new Error("Tanggal tidak valid.");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      subscriptionPlan: plan as "FREE" | "PAID",
      subscriptionEndsAt,
      subscriptionGraceEndsAt: subscriptionEndsAt ? getSubscriptionGraceEnd(subscriptionEndsAt) : null,
      subscriptionNoticeSentAt: null,
      subscriptionExpiredNoticeSentAt: null,
    },
  });
}