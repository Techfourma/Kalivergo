import "server-only";

import { prisma } from "@/server/db/prisma";

export const portfolioSelect = {
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

export function findPortfolioById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: portfolioSelect });
}

export function findPortfolioByUsername(username: string) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: username, mode: "insensitive" } },
        { name: { contains: username, mode: "insensitive" } },
      ],
    },
    select: portfolioSelect,
  });
}

export function findPortfolioByUsernameInTenant(
  username: string,
  tenant: { university: string; program: string; class: string }
) {
  return prisma.user.findFirst({
    where: {
      name: { contains: username, mode: "insensitive" },
      tenantMemberships: {
        some: {
          tenant: {
            university: { slug: tenant.university },
            program: { slug: tenant.program },
            slug: tenant.class,
          },
        },
      },
    },
  });
}

export function updatePortfolio(
  id: string,
  data: Record<string, string | null | undefined>
) {
  return prisma.user.update({ where: { id }, data });
}