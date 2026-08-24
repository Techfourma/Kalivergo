"use server";

import { prisma } from "@/lib/prisma";
import { generateVerificationToken, hashToken } from "@/lib/auth";
import { generateSlug } from "@/lib/tenant";
import { createAuditLog } from "@/server/audit";
import { uploadToCloudinary, deleteFromCloudinary } from "@/server/storage/cloudinary";
import { KYC_STORAGE_FOLDER } from "@/server/kyc/validation";
import { sendOwnerApprovalEmail } from "@/lib/email";

export interface CreateOwnerApplicationInput {
  userId: string;
  universityName: string;
  programName: string;
  className: string;
  customSlug?: string;
  selfieStorageKey: string;
  ktmStorageKey?: string;
  whatsappNumber?: string;
}

export interface ApproveApplicationResult {
  success: boolean;
  tenantId?: string;
  error?: string;
}

export async function uploadSelfieForKYC(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; publicId?: string; url?: string; error?: string }> {
  try {
    const result = await uploadToCloudinary(fileBuffer, {
      folder: KYC_STORAGE_FOLDER,
      resourceType: "image",
      publicId: `kyc_selfie_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    });

    return {
      success: true,
      publicId: result.public_id,
      url: result.secure_url,
    };
  } catch (error: any) {
    console.error("Error uploading selfie to Cloudinary:", error);
    const isTimeout =
      error?.name === "TimeoutError" ||
      error?.http_code === 499 ||
      String(error?.message || "").toLowerCase().includes("timeout");
    return {
      success: false,
      error: isTimeout
        ? "Upload foto selfie timeout. Coba gunakan file yang lebih kecil atau ulangi beberapa saat lagi."
        : "Gagal mengunggah foto selfie",
    };
  }
}

export async function uploadKtmForKYC(
  fileBuffer: Buffer,
  fileName: string
): Promise<{ success: boolean; publicId?: string; url?: string; error?: string }> {
  try {
    const result = await uploadToCloudinary(fileBuffer, {
      folder: KYC_STORAGE_FOLDER,
      resourceType: "image",
      publicId: `kyc_ktm_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    });

    return {
      success: true,
      publicId: result.public_id,
      url: result.secure_url,
    };
  } catch (error: any) {
    console.error("Error uploading KTM to Cloudinary:", error);
    const isTimeout =
      error?.name === "TimeoutError" ||
      error?.http_code === 499 ||
      String(error?.message || "").toLowerCase().includes("timeout");
    return {
      success: false,
      error: isTimeout
        ? "Upload foto KTM timeout. Coba gunakan file yang lebih kecil atau ulangi beberapa saat lagi."
        : "Gagal mengunggah foto KTM",
    };
  }
}

export async function deleteSelfieFromKYC(publicId: string): Promise<void> {
  try {
    await deleteFromCloudinary(publicId, "image");
  } catch (error: any) {
    console.error("Error deleting selfie from Cloudinary:", error);
  }
}

export async function deleteKtmFromKYC(publicId: string): Promise<void> {
  try {
    await deleteFromCloudinary(publicId, "image");
  } catch (error: any) {
    console.error("Error deleting KTM from Cloudinary:", error);
  }
}

export async function createOwnerApplication(
  input: CreateOwnerApplicationInput
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    const existingApproved = await prisma.ownerApplication.findFirst({
      where: {
        userId: input.userId,
        status: "APPROVED",
      },
    });

    if (existingApproved) {
      return {
        success: false,
        error: "Anda sudah memiliki aplikasi yang disetujui",
      };
    }

    const existingPending = await prisma.ownerApplication.findFirst({
      where: {
        userId: input.userId,
        status: { in: ["PENDING_EMAIL", "PENDING_KYC"] },
      },
    });

    if (existingPending) {
      return {
        success: false,
        error: "Anda sudah memiliki aplikasi yang sedang diproses",
      };
    }

    const application = await prisma.ownerApplication.create({
      data: {
        userId: input.userId,
        universityName: input.universityName,
        programName: input.programName,
        className: input.className,
        customSlug: input.customSlug || null,
        selfieStorageKey: input.selfieStorageKey,
        ktmStorageKey: input.ktmStorageKey || null,
        whatsappNumber: input.whatsappNumber || null,
        status: "PENDING_KYC",
        submittedAt: new Date(),
      },
    });

    await createAuditLog(
      "OWNER_APPLICATION",
      "CREATE",
      `Aplikasi owner baru dibuat oleh user ${input.userId}`,
      input.userId,
      {
        applicationId: application.id,
        universityName: input.universityName,
        programName: input.programName,
        className: input.className,
        customSlug: input.customSlug,
      }
    );

    return { success: true, applicationId: application.id };
  } catch (error) {
    console.error("Error creating owner application:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat membuat aplikasi owner",
    };
  }
}

