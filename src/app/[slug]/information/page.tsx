import { prisma } from '@/lib/prisma';
import { getCurrentSessionUser } from '@/server/auth/session';
import { requireTenantMembership } from '@/lib/tenant';
import { InformationType } from '@prisma/client';

export default async function InformationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const routeParams = await params;
  const session = await getCurrentSessionUser();

  if (!session?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please login to view information</p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findFirst({
    where: { customSlug: routeParams.slug },
    select: { id: true },
  });

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Tenant not found</p>
      </div>
    );
  }

  try {
    await requireTenantMembership(session.id, tenant.id);
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Access denied</p>
      </div>
    );
  }

  const CreatePostForm = (await import('@/components/information/CreatePostForm')).default;
  const InformationFeed = (await import('@/components/information/InformationFeed')).default;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Information Feed</h1>

        <CreatePostForm tenantId={tenant.id} />

        <InformationFeed tenantId={tenant.id} />
      </div>
    </div>
  );
}
