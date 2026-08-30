"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { CalendarDays, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getDaysRemaining, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  DEFAULT_TASK_CATEGORY,
  TASK_CATEGORIES,
  getTaskCategoryLabel,
} from "@/shared/task-category";

interface Task {
  id: string;
  title: string;
  description: string;
  startDate?: string;
  deadline: string;
  category?: string;
}

interface WeeklyTasksProps {
  tasks: Task[];
  tenantPath?: string;
}

export default function WeeklyTasks({ tasks, tenantPath }: WeeklyTasksProps) {
  const [category, setCategory] = useState<string>(DEFAULT_TASK_CATEGORY);

  const sortedTasks = [...tasks]
    .filter(
      (task) => (task.category ?? DEFAULT_TASK_CATEGORY) === category
    )
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

  const card = (
    <Card
      className={cn(
        "transition-all duration-300",
        tenantPath
          ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          : ""
      )}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white">Tugas Minggu Ini</h2>
          <p className="text-xs text-dark-400 dark:text-dark-500">
            {sortedTasks.length} tugas aktif
          </p>
        </div>
        <div className="relative shrink-0">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Filter kategori tugas"
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-dark-700 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium [color-scheme:light] dark:[color-scheme:dark]"
          >
            {Object.entries(TASK_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value} className="text-dark-900 dark:text-white bg-white dark:bg-dark-900">
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-dark-400 dark:text-dark-500">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada tugas minggu ini</p>
          </div>
        ) : (
          sortedTasks.map((task, index) => {
            const daysLeft = getDaysRemaining(task.deadline);
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl p-3 transition-all duration-200",
                  daysLeft <= 1
                    ? "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40"
                    : daysLeft <= 3
                    ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40"
                    : "bg-dark-50 dark:bg-dark-800/50 border border-dark-100 dark:border-dark-700/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    daysLeft <= 1
                      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                      : daysLeft <= 3
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                      : "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="font-medium text-dark-900 dark:text-white text-sm truncate flex-1 min-w-0">
                      {task.title}
                    </h4>
                    <Badge
                      variant={(task.category ?? DEFAULT_TASK_CATEGORY) === "TATAP_MUKA" ? "warning" : "info"}
                      className="shrink-0"
                    >
                      {getTaskCategoryLabel(task.category)}
                    </Badge>
                  </div>
                  <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5 truncate">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {task.startDate && (
                      <>
                        <CalendarDays className="h-3 w-3 text-dark-400 dark:text-dark-500" />
                        <span className="text-xs text-dark-400 dark:text-dark-500">
                          Mulai: {formatDateTime(task.startDate)}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-dark-400 dark:text-dark-500" />
                    <span className="text-xs text-dark-400 dark:text-dark-500">
                      Deadline: {formatDateTime(task.deadline)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={
                    daysLeft <= 0
                      ? "danger"
                      : daysLeft <= 1
                      ? "warning"
                      : "info"
                  }
                >
                  {daysLeft <= 0 ? "Overdue" : `${daysLeft} hari`}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );

  if (!tenantPath) return card;

  return (
    <Link href={`${tenantPath}/tasks`} className="block">
      {card}
    </Link>
  );
}
