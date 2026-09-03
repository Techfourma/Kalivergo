import "server-only";

import {
  createTaskForTenant as createTaskForTenantRepository,
  findTaskSubmissions,
  findTaskWithTenant,
  findTasksByTitleForTenant,
  findTenantMemberIds,
  findTenantTaskMembers,
  findTasksForTenant,
  deleteTaskById,
  replaceTaskSubmissions,
  findPendingTaskSubmissions,
  findSubmissionWithTask,
  submitTaskForReview,
  reviewTaskSubmission,
  updateTaskById,
  createPertemuan,
  setTaskPertemuan,
} from "@/features/task/repositories/task.repository";
import {
  getPertemuanSetKey,
  normalizePertemuanName,
  normalizeTaskTitle,
} from "@/features/task/validators/task.utils";

export async function createTaskForTenant(input: {
  tenantId: string;
  title: string;
  description: string;
  url?: string | null;
  category?: string;
  startDate: Date;
  deadline: Date;
}) {
  return createTaskForTenantRepository(input);
}

export async function upsertTaskWithPertemuanForTenant(input: {
  tenantId: string;
  title: string;
  description: string;
  url?: string | null;
  category?: string;
  startDate: Date;
  deadline: Date;
  pertemuanName?: string;
}) {
  const title = normalizeTaskTitle(input.title);
  const pertemuanName = normalizePertemuanName(input.pertemuanName ?? "");
  const submittedPertemuanKey = getPertemuanSetKey(
    pertemuanName ? [pertemuanName] : []
  );

  const existingTasks = await findTasksByTitleForTenant(input.tenantId, title);

  const matchingTask =
    existingTasks.find(
      (task) =>
        getPertemuanSetKey(task.pertemuan.map((p) => p.name)) ===
        submittedPertemuanKey
    ) ?? null;

  if (!matchingTask) {
    const task = await createTaskForTenantRepository({
      tenantId: input.tenantId,
      title,
      description: input.description,
      url: input.url ?? null,
      category: input.category,
      startDate: input.startDate,
      deadline: input.deadline,
    });

    if (pertemuanName) {
      await createPertemuan(task.id, pertemuanName);
    }

    return {
      task,
      created: true as const,
      pertemuanAdded: pertemuanName ? 1 : 0,
    };
  }

  const updated = await updateTaskById(matchingTask.id, {
    title,
    description: input.description,
    url: input.url ?? null,
    category: input.category,
    startDate: input.startDate,
    deadline: input.deadline,
  });

  return {
    task: updated,
    created: false as const,
    pertemuanAdded: 0,
  };
}

export { findTasksForTenant };

export async function getTaskTenantId(taskId: string) {
  const task = await findTaskWithTenant(taskId);
  return task?.tenantId ?? null;
}

export async function getTaskManagementData(tenantId: string) {
  const [tasks, memberships] = await Promise.all([
    findTasksForTenant(tenantId, {}),
    findTenantTaskMembers(tenantId),
  ]);
  return { tasks, allUsers: memberships.map((membership) => membership.user) };
}

export async function getPendingTaskSubmissionsForTenant(tenantId: string) {
  return findPendingTaskSubmissions(tenantId);
}

export async function submitTaskForReviewForTenant(taskId: string, tenantId: string, userId: string) {
  const task = await findTaskWithTenant(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  return submitTaskForReview(taskId, userId);
}

export async function reviewTaskSubmissionForTenant(
  submissionId: string,
  tenantId: string,
  status: "SUBMITTED" | "REJECTED"
) {
  const submission = await findSubmissionWithTask(submissionId);
  if (!submission || submission.task.tenantId !== tenantId) {
    return { error: "Submission tidak ditemukan" } as const;
  }
  if (submission.status !== "PENDING_REVIEW") {
    return { error: "Submission ini sudah diproses" } as const;
  }
  return { submission: await reviewTaskSubmission(submissionId, status) } as const;
}
export async function deleteTaskForTenant(id: string, tenantId: string) {
  const task = await findTaskWithTenant(id);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  await deleteTaskById(id);
  return { success: true } as const;
}

export async function updateTaskForTenant(id: string, tenantId: string, data: {
  title: string;
  description: string;
  url?: string | null;
  category: string;
  startDate: Date;
  deadline: Date;
  pertemuanName?: string;
}) {
  const task = await findTaskWithTenant(id);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  if (data.deadline <= data.startDate) {
    return { error: "Deadline harus setelah Start Date Time." } as const;
  }

  const { pertemuanName, ...taskData } = data;
  const updated = await updateTaskById(id, taskData);

  if (pertemuanName !== undefined) {
    const trimmed = normalizePertemuanName(pertemuanName);
    if (trimmed) {
      await setTaskPertemuan(id, trimmed);
    }
  }

  return { task: updated } as const;
}

export async function getTaskSubmissionsForTenant(
  taskId: string,
  tenantId: string
) {
  const task = await findTaskWithTenant(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  return { submissions: await findTaskSubmissions(taskId) } as const;
}

export async function replaceTaskSubmissionsForTenant(
  taskId: string,
  tenantId: string,
  userIds: string[]
) {
  const task = await findTaskWithTenant(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }

  const validMembers = await findTenantMemberIds(tenantId, userIds);
  const validUserIds = new Set(validMembers.map((member) => member.userId));
  if (validUserIds.size !== new Set(userIds).size) {
    return { error: "Akses ditolak: terdapat anggota yang bukan bagian dari kelas ini" } as const;
  }

  const count = await replaceTaskSubmissions(taskId, userIds);
  return { count } as const;
}

export async function updateTaskSubmissionsForTenant(
  taskId: string,
  userIds: string[],
  tenantId: string
) {
  return replaceTaskSubmissionsForTenant(taskId, tenantId, userIds);
}