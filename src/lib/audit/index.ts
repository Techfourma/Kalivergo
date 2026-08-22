"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createAuditLog(
  module: string,
  action: string,
  description: string,
  actorUserId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    let userName: string | undefined;

    if (actorUserId) {
      const user = await prisma.user.findUnique({
        where: { id: actorUserId },
        select: { name: true },
      });
      userName = user?.name;
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId ?? null,
        action,
        entityType: module,
        entityId: null,
        metadata: metadata ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
}

export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  entityType?: string;
  actorUserId?: string;
  action?: string;
}) {
  try {
    const {
      limit = 50,
      offset = 0,
      entityType,
      actorUserId,
      action,
    } = options || {};

    const where: any = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (actorUserId) {
      where.actorUserId = actorUserId;
    }

    if (action) {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.auditLog.count({ where });

    return { logs, total };
  } catch (error) {
    console.error("Error getting audit logs:", error);
    return { logs: [], total: 0 };
  }
}