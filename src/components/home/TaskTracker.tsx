"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Calendar, Clock, Filter, CheckCircle2, Search, ClipboardCheck, X, Loader2 } from "lucide-react";
import { formatDateTime, getDaysRemaining } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  DEFAULT_TASK_CATEGORY,
  getTaskCategoryLabel,
} from "@/shared/task-category";
import { submitTaskForReviewAction } from "@/features/task/actions/task.action";

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

type Submission = { userId: string; status: string };

export default function TaskTracker({
  tasks,
  allTasks,
  currentUserId,
}: TaskTrackerProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isPending, startTransition] = useTransition();
  const gestureStartX = useRef<number | null>(null);
  const gestureTaskId = useRef<string | null>(null);
  const didSwipe = useRef(false);

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

  const currentSubmission = (task: Task) =>
    (task.submissions as Submission[] | undefined)?.find(
      (submission) => submission.userId === currentUserId
    );

  const submitAfterSwipe = (task: Task) => {
    if (currentSubmission(task)?.status === "PENDING_REVIEW") return;
    setConfirmTask(task);
  };

  const confirmSubmission = () => {
    if (!confirmTask) return;
    const task = confirmTask;
    setConfirmTask(null);

    setPendingTaskIds((previous) => new Set(previous).add(task.id));
    startTransition(async () => {
      const result = await submitTaskForReviewAction(task.id);
      setPendingTaskIds((previous) => {
        const next = new Set(previous);
        next.delete(task.id);
        return next;
      });
      if ("error" in result && result.error) {
        window.alert(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handlePointerDown = (taskId: string, event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gestureStartX.current = event.clientX;
    gestureTaskId.current = taskId;
    didSwipe.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (gestureStartX.current === null) return;
    const distance = event.clientX - gestureStartX.current;
    if (Math.abs(distance) > 10) {
      event.preventDefault();
      setSwipeOffset(Math.max(-140, Math.min(140, distance)));
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const startX = gestureStartX.current;
    const taskId = gestureTaskId.current;
    gestureStartX.current = null;
    gestureTaskId.current = null;
    const distance = startX === null ? 0 : event.clientX - startX;
    setSwipeOffset(0);
    if (startX === null || !taskId) return;

    if (Math.abs(distance) < 60) return;
    didSwipe.current = true;
    const task = allTasks.find((candidate) => candidate.id === taskId);
    if (task) submitAfterSwipe(task);
  };

  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!didSwipe.current) return;
    event.preventDefault();
    event.stopPropagation();
    didSwipe.current = false;
  };

  const swipeStyle = (taskId: string) => ({
    transform: `translateX(${gestureTaskId.current === taskId ? swipeOffset : 0}px)`,
    transition: gestureTaskId.current === taskId && swipeOffset !== 0
      ? "none"
      : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
    userSelect: "none" as const,
  });

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
                Geser kartu tugas ke kiri/kanan jika tugas sudah selesai.
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
                className="group select-none rounded-xl border border-dark-100 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-800/40 p-4 hover:border-primary-200 dark:hover:border-primary-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-all duration-200"
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
                {currentSubmission(task)?.status === "PENDING_REVIEW" && (
                  <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                    Menunggu validasi administrator
                  </p>
                )}
                {currentSubmission(task)?.status === "REJECTED" && (
                  <p className="mt-3 text-xs font-medium text-red-700 dark:text-red-300">
                    Submission dikembalikan. Silakan kerjakan kembali.
                  </p>
                )}
              </div>
            );

            if (!task.url) {
              return (
                <div
                  key={task.id}
                  onPointerDown={(event) => handlePointerDown(task.id, event)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onClick={handleCardClick}
                  style={{ ...swipeStyle(task.id), touchAction: "pan-y" }}
                >
                  {card}
                </div>
              );
            }

            return (
              <a
                key={task.id}
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buka tugas ${task.title} di tab baru`}
                onPointerDown={(event) => handlePointerDown(task.id, event)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={handleCardClick}
                aria-busy={isPending && pendingTaskIds.has(task.id)}
                className="block touch-pan-y"
                style={swipeStyle(task.id)}
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

      {confirmTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-dark-100 bg-white p-6 text-center shadow-2xl dark:border-dark-700 dark:bg-dark-900 sm:p-8">
            <button
              type="button"
              onClick={() => setConfirmTask(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-dark-100 hover:text-dark-600 dark:hover:bg-dark-800 dark:hover:text-dark-200"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <p className="mt-3 text-sm leading-6 text-dark-600 dark:text-dark-300">
              Apakah Anda yakin telah menyelesaikan tugas <span className="font-semibold text-dark-900 dark:text-white">{confirmTask.title}</span>?
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setConfirmTask(null)}
                className="rounded-lg border border-dark-200 px-5 py-2.5 text-sm font-medium text-dark-700 transition-colors hover:bg-dark-50 dark:border-dark-700 dark:text-dark-200 dark:hover:bg-dark-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSubmission}
                disabled={isPending}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-600/20 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Iya
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}