import { prisma } from "@/lib/prisma";
export {
  resolveTenantFromRoute,
  type TenantContext,
  type TenantRouteParams,
} from "@/server/tenant/context";

export async function resolveTenantById(tenantId: string): Promise<{
  id: string;
  name: string;
  slug: string;
  status: string;
} | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    return tenant;
  } catch (error) {
    console.error("Error resolving tenant by ID:", error);
    return null;
  }
}

export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}