import "server-only";

import { prisma } from "@/server/db/prisma";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function createMember(data: {
  name: string;
  nim: string;
  email: string;
}) {
  return prisma.user.create({ data: { ...data, isVerified: false } });
}

export function createTenantMembership(data: {
  userId: string;
  tenantId: string;
  cmsRole: string | null;
}) {
  return prisma.tenantMembership.create({
    data: { userId: data.userId, tenantId: data.tenantId, role: "MEMBER", cmsRole: data.cmsRole as any },
  });
}

export function findTenantMembership(userId: string, tenantId: string) {
  return prisma.tenantMembership.findFirst({ where: { userId, tenantId } });
}

export function verifyUser(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
}

export function deleteUser(userId: string) {
  return prisma.user.delete({ where: { id: userId } });
}