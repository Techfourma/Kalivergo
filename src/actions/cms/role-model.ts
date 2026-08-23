import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { CMS_ROLES } from '@/types';
import { getCurrentTenantForUser } from '@/lib/tenant-context';

export const PLATFORM_ROLES = ['SUPER_ADMIN_KYC', 'ADMIN_KYC'] as const;
export const CLASS_ROLES = [
  'MEMBER',
  'PRESIDENT',
  'VICE_PRESIDENT',
  'TREASURER',
  'VICE_TREASURER',
  'SECRETARY',
] as const;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  nim: string | null;
  platformRole?: string | null;
  role?: string | null;
  cmsRole?: string | null;
  memberships?: Array<{ tenantId: string; role: string; cmsRole?: string | null }>;
}

export async function readSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('kalivergo_user')?.value;
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch (e) {
    return null;
  }
}

export async function resolveTenantId(): Promise<string | null> {
  try {
    const tenant = await getCurrentTenantForUser();
    return tenant?.tenantId ?? null;
  } catch (error) {
    console.error('Error resolving tenant context:', error);
    return null;
  }
}

export async function hasCmsAccess(userId: string, tenantId: string): Promise<boolean> {
  if (!userId || !tenantId) return false;
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId, tenantId },
  });
  if (!membership) return false;
  if (membership.role === 'OWNER') return true;
  return !!membership.cmsRole && CMS_ROLES.includes(membership.cmsRole);
}

export async function isOwner(userId: string, tenantId: string): Promise<boolean> {
  if (!userId || !tenantId) return false;
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId, tenantId, role: 'OWNER' },
  });
  return !!membership;
}

export async function requireCmsActor(tenantId: string): Promise<string | null> {
  const session = await readSessionUser();
  if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) return null;
  return session.id;
}

export async function requireOwner(tenantId: string): Promise<string | null> {
  const session = await readSessionUser();
  if (!session?.id || !(await isOwner(session.id, tenantId))) return null;
  return session.id;
}