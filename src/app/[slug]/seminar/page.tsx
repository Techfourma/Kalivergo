import UpcomingSeminars from "@/features/seminar/components/UpcomingSeminar";
import SeminarUnsubmittedList from "@/features/seminar/components/SeminarUnsubmittedList";
import TenantNavbar from "@/components/layout/TenantNavbar";
import PageBackground from "@/components/ui/PageBackground";
import { cookies } from "next/headers";
import { requireTenantPageAccess, resolveTenantFromRoute } from "@/lib/tenant";
import { loadCurrentUser } from "@/lib/user-session";
import { notFound } from "next/navigation";
import { listSeminarsWithSubmissions } from "@/features/seminar/services/list-seminars.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type SeminarPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SeminarPage({ params }: SeminarPageProps) {
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

    const [seminars, allUsers] = await Promise.all([
      tenantId
        ? listSeminarsWithSubmissions(tenantId)
        : Promise.resolve([]),
      tenantId
        ? prisma.tenantMembership.findMany({
            where: { tenantId },
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
            orderBy: { user: { name: "asc" } },
          }).then((memberships) => memberships.map((m) => m.user))
        : Promise.resolve([]),
    ]);

    const seminarsForUnsubmitted = seminars.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date.toISOString(),
      submissions: s.submissions.map((sub) => ({ userId: sub.userId })),
    }));

    const tenantPath = `/${routeParams.slug}`;

    return (
      <>
        <PageBackground />

        <div className="fixed top-0 left-0 right-0 z-50 nav-shell">
          <TenantNavbar user={currentUser} tenantPath={tenantPath} />
        </div>

        <main className="flex-1 py-8 pt-24 pb-28 relative z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">
                Seminar
              </h1>

              <p className="text-muted mt-2">
                Informasi seminar yang tersedia pada kelas Anda. 
                Pantau seminar yang akan datang dan lihat siapa saja yang belum mendaftar.
              </p>
            </div>

            <div className="space-y-6">
              <UpcomingSeminars seminars={seminars as any} />

              <SeminarUnsubmittedList
                seminars={seminarsForUnsubmitted}
                allUsers={allUsers}
              />
            </div>

          </div>
        </main>
      </>
    );
  } catch (err) {
    console.error("SeminarPage: DB error (non-fatal):", err);

    return (
      <div className="text-dark-900 dark:text-white p-10">
        Terjadi kesalahan saat memuat data seminar.
      </div>
    );
  }
}