import { prisma } from "@/lib/prisma";
import { parseSessionCookie } from "@/shared/auth/session";

export type SessionMembership = {
  tenantId: string;
  role: string; 
  cmsRole?: string | null;
};

export type SessionUser = {
  id: string;
  name?: string;
  email?: string;
  nim?: string | null;
  platformRole?: string | null;
  role?: string | null;
  cmsRole?: string | null;
  memberships?: SessionMembership[];
};

export type SessionEnrichedUser = {
  id: string;
  name: string;
  email?: string | null;
  nim?: string | null;
  image?: string | null;
  bio?: string | null;
  workExperience?: string | null;
  skills?: string | null;
  instagramUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  isVerified?: boolean;
  platformRole?: string | null;
  role: string;
  cmsRole: string | null;
  canAccessCms: boolean;
  memberships?: SessionMembership[];
};

export async function loadCurrentUser(
  userCookie: string | undefined,
  tenantId?: string | null
): Promise<SessionEnrichedUser | null> {
  if (!userCookie) return null;

  const session = parseSessionCookie(userCookie) as SessionUser | null;

  if (!session?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
  });
  if (!dbUser) return null;

  const membership = session.memberships?.find((m) => m.tenantId === tenantId);
  const role = membership?.role ?? session.role ?? dbUser.platformRole ?? "MEMBER";
  const cmsRole = membership?.cmsRole ?? session.cmsRole ?? null;

  return {
    ...dbUser,
    role,
    cmsRole,
    canAccessCms: role === "OWNER" || !!cmsRole,
    memberships: session.memberships ?? [],
  };
}