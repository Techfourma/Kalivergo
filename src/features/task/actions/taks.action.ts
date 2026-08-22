'use server';

import { revalidatePath } from "next/cache";
import { readSessionUser } from "@/actions/cms/role-model";
import { validateTenantMembership } from "@/features/tenant/services/tenant.service";
import {
  createTaskForTenant,
  deleteTaskForTenant,
  updateTaskSubmissionsForTenant,
} from "@/features/task/services/task.service";
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
  const deadline = new Date(formData.get("deadline") as string);

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
  }

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const task = await createTaskForTenant({ tenantId, title, description, deadline });
  await createAuditLog("TASKS", "CREATE", `Menambahkan tugas: ${title}`, "System", {
    taskId: task.id,
    title,
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