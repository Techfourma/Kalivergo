import "server-only";

import { prisma } from "@/server/db/prisma";

export async function findTenantByPath(
  universitySlug: string,
  programSlug: string,
  classSlug: string
) {
  return prisma.tenant.findFirst({
    where: {
      university: { slug: universitySlug },
      program: { slug: programSlug },
      slug: classSlug,
    },
  });
}

export async function findTenantById(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      university: { select: { slug: true, name: true } },
      program: { select: { slug: true, name: true } },
    },
  });
}

export async function findTenantMembership(userId: string, tenantId: string) {
  return prisma.tenantMembership.findFirst({
    where: { userId, tenantId },
    include: {
      tenant: {
        include: {
          university: { select: { slug: true } },
          program: { select: { slug: true } },
        },
      },
    },
  });
}

export async function findTenantMemberships(userId: string) {
  return prisma.tenantMembership.findMany({
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
}