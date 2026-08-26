import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { requireTenantCmsAccess, resolveTenantFromRoute } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import type { CmsRole } from "@/types";

import Sidebar from "@/components/layout/Sidebar";
import CacheGuard from "@/components/security/CacheGuard";
import { getCurrentSessionUser } from "@/server/auth/session";

const ALL_CMS_MODULES = [
  "tasks",
  "people",
  "finance",
  "schedule",
  "seminar",
  "audit",
];

export const dynamic = "force-dynamic";

type TenantCmsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

export default async function TenantCmsLayout({
  children,
  params,
}: TenantCmsLayoutProps) {
  noStore();

  const { slug } = await params;

  const tenant = await resolveTenantFromRoute({
    slug,
  });

  if (!tenant) {
    notFound();
  }

  const session = await getCurrentSessionUser();

  if (!session?.id) {
    redirect("/unauthorized");
  }

  let membership;
  try {
    membership = await requireTenantCmsAccess(session.id, tenant.tenantId);
  } catch {
    redirect("/unauthorized");
  }

  const tenantPath = `/${slug}`;

  let cmsModules: string[] = [];
  if (membership.role === "OWNER") {
    cmsModules = ALL_CMS_MODULES;
  } else if (membership.cmsRole) {
    const permissions = await prisma.cmsAccessPermission.findMany({
      where: { tenantId: tenant.tenantId, cmsRole: membership.cmsRole as CmsRole },
      select: { module: true },
    });
    cmsModules = permissions.map((p) => p.module);
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark-950">
      <CacheGuard redirectTo="/unauthorized" />
      <Sidebar
        variant="cms"
        userRole={membership.cmsRole ?? membership.role}
        tenantPath={tenantPath}
        cmsModules={cmsModules}
      />

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}