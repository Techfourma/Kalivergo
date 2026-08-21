import { prisma } from "@/lib/db";
import DeleteTransactionButton from "@/components/ui/DeleteTransactionButton";
import FinanceInput from "@/components/cms/FinanceInput";
import { resolveTenantFromRoute } from "@/lib/tenant";
import { getTransactionsWithSummary } from "@/features/finance/services/transaction.service";
import { getUangKasSchedules } from "@/features/finance/services/uang-kas.service";

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
  params: Promise<{ university: string; program: string; class: string }>;
}) {
  const routeParams = await params;
  const tenantContext = await resolveTenantFromRoute(routeParams);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 font-display">
            Manage Finance
          </h1>
          <p className="text-dark-500 mt-1">Kelola keuangan dan transaksi kelas</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 p-6 text-center">
          <p className="text-red-600">Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].</p>
        </div>
      </div>
    );
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

  const uangKasSchedule = await getUangKasSchedules(tenantId);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-900 font-display">
          Manage Finance
        </h1>
        <p className="text-dark-500 mt-1">
          Kelola keuangan dan transaksi kas kelas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <p className="text-sm text-green-600 font-medium">Total Pemasukan</p>
          <p className="text-2xl font-bold text-green-700 mt-2">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-sm text-red-600 font-medium">
            Total Pengeluaran
          </p>
          <p className="text-2xl font-bold text-red-700 mt-2">
            {formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-sm text-blue-600 font-medium">
            Saldo Saat Ini
          </p>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

<FinanceInput
        users={users}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        uangKasDates={uangKasDates}
      />

      <div className="bg-white rounded-xl shadow-sm border border-dark-100">
        <div className="p-6 border-b border-dark-100">
          <h2 className="text-lg font-semibold">Riwayat Transaksi</h2>
        </div>
        <div className="divide-y divide-dark-100">
          {transactions.length === 0 ? (
            <div className="p-6 text-dark-500">Belum ada transaksi.</div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="text-sm text-dark-500">
                    {new Date(transaction.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-base font-semibold text-dark-900">
                    {transaction.description}
                  </p>
                  {transaction.categoryId && (
                    <p className="text-sm text-dark-500">
                      Kategori: {categoryMap.get(transaction.categoryId) ?? "Kategori tidak tersedia"}
                    </p>
                  )}
                  <p className="text-sm text-dark-500">
                    {transaction.invoiceUrl ? "Dengan bukti" : "Tanpa bukti"}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-semibold ${
                      transaction.type === "INCOME"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {transaction.type === "INCOME" ? "+" : "-"}{" "}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                  <p className="text-xs text-dark-500">{transaction.type}</p>
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
  );
}