import { prisma } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import TenantNavbar from "@/components/layout/TenantNavbar";
import Footer from "@/components/layout/Footer";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import ArrearsList from "@/components/dashboard/ArrearsList";
import WaveBackground from "@/components/ui/WaveBackground";
import CacheGuard from "@/components/security/CacheGuard";
import { cookies } from "next/headers";
import { getCurrentTenant } from "@/lib/tenant-context";
import { loadCurrentUser } from "@/lib/user-session";

export const dynamic = 'force-dynamic';

type DashboardPageProps = {
  params: {
    university: string;
    program: string;
    class: string;
  };
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  noStore();
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('kalivergo_user')?.value;

  const tenantContext = await getCurrentTenant();
  const tenantId = tenantContext?.tenantId;

  let currentUser: any = null;
  let dbTransactions: any[] = [];
  let users: any[] = [];

  try {
    currentUser = await loadCurrentUser(userCookie, tenantId);

    if (!currentUser) {
      currentUser = {
        name: "Guest",
        email: "guest@kalivergo.id",
        role: "MEMBER",
      };
    }

    const transactionWhere = tenantId ? { tenantId } : {};
    const uangKasScheduleWhere = tenantId ? { tenantId } : {};
    const cashPaymentWhere = tenantId ? { tenantId } : {};

    [dbTransactions, users] = await Promise.all([
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
    ]);
  } catch (err) {
    console.error("DashboardPage: DB error (non-fatal):", err);
  }

const defaultKasAmount = 10000;

  let uangKasScheduleDates: {
  id: string;
  date: string;
  formattedDate: string;
  amount: number;
  description: string | null;
}[] = [];

  const uangKasDateLabels = [
    "05 September",
    "12 September",
    "19 September",
    "26 September",
    "03 Oktober",
    "10 Oktober",
    "17 Oktober",
    "24 Oktober",
    "31 Oktober",
    "07 November",
    "14 November",
    "21 November",
    "28 November",
    "05 Desember",
    "12 Desember",
    "19 Desember",
  ];

  const monthMap: Record<string, string> = {
    januari: '01',
    februari: '02',
    maret: '03',
    april: '04',
    mei: '05',
    juni: '06',
    juli: '07',
    agustus: '08',
    september: '09',
    oktober: '10',
    november: '11',
    desember: '12',
  };

  const currentYear = new Date().getFullYear();

const fallbackPaymentDates = uangKasDateLabels.map((label) => {
    const parts = label.split(' ');
    const day = parts[0].padStart(2, '0');
    const monthName = (parts[1] || '').toLowerCase();
    const month = monthMap[monthName] || '01';
    const iso = `${currentYear}-${month}-${day}`;
    return {
      id: `fallback-${iso}`,
      date: iso,
      formattedDate: label,
      amount: defaultKasAmount,
      description: null,
    };
  });

  const finalExpectedPaymentDates = uangKasScheduleDates.length > 0
    ? uangKasScheduleDates
    : fallbackPaymentDates;

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

const fallbackUnpaidDetail = [{ date: new Date().toISOString().split('T')[0], formattedDate: "Hari Ini", amount: 10000 }];
  const fallbackTotalExpected = finalExpectedPaymentDates.reduce((sum, i) => sum + i.amount, 0) || defaultKasAmount;
  const fallbackDates = finalExpectedPaymentDates.length > 0
    ? finalExpectedPaymentDates.map(d => d.formattedDate)
    : ["Hari Ini"];

const finalMembers = members.length > 0 ? members : [
    {
      userId: "1",
      userName: "Jundi Lesmana",
      userEmail: "jundi@kalivergo.id",
      totalPaid: 0,
      totalExpected: fallbackTotalExpected,
      arrears: fallbackTotalExpected,
      unpaidMonths: ["Bulan Ini"],
      unpaidDateDetails: finalExpectedPaymentDates.length > 0 ? finalExpectedPaymentDates : fallbackUnpaidDetail,
      allPaymentDates: finalExpectedPaymentDates.length > 0 ? finalExpectedPaymentDates : fallbackUnpaidDetail,
      paymentByDate: {},
      schedules: finalExpectedPaymentDates.length > 0 ? finalExpectedPaymentDates : fallbackUnpaidDetail,

      unpaidDates: fallbackDates,
      unpaidCount: fallbackDates.length,
      totalExpectedCount: finalExpectedPaymentDates.length || 1,
      isFullyPaid: false,
    }
  ];

  const tenantPath = `/${params.university}/${params.program}/${params.class}`;

  return (
  <>
    <CacheGuard />

    <WaveBackground />

    <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a14]/50 to-[#0a0a14] pointer-events-none" />

    {/* TENANT NAVBAR - ISOLATED TO THIS TENANT ONLY */}
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a14]/80 backdrop-blur-md border-b border-white/10">
      <TenantNavbar user={currentUser} tenantPath={tenantPath} />
    </div>

    {/* CONTENT */}
    <main className="relative z-10 pt-[120px] pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
              <span className="text-2xl font-bold">
                💰
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white font-display">
                Dashboard Keuangan
              </h1>

              <p className="text-gray-300 mt-1">
                Monitoring uang kas kelas Kalivergo
              </p>
            </div>

          </div>
        </div>

        {/* DASHBOARD CONTENT */}
        <div className="space-y-6">
          <CashFlowChart
            transactions={dbTransactions as any}
          />

          <ArrearsList
            members={finalMembers as any}
          />
        </div>

      </div>
    </main>

    <Footer />
  </>
);
}