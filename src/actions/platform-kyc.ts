"use server";

import { requirePlatformAdmin } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import {
  approveOwnerApplication,
  getPendingOwnerApplications,
  rejectOwnerApplication,
} from "@/features/kyc/services/kyc-review.service";
import { getCurrentSessionUserId } from "@/server/auth/session";
import { env } from "@/config/env";

async function getCurrentAdminUserId(): Promise<string | null> {
  return getCurrentSessionUserId();
}

export interface KycApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  universityName: string;
  programName: string;
  className: string;
  selfieUrl: string | null;
  ktmUrl: string | null;
  submittedAt: string | null;
}

export async function getKycApplications(): Promise<{
  success: boolean;
  applications: KycApplication[];
  error?: string;
}> {
  const adminId = await getCurrentAdminUserId();
  if (!adminId) {
    return { success: false, applications: [], error: "Anda harus login terlebih dahulu." };
  }

  try {
    await requirePlatformAdmin(adminId);
  } catch (error) {
    return { success: false, applications: [], error: "Akses ditolak." };
  }

  const apps = await getPendingOwnerApplications();
  const cloudName = env.cloudinaryCloudName;

  const applications: KycApplication[] = apps.map((app) => ({
    id: app.id,
    fullName: app.user.name,
    email: app.user.email ?? "-",
    phone: app.whatsappNumber ?? null,
    universityName: app.universityName,
    programName: app.programName,
    className: app.className,
    selfieUrl:
      cloudName && app.selfieStorageKey
        ? `https://res.cloudinary.com/${cloudName}/image/upload/${app.selfieStorageKey}`
        : null,
    ktmUrl:
      cloudName && app.ktmStorageKey
        ? `https://res.cloudinary.com/${cloudName}/image/upload/${app.ktmStorageKey}`
        : null,
    submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
  }));

  return { success: true, applications };
}

export async function approveKycApplication(
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  const adminId = await getCurrentAdminUserId();
  if (!adminId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  try {
    await requirePlatformAdmin(adminId);
  } catch (error) {
    return { success: false, error: "Akses ditolak." };
  }

  return approveOwnerApplication(applicationId, adminId);
}

export async function rejectKycApplication(
  applicationId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = (reason || "").trim();
  if (trimmed.length < 10) {
    return { success: false, error: "Alasan penolakan minimal 10 karakter." };
  }

  const adminId = await getCurrentAdminUserId();
  if (!adminId) {
    return { success: false, error: "Anda harus login terlebih dahulu." };
  }

  try {
    await requirePlatformAdmin(adminId);
  } catch (error) {
    return { success: false, error: "Akses ditolak." };
  }

  return rejectOwnerApplication(applicationId, adminId, trimmed);
}

export interface KycAuditLog {
  id: string;
  action: string;
  description: string;
  applicationId: string | null;
  applicantName: string | null;
  adminName: string | null;
  metadata: any;
  createdAt: Date;
}

export async function getKycAuditLogs(
  action?: string,
  startDate?: Date,
  endDate?: Date
): Promise<KycAuditLog[]> {
  const adminId = await getCurrentAdminUserId();
  if (!adminId) {
    return [];
  }

  try {
    await requirePlatformAdmin(adminId);
  } catch (error) {
    return [];
  }

  try {
    const where: any = { entityType: "OWNER_APPLICATION" };
    if (action) {
      where.action = action;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const userIds = new Set<string>();
    const applicationIds = new Set<string>();
    for (const log of logs) {
      if (log.actorUserId) userIds.add(log.actorUserId);
      const applicantUserId = (log.metadata as any)?.applicantUserId;
      if (applicantUserId) userIds.add(applicantUserId);
      const appId = log.entityId || (log.metadata as any)?.applicationId;
      if (appId) applicationIds.add(appId);
    }

    const [users, applications] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: { id: true, name: true },
      }),
      prisma.ownerApplication.findMany({
        where: { id: { in: Array.from(applicationIds) } },
        select: {
          id: true,
          className: true,
          programName: true,
          universityName: true,
        },
      }),
    ]);

    const userNames = new Map(users.map((u) => [u.id, u.name]));
    const appMap = new Map(applications.map((a) => [a.id, a]));

    return logs.map((log) => {
      const meta: any = log.metadata ?? {};
      const applicationId = log.entityId || meta.applicationId || null;
      const applicantUserId =
        meta.applicantUserId || (log.action === "CREATE" ? log.actorUserId : undefined);
      const applicantName = applicantUserId
        ? userNames.get(applicantUserId) ?? null
        : null;
      const adminName =
        log.actorUserId && log.action !== "CREATE"
          ? userNames.get(log.actorUserId) ?? null
          : null;
      const app = applicationId ? appMap.get(applicationId) : undefined;

      const className = app?.className || meta.className || meta.tenantName || "-";
      const programName = app?.programName || meta.programName || "-";
      const universityName = app?.universityName || meta.universityName || "-";

      let description: string;
      switch (log.action) {
        case "APPROVE":
          description = `Aplikasi owner untuk kelas ${className} (${programName}, ${universityName}) disetujui`;
          break;
        case "REJECT":
          description = `Aplikasi owner untuk kelas ${className} (${programName}, ${universityName}) ditolak${
            meta.reason ? ` — alasan: ${meta.reason}` : ""
          }`;
          break;
        case "CREATE":
          description = `Pengajuan aplikasi owner baru untuk kelas ${className} (${programName}, ${universityName})`;
          break;
        default:
          description = log.action;
      }

      return {
        id: log.id,
        action: log.action,
        description,
        applicationId,
        applicantName,
        adminName,
        metadata: log.metadata,
        createdAt: log.createdAt,
      };
    });
  } catch (error) {
    console.error("Error getting KYC audit logs:", error);
    return [];
  }
}