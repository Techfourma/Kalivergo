import { prisma } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import TenantNavbar from "@/components/layout/TenantNavbar";
import Footer from "@/components/layout/Footer";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import ArrearsList from "@/components/dashboard/ArrearsList";
import PageBackground from "@/components/ui/PageBackground";
import CacheGuard from "@/components/security/CacheGuard";
import { cookies } from "next/headers";
import { requireTenantPageAccess, resolveTenantFromRoute } from "@/lib/tenant";
import { loadCurrentUser } from "@/lib/user-session";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

type DashboardPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const routeParams = await params;
  noStore();
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('kalivergo_user')?.value;

  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    notFound();
  }

  await requireTenantPageAccess(tenantId);

  let currentUser: any = null;
  let dbTransactions: any[] = [];
  let users: any[] = [];
  let tenantInfo: any = null;
  let uangKasScheduleDates: {
    id: string;
    date: string;
    formattedDate: string;
    amount: number;
    description: string | null;
  }[] = [];

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

    const transactionWhere = tenantId ? { tenantId } : {};
    const uangKasScheduleWhere = tenantId ? { tenantId } : {};
    const cashPaymentWhere = tenantId ? { tenantId } : {};

    tenantInfo = tenantId
    ? await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          university: true,
          program: true,
          },
        })
      : null;

    let schedules: any[] = [];
    [dbTransactions, users, schedules] = await Promise.all([
      prisma.transaction.findMany({
        where: transactionWhere,
        orderBy: { date: "asc" },
        include: { category: true }
      }),
      prisma.tenantMembership.findMany({
        where: { tenantId: tenantId! },
        include: {
          user: {
            include: {
              cashPayments: {
                where: cashPaymentWhere,
              }
            }
          }
        }
      }).then(memberships => memberships.map(m => m.user)),
      prisma.uangKasSchedule.findMany({
        where: { tenantId: tenantId! },
        orderBy: { date: "asc" },
      }),
    ]);

    uangKasScheduleDates = schedules.map((schedule) => ({
      id: schedule.id,
      date: new Date(schedule.date).toISOString().split("T")[0],
      formattedDate: new Date(schedule.date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      amount: Number(schedule.amount),
      description: schedule.description,
    }));
  } catch (err) {
    console.error("DashboardPage: DB error (non-fatal):", err);
  }

  const finalExpectedPaymentDates = uangKasScheduleDates;

  const incomeCategoryNames = Array.from(new Set(
    dbTransactions
      .filter(t => t.type === "INCOME" && t.category?.name)
      .map(t => t.category!.name.toLowerCase())
  ));
  const expenseCategoryNames = Array.from(new Set(
    dbTransactions
      .filter(t => t.type === "EXPENSE" && t.category?.name)
      .map(t => t.category!.name.toLowerCase())
  ));
  const onlyHasUangKas = incomeCategoryNames.length > 0 && expenseCategoryNames.length === 0 && incomeCategoryNames.some(name => name.includes("uang kas"));
  const shouldLockFeatures = onlyHasUangKas || (incomeCategoryNames.length === 0 && expenseCategoryNames.length === 0);

  const members = users.map((user) => {

    const userPayments = user.cashPayments || [];

    const userKasTransactions = dbTransactions.filter((t) => {
      const isIncome = t.type === "INCOME";
      const isKasCategory =
        t.category && t.category.name.toLowerCase().includes("uang kas");
      const isUser = t.userId === user.id;
      return isIncome && isKasCategory && isUser;
    });

    const paymentByDate: Record<string, any> = {};
    finalExpectedPaymentDates.forEach((s) => {
      const matchedTx = userKasTransactions.find((t) => {
        const txDate = new Date(t.date).toISOString().split('T')[0];
        return txDate === s.date;
      });
      const matchedCash = userPayments.find((p: any) => {
        const pDate = new Date(p.date).toISOString().split('T')[0];
        return pDate === s.date;
      });
      const paid = !!(matchedTx || matchedCash);
      paymentByDate[s.date] = {
        date: s.date,
        formattedDate: s.formattedDate,
        amount: s.amount,
        scheduleDescription: s.description,
        paid,
        paymentAmount: paid ? (matchedTx ? Number(matchedTx.amount) : Number(matchedCash.amount)) : 0,
        transactionDescription: matchedTx?.description || null,
        createdBy: matchedTx?.createdBy || null,
      };
    });

    const unpaidDateDetails = finalExpectedPaymentDates.filter(expectedDate => {
      const hasPayment = userPayments.some((payment: any) => {
        const paymentDate = new Date(payment.date).toISOString().split('T')[0];
        return paymentDate === expectedDate.date;
      });
      return !hasPayment;
    });

    const totalExpected = finalExpectedPaymentDates.reduce((sum, item) => sum + item.amount, 0);

    const totalPaid = userPayments.reduce((sum: number, payment: any) => {
      const pDate = new Date(payment.date).toISOString().split('T')[0];
      const isKasDate = finalExpectedPaymentDates.some(ep => ep.date === pDate);
      return isKasDate ? sum + Number(payment.amount) : sum;
    }, 0);

    const arrears = Math.max(0, totalExpected - totalPaid);

return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      totalPaid,
      totalExpected,
      arrears,
      unpaidDateDetails,
      allPaymentDates: finalExpectedPaymentDates,
      paymentByDate,
      schedules: finalExpectedPaymentDates,
      unpaidMonths: unpaidDateDetails.map(d => d.formattedDate),
      unpaidDates: unpaidDateDetails.map(d => d.formattedDate),
      unpaidCount: unpaidDateDetails.length,
      totalExpectedCount: finalExpectedPaymentDates.length,
      isFullyPaid: arrears <= 0,
    };
  });

  const finalMembers = members;

  const tenantPath = `/${routeParams.slug}`;

  return (
  <>
    <CacheGuard />

    <PageBackground />

    <div className="fixed top-0 left-0 right-0 z-50 nav-shell">
      <TenantNavbar user={currentUser} tenantPath={tenantPath} />
    </div>

    <main className="relative z-10 pt-[120px] pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div>
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">
                Dashboard Keuangan
              </h1>

              <p className="text-muted mt-1">
                Monitoring uang kas dan transaksi keuangan {tenantInfo?.university.name || "Universitas"} - {tenantInfo?.program.name || "Program"} - {tenantInfo?.name || "Kelas"}.
              </p>
            </div>

          </div>
        </div>

        <div className="space-y-6">
          <CashFlowChart
            transactions={dbTransactions as any}
            universityName={tenantInfo?.university.name || "Universitas"}
            programName={tenantInfo?.program.name || "Program"}
            className={tenantInfo?.name || "Kelas"}
            members={users.map(u => ({ userId: u.id, userName: u.name }))}
            shouldLockFeatures={shouldLockFeatures}
          />

          <ArrearsList
            members={finalMembers as any}
            hasUangKasSettings={finalExpectedPaymentDates.length > 0}
            shouldLockFeatures={shouldLockFeatures}
          />
        </div>

      </div>
    </main>

    <Footer />
  </>
);
}