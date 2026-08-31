import "server-only";

import { prisma } from "@/server/db/prisma";

export function findTasksForTenant(
  tenantId: string,
  filters: { startDate?: Date; endDate?: Date; weekly?: boolean; category?: string }
) {
  const where: {
    tenantId: string;
    startDate?: { lt?: Date };
    deadline?: { gte?: Date; lte?: Date; lt?: Date };
    category?: string;
  } = { tenantId };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.weekly) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    where.startDate = { lt: endOfWeek };
    where.deadline = { gte: startOfWeek };
  } else if (filters.startDate && filters.endDate) {
    where.deadline = { gte: filters.startDate, lte: filters.endDate };
  }

  return prisma.task.findMany({
    where,
    include: {
      submissions: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      pertemuan: true,
    },
    orderBy: { deadline: "asc" },
  });
}

export function createTaskForTenant(data: {
  tenantId: string;
  title: string;
  description: string;
  url?: string | null;
  category?: string;
  startDate: Date;
  deadline: Date;
}) {
  return prisma.task.create({ data });
}

export function findTaskWithTenant(id: string) {
  return prisma.task.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });
}

export function findTaskWithPertemuan(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: { pertemuan: { orderBy: { createdAt: "asc" } } },
  });
}

export function deleteTaskById(id: string) {
  return prisma.task.delete({ where: { id } });
}

export function updateTaskById(id: string, data: {
  title?: string;
  description?: string;
  url?: string | null;
  category?: string;
  startDate?: Date;
  deadline?: Date;
}) {
  return prisma.task.update({ where: { id }, data });
}

export function findTaskSubmissions(taskId: string) {
  return prisma.submission.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
}

export function findTenantTaskMembers(tenantId: string) {
  return prisma.tenantMembership.findMany({
    where: { tenantId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export function findTenantMemberIds(tenantId: string, userIds: string[]) {
  return prisma.tenantMembership.findMany({
    where: { tenantId, userId: { in: userIds } },
    select: { userId: true },
  });
}

export async function replaceTaskSubmissions(
  taskId: string,
  userIds: string[]
) {
  await prisma.submission.deleteMany({ where: { taskId } });
  if (userIds.length > 0) {
    await prisma.submission.createMany({
      data: userIds.map((userId) => ({ taskId, userId, status: "SUBMITTED" })),
      skipDuplicates: true,
    });
  }
  return prisma.submission.count({ where: { taskId } });
}

export function createPertemuan(taskId: string, name: string) {
  return prisma.pertemuan.create({ data: { taskId, name } });
}

export function findPertemuanByTaskId(taskId: string) {
  return prisma.pertemuan.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
  });
}

export function deletePertemuanById(id: string) {
  return prisma.pertemuan.delete({ where: { id } });
}

export function updateSubmissionPertemuan(taskId: string, userId: string, pertemuanId: string | null) {
  return prisma.submission.updateMany({
    where: { taskId, userId },
    data: { pertemuanId },
  });
}

export function findSubmissionsByPertemuan(taskId: string, pertemuanId: string) {
  return prisma.submission.findMany({
    where: { taskId, pertemuanId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
}