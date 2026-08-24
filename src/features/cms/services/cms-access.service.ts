import { CmsAccessRepository } from "@/features/cms/repositories/cms-access.repository";
import { CmsRole } from "@prisma/client";

const CMS_MODULES = [
  "tasks",
  "people",
  "finance",
  "schedule",
  "seminar",
  "audit",
] as const;

export type CmsModule = typeof CMS_MODULES[number];

export class CmsAccessService {
  private repository: CmsAccessRepository;

  constructor() {
    this.repository = new CmsAccessRepository();
  }

  async getAllPermissions(tenantId: string) {
    return this.repository.getPermissionsByTenant(tenantId);
  }

  async getPermissionsForRole(tenantId: string, cmsRole: CmsRole) {
    const permissions = await this.repository.getPermissionsForRole(
      tenantId,
      cmsRole
    );
    return permissions.map((p) => p.module);
  }

  async grantPermission(
    tenantId: string,
    cmsRole: CmsRole,
    module: string
  ) {
    return this.repository.grantPermission(tenantId, cmsRole, module);
  }

  async revokePermission(
    tenantId: string,
    cmsRole: CmsRole,
    module: string
  ) {
    return this.repository.revokePermission(tenantId, cmsRole, module);
  }

  async setPermissionsForRole(
    tenantId: string,
    cmsRole: CmsRole,
    modules: string[]
  ) {
    const validModules = modules.filter((m) => CMS_MODULES.includes(m as CmsModule));
    return this.repository.setPermissionsForRole(tenantId, cmsRole, validModules);
  }

  async hasAccess(
    tenantId: string,
    cmsRole: CmsRole,
    module: string
  ): Promise<boolean> {
    return this.repository.hasAccess(tenantId, cmsRole, module);
  }

  async initializeDefaultPermissions(tenantId: string) {
    const roles: CmsRole[] = [
      "PRESIDENT",
      "VICE_PRESIDENT",
      "TREASURER",
      "VICE_TREASURER",
      "SECRETARY",
    ];

    for (const role of roles) {
      await this.repository.setPermissionsForRole(tenantId, role, [
        ...CMS_MODULES,
      ]);
    }
  }

  getCmsModules(): string[] {
    return [...CMS_MODULES];
  }

  getCmsRoles(): CmsRole[] {
    return [
      "PRESIDENT",
      "VICE_PRESIDENT",
      "TREASURER",
      "VICE_TREASURER",
      "SECRETARY",
    ];
  }
}
