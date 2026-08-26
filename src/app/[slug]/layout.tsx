import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUser } from "@/server/auth/session";
import NavbarGate from "@/components/layout/NavbarGate";

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
      const { loadCurrentUser } = await import("@/lib/user-session");
      const cookieStore = await cookies();
      user =
        (await loadCurrentUser(cookieStore.get("kalivergo_user")?.value, tenant.id)) ?? null;
    } catch {
    }
  }

  const tenantPath = `/${routeParams.slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarGate
        user={user}
        tenantPath={tenantPath}
      />
      <main>{children}</main>
    </div>
  );
}
