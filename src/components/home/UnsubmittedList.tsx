"use client";

import { useState, useMemo, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { AlertTriangle, ChevronDown, ClipboardList, CheckCircle2, UserX } from "lucide-react";
import { DEFAULT_TASK_CATEGORY, getTaskCategoryLabel } from "@/shared/task-category";

interface User {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
}

interface Pertemuan {
  id: string;
  name: string;
}

interface Submission {
  userId: string;
  status?: string;
  pertemuanId?: string | null;
}

interface Task {
  id: string;
  title: string;
  category?: string;
  startDate?: string;
  deadline: string;
  submissions: Submission[];
  pertemuan?: Pertemuan[];
}

interface UnsubmittedListProps {
  tasks: Task[];
  allUsers: User[];
}

export default function UnsubmittedList({ tasks, allUsers }: UnsubmittedListProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedPertemuanId, setSelectedPertemuanId] = useState<string>("");
  const [pertemuanList, setPertemuanList] = useState<Pertemuan[]>([]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  useEffect(() => {
    if (selectedTask) {
      setSelectedPertemuanId("");
      setPertemuanList(selectedTask.pertemuan ?? []);
    } else {
      setSelectedPertemuanId("");
      setPertemuanList([]);
    }
  }, [selectedTask]);

  const submittedUserIds = useMemo(() => {
    if (!selectedTask) return new Set<string>();
    const ids = new Set<string>();
    for (const submission of selectedTask.submissions) {
      if (submission.status !== "PENDING") {
        if (selectedPertemuanId) {
          if (submission.pertemuanId === selectedPertemuanId) {
            ids.add(submission.userId);
          }
        } else {
          ids.add(submission.userId);
        }
      }
    }
    return ids;
  }, [selectedTask, selectedPertemuanId]);

  const allMemberNames = useMemo(() => {
    return Array.from(new Set(allUsers.map((u) => u.name))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [allUsers]);

  const usersForSelectedTask = useMemo(() => {
    if (!selectedTask) return [];
    let result = allUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      submitted: submittedUserIds.has(user.id),
    }));
    if (selectedMember !== "all") {
      result = result.filter((u) => u.name === selectedMember);
    }
    return result;
  }, [allUsers, selectedTask, submittedUserIds, selectedMember]);

  const submittedCount = usersForSelectedTask.filter((u) => u.submitted).length;
  const notSubmittedCount = usersForSelectedTask.filter((u) => !u.submitted).length;

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white">Pengumpulan Tugas</h2>
          <p className="text-xs text-dark-400 dark:text-dark-500">
            {selectedTask
              ? `${submittedCount} sudah mengumpulkan, ${notSubmittedCount} belum`
              : "Pilih tugas untuk melihat data"}
          </p>
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-3.5 w-3.5 text-dark-500 dark:text-dark-400" />
              <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">
                Pilih Tugas
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full appearance-none pl-3 pr-9 py-2.5 border border-dark-200 dark:border-dark-700 rounded-xl text-sm text-dark-900 dark:text-white bg-white dark:bg-dark-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer font-medium"
              >
                <option value="">-- Pilih Tugas --</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id} className="text-dark-900 dark:text-white bg-white dark:bg-dark-900">
                    {task.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
            </div>
            {selectedTask && (
              <div className="text-xs text-dark-400 dark:text-dark-500 mt-1 pl-1 space-y-0.5">
                <p>
                  Kategori:{" "}
                  <span
                    className={
                      (selectedTask.category ?? DEFAULT_TASK_CATEGORY) === "TATAP_MUKA"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-primary-600 dark:text-primary-400"
                    }
                  >
                    {getTaskCategoryLabel(selectedTask.category)}
                  </span>
                </p>
                {selectedTask.startDate && (
                  <p>
                    Mulai:{" "}
                    {new Date(selectedTask.startDate).toLocaleDateString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                <p>
                  Deadline:{" "}
                  {new Date(selectedTask.deadline).toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {selectedTask && pertemuanList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="h-3.5 w-3.5 text-dark-500 dark:text-dark-400" />
                <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">
                  Pilih Pertemuan
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedPertemuanId}
                  onChange={(e) => setSelectedPertemuanId(e.target.value)}
                  className="w-full appearance-none pl-3 pr-9 py-2.5 border border-dark-200 dark:border-dark-700 rounded-xl text-sm text-dark-900 dark:text-white bg-white dark:bg-dark-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer font-medium"
                >
                  <option value="">-- Semua Pertemuan --</option>
                  {pertemuanList.map((p) => (
                    <option key={p.id} value={p.id} className="text-dark-900 dark:text-white bg-white dark:bg-dark-900">
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
              </div>
            </div>
          )}

          {selectedTask && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">
                  Filter Nama
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full appearance-none pl-3 pr-9 py-2.5 border border-dark-200 dark:border-dark-700 rounded-xl text-sm text-dark-900 dark:text-white bg-white dark:bg-dark-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer font-medium"
                >
                  <option value="all">Semua Anggota</option>
                  {allMemberNames.map((name) => (
                    <option key={name} value={name} className="text-dark-900 dark:text-white bg-white dark:bg-dark-900">
                      {name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl text-sm text-dark-500 dark:text-dark-400 text-center">
          Belum ada tugas ditambahkan di CMS
        </div>
      )}

      <div className="space-y-2">
        {!selectedTask ? (
          <div className="text-center py-10 text-dark-400 dark:text-dark-500">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Silakan pilih tugas terlebih dahulu</p>
          </div>
        ) : usersForSelectedTask.length === 0 ? (
          <div className="text-center py-10 text-dark-400 dark:text-dark-500">
            <UserX className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada anggota yang cocok dengan filter ini</p>
          </div>
        ) : (
          usersForSelectedTask.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                user.submitted
                  ? "border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20"
                  : "bg-dark-50 dark:bg-dark-800/50 hover:bg-red-50 dark:hover:bg-red-950/20"
              }`}
            >
              <Avatar src={user.image} name={user.name} id={user.id} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark-900 dark:text-white text-sm truncate">
                  {user.name}
                </p>
                {user.email && (
                  <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{user.email}</p>
                )}
              </div>
              <Badge variant={user.submitted ? "success" : "danger"}>
                {user.submitted ? "Sudah Mengumpulkan" : "Belum Mengumpulkan"}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
