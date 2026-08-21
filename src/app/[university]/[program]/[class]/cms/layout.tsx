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
    university: string;
    program: string;
    class: string;
  }>;
};

/**
 * Isolated per-tenant CMS layout.
 *
 * The tenant is resolved server-side from the URL route (authoritative).
 * Access is granted ONLY to users who are OWNER of this exact tenant or
 * hold one of the CMS roles (PRESIDENT, VICE_PRESIDENT, TREASURER,
 * VICE_TREASURER, SECRETARY) in this exact tenant — verified against the
 * database, never from a client-controllable cookie.
 */
export default async function TenantCmsLayout({
  children,
  params,
}: TenantCmsLayoutProps) {
  noStore();

  const { university, program, class: className } = await params;

  const tenant = await resolveTenantFromRoute({
    university,
    program,
    class: className,
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

  const tenantPath = `/${university}/${program}/${className}`;

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