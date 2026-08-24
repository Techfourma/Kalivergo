import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { requireTenantRole, resolveTenantFromRoute } from "@/lib/tenant";

import CacheGuard from "@/components/security/CacheGuard";
import { getCurrentSessionUser } from "@/server/auth/session";
import CmsAccessPage from "@/components/cms/CmsAccessPage";

export const dynamic = "force-dynamic";

type CmsAccessPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({ params }: CmsAccessPageProps) {
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

  try {
    await requireTenantRole(session.id, tenant.tenantId, "OWNER");
  } catch {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <CacheGuard redirectTo="/unauthorized" />
      <CmsAccessPage
        university={tenant.universitySlug}
        program={tenant.programSlug}
        className={tenant.classSlug}
      />
    </div>
  );
}
