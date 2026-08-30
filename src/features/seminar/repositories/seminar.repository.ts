import "server-only";

import { prisma } from "@/server/db/prisma";

export function createSeminar(data: {
  tenantId: string;
  title: string;
  description: string;
  url?: string | null;
  date: Date;
  location: string;
}) {
  return prisma.seminar.create({ data });
}

export function findSeminarById(id: string) {
  return prisma.seminar.findUnique({ where: { id } });
}

export function deleteSeminarById(id: string) {
  return prisma.seminar.delete({ where: { id } });
}

export function listSeminarsByTenant(tenantId: string) {
  return prisma.seminar.findMany({
    where: { tenantId },
    orderBy: { date: "asc" },
  });
}

export function listSeminarsByTenantWithSubmissions(tenantId: string) {
  return prisma.seminar.findMany({
    where: { tenantId },
    orderBy: { date: "asc" },
    include: {
      submissions: {
        select: { userId: true },
      },
    },
  });
}

export function listUpcomingSeminarsByTenant(tenantId: string) {
  return prisma.seminar.findMany({
    where: { tenantId, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });
}

export function listSeminarsInNext7Days(tenantId: string) {
  const now = new Date();
  const end = new Date();
  end.setDate(now.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return prisma.seminar.findMany({
    where: {
      tenantId,
      date: {
        gte: now,
        lte: end,
      },
    },
    orderBy: { date: "asc" },
  });
}

export function countSeminarsByTenant(tenantId: string) {
  return prisma.seminar.count({ where: { tenantId } });
}

export function findSeminarWithTenant(id: string) {
  return prisma.seminar.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });
}

export function findTenantSeminarMembers(tenantId: string) {
  return prisma.tenantMembership.findMany({
    where: { tenantId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export function findTenantSeminarMemberIds(tenantId: string, userIds: string[]) {
  return prisma.tenantMembership.findMany({
    where: { tenantId, userId: { in: userIds } },
    select: { userId: true },
  });
}

export async function replaceSeminarSubmissions(
  seminarId: string,
  userIds: string[]
) {
  await prisma.seminarSubmission.deleteMany({ where: { seminarId } });
  if (userIds.length > 0) {
    await prisma.seminarSubmission.createMany({
      data: userIds.map((userId) => ({ seminarId, userId, status: "SUBMITTED" })),
      skipDuplicates: true,
    });
  }
  return prisma.seminarSubmission.count({ where: { seminarId } });
}

export function findTenantRouteSlug(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { customSlug: true },
  });
}