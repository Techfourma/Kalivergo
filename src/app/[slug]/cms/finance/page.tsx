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
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
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

  const resolvedSearchParams = await searchParams;
  const startDateParam = resolvedSearchParams?.startDate;
  const endDateParam = resolvedSearchParams?.endDate;
  const startDate = startDateParam ? new Date(startDateParam) : undefined;
  const endDate = endDateParam ? new Date(endDateParam) : undefined;

  const categoryWhere = { tenantId };
  const { transactions, summary } = await getTransactionsWithSummary(tenantId, startDate, endDate);
  
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

        <div className="relative overflow-hidden rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl p-4 sm:p-6 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium truncate">Total Pemasukan</p>
                <p className="text-base sm:text-xl font-bold text-emerald-700 dark:text-emerald-300 truncate">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium truncate">Total Pengeluaran</p>
                <p className="text-base sm:text-xl font-bold text-red-700 dark:text-red-300 truncate">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium truncate">Saldo Saat Ini</p>
                <p className="text-base sm:text-xl font-bold text-blue-700 dark:text-blue-300 truncate">{formatCurrency(balance)}</p>
              </div>
            </div>
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
          <div className="p-6 border-b border-dark-100 dark:border-dark-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-dark-900 dark:text-dark-50">Riwayat Transaksi</h2>
            <form className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-dark-600 dark:text-dark-300" htmlFor="startDate">Dari:</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  defaultValue={startDateParam}
                  className="rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-dark-600 dark:text-dark-300" htmlFor="endDate">Sampai:</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  defaultValue={endDateParam}
                  className="rounded-lg border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Filter
                </button>
                {(startDateParam || endDateParam) && (
                  <a
                    href={`/${routeParams.slug}/cms/finance`}
                    className="px-3 py-2 text-sm font-medium bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-dark-200 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors"
                  >
                    Reset
                  </a>
                )}
              </div>
            </form>
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
                    {transaction.invoiceUrl ? (
                      <a
                        href={transaction.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                      >
                        Lihat Bukti
                      </a>
                    ) : (
                      <p className="text-sm text-dark-500 dark:text-dark-400">Tanpa bukti</p>
                    )}
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