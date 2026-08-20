import "server-only";

import { prisma } from "@/server/db/prisma";
import { createAuditLog } from "@/server/audit";

export interface TenantContext {
  tenantId: string;
  universitySlug: string;
  programSlug: string;
  classSlug: string;
}

export async function resolveTenantFromPath(
  universitySlug: string,
  programSlug: string,
  classSlug: string
): Promise<{ tenantId: string } | { error: string }> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      university: { slug: universitySlug },
      program: { slug: programSlug },
      slug: classSlug,
    },
    select: { id: true },
  });

  if (!tenant) {
    return { error: "Kelas tidak ditemukan" };
  }

  return { tenantId: tenant.id };
}

export async function validateTenantMembership(
  userId: string,
  tenantId: string
): Promise<{ valid: boolean; role?: string; cmsRole?: string | null }> {
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId, tenantId },
    select: { role: true, cmsRole: true },
  });

  if (!membership) {
    return { valid: false };
  }

  return { valid: true, role: membership.role, cmsRole: membership.cmsRole };
}

export async function getTenantContext(tenantId: string): Promise<TenantContext | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      university: { select: { slug: true } },
      program: { select: { slug: true } },
    },
  });

  if (!tenant) {
    return null;
  }

  return {
    tenantId: tenant.id,
    universitySlug: tenant.university.slug,
    programSlug: tenant.program.slug,
    classSlug: tenant.slug,
  };
}

export async function getCurrentTenantForUser(userId: string): Promise<{ tenantId: string; role: string; cmsRole: string | null }[] | null> {
  const memberships = await prisma.tenantMembership.findMany({
    where: { userId },
    include: {
      tenant: {
        include: {
          university: { select: { slug: true } },
          program: { select: { slug: true } },
        },
      },
    },
  });

  if (!memberships.length) {
    return null;
  }

  return memberships.map((m) => ({
    tenantId: m.tenantId,
    role: m.role,
    cmsRole: m.cmsRole,
  }));
}