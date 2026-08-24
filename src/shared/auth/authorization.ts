export const CMS_ROLES = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "TREASURER",
  "VICE_TREASURER",
  "SECRETARY",
] as const;

export const PLATFORM_ROLES = ["SUPER_ADMIN_KYC", "ADMIN_KYC"] as const;

export type SessionMembership = {
  tenantId: string;
  role: string;
  cmsRole?: string | null;
};

export type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  nim?: string | null;
  image?: string | null;
  isVerified?: boolean;
  canAccessCms?: boolean;
  platformRole?: string | null;
  role?: string | null;
  cmsRole?: string | null;
  memberships?: SessionMembership[];
};

export function hasPlatformRole(
  user: SessionUser | null,
  role?: (typeof PLATFORM_ROLES)[number]
): boolean {
  if (!user?.platformRole) return false;
  return role
    ? user.platformRole === role
    : PLATFORM_ROLES.includes(user.platformRole as (typeof PLATFORM_ROLES)[number]);
}

export function hasTenantMembership(
  user: SessionUser | null,
  tenantId: string
): boolean {
  if (!user || !tenantId) return false;
  return !!user.memberships?.some((membership) => membership.tenantId === tenantId);
}

export function hasCmsAccessInTenant(
  user: SessionUser | null,
  tenantId: string | null
): boolean {
  if (!user) return false;

  if (!tenantId) {
    return (
      user.role === "OWNER" ||
      !!user.memberships?.some((membership) => membership.role === "OWNER") ||
      isCmsRole(user.cmsRole) ||
      isCmsRole(user.role)
    );
  }

  const membership = user.memberships?.find(
    (candidate) => candidate.tenantId === tenantId
  );
  if (!membership) return false;

  return membership.role === "OWNER" || isCmsRole(membership.cmsRole);
}

export function isCmsRole(role: string | null | undefined): boolean {
  return !!role && CMS_ROLES.includes(role as (typeof CMS_ROLES)[number]);
}