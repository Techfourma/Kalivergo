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
  CalendarRange,
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
}

export default function CashFlowChart({
  transactions,
  universityName = "Universitas",
  programName = "Program",
  className = "Kelas",
  members = []
}: CashFlowChartProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const incomeCategories = categoryBreakdown.filter((c) => c.type === "INCOME");
  const expenseCategories = categoryBreakdown.filter((c) => c.type === "EXPENSE");

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Pemasukan</p>
              <p className="text-lg font-bold text-emerald-900">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/25">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-medium">Pengeluaran</p>
              <p className="text-lg font-bold text-red-900">
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-primary-100/50 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/25">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-primary-600 font-medium">Saldo</p>
              <p className="text-lg font-bold text-primary-900">
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-dark-900">
                Rentang Waktu Arus Kas
              </h3>
              <p className="text-xs text-dark-500">
                Pilih periode mulai &amp; selesai untuk memfilter arus kas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-dark-600">
                Dari Tanggal
              </span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-dark-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-dark-600">
                Sampai Tanggal
              </span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-dark-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <button
              type="button"
              onClick={resetRange}
              className="inline-flex items-center gap-2 rounded-xl border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 transition-colors hover:bg-dark-50 hover:text-dark-900"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {hasFilter && (
          <p className="mt-3 text-xs text-dark-500">
            Menampilkan arus kas dari{" "}
            <span className="font-semibold text-dark-800">
              {startDate
                ? new Date(`${startDate}T00:00:00`).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "awal"}
            </span>{" "}
            sampai{" "}
            <span className="font-semibold text-dark-800">
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
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-dark-900">Arus Kas</h3>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
        </div>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
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
              <Legend />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-dark-900">
                Pemasukan per Kategori
              </h3>
              <p className="text-xs text-dark-500">
                Total {formatCurrency(summary.totalIncome)}
              </p>
            </div>
          </div>

          {incomeCategories.length > 0 ? (
            <ul className="space-y-3">
              {incomeCategories.map((item) => {
                const pct =
                  summary.totalIncome > 0
                    ? Math.round((item.amount / summary.totalIncome) * 100)
                    : 0;
                return (
                  <li key={`income-${item.category}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-dark-800">
                        {item.category}
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(item.amount)}
                        <span className="ml-2 text-xs font-medium text-dark-500">
                          {pct}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-dark-100">
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
            <p className="text-sm text-dark-500">
              Belum ada data pemasukan pada rentang waktu ini.
            </p>
          )}
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <TrendingDown className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-dark-900">
                Pengeluaran per Kategori
              </h3>
              <p className="text-xs text-dark-500">
                Total {formatCurrency(summary.totalExpense)}
              </p>
            </div>
          </div>

          {expenseCategories.length > 0 ? (
            <ul className="space-y-3">
              {expenseCategories.map((item) => {
                const pct =
                  summary.totalExpense > 0
                    ? Math.round((item.amount / summary.totalExpense) * 100)
                    : 0;
                return (
                  <li key={`expense-${item.category}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-dark-800">
                        {item.category}
                      </span>
                      <span className="font-semibold text-red-700">
                        {formatCurrency(item.amount)}
                        <span className="ml-2 text-xs font-medium text-dark-500">
                          {pct}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-dark-100">
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
            <p className="text-sm text-dark-500">
              Belum ada data pengeluaran pada rentang waktu ini.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}