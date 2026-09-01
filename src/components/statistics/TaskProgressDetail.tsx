"use client";

import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import { ClipboardList } from "lucide-react";

interface MemberProgress {
  userId: string;
  name: string;
  image?: string | null;
  submitted: number;
  pending: number;
  total: number;
  rate: number;
}

interface SelectedMemberTaskRow {
  title: string;
  totalMeetings: number;
  completedMeetings: number;
  rate: number;
  meetingList: string[];
}

interface TaskProgressDetailProps {
  selectedMember: string;
  selectedUserName: string;
  memberProgress: MemberProgress[];
  selectedMemberTaskRows: SelectedMemberTaskRow[];
  selectedMemberProgress: MemberProgress | null;
  summary: {
    submitted: number;
    pending: number;
    rate: number;
  };
  taskProgressEntries: any[];
}

export default function TaskProgressDetail({
  selectedMember,
  selectedUserName,
  memberProgress,
  selectedMemberTaskRows,
  selectedMemberProgress,
  summary,
  taskProgressEntries,
}: TaskProgressDetailProps) {
  return (
    <Card padding="lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-dark-900 dark:text-white">Rincian Progress</h3>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            {selectedMember === "all" ? "Semua anggota" : selectedUserName}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-3 py-2">
            <ClipboardList className="h-4 w-4 text-primary-500" />
            <div>
              <p className="text-[10px] font-medium text-dark-500 dark:text-dark-400 uppercase tracking-wide">Total Tugas</p>
              <p className="text-sm font-bold text-dark-900 dark:text-white">{taskProgressEntries.length}</p>
            </div>
          </div>
          <Badge variant={summary.rate === 100 ? "success" : summary.rate >= 50 ? "warning" : "danger"}>
            {summary.rate === 100 ? "Selesai" : summary.rate >= 50 ? "Cukup" : "Kurang"} {summary.rate}%
          </Badge>
        </div>
      </div>

      {/* Content */}
      {selectedMember === "all" ? (
        <AllMembersTable memberProgress={memberProgress} />
      ) : selectedMemberProgress ? (
        <SelectedMemberTable taskRows={selectedMemberTaskRows} />
      ) : (
        <EmptyState />
      )}
    </Card>
  );
}

/**
 * Table for viewing all members' progress
 */
function AllMembersTable({ memberProgress }: { memberProgress: MemberProgress[] }) {
  return (
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
                <ProgressBar rate={member.rate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Table for viewing selected member's task details
 */
function SelectedMemberTable({ taskRows }: { taskRows: SelectedMemberTaskRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Tugas</th>
            <th className="text-center py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
          </tr>
        </thead>
        <tbody>
          {taskRows.map((taskRow) => (
            <tr key={taskRow.title} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 px-4 text-gray-900 dark:text-gray-100">
                <div className="flex flex-col">
                  <span className="font-medium">{taskRow.title}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Pertemuan: {taskRow.completedMeetings}/{taskRow.totalMeetings}
                  </span>
                </div>
              </td>
              <td className="text-center py-2 px-4">
                <ProgressBar rate={taskRow.rate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Reusable progress bar component
 */
function ProgressBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-24 h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            rate === 100 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10">{rate}%</span>
    </div>
  );
}

/**
 * Empty state when no member is selected
 */
function EmptyState() {
  return (
    <div className="text-center py-8 text-dark-400 dark:text-dark-500">
      <p className="font-medium">Pilih anggota untuk melihat rincian progress</p>
    </div>
  );
}
