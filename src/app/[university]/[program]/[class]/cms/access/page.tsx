import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { requireTenantRole, resolveTenantFromRoute } from "@/lib/tenant";

import CacheGuard from "@/components/security/CacheGuard";
import { getCurrentSessionUser } from "@/server/auth/session";
import CmsAccessPage from "@/components/cms/CmsAccessPage";

export const dynamic = "force-dynamic";

type CmsAccessPageProps = {
  params: Promise<{
    university: string;
    program: string;
    class: string;
  }>;
};

export default async function Page({ params }: CmsAccessPageProps) {
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

  try {
    await requireTenantRole(session.id, tenant.tenantId, "OWNER");
  } catch {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <CacheGuard redirectTo="/unauthorized" />
      <CmsAccessPage
        university={university}
        program={program}
        className={className}
      />
    </div>
  );
}
