import "server-only";

import { prisma } from "@/server/db/prisma";
import { normalizePertemuanName } from "@/features/task/validators/task.utils";

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

export function findTasksByTitleForTenant(tenantId: string, title: string) {
  return prisma.task.findMany({
    where: {
      tenantId,
      title: { equals: title, mode: "insensitive" },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      tenantId: true,
      createdAt: true,
      pertemuan: { select: { id: true, name: true } },
    },
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

export function findPendingTaskSubmissions(tenantId: string) {
  return prisma.submission.findMany({
    where: { status: "PENDING_REVIEW", task: { tenantId } },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          category: true,
          pertemuan: { select: { id: true, name: true }, orderBy: { createdAt: "asc" }, take: 1 },
        },
      },
      pertemuan: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { submittedAt: "asc" },
  });
}

export function findSubmissionWithTask(submissionId: string) {
  return prisma.submission.findUnique({
    where: { id: submissionId },
    include: { task: { select: { tenantId: true } } },
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

export async function submitTaskForReview(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { pertemuan: { select: { id: true }, orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!task) return { error: "Tugas tidak ditemukan" } as const;

  const pertemuanId = task.pertemuan[0]?.id ?? null;
  const existing = await prisma.submission.findFirst({ where: { taskId, userId } });

  if (existing?.status === "SUBMITTED") {
    return { error: "Tugas ini sudah disetujui administrator" } as const;
  }

  const submission = existing
    ? await prisma.submission.update({
        where: { id: existing.id },
        data: { status: "PENDING_REVIEW", submittedAt: new Date(), pertemuanId },
      })
    : await prisma.submission.create({
        data: { taskId, userId, status: "PENDING_REVIEW", pertemuanId },
      });

  return { submission } as const;
}

export function reviewTaskSubmission(
  submissionId: string,
  status: "SUBMITTED" | "REJECTED"
) {
  return prisma.submission.update({ where: { id: submissionId }, data: { status } });
}

export function createPertemuan(taskId: string, name: string) {
  return prisma.pertemuan.create({ data: { taskId, name } });
}

export async function setTaskPertemuan(taskId: string, name: string) {
  const existing = await prisma.pertemuan.findFirst({
    where: { taskId },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    await prisma.pertemuan.deleteMany({
      where: { taskId, NOT: { id: existing.id } },
    });

    if (
      normalizePertemuanName(existing.name).toLowerCase() ===
      normalizePertemuanName(name).toLowerCase()
    ) {
      return existing;
    }

    return prisma.pertemuan.update({ where: { id: existing.id }, data: { name } });
  }

  return prisma.pertemuan.create({ data: { taskId, name } });
}