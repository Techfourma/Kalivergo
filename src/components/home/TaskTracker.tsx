"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Calendar, Clock, Filter, CheckCircle2, Search } from "lucide-react";
import { formatDateTime, getDaysRemaining } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TASK_CATEGORY,
  getTaskCategoryLabel,
} from "@/shared/task-category";

interface Task {
  id: string;
  title: string;
  description: string;
  startDate?: string;
  deadline: string;
  url?: string | null;
  category?: string;
  submissions?: any[];
}

interface TaskTrackerProps {
  tasks: Task[];
  allTasks: Task[];
  currentUserId: string;
}

export default function TaskTracker({
  tasks,
  allTasks,
  currentUserId,
}: TaskTrackerProps) {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const filtered = tasks.filter((task) => {
        const rangeStart = new Date(dateRange.start);
        const rangeEnd = new Date(dateRange.end);
        const taskStart = new Date(task.startDate || task.deadline);
        const taskEnd = new Date(task.deadline);
        return taskStart <= rangeEnd && taskEnd >= rangeStart;
      });
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(tasks);
    }
  }, [dateRange, tasks]);

  const isRangeSelected = Boolean(dateRange.start && dateRange.end);

  const isSubmittedByUser = (task: Task) =>
    task.submissions?.some(
      (submission) =>
        submission.userId === currentUserId &&
        submission.status === "SUBMITTED"
    ) ?? false;

  const matchesCategory = (task: Task) =>
    categoryFilter === "all" ||
    (task.category ?? DEFAULT_TASK_CATEGORY) === categoryFilter;

  const matchesSearch = (task: Task) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const categoryLabel = getTaskCategoryLabel(task.category).toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      (task.category ?? "").toLowerCase().includes(q) ||
      categoryLabel.includes(q)
    );
  };

  const isTaskInRange = (task: Task) => {
    if (!isRangeSelected) return true;
    const rangeStart = new Date(dateRange.start);
    const rangeEnd = new Date(dateRange.end);
    const taskStart = new Date(task.startDate || task.deadline);
    const taskEnd = new Date(task.deadline);
    return taskStart <= rangeEnd && taskEnd >= rangeStart;
  };

  const todoTasks = (
    isRangeSelected
      ? allTasks.filter((task) => isTaskInRange(task) && !isSubmittedByUser(task))
      : filteredTasks.filter((task) => !isSubmittedByUser(task))
  ).filter(matchesCategory).filter(matchesSearch);

  const tasksInRange = isRangeSelected
    ? allTasks
        .filter((task) => isTaskInRange(task))
        .filter(matchesCategory)
        .filter(matchesSearch)
    : [];

  const scopeTasks = isRangeSelected
    ? tasksInRange
    : allTasks.filter(matchesCategory).filter(matchesSearch);
  const allDone =
    todoTasks.length === 0 &&
    scopeTasks.length > 0 &&
    scopeTasks.every(isSubmittedByUser);

  return (
    <Card padding="lg">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">Task Tracker</h2>
              <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
                Pantau semua tugas berdasarkan rentang waktu
              </p>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-dark-600 dark:text-dark-300 tracking-widest ml-1 mb-1">KATEGORI</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter kategori tugas"
                className="appearance-none rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-1.5 text-sm text-dark-700 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium [color-scheme:light] dark:[color-scheme:dark]"
              >
                <option value="all" className="text-dark-900 dark:text-white bg-white dark:bg-dark-900">Semua</option>
                <option value="E_LEARNING" className="text-dark-900 dark:text-white bg-white dark:bg-dark-900">E-Learning</option>
                <option value="TATAP_MUKA" className="text-dark-900 dark:text-white bg-white dark:bg-dark-900">Tatap Muka</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-dark-700 dark:text-dark-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-dark-600 dark:text-dark-300 tracking-widest ml-1 mb-1">TGL. MULAI</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value })}
              className="rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-1.5 text-sm text-dark-700 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <span className="text-dark-400 dark:text-dark-500 pb-2 hidden sm:inline">-</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-dark-600 dark:text-dark-300 tracking-widest ml-1 mb-1">TGL. SELESAI</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value })}
              className="rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-1.5 text-sm text-dark-700 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {todoTasks.length > 0 ? (
          todoTasks.map((task) => {
            const daysLeft = getDaysRemaining(task.deadline);
            const urgency =
              daysLeft <= 1? "danger" : daysLeft <= 3? "warning" : "info";

            const card = (
              <div
                key={task.id}
                className="group rounded-xl border border-dark-100 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-800/40 p-4 hover:border-primary-200 dark:hover:border-primary-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-dark-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors truncate flex-1 min-w-0">
                        {task.title}
                      </h3>
                      <Badge
                        variant={(task.category ?? DEFAULT_TASK_CATEGORY) === "TATAP_MUKA" ? "warning" : "info"}
                        className="shrink-0"
                      >
                        {getTaskCategoryLabel(task.category)}
                      </Badge>
                    </div>
                    <p className="text-sm text-dark-500 dark:text-dark-400 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                  <Badge variant={urgency as any}>
                    {daysLeft <= 0
                     ? "Terlewat"
                      : daysLeft === 1
                     ? "Besok"
                      : `${daysLeft} hari`}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-dark-400 dark:text-dark-500">
                  {task.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Mulai: {formatDateTime(task.startDate)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Deadline: {formatDateTime(task.deadline)}
                  </span>
                  {task.submissions && (
                    <span>
                      {task.submissions.filter((s) => s.status === "SUBMITTED").length}{" "}
                      mengumpulkan
                    </span>
                  )}
                </div>
              </div>
            );

            if (!task.url) return card;

            return (
              <a
                key={task.id}
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buka tugas ${task.title} di tab baru`}
                className="block"
              >
                {card}
              </a>
            );
          })
        ) : allDone ? (
          <div className="text-center py-12 rounded-xl border border-green-200 dark:border-green-800/60 bg-green-50/60 dark:bg-green-950/30">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-semibold text-dark-900 dark:text-white">
              Semua tugas sudah dikerjakan! 🎉
            </p>
            <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
              {isRangeSelected
                ? "Kamu telah menyelesaikan semua tugas pada rentang tanggal yang dipilih."
                : "Tidak ada tugas yang belum kamu kerjakan. Kerja bagus!"}
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-dark-400 dark:text-dark-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Tidak ada tugas dalam rentang waktu ini</p>
          </div>
        )}
      </div>
    </Card>
  );
}