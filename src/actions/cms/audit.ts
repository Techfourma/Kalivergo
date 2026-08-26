'use server';

import { prisma } from '@/lib/db';
import { readSessionUser, requireCmsActor } from './role-model';

const CMS_AUDIT_MODULES = ['FINANCE', 'PEOPLE', 'TASKS', 'SEMINAR', 'SCHEDULE', 'ACCESS'] as const;

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
      const session = await readSessionUser();
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
    if (!tenantId) return [];
    if (!(await requireCmsActor(tenantId))) return [];
    if (module && module !== 'ALL' && !CMS_AUDIT_MODULES.includes(module as typeof CMS_AUDIT_MODULES[number])) {
      return [];
    }

    const where: any = {};
    where.entityType = module && module !== 'ALL'
      ? module
      : { in: [...CMS_AUDIT_MODULES] };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    where.metadata = { path: ['tenantId'], equals: tenantId };

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