"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Calendar, Clock, Filter } from "lucide-react";
import { formatDateTime, getDaysRemaining } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  startDate?: string;
  deadline: string;
  submissions?: any[];
}

interface TaskTrackerProps {
  tasks: Task[];
}

export default function TaskTracker({ tasks }: TaskTrackerProps) {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const filtered = tasks.filter((task) => {
        const taskDate = new Date(task.deadline);
        return (
          taskDate >= new Date(dateRange.start) &&
          taskDate <= new Date(dateRange.end)
        );
      });
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks(tasks);
    }
  }, [dateRange, tasks]);

  return (
    <Card padding="lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-dark-900 dark:text-white">Task Tracker</h2>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">
            Pantau semua tugas berdasarkan rentang waktu
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-dark-600 dark:text-dark-300 tracking-widest ml-1 mb-1">TGL. MULAI</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value })}
              className="rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-1.5 text-sm text-dark-700 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <span className="text-dark-400 dark:text-dark-500 pb-2">-</span>
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
        {filteredTasks.length === 0? (
          <div className="text-center py-12 text-dark-400 dark:text-dark-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Tidak ada tugas dalam rentang waktu ini</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const daysLeft = getDaysRemaining(task.deadline);
            const urgency =
              daysLeft <= 1? "danger" : daysLeft <= 3? "warning" : "info";

            return (
              <div
                key={task.id}
                className="group rounded-xl border border-dark-100 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-800/40 p-4 hover:border-primary-200 dark:hover:border-primary-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-dark-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                      {task.title}
                    </h3>
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
                      Mulai {formatDateTime(task.startDate)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(task.deadline)}
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
          })
        )}
      </div>
    </Card>
  );
}