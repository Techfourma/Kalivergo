import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromRoute } from "@/lib/tenant";
import TenantLanding from "@/components/landing/TenantLanding";
import {
  convertUserToOrgMember,
  type OrgMember,
} from "@/data/orgMembers";

export const dynamic = "force-dynamic";

type TenantLandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TenantLandingPage({
  params,
}: TenantLandingPageProps) {
  const routeParams = await params;
  const tenant = await resolveTenantFromRoute(routeParams);

  if (!tenant) {
    notFound();
  }

  const tenantInfo = await prisma.tenant
    .findUnique({
      where: { id: tenant.tenantId },
      select: {
        name: true,
        university: { select: { name: true } },
      },
    })
    .catch(() => null);

  // Real member/org data from the tenant, resolved server-side so the public
  // landing can show it even for anonymous visitors (the /api/member endpoint
  // stays gated for authenticated members only).
  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId: tenant.tenantId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  const members: OrgMember[] = memberships.map((membership) =>
    convertUserToOrgMember({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email ?? null,
      image: membership.user.image,
      tenantRole: membership.role,
      cmsRole: membership.cmsRole,
    })
  );

  return (
    <TenantLanding
      tenantId={tenant.tenantId}
      customSlug={routeParams.slug}
      members={members}
      tenant={{
        label: tenantInfo
          ? `${tenantInfo.name} ${tenantInfo.university?.name ?? ""}`.trim()
          : undefined,
        universityName: tenantInfo?.university?.name,
        className: tenantInfo?.name,
      }}
    />
  );
}

export async function generateMetadata({
  params,
}: TenantLandingPageProps): Promise<Metadata> {
  const routeParams = await params;
  const tenant = await resolveTenantFromRoute(routeParams);

  return {
    title: tenant ? `Kalivergo - ${tenant.classSlug}` : "Kalivergo",
    description:
      "Platform terpadu untuk manajemen kelas, tracking tugas, kelola keuangan, dan pantau kegiatan seminar dalam satu tempat.",
  };
}