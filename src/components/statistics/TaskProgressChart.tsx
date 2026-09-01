"use client";

import { useMemo } from "react";
import Card from "@/components/ui/Card";
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
import { ChevronDown, ClipboardList, CheckCircle2, XCircle, CalendarRange } from "lucide-react";

interface ChartDataPoint {
  date: string;
  submitted: number;
  pending: number;
  rate: number;
}

interface TaskProgressChartProps {
  selectedMember: string;
  startDate: string;
  endDate: string;
  chartData: ChartDataPoint[];
  filteredTasks: any[];
  summary: {
    submitted: number;
    pending: number;
    rate: number;
  };
  users: any[];
  allMemberNames: string[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onResetDateRange: () => void;
  onMemberChange: (memberId: string) => void;
}

export default function TaskProgressChart({
  selectedMember,
  startDate,
  endDate,
  chartData,
  filteredTasks,
  summary,
  users,
  allMemberNames,
  onStartDateChange,
  onEndDateChange,
  onResetDateRange,
  onMemberChange,
}: TaskProgressChartProps) {
  const selectedUserName = useMemo(() => {
    if (selectedMember === "all") return "Semua Anggota";
    return users.find((u: any) => u.id === selectedMember)?.name || "Anggota";
  }, [selectedMember, users]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">
              Progress Pengerjaan Tugas
            </h3>
            <p className="text-sm text-dark-500 dark:text-dark-400">
              {selectedMember === "all"
                ? "Persentase pengerjaan tugas keseluruhan kelas berdasarkan waktu"
                : `Progress pengerjaan tugas: ${selectedUserName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarRange className="h-4 w-4 text-dark-500 dark:text-dark-400" />
          <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Rentang Waktu</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-dark-600 dark:text-dark-400 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-dark-600 dark:text-dark-400 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate || undefined}
              className="w-full rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={onResetDateRange}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Date Range Info */}
        {startDate && endDate && (
          <p className="mt-2 text-xs text-dark-500 dark:text-dark-400">
            Menampilkan data dari{" "}
            <span className="font-semibold text-dark-800 dark:text-dark-200">
              {new Date(`${startDate}T00:00:00`).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>{" "}
            sampai{" "}
            <span className="font-semibold text-dark-800 dark:text-dark-200">
              {new Date(`${endDate}T00:00:00`).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2">
          <ClipboardList className="h-4 w-4 text-primary-500" />
          <div>
            <p className="text-[10px] font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">Total Tugas</p>
            <p className="text-sm font-bold text-dark-900 dark:text-white">{filteredTasks.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <div>
            <p className="text-[10px] font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">Dikerjakan</p>
            <p className="text-sm font-bold text-dark-900 dark:text-white">{summary.submitted}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-[10px] font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">Belum</p>
            <p className="text-sm font-bold text-dark-900 dark:text-white">{summary.pending}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2">
          <ClipboardList className="h-4 w-4 text-indigo-500" />
          <div>
            <p className="text-[10px] font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">Progress</p>
            <p className="text-sm font-bold text-dark-900 dark:text-white">{summary.rate}%</p>
          </div>
        </div>
      </div>

      {/* Member Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
          Filter Nama
        </label>
        <div className="relative">
          <select
            value={selectedMember}
            onChange={(e) => onMemberChange(e.target.value)}
            className="appearance-none bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
          >
            <option value="all">Semua Anggota</option>
            {allMemberNames.map((name) => (
              <option key={name} value={users.find((u: any) => u.name === name)?.id}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="text-center py-16 text-dark-400 dark:text-dark-500">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Belum ada data tugas</p>
          <p className="text-sm mt-1">Tugas yang dibuat di CMS akan muncul di sini</p>
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="submittedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="text-gray-600 dark:text-gray-400"
                interval={0}
                angle={-15}
                textAnchor="end"
                height={80}
                tickFormatter={formatDateLabel}
              />
              <YAxis
                label={{ value: 'Jumlah Tugas', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    submitted: "Dikerjakan",
                    pending: "Belum",
                    rate: "Progress",
                  };
                  if (name === "rate") return [`${value}%`, "Progress"];
                  return [value, labels[name] || name];
                }}
                labelFormatter={(label) => {
                  const date = new Date(label + "T00:00:00");
                  return date.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="submitted"
                name="Dikerjakan"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#submittedGradient)"
              />
              <Area
                type="monotone"
                dataKey="pending"
                name="Belum"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#pendingGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
