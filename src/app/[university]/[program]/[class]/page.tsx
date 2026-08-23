import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  requireTenantMembership,
  resolveTenantFromRoute,
} from "@/lib/tenant";
import { getCurrentSessionUser } from "@/server/auth/session";
import TenantLanding from "@/components/landing/TenantLanding";

export const dynamic = "force-dynamic";

type TenantLandingPageProps = {
  params: Promise<{
    university: string;
    program: string;
    class: string;
  }>;
};

export default async function TenantLandingPage({
  params,
}: TenantLandingPageProps) {
  const routeParams = await params;
  const tenant = await resolveTenantFromRoute({
    university: routeParams.university,
    program: routeParams.program,
    class: routeParams.class,
  });

  if (!tenant) {
    notFound();
  }

  const session = await getCurrentSessionUser();
  if (!session?.id) {
    redirect("/login");
  }
  try {
    await requireTenantMembership(session.id, tenant.tenantId);
  } catch {
    redirect("/unauthorized");
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

  return (
    <TenantLanding
      tenantId={tenant.tenantId}
      university={routeParams.university}
      program={routeParams.program}
      classSlug={routeParams.class}
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
  const tenant = await resolveTenantFromRoute({
    university: routeParams.university,
    program: routeParams.program,
    class: routeParams.class,
  });

  return {
    title: tenant ? `Kalivergo - Kelas ${routeParams.class}` : "Kalivergo",
    description:
      "Platform terpadu untuk manajemen kelas, tracking tugas, kelola keuangan, dan pantau kegiatan seminar dalam satu tempat.",
  };
}