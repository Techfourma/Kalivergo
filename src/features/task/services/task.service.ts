import "server-only";

import {
  createTaskForTenant as createTaskForTenantRepository,
  findTaskSubmissions,
  findTaskWithTenant,
  findTaskWithPertemuan,
  findTenantMemberIds,
  findTenantTaskMembers,
  findTasksForTenant,
  deleteTaskById,
  replaceTaskSubmissions,
  updateTaskById,
  createPertemuan,
  findPertemuanByTaskId,
  deletePertemuanById,
  findSubmissionsByPertemuan,
  updateSubmissionPertemuan,
} from "@/features/task/repositories/task.repository";

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
}) {
  const task = await findTaskWithTenant(id);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  if (data.deadline <= data.startDate) {
    return { error: "Deadline harus setelah Start Date Time." } as const;
  }
  const updated = await updateTaskById(id, data);
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

export async function getTaskWithPertemuan(taskId: string, tenantId: string) {
  const task = await findTaskWithTenant(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  const pertemuan = await findPertemuanByTaskId(taskId);
  return { task, pertemuan } as const;
}

export async function addPertemuanToTask(taskId: string, tenantId: string, name: string) {
  const task = await findTaskWithTenant(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  const pertemuan = await createPertemuan(taskId, name);
  return { pertemuan } as const;
}

export { createPertemuan };

export async function removePertemuanFromTask(pertemuanId: string, taskId: string, tenantId: string) {
  const task = await findTaskWithTenant(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  await deletePertemuanById(pertemuanId);
  return { success: true } as const;
}

export async function getSubmissionsForPertemuan(taskId: string, pertemuanId: string, tenantId: string) {
  const task = await findTaskWithTenant(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  const submissions = await findSubmissionsByPertemuan(taskId, pertemuanId);
  return { submissions } as const;
}

export async function markSubmissionPertemuan(taskId: string, userId: string, pertemuanId: string | null, tenantId: string) {
  const task = await findTaskWithTenant(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }
  await updateSubmissionPertemuan(taskId, userId, pertemuanId);
  return { success: true } as const;
}