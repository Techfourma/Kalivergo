import "server-only";

import { prisma } from "@/server/db/prisma";

export const memberProfileSelect = {
  id: true,
  name: true,
  email: true,
  nim: true,
  image: true,
  bio: true,
  workExperience: true,
  skills: true,
  instagramUrl: true,
  githubUrl: true,
  linkedinUrl: true,
  websiteUrl: true,
} as const;

export function findTenantMembers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantMemberships: { some: { tenantId } } },
    select: {
      ...memberProfileSelect,
      cashPayments: {
        select: { date: true, amount: true, description: true },
        orderBy: { date: "desc" },
      },
      tenantMemberships: {
        where: { tenantId },
        select: { role: true, cmsRole: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function updateUserProfile(
  id: string,
  data: Record<string, string | null | undefined>
) {
  return prisma.user.update({ where: { id }, data });
}