"use server";

import { requirePlatformAdmin } from "@/lib/tenant/require-tenant-access";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionUserId } from "@/server/auth/session";
import { deleteFromCloudinary, extractPublicIdFromUrl } from "@/server/storage/cloudinary";
import { env } from "@/config/env";

export interface PlatformOwner {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  nim: string | null;
  phone: string | null;
  address: string | null;
  kycStatus: string;
  platformRole: string | null;
  tenantId: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  tenantStatus: string | null;
  subscriptionPlan: string;
  subscriptionEndsAt: string | null;
  subscriptionGraceEndsAt: string | null;
  universityName: string;
  programName: string;
  className: string;
  customSlug: string | null;
  whatsappNumber: string | null;
  applicationStatus: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  selfieUrl: string | null;
  ktmUrl: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

export async function getAllOwners(): Promise<{
  success: boolean;
  owners: PlatformOwner[];
  error?: string;
}> {
  const adminId = await getCurrentSessionUserId();
  if (!adminId) {
    return { success: false, owners: [], error: "Anda harus login terlebih dahulu." };
  }

  try {
    await requirePlatformAdmin(adminId);
  } catch (error) {
    return { success: false, owners: [], error: "Akses ditolak." };
  }

  try {
    const memberships = await prisma.tenantMembership.findMany({
      where: { role: "OWNER" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
            phone: true,
            address: true,
            kycStatus: true,
            platformRole: true,
            image: true,
            createdAt: true,
            ownerApplications: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            subscriptionPlan: true,
            subscriptionEndsAt: true,
            subscriptionGraceEndsAt: true,
          },
        },
      },
    });

    const cloudName = env.cloudinaryCloudName;

    const owners: PlatformOwner[] = memberships.map((m) => {
      const user = m.user;
      const app = user.ownerApplications[0] || null;

      return {
        id: app?.id || user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        nim: user.nim,
        phone: user.phone,
        address: user.address,
        kycStatus: user.kycStatus,
        platformRole: user.platformRole,
        tenantId: m.tenant.id,
        tenantName: m.tenant.name,
        tenantSlug: m.tenant.slug,
        tenantStatus: m.tenant.status,
        subscriptionPlan: m.tenant.subscriptionPlan,
        subscriptionEndsAt: m.tenant.subscriptionEndsAt?.toISOString() || null,
        subscriptionGraceEndsAt: m.tenant.subscriptionGraceEndsAt?.toISOString() || null,
        universityName: app?.universityName || "-",
        programName: app?.programName || "-",
        className: app?.className || "-",
        customSlug: app?.customSlug || null,
        whatsappNumber: app?.whatsappNumber || null,
        applicationStatus: app?.status || "NO_APPLICATION",
        submittedAt: app?.submittedAt ? app.submittedAt.toISOString() : null,
        reviewedAt: app?.reviewedAt ? app.reviewedAt.toISOString() : null,
        rejectionReason: app?.rejectionReason || null,
        selfieUrl: app?.selfieStorageKey && cloudName ? `https://res.cloudinary.com/${cloudName}/image/upload/${app.selfieStorageKey}` : null,
        ktmUrl: app?.ktmStorageKey && cloudName ? `https://res.cloudinary.com/${cloudName}/image/upload/${app.ktmStorageKey}` : null,
        profileImageUrl: user.image || null,
        createdAt: user.createdAt.toISOString(),
      };
    });

    return { success: true, owners };
  } catch (error) {
    console.error("Error fetching owners:", error);
    return { success: false, owners: [], error: "Gagal memuat data owner." };
  }
}

export async function deletePlatformOwner(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const tenantId = formData.get("tenantId") as string;

    if (!userId || !tenantId) {
      return { error: "Data tidak lengkap." };
    }

    const adminId = await getCurrentSessionUserId();
    if (!adminId) {
      return { error: "Anda harus login terlebih dahulu." };
    }

    try {
      await requirePlatformAdmin(adminId);
    } catch {
      return { error: "Akses ditolak." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        ktpStorageKey: true,
        ownerApplications: {
          where: { tenantId },
          select: {
            selfieStorageKey: true,
            ktmStorageKey: true,
          },
        },
      },
    });

    if (!user) {
      return { error: "User tidak ditemukan." };
    }

    const cloudName = env.cloudinaryCloudName;

    if (user.image && cloudName) {
      const publicId = extractPublicIdFromUrl(user.image);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId, "image");
        } catch (err) {
          console.error("Failed to delete profile image:", err);
        }
      }
    }

    if (user.ktpStorageKey && cloudName) {
      try {
        await deleteFromCloudinary(user.ktpStorageKey, "image");
      } catch (err) {
        console.error("Failed to delete KTP:", err);
      }
    }

    for (const app of user.ownerApplications) {
      if (app.selfieStorageKey && cloudName) {
        try {
          await deleteFromCloudinary(app.selfieStorageKey, "image");
        } catch (err) {
          console.error("Failed to delete selfie:", err);
        }
      }
      if (app.ktmStorageKey && cloudName) {
        try {
          await deleteFromCloudinary(app.ktmStorageKey, "image");
        } catch (err) {
          console.error("Failed to delete KTM:", err);
        }
      }
    }

    await prisma.tenantMembership.deleteMany({
      where: { userId, tenantId },
    });

    await prisma.ownerApplication.deleteMany({
      where: { userId, tenantId },
    });

    await prisma.memberApplication.deleteMany({
      where: { userId, tenantId },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: `Akun owner ${user.name} berhasil dihapus.` };
  } catch (error) {
    console.error("Error deleting platform owner:", error);
    return { error: "Gagal menghapus akun owner." };
  }
}
