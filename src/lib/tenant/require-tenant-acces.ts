import { prisma } from "@/lib/prisma";
import { CMS_ROLES } from "@/types";

export class TenantAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantAccessError";
  }
}

export interface TenantMembership {
  id: string;
  userId: string;
  tenantId: string;
  role: "OWNER" | "MEMBER";
}

export async function requireTenantMembership(
  userId: string,
  tenantId: string
): Promise<TenantMembership> {
  if (!userId) {
    throw new TenantAccessError("User not authenticated");
  }

  if (!tenantId) {
    throw new TenantAccessError("Invalid tenant ID");
  }

  try {
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        userId,
        tenantId,
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        role: true,
      },
    });

    if (!membership) {
      throw new TenantAccessError(
        `User ${userId} does not have access to tenant ${tenantId}`
      );
    }

    return membership;
  } catch (error) {
    if (error instanceof TenantAccessError) {
      throw error;
    }
    console.error("Error checking tenant membership:", error);
    throw new TenantAccessError("Failed to verify tenant access");
  }
}

export async function requireTenantRole(
  userId: string,
  tenantId: string,
  requiredRole: "OWNER" | "MEMBER"
): Promise<TenantMembership> {
  const membership = await requireTenantMembership(userId, tenantId);

  if (membership.role !== requiredRole) {
    throw new TenantAccessError(
      `User requires role ${requiredRole} but has ${membership.role}`
    );
  }

  return membership;
}

export async function requireTenantCmsAccess(
  userId: string,
  tenantId: string
): Promise<TenantMembership & { cmsRole?: string | null }> {
  const membership = await requireTenantMembership(userId, tenantId);

  if (membership.role === "OWNER") {
    return { ...membership, cmsRole: null };
  }

  const full = await prisma.tenantMembership.findUnique({
    where: { id: membership.id },
    select: { cmsRole: true },
  });

  if (full?.cmsRole && CMS_ROLES.includes(full.cmsRole)) {
    return { ...membership, cmsRole: full.cmsRole };
  }

  throw new TenantAccessError(
    `User ${userId} requires CMS access in tenant ${tenantId}`
  );
}

export async function getUserTenants(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    role: "OWNER" | "MEMBER";
    universitySlug: string;
    programSlug: string;
  }>
> {
  try {
    const memberships = await prisma.tenantMembership.findMany({
      where: { userId },
      include: {
        tenant: {
          include: {
            university: {
              select: { slug: true },
            },
            program: {
              select: { slug: true },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role as "OWNER" | "MEMBER",
      universitySlug: m.tenant.university.slug,
      programSlug: m.tenant.program.slug,
    }));
  } catch (error) {
    console.error("Error getting user tenants:", error);
    return [];
  }
}

export async function requirePlatformAdmin(userId: string): Promise<void> {
  if (!userId) {
    throw new TenantAccessError("User not authenticated");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true, kycStatus: true },
    });

    if (!user || (user.platformRole !== "ADMIN_KYC" && user.platformRole !== "SUPER_ADMIN_KYC")) {
      throw new TenantAccessError("Platform admin access required");
    }

    // Check if admin is approved
    if (user.kycStatus !== "APPROVED") {
      throw new TenantAccessError("Admin account not yet approved");
    }
  } catch (error) {
    if (error instanceof TenantAccessError) {
      throw error;
    }
    console.error("Error checking platform admin role:", error);
    throw new TenantAccessError("Failed to verify platform admin access");
  }
}

export async function requireSuperAdminKyc(userId: string): Promise<void> {
  if (!userId) {
    throw new TenantAccessError("User not authenticated");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true, kycStatus: true },
    });

    if (!user || user.platformRole !== "SUPER_ADMIN_KYC") {
      throw new TenantAccessError("SUPER_ADMIN_KYC access required");
    }

    if (user.kycStatus !== "APPROVED") {
      throw new TenantAccessError("SUPER_ADMIN_KYC account not approved");
    }
  } catch (error) {
    if (error instanceof TenantAccessError) {
      throw error;
    }
    console.error("Error checking SUPER_ADMIN_KYC role:", error);
    throw new TenantAccessError("Failed to verify SUPER_ADMIN_KYC access");
  }
}