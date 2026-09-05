import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CMS_ROLES } from "@/types";

export async function getNavbarHomeHref(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return "/";
  }

  if (session.user.role === "SUPER_ADMIN_KYC" || session.user.role === "ADMIN_KYC") {
    return "/platform";
  }

  const userId = session.user.id;

  const memberships = await prisma.tenantMembership.findMany({
    where: { userId },
    include: {
      tenant: {
        select: { customSlug: true },
      },
    },
  });

  if (memberships.length === 0) {
    return "/";
  }

  const priorityOrder = [
    "OWNER",
    "PRESIDENT",
    "VICE_PRESIDENT",
    "TREASURER",
    "VICE_TREASURER",
    "SECRETARY",
    "MEMBER",
  ];

  const rank = (m: {
    role: string;
    cmsRole: string | null;
  }): number => {
    if (m.role === "OWNER") return 0;
    const idx = m.cmsRole ? CMS_ROLES.indexOf(m.cmsRole as any) : -1;
    if (idx >= 0) return idx + 1;
    return priorityOrder.indexOf("MEMBER");
  };

  const sorted = [...memberships].sort((a, b) => rank(a) - rank(b));
  const primary = sorted[0];

  if (primary.tenant.customSlug) {
    return `/${primary.tenant.customSlug}`;
  }

  return "/";
}
