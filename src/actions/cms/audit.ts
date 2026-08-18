'use server';

import { prisma } from '@/lib/db';
import { readSessionUser } from './role-model';

export async function createAuditLog(
  module: string,
  action: string,
  description: string,
  userName?: string,
  metadata?: any,
  tenantId?: string
) {
  try {
    let resolvedUserName = userName;
    if (!resolvedUserName || resolvedUserName === 'System') {
      const session = readSessionUser();
      if (session?.name) resolvedUserName = session.name;
    }
    if (!resolvedUserName) resolvedUserName = 'System';

    const payload: Record<string, any> = { description, userName: resolvedUserName };
    if (metadata) {
      if (typeof metadata === 'object' && metadata !== null) {
        Object.assign(payload, metadata);
      } else {
        payload.value = metadata;
      }
    }
    if (tenantId) payload.tenantId = tenantId;

    await prisma.auditLog.create({
      data: {
        actorUserId: null,
        action,
        entityType: module,
        entityId: null,
        metadata: payload,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return { error: error.message || 'Gagal membuat audit log' };
  }
}

export async function getAuditLogs(module?: string, startDate?: Date, endDate?: Date, tenantId?: string) {
  try {
    const where: any = {};
    if (module && module !== 'ALL') where.entityType = module;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    if (tenantId) {
      where.metadata = { path: ['tenantId'], equals: tenantId };
    }

    const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' } });

    return rows.map((row) => ({
      id: row.id,
      module: row.entityType,
      action: row.action,
      description: (row.metadata as any)?.description ?? '',
      userId: null,
      userName: (row.metadata as any)?.userName ?? null,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}