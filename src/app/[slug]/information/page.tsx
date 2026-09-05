import { prisma } from '@/lib/prisma';
import { getCurrentSessionUser } from '@/server/auth/session';
import { requireTenantMembership } from '@/lib/tenant';
import { InformationType } from '@prisma/client';
import PageBackground from '@/components/ui/PageBackground';
import TenantNavbar from '@/components/layout/TenantNavbar';
import { redirect } from 'next/navigation';

export default async function InformationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ post?: string }>;
}) {
  const routeParams = await params;
  const queryParams = await searchParams;
  const session = await getCurrentSessionUser();

  if (!session?.id) {
    redirect('/unauthorized');
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

  let membership;
  try {
    membership = await requireTenantMembership(session.id, tenant.id);
  } catch {
    redirect('/unauthorized');
  }

  const membershipDetails = await prisma.tenantMembership.findUnique({
    where: { id: membership.id },
    select: { cmsRole: true },
  });

  const CreatePostForm = (await import('@/components/information/CreatePostForm')).default;
  const InformationFeed = (await import('@/components/information/InformationFeed')).default;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, image: true },
  });

  const currentUser = {
    id: session.id,
    name: dbUser?.name || session.name || 'User',
    image: dbUser?.image || session.image,
    role: membership.role,
    cmsRole: membershipDetails?.cmsRole,
    canAccessCms: membership.role === 'OWNER' || !!membershipDetails?.cmsRole,
  };
  const tenantPath = `/${routeParams.slug}`;

  return (
    <>
      <PageBackground />
      <div className="fixed top-0 left-0 right-0 z-50 nav-shell">
        <TenantNavbar user={currentUser} tenantPath={tenantPath} />
      </div>
      <main className="tenant-content-offset relative z-10 pt-28 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <CreatePostForm tenantId={tenant.id} currentUser={currentUser} />

          <InformationFeed
            tenantId={tenant.id}
            sharePostId={queryParams.post}
            currentUserId={session.id}
          />
        </div>
      </main>
    </>
  );
}
