"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Card from "@/components/ui/Card";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RotateCcw,
  FileDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface CashFlowCategory {
  id?: string;
  name: string;
  type?: string;
}

interface CashFlowTransaction {
  id: string;
  type: string;
  amount: number;
  date: string | Date;
  category?: CashFlowCategory | null;
  userId?: string | null;
  createdBy?: string | null;
  description?: string;
}

interface MemberInfo {
  userId: string;
  userName: string;
}

interface CashFlowChartProps {
  transactions: CashFlowTransaction[];
  universityName?: string;
  programName?: string;
  className?: string;
  members?: MemberInfo[];
  incomeCategories?: { id: string; name: string; type?: string }[];
  expenseCategories?: { id: string; name: string; type?: string }[];
  shouldLockFeatures?: boolean;
}

export default function CashFlowChart({
  transactions,
  universityName = "Universitas",
  programName = "Program",
  className = "Kelas",
  members = [],
  incomeCategories = [],
  expenseCategories = [],
  shouldLockFeatures: shouldLockFeaturesProp,
}: CashFlowChartProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showCategoryNotice, setShowCategoryNotice] = useState(false);

  const hasIncomeCategories = incomeCategories.length > 0;
  const hasExpenseCategories = expenseCategories.length > 0;
  const onlyHasUangKas = hasIncomeCategories && !hasExpenseCategories && incomeCategories.some(cat => cat.name.toLowerCase().includes("uang kas"));
  const computedShouldLockFeatures = onlyHasUangKas || (!hasIncomeCategories && !hasExpenseCategories);
  const shouldLockFeatures = shouldLockFeaturesProp ?? computedShouldLockFeatures;

  const filtered = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : null;
    return transactions.filter((t) => {
      const time = new Date(t.date).getTime();
      if (start !== null && time < start) return false;
      if (end !== null && time > end) return false;
      return true;
    });
  }, [transactions, startDate, endDate]);

  const summary = useMemo(() => {
    const totalIncome = filtered
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = filtered
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [filtered]);

  const chartData = useMemo(() => {
    return filtered.reduce((acc: any[], t) => {
      const date = new Date(t.date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
      const existing = acc.find((item) => item.date === date);
      const amount = Number(t.amount);
      const categoryName = t.category?.name || "Tanpa Kategori";
      if (existing) {
        if (t.type === "INCOME") {
          existing.income += amount;
          if (!existing.incomeCategories.includes(categoryName)) {
            existing.incomeCategories.push(categoryName);
          }
        } else {
          existing.expense += amount;
          if (!existing.expenseCategories.includes(categoryName)) {
            existing.expenseCategories.push(categoryName);
          }
        }
      } else {
        acc.push({
          date,
          income: t.type === "INCOME" ? amount : 0,
          expense: t.type === "EXPENSE" ? amount : 0,
          incomeCategories: t.type === "INCOME" ? [categoryName] : [],
          expenseCategories: t.type === "EXPENSE" ? [categoryName] : [],
        });
      }
      return acc;
    }, []);
  }, [filtered]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: string; type: string; amount: number }>();
    filtered.forEach((t) => {
      const name = t.category?.name || "Tanpa Kategori";
      const key = `${t.type}::${name}`;
      const amount = Number(t.amount);
      const existing = map.get(key);
      if (existing) {
        existing.amount += amount;
      } else {
        map.set(key, { category: name, type: t.type, amount });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  const incomeCategoryBreakdown = categoryBreakdown.filter((c) => c.type === "INCOME");
  const expenseCategoryBreakdown = categoryBreakdown.filter((c) => c.type === "EXPENSE");

  const resetRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${universityName} - ${programName} - ${className}`, 14, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Mutasi Arus Kas", 14, 28);

    let dateInfo = "Semua Transaksi";
    if (startDate || endDate) {
      const startStr = startDate
        ? new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : "awal";
      const endStr = endDate
        ? new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : "sekarang";
      dateInfo = `${startStr} - ${endStr}`;
    }
    doc.setFontSize(10);
    doc.text(`Periode: ${dateInfo}`, 14, 35);

    const tableData = filtered.map((t) => {
      const member = members.find(m => m.userId === t.userId);
      const memberName = member?.userName || t.createdBy || "-";
      const inputterName = t.createdBy || "-";
      const typeLabel = t.type === "INCOME" ? "Pemasukan" : "Pengeluaran";
      const categoryName = t.category?.name || "Tanpa Kategori";
      const amountFormatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(t.amount);

      return [
        memberName,
        inputterName,
        typeLabel,
        categoryName,
        amountFormatted,
      ];
    });

    const head = [["Nama Anggota", "Input Oleh", "Jenis Transaksi", "Kategori", "Nominal"]];

    autoTable(doc, {
      startY: 42,
      head,
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 42 },
      didParseCell: (data) => {
        if (data.section === "body") {
          if (data.column.index === 4) {
            data.cell.styles.halign = "right";
          }
        }
      },
    });

    const totalIncome = filtered
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = filtered
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Transaksi:", 14, finalY);

    doc.setFont("helvetica", "normal");
    const incomeFormatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalIncome);
    const expenseFormatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalExpense);
    const balanceFormatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalIncome - totalExpense);

    doc.text(`Total Pemasukan: ${incomeFormatted}`, 14, finalY + 7);
    doc.text(`Total Pengeluaran: ${expenseFormatted}`, 14, finalY + 14);
    doc.text(`Saldo: ${balanceFormatted}`, 14, finalY + 21);

    doc.save(`mutasi-arus-kas-${className}-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const hasFilter = Boolean(startDate || endDate);
  return (
    <div className="space-y-6">
      <Card padding="md" className="bg-gradient-to-br from-dark-50/50 to-dark-100/50 dark:from-dark-900/50 dark:to-dark-800/50 border-dark-200 dark:border-dark-700/60">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Pemasukan</p>
              <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/25">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">Total Pengeluaran</p>
              <p className="text-lg font-bold text-red-900 dark:text-red-300">
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Saldo</p>
              <p className="text-lg font-bold text-blue-900 dark:text-white">
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {shouldLockFeatures && (
        <Card padding="md" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">Fitur Terkunci</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                {onlyHasUangKas
                  ? "Anda hanya memiliki kategori Uang Kas. Silakan tambahkan kategori Pemasukan dan Pengeluaran terlebih dahulu untuk membuka fitur Arus Kas dan Tunggakan Uang Kas."
                  : "Silakan tambahkan kategori Pemasukan dan Pengeluaran terlebih dahulu untuk membuka fitur Arus Kas dan Tunggakan Uang Kas."
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card padding="lg" className={shouldLockFeatures ? "opacity-50 pointer-events-none" : ""}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-dark-900 dark:text-white">Arus Kas</h3>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 sm:ml-auto">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-dark-600 dark:text-dark-300">
                Dari Tanggal
              </span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={shouldLockFeatures}
                className="rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-dark-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-dark-600 dark:text-dark-300">
                Sampai Tanggal
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={shouldLockFeatures}
                className="rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-900 dark:text-dark-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
            <button
              type="button"
              onClick={resetRange}
              disabled={shouldLockFeatures}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-dark-200 dark:border-dark-700 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 transition-colors hover:bg-dark-50 dark:hover:bg-dark-800 hover:text-dark-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {hasFilter && (
          <p className="mb-3 text-xs text-dark-500 dark:text-dark-400">
            Menampilkan arus kas dari{" "}
            <span className="font-semibold text-dark-800 dark:text-dark-200">
              {startDate
                ? new Date(`${startDate}T00:00:00`).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "awal"}
            </span>{" "}
            sampai{" "}
            <span className="font-semibold text-dark-800 dark:text-dark-200">
              {endDate
                ? new Date(`${endDate}T00:00:00`).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "sekarang"}
            </span>{" "}
            ({chartData.length} hari).
          </p>
        )}

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-strong)" />
              <XAxis
                dataKey="date"
                stroke="var(--text-faint)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-faint)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  color: "var(--text-primary)",
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--text-primary)" }}
                formatter={(value: number, name: string, item: any) => {
                  const payload = item.payload;
                  let categoryInfo = "";

                  if (name === "Pemasukan") {
                    const categories = payload?.incomeCategories;
                    if (categories && categories.length > 0) {
                      categoryInfo = ` (${categories.join(", ")})`;
                    }
                  } else if (name === "Pengeluaran") {
                    const categories = payload?.expenseCategories;
                    if (categories && categories.length > 0) {
                      categoryInfo = ` (${categories.join(", ")})`;
                    }
                  }

                  return [formatCurrency(value), name + categoryInfo];
                }}
              />
              <Legend wrapperStyle={{ color: "var(--text-muted)" }} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#incomeGradient)"
                name="Pemasukan"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#expenseGradient)"
                name="Pengeluaran"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-dark-900 dark:text-white">
                  Pemasukan per Kategori
                </h3>
                <p className="text-xs text-dark-500 dark:text-dark-400">
                  Total {formatCurrency(summary.totalIncome)}
                </p>
              </div>
            </div>

            {incomeCategoryBreakdown.length > 0 ? (
              <ul className="space-y-3">
                {incomeCategoryBreakdown.map((item) => {
                  const pct =
                    summary.totalIncome > 0
                      ? Math.round((item.amount / summary.totalIncome) * 100)
                      : 0;
                  return (
                    <li key={`income-${item.category}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-dark-800 dark:text-dark-200">
                          {item.category}
                        </span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(item.amount)}
                          <span className="ml-2 text-xs font-medium text-dark-500 dark:text-dark-400">
                            {pct}%
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-dark-100 dark:bg-dark-700">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Belum ada data pemasukan pada rentang waktu ini.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-dark-900 dark:text-white">
                  Pengeluaran per Kategori
                </h3>
                <p className="text-xs text-dark-500 dark:text-dark-400">
                  Total {formatCurrency(summary.totalExpense)}
                </p>
              </div>
            </div>

            {expenseCategoryBreakdown.length > 0 ? (
              <ul className="space-y-3">
                {expenseCategoryBreakdown.map((item) => {
                  const pct =
                    summary.totalExpense > 0
                      ? Math.round((item.amount / summary.totalExpense) * 100)
                      : 0;
                  return (
                    <li key={`expense-${item.category}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-dark-800 dark:text-dark-200">
                          {item.category}
                        </span>
                        <span className="font-semibold text-red-700 dark:text-red-400">
                          {formatCurrency(item.amount)}
                          <span className="ml-2 text-xs font-medium text-dark-500 dark:text-dark-400">
                            {pct}%
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-dark-100 dark:bg-dark-700">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Belum ada data pengeluaran pada rentang waktu ini.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}