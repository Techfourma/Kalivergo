import { prisma } from "@/lib/db";
import DeleteTransactionButton from "@/components/ui/DeleteTransactionButton";
import FinanceInput from "@/components/cms/FinanceInput";
import CategoryManager from "@/components/cms/CategoryManager";
import { resolveTenantFromRoute } from "@/lib/tenant";
import { getCurrentSessionUser } from "@/server/auth/session";
import { getTransactionsWithSummary } from "@/features/finance/services/transaction.service";
import { getUangKasSchedules } from "@/features/finance/services/uang-kas.service";
import UangKasSettingsCard from "@/components/cms/UangKasSettingsCard";
import { notFound, redirect } from "next/navigation";
import type { CmsRole } from "@prisma/client";

import PageBackground from '@/components/ui/PageBackground';

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);
}

export default async function FinancePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const routeParams = await params;
  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    return (
      <>
        <PageBackground />
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 font-display">
              Manage Finance
            </h1>
            <p className="text-dark-500 dark:text-dark-300 mt-1">Kelola keuangan dan transaksi kelas</p>
          </div>
          <div className="relative rounded-xl border-2 border-dark-100 dark:border-dark-700/60 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].</p>
          </div>
        </div>
      </>
    );
  }

  const session = await getCurrentSessionUser();
  let hasFinanceAccess = false;
  if (session?.id) {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: session.id, tenantId },
      select: { role: true, cmsRole: true },
    });

    if (membership) {
      if (membership.role === "OWNER") {
        hasFinanceAccess = true;
      } else if (membership.cmsRole) {
        const permission = await prisma.cmsAccessPermission.findFirst({
          where: {
            tenantId,
            cmsRole: membership.cmsRole as CmsRole,
            module: "finance",
          },
        });
        hasFinanceAccess = !!permission;
      }
    }
  }

  if (!hasFinanceAccess) {
    redirect("/unauthorized");
  }

  const categoryWhere = { tenantId };
  const { transactions, summary } = await getTransactionsWithSummary(tenantId);
  
  const users = await prisma.tenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: { id: true, name: true }
      }
    },
    orderBy: { user: { name: "asc" } },
  }).then(memberships => memberships.map(m => m.user));

  const incomeCategories = await prisma.category.findMany({
    where: { ...categoryWhere, type: "INCOME" },
    orderBy: { name: "asc" },
  });

  const expenseCategories = await prisma.category.findMany({
    where: { ...categoryWhere, type: "EXPENSE" },
    orderBy: { name: "asc" },
  });

  const isOwner =
    !!session?.id &&
    (await prisma.tenantMembership.findFirst({
      where: { userId: session.id, tenantId, role: "OWNER" },
      select: { id: true },
    })) !== null;

  const allCategoriesEmpty =
    incomeCategories.length === 0 && expenseCategories.length === 0;

  const uangKasSchedule = await getUangKasSchedules(tenantId);
  const uangKasSettings = uangKasSchedule[0];
  const uangKasDates = uangKasSchedule.map((s) => ({
    label: new Date(s.date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
    }),
    value: new Date(s.date).toISOString().split("T")[0],
  }));

  const allCategories = [...incomeCategories, ...expenseCategories];
  const categoryMap = new Map(allCategories.map((cat) => [cat.id, cat.name]));

  const { totalIncome, totalExpense, balance } = summary;

  return (
    <>
      <PageBackground />
      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 font-display">
            Manage Finance
          </h1>
          <p className="text-dark-500 dark:text-dark-300 mt-1">
            Kelola keuangan dan transaksi kas kelas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative rounded-xl border-2 border-green-200 dark:border-green-700/40 bg-green-50/90 dark:bg-green-900/20 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Pemasukan</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="relative rounded-xl border-2 border-red-200 dark:border-red-700/40 bg-red-50/90 dark:bg-red-900/20 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Total Pengeluaran
            </p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-2">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div className="relative rounded-xl border-2 border-blue-200 dark:border-blue-700/40 bg-blue-50/90 dark:bg-blue-900/20 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Saldo Saat Ini
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-2">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        <UangKasSettingsCard
          dates={uangKasSchedule.map((schedule) => new Date(schedule.date).toISOString().split("T")[0])}
          amount={uangKasSettings ? Number(uangKasSettings.amount) : undefined}
        />

        {allCategoriesEmpty && (
          <div className="relative rounded-xl border-2 border-amber-200 dark:border-amber-700/40 bg-amber-50/90 dark:bg-amber-900/20 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Silakan untuk menambahkan kategori sebelum melakukan input transaksi.
            </p>
          </div>
        )}

        {isOwner && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50 font-display">
                Kelola Kategori Kas
              </h2>
              <p className="text-dark-500 dark:text-dark-300 text-sm mt-0.5">
                Atur kategori pemasukan dan pengeluaran uang kas kelas Anda
              </p>
            </div>
            <CategoryManager
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
            />
          </div>
        )}

        <FinanceInput
          users={users}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          uangKasDates={uangKasDates}
          uangKasAmount={uangKasSettings ? Number(uangKasSettings.amount) : undefined}
        />

        <div className="relative rounded-xl border-2 border-dark-100 dark:border-dark-700/60 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent" />
          <div className="p-6 border-b border-dark-100 dark:border-dark-700/60">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-50">Riwayat Transaksi</h2>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-700/60">
            {transactions.length === 0 ? (
              <div className="p-6 text-dark-500 dark:text-dark-400">Belum ada transaksi.</div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-dark-50 dark:hover:bg-dark-800/40 transition-colors"
                >
                  <div>
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                      {new Date(transaction.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-base font-semibold text-dark-900 dark:text-dark-50">
                      {transaction.description}
                    </p>
                    {transaction.categoryId && (
                      <p className="text-sm text-dark-500 dark:text-dark-400">
                        Kategori: {categoryMap.get(transaction.categoryId) ?? "Kategori tidak tersedia"}
                      </p>
                    )}
                    <p className="text-sm text-dark-500 dark:text-dark-400">
                      {transaction.invoiceUrl ? "Dengan bukti" : "Tanpa bukti"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === "INCOME"
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}{" "}
                      {formatCurrency(Number(transaction.amount))}
                    </p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">{transaction.type}</p>
                    <DeleteTransactionButton
                      id={transaction.id}
                      description={transaction.description}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}