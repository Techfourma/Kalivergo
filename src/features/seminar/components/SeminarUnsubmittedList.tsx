"use client";

import { useState, useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { UserX, AlertTriangle, ChevronDown, GraduationCap } from "lucide-react";

interface User {
  id: string;
  name: string;
  email?: string | null;
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-dark-900">Belum Mengumpulkan</h2>
          <p className="text-xs text-dark-400">
            {selectedSeminar
              ? `${notSubmittedUsers.length} anggota belum submit`
              : "Pilih seminar untuk melihat data"}
          </p>
        </div>
      </div>


      {seminars.length > 0 ? (
        <div className="relative mb-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-3.5 w-3.5 text-dark-500" />
            <span className="text-xs font-medium text-dark-500 uppercase tracking-wide">
              Pilih Seminar
            </span>
          </div>
          <div className="relative">
            <select
              value={selectedSeminarId}
              onChange={(e) => setSelectedSeminarId(e.target.value)}
              className="w-full appearance-none pl-3 pr-9 py-2.5 border border-dark-200 rounded-xl text-sm text-dark-900 bg-white focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none cursor-pointer font-medium"
            >
              {seminars.map((seminar) => (
                <option key={seminar.id} value={seminar.id}>
                  {seminar.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400 pointer-events-none" />
          </div>
          {selectedSeminar && (
            <p className="text-xs text-dark-400 mt-1 pl-1">
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
        <div className="mb-4 p-3 bg-dark-50 rounded-xl text-sm text-dark-500 text-center">
          Belum ada seminar ditambahkan di CMS
        </div>
      )}

      <div className="space-y-2">
        {!selectedSeminar ? null : notSubmittedUsers.length === 0 ? (
          <div className="text-center py-8 text-dark-400">
            <UserX className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Semua anggota sudah mengumpulkan! 🎉</p>
          </div>
        ) : (
          notSubmittedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 rounded-xl bg-dark-50 p-3 hover:bg-red-50 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-dark-900 text-sm truncate">
                  {user.name}
                </p>
                {user.email && (
                  <p className="text-xs text-dark-500 truncate">{user.email}</p>
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