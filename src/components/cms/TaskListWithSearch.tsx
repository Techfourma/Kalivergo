"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import TaskSubmissionManager from "@/components/ui/TaskSubmissionManager";
import EditTaskButton from "@/components/cms/EditTaskButton";
import DeleteTaskButton from "@/components/ui/DeleteTaskButton";
import Badge from "@/components/ui/Badge";
import { getTaskCategoryLabel } from "@/shared/task-category";

interface User {
  id: string;
  name: string;
  email?: string;
  image?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  url?: string | null;
  category?: string;
  startDate: string | Date;
  deadline: string | Date;
  submissions?: { userId: string }[];
}

interface TaskListWithSearchProps {
  tasks: Task[];
  allUsers: User[];
}

export default function TaskListWithSearch({ tasks, allUsers }: TaskListWithSearchProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase().trim();
    return tasks.filter((task) => {
      const title = task.title.toLowerCase();
      const description = task.description.toLowerCase();
      const category = (task.category ?? "").toLowerCase();
      const categoryLabel = getTaskCategoryLabel(task.category).toLowerCase();
      return title.includes(q) || description.includes(q) || category.includes(q) || categoryLabel.includes(q);
    });
  }, [tasks, search]);

  return (
    <div className="relative rounded-2xl border-2 border-dark-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/70 backdrop-blur-xl overflow-hidden shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.55)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/80 dark:via-white/10 to-transparent" />

      <div className="p-4 md:p-6 border-b border-dark-100 dark:border-dark-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white">
          Daftar Tugas ({filtered.length})
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tugas..."
            className="w-full sm:w-64 pl-9 pr-4 py-2 border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900/60 text-dark-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="divide-y divide-dark-100 dark:divide-dark-800">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-dark-500 dark:text-dark-400">
            {tasks.length === 0 ? "Belum ada tugas. Tambahkan tugas pertama Anda!" : "Tidak ada tugas yang sesuai dengan pencarian."}
          </div>
        ) : (
          filtered.map((task) => {
            const submittedUserIds = task.submissions?.map((s) => s.userId) ?? [];
            return (
              <div
                key={task.id}
                className="p-4 md:p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 hover:bg-dark-50 dark:hover:bg-dark-800/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="font-semibold text-dark-900 dark:text-white break-words line-clamp-2">
                      {task.title}
                    </h3>
                    <Badge
                      variant={task.category === "TATAP_MUKA" ? "warning" : "info"}
                      className="shrink-0 mt-0.5"
                    >
                      {getTaskCategoryLabel(task.category)}
                    </Badge>
                  </div>
                  <p className="text-sm text-dark-600 dark:text-dark-300 mt-1 break-words">
                    {task.description}
                  </p>
                  <div className="text-xs md:text-sm text-dark-500 dark:text-dark-400 mt-2 space-y-1">
                    <p className="text-primary-600 dark:text-primary-400">
                      Start:{" "}
                      {new Date(task.startDate).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-red-600 dark:text-red-400">
                      Deadline:{" "}
                      {new Date(task.deadline).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-0 border-dark-100 dark:border-dark-800">
                  <TaskSubmissionManager
                    taskId={task.id}
                    taskTitle={task.title}
                    submittedUserIds={submittedUserIds}
                    allUsers={allUsers}
                    submissionCount={task.submissions?.length ?? 0}
                  />
                  <EditTaskButton task={task} />
                  <DeleteTaskButton id={task.id} title={task.title} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
