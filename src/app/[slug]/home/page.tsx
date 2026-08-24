import { prisma } from "@/lib/db";
import Footer from "@/components/layout/Footer";
import TaskTracker from "@/components/home/TaskTracker";
import WeeklyTasks from "@/components/home/WeeklyTasks";
import UnsubmittedList from "@/components/home/UnsubmittedList";

import TenantNavbar from "@/components/layout/TenantNavbar";
import WaveBackground from "@/components/ui/WaveBackground";
import { cookies } from "next/headers";
import Link from "next/link";
import { requireTenantPageAccess, resolveTenantFromRoute } from "@/lib/tenant";
import { loadCurrentUser } from "@/lib/user-session";
import { notFound } from "next/navigation";
import { findTasksForTenant } from "@/features/task/services/task.service";

export const dynamic = 'force-dynamic';

type TenantHomePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TenantHomePage({ params }: TenantHomePageProps) {
  const routeParams = await params;
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('kalivergo_user')?.value;
  let currentUser: any = null;

  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    notFound();
  }

  await requireTenantPageAccess(tenantId);

  try {
    currentUser = await loadCurrentUser(userCookie, tenantId);

    if (!currentUser) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a14]">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Akses Ditolak</h2>
            <p>Silakan login untuk mengakses halaman ini.</p>
            <Link href="/login" className="mt-4 inline-block px-6 py-2 bg-primary-600 rounded-lg">
              Login
            </Link>
          </div>
        </div>
      );
    }

    const taskWhere = tenantId ? { tenantId } : {};
    const scheduleWhere = tenantId ? { tenantId } : {};

    const [tasks, schedules, allUsers] = await Promise.all([
      findTasksForTenant(tenantId!, {}),

      prisma.schedule.findMany({
        where: scheduleWhere,
        orderBy: { date: "asc" },
        take: 5,
      }),

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

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const weeklyTasks = tasks.filter((task) => {
      const deadline = new Date(task.deadline);
      return deadline >= startOfWeek && deadline < endOfWeek;
    });

    const tasksForUnsubmitted = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline.toISOString(),
      submissions: t.submissions.map((s) => ({ userId: s.userId })),
    }));

    const tenantPath = `/${routeParams.slug}`;

    return (
      <>
        <WaveBackground />
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />

        {/* TENANT NAVBAR - ISOLATED TO THIS TENANT ONLY */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a14]/80 backdrop-blur-md border-b border-white/10">
          <TenantNavbar
            user={currentUser}
            tenantPath={tenantPath}
          />
        </div>

        <main className="flex-1 py-8 pt-24 pb-28 relative z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white font-display">Dashboard Home</h1>
              <p className="text-gray-300 mt-2">
                Kelas: {tenantContext.classSlug}
              </p>
              <p className="text-gray-300">
                Selamat datang, {currentUser.name}!{" "}
                {currentUser.role &&
                  ` (${currentUser.role === "OWNER" ? "Owner" : currentUser.role})`}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <TaskTracker tasks={tasks as any} />
                <UnsubmittedList tasks={tasksForUnsubmitted} allUsers={allUsers} />
              </div>
              <div className="space-y-6">
                <WeeklyTasks tasks={weeklyTasks as any} />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  } catch (err) {
    console.error("Tenant HomePage: DB error (non-fatal):", err);
    return <div className="text-white p-10">Terjadi kesalahan saat memuat data.</div>;
  }
}