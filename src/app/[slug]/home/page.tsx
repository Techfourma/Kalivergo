import { prisma } from "@/lib/db";
import WeeklyTasks from "@/components/home/WeeklyTasks";
import HomeFinanceCard from "@/components/home/HomeFinanceCard";
import HomeInfoCard from "@/components/home/HomeInfoCard";
import HomeUpcomingSeminars from "@/components/home/HomeUpcomingSeminars";

import TenantNavbar from "@/components/layout/TenantNavbar";
import PageBackground from "@/components/ui/PageBackground";
import { cookies } from "next/headers";
import Link from "next/link";
import { requireTenantPageAccess, resolveTenantFromRoute } from "@/lib/tenant";
import { loadCurrentUser } from "@/lib/user-session";
import { notFound } from "next/navigation";
import { findTasksForTenant } from "@/features/task/services/task.service";
import { listSeminarsInNext7Days } from "@/features/seminar/services/list-seminars.service";

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
        <div className="min-h-screen flex items-center justify-center bg-dark-50 dark:bg-dark-950">
          <div className="text-dark-900 dark:text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Akses Ditolak</h2>
            <p>Silakan login untuk mengakses halaman ini.</p>
            <Link href="/login" className="mt-4 inline-block px-6 py-2 bg-primary-600 rounded-lg text-white">
              Login
            </Link>
          </div>
        </div>
      );
    }

    const taskWhere = tenantId ? { tenantId } : {};
    const scheduleWhere = tenantId ? { tenantId } : {};
    const transactionWhere = tenantId ? { tenantId } : {};

    const [tasks, schedules, allUsers, transactions, latestInfo, upcomingSeminars] = await Promise.all([
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

      prisma.transaction.findMany({
        where: transactionWhere,
        select: { type: true, amount: true },
      }),

      prisma.information.findFirst({
        where: { tenantId: tenantId! },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          mediaUrl: true,
          createdAt: true,
          user: {
            select: { name: true }
          }
        },
      }),

      listSeminarsInNext7Days(tenantId!),
    ]);

    const now = new Date();
    const jakartaNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const startOfWeek = new Date(jakartaNow);
    startOfWeek.setDate(jakartaNow.getDate() - jakartaNow.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const weeklyTasks = tasks.filter((task) => {
      const startDate = new Date(task.startDate);
      const deadline = new Date(task.deadline);
      return startDate < endOfWeek && deadline >= startOfWeek;
    });

    const tenantPath = `/${routeParams.slug}`;

    return (
      <>
        <PageBackground />

      {/* TENANT NAVBAR - ISOLATED TO THIS TENANT ONLY */}
      <div className="fixed top-0 left-0 right-0 z-50 nav-shell">
        <TenantNavbar
          user={currentUser}
          tenantPath={tenantPath}
        />
      </div>

        <main className="flex-1 py-8 pt-24 pb-28 relative z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">Home</h1>
              <p className="text-muted mt-2">
                Kelas: {tenantContext.classSlug}
              </p>
              <p className="text-muted">
                Selamat datang, {currentUser.name}!{" "}
                {currentUser.role &&
                  ` (${currentUser.role === "OWNER" ? "Owner" : currentUser.role})`}
              </p>
            </div>

            <div className="mb-6">
              <HomeFinanceCard transactions={transactions as any} tenantPath={tenantPath} />
            </div>

            <div className="mb-6">
              <HomeInfoCard post={latestInfo as any} tenantPath={tenantPath} />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-6">
                <WeeklyTasks tasks={weeklyTasks as any} tenantPath={tenantPath} />
                <HomeUpcomingSeminars seminars={upcomingSeminars as any} tenantPath={tenantPath} />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  } catch (err) {
    console.error("Tenant HomePage: DB error (non-fatal):", err);
    return <div className="text-dark-900 dark:text-white p-10">Terjadi kesalahan saat memuat data.</div>;
  }
}