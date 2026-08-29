"use client";

import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { UserX, AlertTriangle, ChevronDown, GraduationCap } from "lucide-react";

interface User {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
}

interface SeminarSubmission {
  userId: string;
}

interface Seminar {
  id: string;
  title: string;
  date: string;
  submissions: SeminarSubmission[];
}

interface SeminarUnsubmittedListProps {
  seminars: Seminar[];
  allUsers: User[];
}

export default function SeminarUnsubmittedList({ seminars, allUsers }: SeminarUnsubmittedListProps) {
  const [selectedSeminarId, setSelectedSeminarId] = useState<string>(
    seminars.length > 0 ? seminars[0].id : ""
  );

  const selectedSeminar = useMemo(
    () => seminars.find((s) => s.id === selectedSeminarId) ?? null,
    [seminars, selectedSeminarId]
  );

  const submittedUserIds = useMemo(
    () => new Set(selectedSeminar?.submissions.map((s) => s.userId) ?? []),
    [selectedSeminar]
  );

  const notSubmittedUsers = useMemo(
    () => allUsers.filter((u) => !submittedUserIds.has(u.id)),
    [allUsers, submittedUserIds]
  );

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white">Belum Terdaftar</h2>
          <p className="text-xs text-dark-400 dark:text-dark-500">
            {selectedSeminar
              ? `${notSubmittedUsers.length} anggota belum submit`
              : "Pilih seminar untuk melihat data"}
          </p>
        </div>
      </div>


      {seminars.length > 0 ? (
        <div className="relative mb-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-3.5 w-3.5 text-dark-500 dark:text-dark-400" />
            <span className="text-xs font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">
              Pilih Seminar
            </span>
          </div>
          <div className="relative">
            <select
              value={selectedSeminarId}
              onChange={(e) => setSelectedSeminarId(e.target.value)}
              className="w-full appearance-none pl-3 pr-9 py-2.5 border border-dark-200 dark:border-dark-700 rounded-xl text-sm text-dark-900 dark:text-white bg-white dark:bg-dark-900 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none cursor-pointer font-medium"
            >
              {seminars.map((seminar) => (
                <option key={seminar.id} value={seminar.id} className="text-dark-900 dark:text-white bg-white dark:bg-dark-900">
                  {seminar.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 dark:text-dark-500 pointer-events-none" />
          </div>
          {selectedSeminar && (
            <p className="text-xs text-dark-400 dark:text-dark-500 mt-1 pl-1">
              Tanggal:{" "}
              {new Date(selectedSeminar.date).toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-dark-50 dark:bg-dark-800 rounded-xl text-sm text-dark-500 dark:text-dark-400 text-center">
          Belum ada seminar ditambahkan di CMS
        </div>
      )}

      <div className="space-y-2">
        {!selectedSeminar ? null : notSubmittedUsers.length === 0 ? (
          <div className="text-center py-8 text-dark-400 dark:text-dark-500">
            <UserX className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Semua anggota sudah mengumpulkan! 🎉</p>
          </div>
        ) : (
          notSubmittedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-xl border border-transparent bg-dark-50 dark:bg-dark-800/50 dark:border-dark-700/50 p-3 hover:bg-red-50 dark:hover:bg-red-950/20 dark:hover:border-red-900/40 transition-colors"
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
              <Badge variant="danger">Pending</Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}