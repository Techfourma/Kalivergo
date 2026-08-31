'use server';

import { revalidatePath } from "next/cache";
import { readSessionUser } from "@/actions/cms/role-model";
import { validateTenantMembership } from "@/features/tenant/services/tenant.service";
import {
  createTaskForTenant,
  deleteTaskForTenant,
  updateTaskForTenant,
  updateTaskSubmissionsForTenant,
  addPertemuanToTask,
  removePertemuanFromTask,
  getTaskWithPertemuan,
  getSubmissionsForPertemuan,
  markSubmissionPertemuan,
  createPertemuan,
} from "@/features/task/services/task.service";
import {
  DEFAULT_TASK_CATEGORY,
  isTaskCategory,
} from "@/shared/task-category";
import { createAuditLog } from "@/server/audit";

async function getTenantIdFromCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const { SESSION_COOKIE } = await import("@/server/auth/session");
  const { parseSessionCookie } = await import("@/shared/auth/session");

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  const session = parseSessionCookie(sessionCookie);
  if (!session || !session.memberships || session.memberships.length === 0) return null;

  return session.memberships[0]?.tenantId ?? null;
}

export async function createTaskAction(formData: FormData) {
  const session = await readSessionUser();
  if (!session?.id) {
    return { error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const url = (formData.get("url") as string)?.trim() || undefined;
  const startDate = new Date(formData.get("startDate") as string);
  const deadline = new Date(formData.get("deadline") as string);
  const rawCategory = formData.get("category");
  const category = isTaskCategory(rawCategory) ? rawCategory : DEFAULT_TASK_CATEGORY;

  if (isNaN(startDate.getTime()) || isNaN(deadline.getTime())) {
    return { error: "Start Date Time dan Deadline harus diisi dengan waktu yang valid." };
  }

  if (url) {
    try {
      new URL(url);
    } catch {
      return { error: "URL tidak valid. Gunakan format lengkap, contoh: https://elearning.univ.ac.id/tugas/1" };
    }
  }

  if (deadline <= startDate) {
    return { error: "Deadline harus setelah Start Date Time." };
  }

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
  }

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const task = await createTaskForTenant({ tenantId, title, description, url, category, startDate, deadline });
  
  const rawPertemuan = formData.get("pertemuan");
  const pertemuanNames = rawPertemuan
    ? (rawPertemuan as string).split(",").map((name) => name.trim()).filter(Boolean)
    : [];
  for (const name of pertemuanNames) {
    await createPertemuan(task.id, name);
  }
  
  await createAuditLog("TASKS", "CREATE", `Menambahkan tugas: ${title}`, "System", {
    taskId: task.id,
    title,
    category,
    startDate: startDate.toISOString(),
    deadline: deadline.toISOString(),
    tenantId,
  });
  revalidatePath("/cms/tasks");
  return { success: "Tugas berhasil ditambahkan" };
}

export async function deleteTaskAction(id: string) {
  const session = await readSessionUser();
  if (!session?.id) {
    return { error: "Unauthorized" };
  }

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
  }

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const result = await deleteTaskForTenant(id, tenantId);
  if ("error" in result) return result;

  await createAuditLog("TASKS", "DELETE", `Menghapus tugas: ${id}`, "System", {
    taskId: id,
    tenantId,
  });

  revalidatePath("/cms/tasks");
  return { success: "Tugas berhasil dihapus" };
}

export async function updateTaskAction(id: string, formData: FormData) {
  const session = await readSessionUser();
  if (!session?.id) {
    return { error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const url = (formData.get("url") as string)?.trim() || undefined;
  const category = formData.get("category") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const deadline = new Date(formData.get("deadline") as string);

  if (!title || !description) {
    return { error: "Judul dan deskripsi harus diisi" };
  }

  if (isNaN(startDate.getTime()) || isNaN(deadline.getTime())) {
    return { error: "Start Date Time dan Deadline harus diisi dengan waktu yang valid." };
  }

  if (deadline <= startDate) {
    return { error: "Deadline harus setelah Start Date Time." };
  }

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
  }

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const result = await updateTaskForTenant(id, tenantId, { title, description, url, category, startDate, deadline });
  if ("error" in result) return result;

  await createAuditLog("TASKS", "UPDATE", `Mengubah tugas: ${title}`, "System", {
    taskId: id,
    title,
    category,
    startDate: startDate.toISOString(),
    deadline: deadline.toISOString(),
    tenantId,
  });

  revalidatePath("/cms/tasks");
  return { success: "Tugas berhasil diperbarui" };
}

export async function updateTaskSubmissionsAction(taskId: string, userIds: string[]) {
  const session = await readSessionUser();
  if (!session?.id) {
    return { error: "Unauthorized" };
  }

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan." };
  }

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const result = await updateTaskSubmissionsForTenant(taskId, userIds, tenantId);
  if ("error" in result) return result;

  revalidatePath("/cms/tasks");
  revalidatePath("/home");
  return { success: "Submission berhasil diperbarui" };
}

export async function addPertemuanAction(taskId: string, name: string) {
  const session = await readSessionUser();
  if (!session?.id) {
    return { error: "Unauthorized" };
  }

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan." };
  }

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  if (!name.trim()) {
    return { error: "Nama pertemuan harus diisi" };
  }

  const result = await addPertemuanToTask(taskId, tenantId, name.trim());
  if ("error" in result) return result;

  revalidatePath("/cms/tasks");
  return { success: "Pertemuan berhasil ditambahkan", pertemuan: result.pertemuan };
}

export async function deletePertemuanAction(pertemuanId: string, taskId: string) {
  const session = await readSessionUser();
  if (!session?.id) {
    return { error: "Unauthorized" };
  }

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan." };
  }

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const result = await removePertemuanFromTask(pertemuanId, taskId, tenantId);
  if ("error" in result) return result;

  revalidatePath("/cms/tasks");
  return { success: "Pertemuan berhasil dihapus" };
}

export async function getTaskPertemuanAction(taskId: string) {
  const session = await readSessionUser();
  if (!session?.id) {
    return { error: "Unauthorized" };
  }

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan." };
  }

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const result = await getTaskWithPertemuan(taskId, tenantId);
  if ("error" in result) return result;

  return { task: result.task, pertemuan: result.pertemuan };
}