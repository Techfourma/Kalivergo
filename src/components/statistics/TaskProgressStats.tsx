"use client";

import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
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

interface Submission {
  userId: string;
  status: string;
  submittedAt?: Date | string | null;
  user?: {
    id: string;
    name: string;
  };
}

interface Task {
  id: string;
  title: string;
  startDate?: Date | string;
  deadline: Date | string;
  submissions: Submission[];
}

interface User {
  id: string;
  name: string;
  image?: string | null;
}

interface TaskProgressStatsProps {
  tasks: Task[];
  users: User[];
}

interface ChartDataPoint {
  date: string;
  submitted: number;
  pending: number;
  rate: number;
}

interface MemberProgress {
  userId: string;
  name: string;
  image?: string | null;
  submitted: number;
  pending: number;
  total: number;
  rate: number;
}

export default function TaskProgressStats({ tasks, users }: TaskProgressStatsProps) {
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const allMemberNames = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.name))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [users]);

  const memberProgress = useMemo<MemberProgress[]>(() => {
    if (tasks.length === 0) return [];

    const progressMap = new Map<string, MemberProgress>();

    users.forEach((user) => {
      let submitted = 0;
      tasks.forEach((task) => {
        const submission = task.submissions.find((s) => s.userId === user.id);
        if (submission && submission.status !== "PENDING") {
          submitted++;
        }
      });

      const total = tasks.length;
      const pending = total - submitted;
      const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

      progressMap.set(user.id, {
        userId: user.id,
        name: user.name,
        image: user.image,
        submitted,
        pending,
        total,
        rate,
      });
    });

    return Array.from(progressMap.values());
  }, [tasks, users]);

  const filteredTasks = useMemo(() => {
    if (!startDate && !endDate) return tasks;
    return tasks.filter((task) => {
      const taskStart = task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : null;
      const taskDeadline = new Date(task.deadline).toISOString().split("T")[0];
      
      if (startDate && taskDeadline < startDate) return false;
      if (startDate && taskStart && taskStart > endDate) return false;
      if (endDate && taskStart && taskDeadline < startDate) return false;
      
      return true;
    });
  }, [tasks, startDate, endDate]);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (filteredTasks.length === 0) return [];

    const dateSet = new Set<string>();

    filteredTasks.forEach((task) => {
      if (task.startDate) {
        dateSet.add(new Date(task.startDate).toISOString().split("T")[0]);
      }
      dateSet.add(new Date(task.deadline).toISOString().split("T")[0]);

      task.submissions.forEach((s) => {
        if (s.submittedAt) {
          dateSet.add(new Date(s.submittedAt).toISOString().split("T")[0]);
        }
      });
    });

    let sortedDates = Array.from(dateSet).sort();
    
    if (startDate || endDate) {
      sortedDates = sortedDates.filter((date) => {
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
      });
    }

    return sortedDates.map((date) => {
      let submitted = 0;

      if (selectedMember === "all") {
        const submittedTaskIds = new Set<string>();
        filteredTasks.forEach((task) => {
          task.submissions.forEach((s) => {
            if (s.status !== "PENDING" && s.submittedAt) {
              const submittedDate = new Date(s.submittedAt).toISOString().split("T")[0];
              if (submittedDate <= date) {
                submittedTaskIds.add(task.id);
              }
            }
          });
        });
        submitted = submittedTaskIds.size;
      } else {
        filteredTasks.forEach((task) => {
          const submission = task.submissions.find((s) => s.userId === selectedMember);
          if (submission && submission.status !== "PENDING" && submission.submittedAt) {
            const submittedDate = new Date(submission.submittedAt).toISOString().split("T")[0];
            if (submittedDate <= date) {
              submitted++;
            }
          }
        });
      }

      const pending = Math.max(0, filteredTasks.length - submitted);
      const rate = filteredTasks.length > 0 ? Math.round((submitted / filteredTasks.length) * 100) : 0;

      return { date, submitted, pending, rate };
    });
  }, [filteredTasks, selectedMember, startDate, endDate]);

  const summary = useMemo(() => {
    if (selectedMember === "all") {
      const totalSubmitted = memberProgress.reduce((sum, m) => sum + m.submitted, 0);
      const totalPending = memberProgress.reduce((sum, m) => sum + m.pending, 0);
      const totalRate = memberProgress.length > 0
        ? Math.round(memberProgress.reduce((sum, m) => sum + m.rate, 0) / memberProgress.length)
        : 0;
      return {
        submitted: totalSubmitted,
        pending: totalPending,
        rate: totalRate,
      };
    }

    const member = memberProgress.find((m) => m.userId === selectedMember);
    if (!member) {
      return { submitted: 0, pending: filteredTasks.length, rate: 0 };
    }
    return {
      submitted: member.submitted,
      pending: member.pending,
      rate: member.rate,
    };
  }, [selectedMember, memberProgress, filteredTasks.length]);

  const selectedUserName = useMemo(() => {
    if (selectedMember === "all") return "Semua Anggota";
    return users.find((u) => u.id === selectedMember)?.name || "Anggota";
  }, [selectedMember, users]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  };

  const selectedMemberProgress = useMemo(() => {
    if (selectedMember === "all") return null;
    return memberProgress.find((m) => m.userId === selectedMember) || null;
  }, [selectedMember, memberProgress]);

  const resetDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
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
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetDateRange}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 text-sm font-medium text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
          {(startDate || endDate) && (
            <p className="mt-2 text-xs text-dark-500 dark:text-dark-400">
              Menampilkan data dari{" "}
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
              </span>
            </p>
          )}
        </div>

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

        <div className="mb-6">
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
            Filter Nama
          </label>
          <div className="relative">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="appearance-none bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg px-4 py-2.5 pr-10 text-sm text-dark-900 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
            >
              <option value="all">Semua Anggota</option>
              {allMemberNames.map((name) => (
                <option key={name} value={users.find((u) => u.name === name)?.id}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
          </div>
        </div>

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

      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark-900 dark:text-white">Rincian Progress</h3>
            <p className="text-sm text-dark-500 dark:text-dark-400">
              {selectedMember === "all" ? "Semua anggota" : selectedUserName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2">
              <ClipboardList className="h-4 w-4 text-primary-500" />
              <div>
                <p className="text-[10px] font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">Total Tugas</p>
                <p className="text-sm font-bold text-dark-900 dark:text-white">{filteredTasks.length}</p>
              </div>
            </div>
            <Badge variant={summary.rate === 100 ? "success" : summary.rate >= 50 ? "warning" : "danger"}>
              {summary.rate === 100 ? "Selesai" : summary.rate >= 50 ? "Cukup" : "Kurang"} {summary.rate}%
            </Badge>
          </div>
        </div>

        {selectedMember === "all" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Nama</th>
                  <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Total</th>
                  <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Dikerjakan</th>
                  <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Belum</th>
                  <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Progress</th>
                </tr>
              </thead>
              <tbody>
                {memberProgress.map((member) => (
                  <tr key={member.userId} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-4 text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <Avatar src={member.image} name={member.name} size="sm" />
                        {member.name}
                      </div>
                    </td>
                    <td className="text-center py-2 px-4 text-gray-900 dark:text-gray-100">{member.total}</td>
                    <td className="text-center py-2 px-4 text-green-600 dark:text-green-400">{member.submitted}</td>
                    <td className="text-center py-2 px-4 text-red-600 dark:text-red-400">{member.pending}</td>
                    <td className="text-center py-2 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${member.rate === 100 ? 'bg-green-500' : member.rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${member.rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10">{member.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedMemberProgress ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Tugas</th>
                  <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const submission = task.submissions.find((s) => s.userId === selectedMember);
                  const isSubmitted = !!submission && submission.status !== "PENDING";
                  return (
                    <tr key={task.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-4 text-gray-900 dark:text-gray-100">{task.title}</td>
                      <td className="text-center py-2 px-4">
                        <Badge variant={isSubmitted ? "success" : "danger"}>
                          {isSubmitted ? "Dikerjakan" : "Belum"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-dark-400 dark:text-dark-500">
            <p>Pilih anggota untuk melihat rincian progress</p>
          </div>
        )}
      </Card>
    </div>
  );
}
