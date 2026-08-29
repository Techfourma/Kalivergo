import "server-only";

import {
  createTaskForTenant as createTaskForTenantRepository,
  findTaskSubmissions,
  findTaskWithTenant,
  findTenantMemberIds,
  findTenantTaskMembers,
  findTasksForTenant,
  deleteTaskById,
  replaceTaskSubmissions,
} from "@/features/task/repositories/task.repository";

export async function createTaskForTenant(input: {
  tenantId: string;
  title: string;
  description: string;
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