"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface Transaction {
  type: string;
  amount: number;
}

interface HomeFinanceCardProps {
  transactions: Transaction[];
  tenantPath: string;
}

const SLIDE_INTERVAL = 3000;

export default function HomeFinanceCard({ transactions, tenantPath }: HomeFinanceCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const summary = transactions.reduce(
    (acc, t) => {
      const amount = Number(t.amount);
      if (t.type === "INCOME") {
        acc.income += amount;
      } else if (t.type === "EXPENSE") {
        acc.expense += amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const balance = summary.income - summary.expense;

  const metrics = [
    {
      key: "income",
      label: "Total Pemasukan",
      value: summary.income,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100/80 dark:from-emerald-950/40 dark:to-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800/50",
      text: "text-emerald-900 dark:text-emerald-300",
      subtext: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    {
      key: "expense",
      label: "Total Pengeluaran",
      value: summary.expense,
      icon: TrendingDown,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100/80 dark:from-red-950/40 dark:to-red-900/20",
      border: "border-red-200 dark:border-red-800/50",
      text: "text-red-900 dark:text-red-300",
      subtext: "text-red-600 dark:text-red-400",
      dot: "bg-red-500",
    },
    {
      key: "balance",
      label: "Saldo",
      value: balance,
      icon: Wallet,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100/80 dark:from-blue-950/40 dark:to-blue-900/20",
      border: "border-blue-200 dark:border-blue-800/50",
      text: "text-blue-900 dark:text-white",
      subtext: "text-blue-600 dark:text-blue-300",
      dot: "bg-blue-500",
    },
  ];

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [isTransitioning]);

  useEffect(() => {
    if (isPaused || metrics.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % metrics.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, metrics.length]);

  const current = metrics[currentIndex];
  const Icon = current.icon;

  return (
    <Link href={`${tenantPath}/dashboard`} className="block">
      <Card
        padding="none"
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer",
          current.bgGradient,
          current.border
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex items-center gap-4 p-4 sm:p-5">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-all duration-400",
              `bg-gradient-to-br ${current.gradient}`
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-semibold uppercase tracking-wider transition-colors duration-400", current.subtext)}>
              {current.label}
            </p>
            <p className={cn("text-xl sm:text-2xl font-bold mt-0.5 transition-colors duration-400 truncate", current.text)}>
              {formatCurrency(current.value)}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo((currentIndex - 1 + metrics.length) % metrics.length);
              }}
              className="rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-white/60 dark:hover:bg-dark-800/60"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo((currentIndex + 1) % metrics.length);
              }}
              className="rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-white/60 dark:hover:bg-dark-800/60"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-3 pt-1">
          {metrics.map((m, idx) => (
            <button
              key={m.key}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(idx);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-400",
                idx === currentIndex ? "w-5" : "w-1.5 opacity-40",
                m.dot
              )}
              aria-label={`Lihat ${m.label}`}
            />
          ))}
        </div>
      </Card>
    </Link>
  );
}
