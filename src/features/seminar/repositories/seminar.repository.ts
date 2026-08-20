import "server-only";

import { prisma } from "@/server/db/prisma";

export function createSeminar(data: {
  tenantId: string;
  title: string;
  description: string;
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

export function countSeminarsByTenant(tenantId: string) {
  return prisma.seminar.count({ where: { tenantId } });
}