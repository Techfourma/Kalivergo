import { prisma } from '@/lib/db';
import { requireTenantPageAccess, resolveTenantFromRoute } from '@/lib/tenant';
import { notFound } from 'next/navigation';
import TaskProgressStats from '@/components/statistics/TaskProgressStats';
import PageBackground from '@/components/ui/PageBackground';
import TenantNavbar from '@/components/layout/TenantNavbar';
import { loadCurrentUser } from '@/lib/user-session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

type StatisticsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StatisticsPage({ params }: StatisticsPageProps) {
  const routeParams = await params;
  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    notFound();
  }

  await requireTenantPageAccess(tenantId);

  const cookieStore = await cookies();
  const userCookie = cookieStore.get('kalivergo_user')?.value;

  const currentUser = await loadCurrentUser(userCookie, tenantId);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950">
        <div className="text-dark-900 dark:text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Akses Ditolak</h2>
          <p>Silakan login untuk mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  const tasks = await prisma.task.findMany({
    where: { tenantId },
    include: {
      submissions: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const users = await prisma.tenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { user: { name: 'asc' } },
  }).then((memberships) => memberships.map((m) => ({ ...m.user, image: m.user.image ?? null })));

  const tenantPath = `/${routeParams.slug}`;

  return (
    <>
      <PageBackground />

      <div className="fixed top-0 left-0 right-0 z-50 nav-shell">
        <TenantNavbar
          user={currentUser}
          tenantPath={tenantPath}
        />
      </div>

      <main className="flex-1 py-8 pt-24 pb-28 relative z-10 lg:pl-[18rem] xl:pl-[20rem]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">
              Statistics
            </h1>
            <p className="text-muted mt-2">
              Progress pengerjaan tugas dan performa anggota kelas
            </p>
          </div>

          <TaskProgressStats tasks={tasks} users={users} />
        </div>
      </main>
    </>
  );
}
