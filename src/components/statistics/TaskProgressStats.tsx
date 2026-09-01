"use client";

import { useState, useMemo, useEffect } from "react";
import TaskProgressChart from "./TaskProgressChart";
import TaskProgressDetail from "./TaskProgressDetail";

interface Submission {
  userId: string;
  status: string;
  submittedAt?: Date | string | null;
  pertemuanId?: string | null;
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
  pertemuan?: Array<{ id: string; name: string }> | null;
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

  // Calculate default date range (earliest task date to today)
  const defaultDateRange = useMemo(() => {
    if (tasks.length === 0) {
      return { start: "", end: "" };
    }

    // Find the earliest task date from all tasks
    let earliestDate: Date | null = null;
    tasks.forEach((task) => {
      const dates: Date[] = [];
      if (task.startDate) {
        dates.push(new Date(task.startDate));
      }
      if (task.deadline) {
        dates.push(new Date(task.deadline));
      }

      dates.forEach((date) => {
        if (!earliestDate || date < earliestDate) {
          earliestDate = date;
        }
      });
    });

    // Get today's date
    const today = new Date();

    // Format dates as YYYY-MM-DD for input[type="date"]
    const startStr = earliestDate
      ? earliestDate.toISOString().split("T")[0]
      : "";
    const endStr = today.toISOString().split("T")[0];

    return { start: startStr, end: endStr };
  }, [tasks]);

  // Initialize date range with default values on component mount
  useEffect(() => {
    if (!startDate && !endDate) {
      setStartDate(defaultDateRange.start);
      setEndDate(defaultDateRange.end);
    }
  }, []);

  const allMemberNames = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.name))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [users]);

  const filteredTasks = useMemo(() => {
    // Only apply filter when BOTH startDate and endDate are provided
    if (!startDate || !endDate) return tasks;

    return tasks.filter((task) => {
      const taskStart = task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : null;
      const taskDeadline = new Date(task.deadline).toISOString().split("T")[0];

      if (taskDeadline < startDate) return false;
      if (taskStart && taskStart > endDate) return false;
      if (taskDeadline < startDate) return false;

      return true;
    });
  }, [tasks, startDate, endDate]);

  const taskProgressEntries = useMemo(() => {
    const seen = new Set<string>();
    const rows: Array<{
      id: string;
      title: string;
      pertemuanId?: string | null;
      pertemuanName: string;
      submissions: Submission[];
    }> = [];

    filteredTasks.forEach((task) => {
      const taskMeetings = task.pertemuan && task.pertemuan.length > 0 ? task.pertemuan : [{ id: `${task.id}-general`, name: "Umum" }];

      taskMeetings.forEach((meeting) => {
        const key = `${task.title.trim().toLowerCase()}::${meeting.id}`;
        if (seen.has(key)) return;
        seen.add(key);

        rows.push({
          id: `${task.id}-${meeting.id}`,
          title: task.title,
          pertemuanId: meeting.id,
          pertemuanName: meeting.name,
          submissions: task.submissions,
        });
      });
    });

    return rows;
  }, [filteredTasks]);

  const memberProgress = useMemo<MemberProgress[]>(() => {
    if (taskProgressEntries.length === 0) return [];

    const progressMap = new Map<string, MemberProgress>();

    users.forEach((user) => {
      let submitted = 0;
      taskProgressEntries.forEach((taskEntry) => {
        const submission = taskEntry.submissions.find((s) => {
          if (s.userId !== user.id) return false;
          if (taskEntry.pertemuanId) {
            return s.pertemuanId === taskEntry.pertemuanId || (!s.pertemuanId && taskEntry.pertemuanId);
          }
          return !s.pertemuanId;
        });

        if (submission && submission.status !== "PENDING") {
          submitted++;
        }
      });

      const total = taskProgressEntries.length;
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
  }, [taskProgressEntries, users]);

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
      return { submitted: 0, pending: taskProgressEntries.length, rate: 0 };
    }
    return {
      submitted: member.submitted,
      pending: member.pending,
      rate: member.rate,
    };
  }, [selectedMember, memberProgress, taskProgressEntries.length]);

  const selectedUserName = useMemo(() => {
    if (selectedMember === "all") return "Semua Anggota";
    return users.find((u) => u.id === selectedMember)?.name || "Anggota";
  }, [selectedMember, users]);

  const selectedMemberProgress = useMemo(() => {
    if (selectedMember === "all") return null;
    return memberProgress.find((m) => m.userId === selectedMember) || null;
  }, [selectedMember, memberProgress]);

  const selectedMemberTaskRows = useMemo(() => {
    if (selectedMember === "all") return [];

    const grouped = new Map<string, {
      title: string;
      totalMeetings: number;
      completedMeetings: number;
      meetingNames: Set<string>;
    }>();

    filteredTasks.forEach((task) => {
      const normalizedTitle = task.title.trim();
      const taskMeetings = task.pertemuan && task.pertemuan.length > 0
        ? task.pertemuan
        : [{ id: `${task.id}-general`, name: "Umum" }];

      const summary = grouped.get(normalizedTitle) ?? {
        title: task.title,
        totalMeetings: 0,
        completedMeetings: 0,
        meetingNames: new Set<string>(),
      };

      const uniqueMeetingIds = new Set<string>();
      taskMeetings.forEach((meeting) => {
        const meetingKey = meeting.id || `${task.id}-general`;
        uniqueMeetingIds.add(meetingKey);
        summary.meetingNames.add(meeting.name);
      });

      const completedForThisTask = Array.from(uniqueMeetingIds).filter((meetingId) => {
        const hasSubmittedMeeting = task.submissions.some((submission) => {
          if (submission.userId !== selectedMember) return false;
          if (submission.status === "PENDING") return false;
          if (!meetingId || meetingId.endsWith("-general")) {
            return !submission.pertemuanId;
          }
          return submission.pertemuanId === meetingId;
        });
        return hasSubmittedMeeting;
      }).length;

      summary.totalMeetings += uniqueMeetingIds.size;
      summary.completedMeetings += completedForThisTask;
      grouped.set(normalizedTitle, summary);
    });

    return Array.from(grouped.values()).map((entry) => ({
      title: entry.title,
      totalMeetings: entry.totalMeetings,
      completedMeetings: entry.completedMeetings,
      rate: entry.totalMeetings > 0 ? Math.round((entry.completedMeetings / entry.totalMeetings) * 100) : 0,
      meetingList: Array.from(entry.meetingNames),
    }));
  }, [filteredTasks, selectedMember]);

  const resetDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6">
      <TaskProgressChart
        selectedMember={selectedMember}
        startDate={startDate}
        endDate={endDate}
        chartData={chartData}
        filteredTasks={filteredTasks}
        summary={summary}
        users={users}
        allMemberNames={allMemberNames}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onResetDateRange={resetDateRange}
        onMemberChange={setSelectedMember}
      />

      <TaskProgressDetail
        selectedMember={selectedMember}
        selectedUserName={selectedUserName}
        memberProgress={memberProgress}
        selectedMemberTaskRows={selectedMemberTaskRows}
        selectedMemberProgress={selectedMemberProgress}
        summary={summary}
        taskProgressEntries={taskProgressEntries}
      />
    </div>
  );
}
