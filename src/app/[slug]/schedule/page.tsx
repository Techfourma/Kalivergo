import TenantNavbar from "@/components/layout/TenantNavbar";
import PageBackground from "@/components/ui/PageBackground";
import { cookies } from "next/headers";
import { requireTenantPageAccess, resolveTenantFromRoute } from "@/lib/tenant";
import { loadCurrentUser } from "@/lib/user-session";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Calendar, MapPin, Clock3 } from "lucide-react";

export const dynamic = "force-dynamic";

type SchedulePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SchedulePage({ params }: SchedulePageProps) {
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

    const schedules = await prisma.schedule.findMany({
      where: { tenantId },
      orderBy: { date: "asc" },
    });

    const tenantPath = `/${routeParams.slug}`;

    return (
      <>
        <PageBackground />

        <div className="fixed top-0 left-0 right-0 z-50 nav-shell">
          <TenantNavbar user={currentUser} tenantPath={tenantPath} />
        </div>

        <main className="tenant-content-offset flex-1 py-8 pt-28 pb-28 relative z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">
                Schedule
              </h1>
              <p className="text-muted mt-2">
                Jadwal kegiatan dan agenda kelas yang sedang berlangsung atau akan datang.
              </p>
            </div>

            <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl overflow-hidden shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

              <div className="p-4 md:p-6 border-b border-dark-100 dark:border-dark-800">
                <h2 className="text-lg font-semibold text-dark-900 dark:text-white">
                  Jadwal Kelas ({schedules.length})
                </h2>
              </div>

              <div className="divide-y divide-dark-100 dark:divide-dark-800">
                {schedules.length === 0 ? (
                  <div className="p-8 text-center text-dark-500 dark:text-dark-400">
                    <Calendar className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p>Belum ada jadwal kegiatan kelas.</p>
                  </div>
                ) : (
                  schedules.map((schedule) => {
                    const date = new Date(schedule.date);
                    const displayDate = date.toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                    const displayTime = schedule.time
                      ? schedule.time
                      : date.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                    return (
                      <div
                        key={schedule.id}
                        className="p-4 md:p-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between hover:bg-dark-50 dark:hover:bg-dark-800/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 flex-wrap">
                            <h3 className="font-semibold text-dark-900 dark:text-white break-words">
                              {schedule.title}
                            </h3>
                            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                              {schedule.type}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2 text-sm text-dark-600 dark:text-dark-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-dark-400" />
                              <span>{displayDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-dark-400" />
                              <span>{displayTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-dark-400" />
                              <span>{schedule.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  } catch (err) {
    console.error("SchedulePage: DB error (non-fatal):", err);
    return <div className="text-dark-900 dark:text-white p-10">Terjadi kesalahan saat memuat data jadwal.</div>;
  }
}
