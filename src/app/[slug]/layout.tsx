import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUser } from "@/server/auth/session";
import TenantNavbar from "@/components/layout/TenantNavbar";

export const dynamic = "force-dynamic";

type SlugLayoutProps = {
  params: Promise<{
    slug: string;
  }>;
  children: React.ReactNode;
};

export default async function SlugLayout({
  params,
  children,
}: SlugLayoutProps) {
  const routeParams = await params;

  const tenant = await prisma.tenant.findFirst({
    where: {
      customSlug: routeParams.slug,
      status: "ACTIVE",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      university: { select: { slug: true, name: true } },
      program: { select: { slug: true, name: true } },
    },
  });

  if (!tenant) {
    notFound();
  }

  const session = await getCurrentSessionUser();

  let user = null;
  if (session?.id) {
    const { requireTenantMembership } = await import("@/lib/tenant/require-tenant-access");
    try {
      await requireTenantMembership(session.id, tenant.id);
      user = {
        name: session.name,
        email: session.email,
        image: session.image,
        role: session.role,
        cmsRole: session.cmsRole,
        canAccessCms: session.canAccessCms,
        isVerified: session.isVerified,
      };
    } catch {
    }
  }

  const tenantPath = `/${routeParams.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantNavbar
        user={user}
        tenantPath={tenantPath}
      />
      <main>{children}</main>
    </div>
  );
}
