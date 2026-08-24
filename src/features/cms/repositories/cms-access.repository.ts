import { prisma } from "@/lib/prisma";
import { CmsRole } from "@prisma/client";

export interface CmsAccessPermission {
  id: string;
  tenantId: string;
  cmsRole: CmsRole;
  module: string;
}

export class CmsAccessRepository {
  async getPermissionsByTenant(tenantId: string): Promise<CmsAccessPermission[]> {
    return prisma.cmsAccessPermission.findMany({
      where: { tenantId },
      orderBy: { cmsRole: 'asc' },
    });
  }

  async getPermission(
    tenantId: string,
    cmsRole: CmsRole,
    module: string
  ): Promise<CmsAccessPermission | null> {
    return prisma.cmsAccessPermission.findUnique({
      where: {
        tenantId_cmsRole_module: {
          tenantId,
          cmsRole,
          module,
        },
      },
    });
  }

  async grantPermission(
    tenantId: string,
    cmsRole: CmsRole,
    module: string
  ): Promise<CmsAccessPermission> {
    return prisma.cmsAccessPermission.upsert({
      where: {
        tenantId_cmsRole_module: {
          tenantId,
          cmsRole,
          module,
        },
      },
      update: {},
      create: {
        tenantId,
        cmsRole,
        module,
      },
    });
  }

  async revokePermission(
    tenantId: string,
    cmsRole: CmsRole,
    module: string
  ): Promise<void> {
    await prisma.cmsAccessPermission.delete({
      where: {
        tenantId_cmsRole_module: {
          tenantId,
          cmsRole,
          module,
        },
      },
    }).catch(() => {
    });
  }

  async setPermissionsForRole(
    tenantId: string,
    cmsRole: CmsRole,
    modules: string[]
  ): Promise<CmsAccessPermission[]> {
    await prisma.cmsAccessPermission.deleteMany({
      where: {
        tenantId,
        cmsRole,
      },
    });

    if (modules.length === 0) {
      return [];
    }

    return prisma.cmsAccessPermission.createMany({
      data: modules.map((module) => ({
        tenantId,
        cmsRole,
        module,
      })),
    }).then(() => {
      return this.getPermissionsForRole(tenantId, cmsRole);
    });
  }

  async getPermissionsForRole(
    tenantId: string,
    cmsRole: CmsRole
  ): Promise<CmsAccessPermission[]> {
    return prisma.cmsAccessPermission.findMany({
      where: {
        tenantId,
        cmsRole,
      },
    });
  }

  async hasAccess(
    tenantId: string,
    cmsRole: CmsRole,
    module: string
  ): Promise<boolean> {
    const permission = await this.getPermission(tenantId, cmsRole, module);
    return permission !== null;
  }
}
