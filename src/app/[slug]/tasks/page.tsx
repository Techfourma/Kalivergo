import { prisma } from "@/lib/db";
import Footer from "@/components/layout/Footer";
import TaskTracker from "@/components/home/TaskTracker";
import UnsubmittedList from "@/components/home/UnsubmittedList";
import TenantNavbar from "@/components/layout/TenantNavbar";
import PageBackground from "@/components/ui/PageBackground";
import { cookies } from "next/headers";
import { requireTenantPageAccess, resolveTenantFromRoute } from "@/lib/tenant";
import { loadCurrentUser } from "@/lib/user-session";
import { notFound } from "next/navigation";
import { findTasksForTenant } from "@/features/task/services/task.service";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TasksPage({ params }: TasksPageProps) {
  const routeParams = await params;
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("kalivergo_user")?.value;

  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    notFound();
  }

  await requireTenantPageAccess(tenantId);

  let currentUser: any = null;

  try {
    currentUser = await loadCurrentUser(userCookie, tenantId);

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

    const taskWhere = tenantId ? { tenantId } : {};

    const [tasks, allUsers] = await Promise.all([
      findTasksForTenant(tenantId!, {}),

      prisma.tenantMembership.findMany({
        where: { tenantId: tenantId! },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { user: { name: "asc" } },
      }).then(memberships => memberships.map(m => m.user)),
    ]);

    const tasksForUnsubmitted = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline.toISOString(),
      submissions: t.submissions.map((s) => ({ userId: s.userId })),
    }));

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

        <main className="flex-1 py-8 pt-24 pb-28 relative z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">Daftar Tugas</h1>
              <p className="text-muted mt-2">
                Pantau dan kelola semua tugas di kelas Anda
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <TaskTracker tasks={tasks as any} />
                <UnsubmittedList tasks={tasksForUnsubmitted} allUsers={allUsers} />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  } catch (err) {
    console.error("TasksPage: DB error (non-fatal):", err);
    return <div className="text-dark-900 dark:text-white p-10">Terjadi kesalahan saat memuat data.</div>;
  }
}
