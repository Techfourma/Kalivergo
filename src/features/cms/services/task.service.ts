import "server-only";

import {
  createTask,
  deleteTaskById,
  findTaskById,
  replaceTaskSubmissions,
} from "@/features/cms/repositories/task.repository";
import { createAuditLog } from "@/server/audit";

export async function createTaskForTenant(input: {
  tenantId: string;
  title: string;
  description: string;
  startDate: Date;
  deadline: Date;
}) {
  const task = await createTask(input);
  await createAuditLog("TASKS", "CREATE", `Menambahkan tugas: ${input.title}`, "System", {
    taskId: task.id,
    title: input.title,
    startDate: input.startDate.toISOString(),
    deadline: input.deadline.toISOString(),
    tenantId: input.tenantId,
  });
  return task;
}

export async function deleteTaskForTenant(id: string, tenantId: string) {
  const task = await findTaskById(id);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }

  await deleteTaskById(id);
  await createAuditLog("TASKS", "DELETE", `Menghapus tugas: ${task.title}`, "System", {
    taskId: id,
    title: task.title,
    tenantId,
  });
  return { task } as const;
}

export async function updateTaskSubmissionsForTenant(
  taskId: string,
  userIds: string[],
  tenantId: string
) {
  const task = await findTaskById(taskId);
  if (!task) return { error: "Tugas tidak ditemukan" } as const;
  if (task.tenantId !== tenantId) {
    return { error: "Akses ditolak: Tugas bukan milik kelas Anda" } as const;
  }

  await replaceTaskSubmissions(taskId, userIds);
  return { success: true } as const;
}