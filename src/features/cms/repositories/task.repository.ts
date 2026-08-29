import "server-only";

import { prisma } from "@/server/db/prisma";

export function createTask(data: {
  tenantId: string;
  title: string;
  description: string;
  startDate: Date;
  deadline: Date;
}) {
  return prisma.task.create({ data });
}

export function findTaskById(id: string) {
  return prisma.task.findUnique({ where: { id } });
}

export function deleteTaskById(id: string) {
  return prisma.task.delete({ where: { id } });
}

export async function replaceTaskSubmissions(
  taskId: string,
  userIds: string[]
): Promise<void> {
  await prisma.submission.deleteMany({ where: { taskId } });

  if (userIds.length > 0) {
    await prisma.submission.createMany({
      data: userIds.map((userId) => ({
        taskId,
        userId,
        status: "SUBMITTED",
      })),
      skipDuplicates: true,
    });
  }
}