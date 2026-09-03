'use server';

import { revalidatePath } from "next/cache";
import { readSessionUser } from "@/actions/cms/role-model";
import { validateTenantMembership } from "@/features/tenant/services/tenant.service";
import {
  upsertTaskWithPertemuanForTenant,
  deleteTaskForTenant,
  updateTaskForTenant,
  updateTaskSubmissionsForTenant,
  submitTaskForReviewForTenant,
  reviewTaskSubmissionForTenant,
} from "@/features/task/services/task.service";
import {
  DEFAULT_TASK_CATEGORY,
  isTaskCategory,
} from "@/shared/task-category";
import { createAuditLog } from "@/server/audit";
import { parseDateTimeLocalToWIB } from "@/lib/date-time";
import { resolveTenantSlug } from "@/actions/cms/role-model";

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
  const startDate = parseDateTimeLocalToWIB(formData.get("startDate") as string);
  const deadline = parseDateTimeLocalToWIB(formData.get("deadline") as string);
  const rawCategory = formData.get("category");
  const category = isTaskCategory(rawCategory) ? rawCategory : DEFAULT_TASK_CATEGORY;

  if (!title?.trim()) {
    return { error: "Judul tugas harus diisi" };
  }

  if (!startDate || !deadline || Number.isNaN(startDate.getTime()) || Number.isNaN(deadline.getTime())) {
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

  const tenantSlug = await resolveTenantSlug();
  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const rawPertemuan = formData.get("pertemuan");
  const pertemuanName = typeof rawPertemuan === "string" ? rawPertemuan.trim() : "";

  const result = await upsertTaskWithPertemuanForTenant({
    tenantId,
    title,
    description,
    url,
    category,
    startDate,
    deadline,
    pertemuanName: pertemuanName || undefined,
  });

  const { task, created } = result;

  await createAuditLog(
    "TASKS",
    created ? "CREATE" : "UPDATE",
    created
      ? `Menambahkan tugas: ${task.title}${pertemuanName ? ` · ${pertemuanName}` : ""}`
      : `Tugas ${task.title}${pertemuanName ? ` · ${pertemuanName}` : ""} sudah ada; metadata disinkronkan ulang`,
    "System",
    {
      taskId: task.id,
      title: task.title,
      pertemuan: pertemuanName || null,
      category,
      startDate: startDate.toISOString(),
      deadline: deadline.toISOString(),
      tenantId,
    }
  );
  revalidatePath("/cms/tasks");
  if (tenantSlug) {
    revalidatePath(`/${tenantSlug}/cms/tasks`);
    revalidatePath(`/${tenantSlug}/tasks`);
    revalidatePath(`/${tenantSlug}/home`);
  }
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

  const tenantSlug = await resolveTenantSlug();
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
  if (tenantSlug) {
    revalidatePath(`/${tenantSlug}/cms/tasks`);
    revalidatePath(`/${tenantSlug}/tasks`);
    revalidatePath(`/${tenantSlug}/home`);
  }
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
  const startDate = parseDateTimeLocalToWIB(formData.get("startDate") as string);
  const deadline = parseDateTimeLocalToWIB(formData.get("deadline") as string);

  if (!title || !description) {
    return { error: "Judul dan deskripsi harus diisi" };
  }

  if (!startDate || !deadline || Number.isNaN(startDate.getTime()) || Number.isNaN(deadline.getTime())) {
    return { error: "Start Date Time dan Deadline harus diisi dengan waktu yang valid." };
  }

  if (deadline <= startDate) {
    return { error: "Deadline harus setelah Start Date Time." };
  }

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) {
    return { error: "Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas]." };
  }

  const tenantSlug = await resolveTenantSlug();
  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const rawPertemuan = formData.get("pertemuan");
  const pertemuanName = typeof rawPertemuan === "string" ? rawPertemuan.trim() : "";

  const result = await updateTaskForTenant(id, tenantId, {
    title,
    description,
    url,
    category,
    startDate,
    deadline,
    pertemuanName: pertemuanName || undefined,
  });
  if ("error" in result) return result;

  await createAuditLog("TASKS", "UPDATE", `Mengubah tugas: ${title}${pertemuanName ? ` · ${pertemuanName}` : ""}`, "System", {
    taskId: id,
    title,
    pertemuan: pertemuanName || null,
    category,
    startDate: startDate.toISOString(),
    deadline: deadline.toISOString(),
    tenantId,
  });

  revalidatePath("/cms/tasks");
  if (tenantSlug) {
    revalidatePath(`/${tenantSlug}/cms/tasks`);
    revalidatePath(`/${tenantSlug}/tasks`);
    revalidatePath(`/${tenantSlug}/home`);
  }
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

  const tenantSlug = await resolveTenantSlug();
  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const result = await updateTaskSubmissionsForTenant(taskId, userIds, tenantId);
  if ("error" in result) return result;

  revalidatePath("/cms/tasks");
  if (tenantSlug) {
    revalidatePath(`/${tenantSlug}/cms/tasks`);
    revalidatePath(`/${tenantSlug}/tasks`);
    revalidatePath(`/${tenantSlug}/home`);
  }
  return { success: "Submission berhasil diperbarui" };
}

export async function submitTaskForReviewAction(taskId: string) {
  const session = await readSessionUser();
  if (!session?.id) return { error: "Unauthorized" };

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) return { error: "Konteks kelas tidak ditemukan." };

  const result = await submitTaskForReviewForTenant(taskId, tenantId, session.id);
  if ("error" in result) return result;

  const tenantSlug = await resolveTenantSlug();
  revalidatePath(`/${tenantSlug}/tasks`);
  revalidatePath(`/${tenantSlug}/cms`);
  return { success: "Tugas dikirim untuk divalidasi administrator" };
}

export async function reviewTaskSubmissionAction(
  submissionId: string,
  decision: "APPROVE" | "REJECT"
) {
  const session = await readSessionUser();
  if (!session?.id) return { error: "Unauthorized" };

  const tenantId = await getTenantIdFromCookie();
  if (!tenantId) return { error: "Konteks kelas tidak ditemukan." };

  const membership = await validateTenantMembership(session.id, tenantId);
  if (!membership.valid || !(membership.role === "OWNER" || membership.cmsRole)) {
    return { error: "Akses ditolak: hanya OWNER atau role CMS." };
  }

  const result = await reviewTaskSubmissionForTenant(
    submissionId,
    tenantId,
    decision === "APPROVE" ? "SUBMITTED" : "REJECTED"
  );
  if ("error" in result) return result;

  const tenantSlug = await resolveTenantSlug();
  revalidatePath(`/${tenantSlug}/cms`);
  revalidatePath(`/${tenantSlug}/cms/tasks`);
  revalidatePath(`/${tenantSlug}/tasks`);
  return { success: decision === "APPROVE" ? "Tugas disetujui" : "Tugas dikembalikan kepada anggota" };
}