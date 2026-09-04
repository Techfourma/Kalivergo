import { prisma } from '@/lib/prisma';
import { getCurrentSessionUser } from '@/server/auth/session';
import { requireTenantMembership } from '@/lib/tenant';
import { InformationType } from '@prisma/client';
import PageBackground from '@/components/ui/PageBackground';
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

  try {
    await requireTenantMembership(session.id, tenant.id);
  } catch {
    redirect('/unauthorized');
  }

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
  };

  return (
    <>
      <PageBackground />
      <div className="relative z-10 lg:pl-[18rem] xl:pl-[20rem]">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <CreatePostForm tenantId={tenant.id} currentUser={currentUser} />

          <InformationFeed
            tenantId={tenant.id}
            sharePostId={queryParams.post}
            currentUser={currentUser}
          />
        </div>
      </div>
    </>
  );
}
