import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { requireTenantCmsAccess, resolveTenantFromRoute } from "@/lib/tenant";

import Sidebar from "@/components/layout/Sidebar";
import CacheGuard from "@/components/security/CacheGuard";
import { getCurrentSessionUser } from "@/server/auth/session";

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CacheGuard redirectTo="/unauthorized" />
      <Sidebar
        variant="cms"
        userRole={membership.role}
        tenantPath={tenantPath}
      />

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}