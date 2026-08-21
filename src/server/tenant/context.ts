import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { TENANT_COOKIE, getCurrentSessionUserId } from "@/server/auth/session";
import { requireTenantMembership } from "@/lib/tenant/require-tenant-access";

export type TenantRouteParams = {
  university: string;
  program: string;
  class: string;
};

export type TenantContext = {
  tenantId: string;
  universitySlug: string;
  programSlug: string;
  classSlug: string;
};

export async function resolveTenantFromRoute(
  params: TenantRouteParams
): Promise<TenantContext | null> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        university: { slug: params.university },
        program: { slug: params.program },
        slug: params.class,
      },
      select: {
        id: true,
        slug: true,
        university: { select: { slug: true } },
        program: { select: { slug: true } },
      },
    });

    if (!tenant) return null;

    return {
      tenantId: tenant.id,
      universitySlug: tenant.university.slug,
      programSlug: tenant.program.slug,
      classSlug: tenant.slug,
    };
  } catch (error) {
    console.error("Error resolving tenant from route:", error);
    return null;
  }
}

export async function getValidatedCurrentTenant(
  userId?: string | null
): Promise<TenantContext | null> {
  const currentUserId = userId ?? (await getCurrentSessionUserId());
  if (!currentUserId) return null;

  const cookie = (await cookies()).get(TENANT_COOKIE)?.value;
  if (!cookie) return null;

  let tenantId: string | undefined;
  try {
    const parsed: unknown = JSON.parse(cookie);
    if (parsed && typeof parsed === "object" && "tenantId" in parsed) {
      const candidate = (parsed as { tenantId?: unknown }).tenantId;
      tenantId = typeof candidate === "string" ? candidate : undefined;
    }
  } catch {
    return null;
  }

  if (!tenantId) return null;
  try {
    await requireTenantMembership(currentUserId, tenantId);
  } catch {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      slug: true,
      university: { select: { slug: true } },
      program: { select: { slug: true } },
    },
  });

  if (!tenant) return null;

  return {
    tenantId: tenant.id,
    universitySlug: tenant.university.slug,
    programSlug: tenant.program.slug,
    classSlug: tenant.slug,
  };
}