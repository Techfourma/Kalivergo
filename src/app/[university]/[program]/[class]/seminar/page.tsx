import { prisma } from "@/lib/db";
import UpcomingSeminars from "@/components/home/UpcomingSeminars";
import SeminarUnsubmittedList from "@/components/home/SeminarUnsubmittedList";
import TenantNavbar from "@/components/layout/TenantNavbar";
import WaveBackground from "@/components/ui/WaveBackground";
import { cookies } from "next/headers";
import { getCurrentTenant } from "@/lib/tenant-context";
import { loadCurrentUser } from "@/lib/user-session";

export const dynamic = "force-dynamic";

type SeminarPageProps = {
  params: {
    university: string;
    program: string;
    class: string;
  };
};

export default async function SeminarPage({ params }: SeminarPageProps) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("techfourma_user")?.value;

  const tenantContext = await getCurrentTenant();
  const tenantId = tenantContext?.tenantId;

  let currentUser: any = null;

  try {
    currentUser = await loadCurrentUser(userCookie, tenantId);

    if (!currentUser) {
      currentUser = {
        name: "Guest",
        email: "guest@techfourma.id",
        role: "MEMBER",
      };
    }

    const seminarWhere = tenantId ? { tenantId } : {};

    const [seminars, allUsers] = await Promise.all([
      prisma.seminar.findMany({
        where: seminarWhere,
        orderBy: {
          date: "asc",
        },
        include: {
          submissions: {
            select: { userId: true },
          },
        },
      }),
      prisma.tenantMembership.findMany({
        where: { tenantId: tenantId! },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { user: { name: "asc" } },
      }).then((memberships) => memberships.map((m) => m.user)),
    ]);

    const seminarsForUnsubmitted = seminars.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date.toISOString(),
      submissions: s.submissions.map((sub) => ({ userId: sub.userId })),
    }));

    const tenantPath = `/${params.university}/${params.program}/${params.class}`;

    return (
      <>
        <WaveBackground />

        <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />

        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a14]/80 backdrop-blur-md border-b border-white/10">
          <TenantNavbar user={currentUser} tenantPath={tenantPath} />
        </div>

        <main className="flex-1 py-8 pt-24 pb-28 relative z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white font-display">
                Seminar
              </h1>

              <p className="text-gray-300 mt-2">
                Informasi seminar dan kegiatan yang tersedia untuk mahasiswa
              </p>
            </div>

            {/* Seminar Mendatang */}
            <div className="space-y-6">
              <UpcomingSeminars seminars={seminars as any} />

              {/* Seminar Belum Mengumpulkan */}
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
      <div className="text-white p-10">
        Terjadi kesalahan saat memuat data seminar.
      </div>
    );
  }
}