export async function approveOwnerApplication(
  applicationId: string,
  adminUserId: string
): Promise<ApproveApplicationResult> {
  try {
    const application = await prisma.ownerApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      throw new Error("Aplikasi tidak ditemukan");
    }

    if (application.status !== "PENDING_KYC") {
      throw new Error(`Aplikasi sudah dalam status ${application.status}. Tidak dapat diproses.`);
    }

    const normalizedClassName = generateSlug(application.className);
    const customSlugToUse = application.customSlug ? application.customSlug.toLowerCase().trim() : normalizedClassName;

    if (application.customSlug) {
      const existingSlugTenant = await prisma.tenant.findFirst({
        where: {
          customSlug: customSlugToUse,
          status: "ACTIVE",
        },
      });

      if (existingSlugTenant && existingSlugTenant.id !== (existingTenant?.id)) {
        throw new Error("Nama website kelas ini sudah digunakan oleh kelas lain.");
      }
    }

    const existingTenant = await prisma.tenant.findFirst({
      where: {
        program: {
          slug: generateSlug(application.programName),
          university: {
            slug: generateSlug(application.universityName),
          },
        },
        slug: normalizedClassName,
      },
      include: {
        memberships: {
          where: { role: "OWNER" },
        },
      },
    });

    if (existingTenant && existingTenant.memberships.length > 0) {
      throw new Error("Kelas ini sudah memiliki owner yang disetujui. Tidak dapat membuat duplikat.");
    }

    const universitySlug = generateSlug(application.universityName);
    const university = await prisma.university.upsert({
      where: { slug: universitySlug },
      update: { name: application.universityName },
      create: {
        name: application.universityName,
        slug: universitySlug,
      },
    });

    const programSlug = generateSlug(application.programName);
    const program = await prisma.studyProgram.upsert({
      where: {
        universityId_slug: {
          universityId: university.id,
          slug: programSlug,
        },
      },
      update: { name: application.programName },
      create: {
        universityId: university.id,
        name: application.programName,
        slug: programSlug,
      },
    });

    const classSlug = normalizedClassName;
    const tenant = existingTenant
      ? existingTenant
      : await prisma.tenant.upsert({
          where: {
            programId_slug: {
              programId: program.id,
              slug: classSlug,
            },
          },
          update: {
            name: application.className,
            status: "ACTIVE",
            customSlug: customSlugToUse,
          },
          create: {
            universityId: university.id,
            programId: program.id,
            name: application.className,
            slug: classSlug,
            customSlug: customSlugToUse,
            status: "ACTIVE",
          },
          include: {
            memberships: {
              where: { role: "OWNER" },
            },
          },
        });

    if (tenant.memberships.length > 0 && !existingTenant) {
      throw new Error("Kelas ini sudah memiliki owner yang disetujui. Tidak dapat membuat duplikat.");
    }

    await prisma.$transaction([
      prisma.tenantMembership.upsert({
        where: {
          userId_tenantId: {
            userId: application.userId,
            tenantId: tenant.id,
          },
        },
        update: { role: "OWNER" },
        create: {
          userId: application.userId,
          tenantId: tenant.id,
          role: "OWNER",
        },
      }),
      prisma.ownerApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          tenantId: tenant.id,
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
        },
      }),
      prisma.kycReview.create({
        data: {
          applicationId,
          adminUserId,
          decision: "APPROVED",
          reason: "Aplikasi owner disetujui oleh administrator",
        },
      }),
      prisma.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "APPROVE",
          entityType: "OWNER_APPLICATION",
          entityId: applicationId,
          metadata: {
            tenantId: tenant.id,
            tenantName: tenant.name,
            universityName: university.name,
            programName: program.name,
            applicantUserId: application.userId,
            applicantEmail: application.user.email,
          },
        },
      }),
    ]);

    const applicantEmail = application.user.email;
    const applicantName = application.user.name || application.user.email;

    try {
      if (applicantEmail) {
        const plainToken = generateVerificationToken();
        const tokenHash = hashToken(plainToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.verificationToken.deleteMany({ where: { email: applicantEmail } });
        await prisma.verificationToken.create({
          data: { tokenHash, email: applicantEmail, expiresAt },
        });

        await sendOwnerApprovalEmail(applicantEmail, applicantName ?? "User", plainToken);
      }
    } catch (emailError) {
      console.error("Error sending owner approval email:", emailError);
    }

    return { success: true, tenantId: tenant.id };
  } catch (error: any) {
    console.error("Error approving owner application:", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat menyetujui aplikasi",
    };
  }
}

export async function rejectOwnerApplication(
  applicationId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const application = await tx.ownerApplication.findUnique({
        where: { id: applicationId },
        include: { user: true },
      });

      if (!application) {
        throw new Error("Aplikasi tidak ditemukan");
      }

      if (application.status !== "PENDING_KYC") {
        throw new Error(
          `Aplikasi sudah dalam status ${application.status}. Tidak dapat ditolak.`
        );
      }

      await tx.ownerApplication.update({
        where: { id: applicationId },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
          rejectionReason: reason,
        },
      });

      await tx.kycReview.create({
        data: {
          applicationId,
          adminUserId,
          decision: "REJECTED",
          reason: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: "REJECT",
          entityType: "OWNER_APPLICATION",
          entityId: applicationId,
          metadata: {
            reason: reason,
            applicantUserId: application.userId,
            applicantEmail: application.user.email,
          },
        },
      });

      try {
        await deleteSelfieFromKYC(application.selfieStorageKey);
      } catch (cleanupError) {
        console.error("Failed to delete selfie during rejection:", cleanupError);
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting owner application:", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat menolak aplikasi",
    };
  }
}

export async function getPendingOwnerApplications() {
  try {
    const applications = await prisma.ownerApplication.findMany({
      where: { status: "PENDING_KYC" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return applications;
  } catch (error) {
    console.error("Error getting pending owner applications:", error);
    return [];
  }
}

export async function getOwnerApplicationById(applicationId: string) {
  try {
    const application = await prisma.ownerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
            isVerified: true,
            createdAt: true,
          },
        },
        tenant: {
          include: {
            university: true,
            program: true,
          },
        },
        reviews: {
          include: {
            application: {
              select: {
                id: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return application;
  } catch (error) {
    console.error("Error getting owner application by ID:", error);
    return null;
  }
}