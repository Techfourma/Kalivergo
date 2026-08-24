import "server-only";
import { prisma } from "@/lib/prisma";

export type TenantSlugParams = {
  slug: string;
};

export type TenantContextBySlug = {
  tenantId: string;
  customSlug: string;
  classSlug: string;
  universitySlug: string;
  programSlug: string;
  name: string;
};

export async function resolveTenantFromCustomSlug(
  params: TenantSlugParams
): Promise<TenantContextBySlug | null> {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        customSlug: params.slug,
        status: "ACTIVE",
      },
      select: {
        id: true,
        slug: true,
        name: true,
        customSlug: true,
        university: { select: { slug: true } },
        program: { select: { slug: true } },
      },
    });

    if (!tenant || !tenant.customSlug) return null;

    return {
      tenantId: tenant.id,
      customSlug: tenant.customSlug,
      classSlug: tenant.slug,
      universitySlug: tenant.university.slug,
      programSlug: tenant.program.slug,
      name: tenant.name,
    };
  } catch (error) {
    console.error("Error resolving tenant from custom slug:", error);
    return null;
  }
}
