import "server-only";

import { prisma } from "@/server/db/prisma";

export function createSchedule(data: {
  tenantId: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  type: string;
}) {
  return prisma.schedule.create({ data });
}

export function findScheduleById(id: string) {
  return prisma.schedule.findUnique({ where: { id } });
}

export function deleteScheduleById(id: string) {
  return prisma.schedule.delete({ where: { id } });
}