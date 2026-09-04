"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, hashToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { env } from "@/config/env";
import { requireSuperAdminKyc } from "@/lib/tenant";
import { createAuditLog } from "@/server/audit";
import {
  clearCurrentSession,
  getCurrentSessionUserId,
  setCurrentSessionUser,
} from "@/server/auth/session";
import { authenticatePlatformAdmin } from "@/features/platform/services/platform-auth.service";
import { KYC_STORAGE_FOLDER } from "@/server/kyc/validation";
import { deleteFromCloudinary } from "@/server/storage/cloudinary";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  nim: string | null;
  platformRole: string | null;
  role: string | null;
  cmsRole: string | null;
  memberships: Array<{ tenantId: string; role: string; cmsRole?: string | null }>;
}

export async function loginPlatformAdmin(
  emailInput: string,
  password: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const authentication = await authenticatePlatformAdmin(emailInput, password);
    if (authentication.error || !authentication.user) {
      return { error: authentication.error ?? "Email atau password salah." };
    }

    const user = authentication.user;

    await setCurrentSessionUser({
      id: user.id,
      name: user.name,
      email: user.email ?? "",
      nim: user.nim ?? null,
      platformRole: user.platformRole,
      role: user.platformRole,
      cmsRole: null,
      memberships: [],
    });

    revalidatePath("/platform");
    return { success: true };
  } catch (error) {
    console.error("Error logging in platform admin:", error);
    return { error: "Terjadi kesalahan saat login. Silakan coba lagi." };
  }
}

export async function registerPlatformAdmin(
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  try {
    const name = (formData.get("name")?.toString() || "").trim();
    const email = (formData.get("email")?.toString() || "").trim().toLowerCase();
    const password = formData.get("password")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";
    const address = (formData.get("address")?.toString() || "").trim();
    const phone = (formData.get("phone")?.toString() || "").trim();
    const ktpFile = formData.get("ktpFile");
    const selfieFile = formData.get("selfieFile");

    if (name.length < 2) return { error: "Nama lengkap minimal 2 karakter." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Format email tidak valid." };
    if (password !== confirmPassword) return { error: "Password dan konfirmasi password tidak cocok." };
    if (password.length < 6) return { error: "Password minimal 6 karakter." };
    if (!address || address.length < 10) return { error: "Alamat lengkap minimal 10 karakter." };
    if (!phone || phone.length < 10) return { error: "Nomor telepon minimal 10 digit." };
    if (!(ktpFile instanceof File) || ktpFile.size === 0) return { error: "Foto KTP wajib diunggah." };
    if (!(selfieFile instanceof File) || selfieFile.size === 0) return { error: "Foto selfie wajib diunggah." };
    if (!["image/jpeg", "image/png", "image/webp"].includes(selfieFile.type)) return { error: "Foto selfie harus berformat JPEG, PNG, atau WebP." };
    if (selfieFile.size > 5 * 1024 * 1024) return { error: "Foto selfie maksimal 5MB." };

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Email sudah terdaftar. Silakan login." };

    const passwordHash = await hash(password, 12);

    const { uploadToCloudinary } = await import("@/server/storage/cloudinary");
    const buffer = Buffer.from(await ktpFile.arrayBuffer());
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: "kyc_admin_ktp",
      resourceType: "image",
      publicId: `ktp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    });

    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());
    const selfieUploadResult = await uploadToCloudinary(selfieBuffer, {
      folder: KYC_STORAGE_FOLDER,
      resourceType: "image",
      publicId: `kyc_admin_selfie_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    });

    await prisma.user.create({
      data: {
        name,
        email,
        platformRole: "ADMIN_KYC",
        isVerified: false,
        kycStatus: "PENDING",
        password: passwordHash,
        address,
        phone,
        ktpStorageKey: uploadResult.public_id,
        selfieStorageKey: selfieUploadResult.public_id,
        image: selfieUploadResult.secure_url,
      },
    });

    return { success: "Pendaftaran berhasil! Menunggu persetujuan dari SUPER_ADMIN_KYC." };
  } catch (error) {
    console.error("Error registering platform admin:", error);
    return { error: "Terjadi kesalahan saat registrasi. Silakan coba lagi." };
  }
}

export async function approveKycAdminRegistration(
  adminUserId: string,
  _approverId?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const approverId = await getCurrentSessionUserId();
    if (!approverId) {
      return { error: "Anda harus login terlebih dahulu." };
    }

    try {
      await requireSuperAdminKyc(approverId);
    } catch {
      return { error: "Hanya SUPER_ADMIN_KYC yang dapat menyetujui pendaftaran." };
    }

    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { platformRole: true, kycStatus: true },
    });

    if (!approver || approver.platformRole !== "SUPER_ADMIN_KYC" || approver.kycStatus !== "APPROVED") {
      return { error: "Hanya SUPER_ADMIN_KYC yang dapat menyetujui pendaftaran." };
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, email: true, name: true, platformRole: true, kycStatus: true, selfieStorageKey: true, image: true },
    });

    if (!admin) return { error: "User tidak ditemukan." };
    if (admin.platformRole !== "ADMIN_KYC") return { error: "User ini bukan ADMIN_KYC." };
    if (admin.kycStatus !== "PENDING") return { error: "Status pendaftaran bukan PENDING." };

    const cloudName = env.cloudinaryCloudName;
    const selfieUrl = cloudName && admin.selfieStorageKey
      ? `https://res.cloudinary.com/${cloudName}/image/upload/${admin.selfieStorageKey}`
      : admin.image;

    await prisma.user.update({
      where: { id: adminUserId },
      data: {
        kycStatus: "APPROVED",
        image: selfieUrl ?? undefined,
      },
    });

    const plainToken = generateVerificationToken();
    const tokenHash = hashToken(plainToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { email: admin.email! } });
    await prisma.verificationToken.create({
      data: { tokenHash, email: admin.email!, expiresAt },
    });

    await sendVerificationEmail(admin.email!, admin.name!, plainToken);

    try {
      await createAuditLog(
        "ADMIN_KYC",
        "APPROVE",
        `Pendaftaran admin KYC "${admin.name}" (${admin.email}) disetujui`,
        approverId,
        { adminUserId, applicantName: admin.name, applicantEmail: admin.email }
      );
    } catch {}

    revalidatePath("/platform/kyc/admin");
    revalidatePath("/platform");

    return { success: true };
  } catch (error) {
    console.error("Error approving KYC admin registration:", error);
    return { error: "Terjadi kesalahan saat menyetujui pendaftaran." };
  }
}

export async function rejectKycAdminRegistration(
  adminUserId: string,
  _approverId: string | undefined,
  reason: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const approverId = await getCurrentSessionUserId();
    if (!approverId) {
      return { error: "Anda harus login terlebih dahulu." };
    }

    try {
      await requireSuperAdminKyc(approverId);
    } catch {
      return { error: "Hanya SUPER_ADMIN_KYC yang dapat menolak pendaftaran." };
    }

    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { platformRole: true, kycStatus: true },
    });

    if (!approver || approver.platformRole !== "SUPER_ADMIN_KYC" || approver.kycStatus !== "APPROVED") {
      return { error: "Hanya SUPER_ADMIN_KYC yang dapat menolak pendaftaran." };
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { id: true, name: true, email: true, platformRole: true, kycStatus: true, ktpStorageKey: true, selfieStorageKey: true },
    });

    if (!admin) return { error: "User tidak ditemukan." };
    if (admin.platformRole !== "ADMIN_KYC") return { error: "User ini bukan ADMIN_KYC." };
    if (admin.kycStatus !== "PENDING") return { error: "Status pendaftaran bukan PENDING." };

    await prisma.user.update({
      where: { id: adminUserId },
      data: { kycStatus: "REJECTED" },
    });

    if (admin.ktpStorageKey) {
      try {
        await deleteFromCloudinary(admin.ktpStorageKey, "image");
      } catch (cleanupError) {
        console.error("Failed to delete KTP during rejection:", cleanupError);
      }
    }

    if (admin.selfieStorageKey) {
      try {
        await deleteFromCloudinary(admin.selfieStorageKey, "image");
      } catch (cleanupError) {
        console.error("Failed to delete selfie during rejection:", cleanupError);
      }
    }

    try {
      await createAuditLog(
        "ADMIN_KYC",
        "REJECT",
        `Pendaftaran admin KYC "${admin.name}" (${admin.email}) ditolak${reason ? ` — alasan: ${reason}` : ""}`,
        approverId,
        { adminUserId, applicantName: admin.name, applicantEmail: admin.email, reason }
      );
    } catch {}

    revalidatePath("/platform/kyc/admin");

    return { success: true };
  } catch (error) {
    console.error("Error rejecting KYC admin registration:", error);
    return { error: "Terjadi kesalahan saat menolak pendaftaran." };
  }
}

export async function getPendingKycAdminRegistrations(): Promise<{
  success: boolean;
  registrations: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    ktpUrl: string | null;
    selfieUrl: string | null;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    const approverId = await getCurrentSessionUserId();
    if (!approverId) {
      return { success: false, registrations: [], error: "Anda harus login terlebih dahulu." };
    }

    try {
      await requireSuperAdminKyc(approverId);
    } catch {
      return { success: false, registrations: [], error: "Akses ditolak." };
    }

    const registrations = await prisma.user.findMany({
      where: {
        platformRole: "ADMIN_KYC",
        kycStatus: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        ktpStorageKey: true,
        selfieStorageKey: true,
        image: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const cloudName = env.cloudinaryCloudName;
    const formattedRegistrations = registrations.map((reg) => ({
      id: reg.id,
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
      address: reg.address,
      ktpUrl:
        cloudName && reg.ktpStorageKey
          ? `https://res.cloudinary.com/${cloudName}/image/upload/${reg.ktpStorageKey}`
          : null,
      selfieUrl:
        cloudName && reg.selfieStorageKey
          ? `https://res.cloudinary.com/${cloudName}/image/upload/${reg.selfieStorageKey}`
          : reg.image,
      createdAt: reg.createdAt.toISOString(),
    }));

    return { success: true, registrations: formattedRegistrations };
  } catch (error) {
    console.error("Error getting pending KYC admin registrations:", error);
    return { success: false, registrations: [], error: "Gagal mengambil data pendaftaran." };
  }
}

export async function createSuperAdminKyc(
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  try {
    const name = (formData.get("name")?.toString() || "").trim();
    const email = (formData.get("email")?.toString() || "").trim().toLowerCase();
    const password = formData.get("password")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";
    const address = (formData.get("address")?.toString() || "").trim();
    const phone = (formData.get("phone")?.toString() || "").trim();
    const ktpFile = formData.get("ktpFile");
    const secretKey = (formData.get("secretKey")?.toString() || "").trim();

    const expectedSecret = env.superAdminSecretKey;
    if (!expectedSecret || secretKey !== expectedSecret) {
      return { error: "Kode rahasia SUPER_ADMIN salah." };
    }

    if (name.length < 2) return { error: "Nama lengkap minimal 2 karakter." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Format email tidak valid." };
    if (password !== confirmPassword) return { error: "Password dan konfirmasi password tidak cocok." };
    if (password.length < 6) return { error: "Password minimal 6 karakter." };
    if (!address || address.length < 10) return { error: "Alamat lengkap minimal 10 karakter." };
    if (!phone || phone.length < 10) return { error: "Nomor telepon minimal 10 digit." };
    if (!(ktpFile instanceof File) || ktpFile.size === 0) return { error: "Foto KTP wajib diunggah." };

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Email sudah terdaftar." };

    const passwordHash = await hash(password, 12);

    const { uploadToCloudinary } = await import("@/server/storage/cloudinary");
    const buffer = Buffer.from(await ktpFile.arrayBuffer());
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: "kyc_admin_ktp",
      resourceType: "image",
      publicId: `ktp_super_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    });

    await prisma.user.create({
      data: {
        name,
        email,
        platformRole: "SUPER_ADMIN_KYC",
        isVerified: true,
        kycStatus: "APPROVED",
        password: passwordHash,
        address,
        phone,
        ktpStorageKey: uploadResult.public_id,
      },
    });

    return { success: "SUPER_ADMIN_KYC berhasil dibuat!" };
  } catch (error) {
    console.error("Error creating super admin KYC:", error);
    return { error: "Terjadi kesalahan saat membuat SUPER_ADMIN_KYC." };
  }
}

export async function logoutPlatformAdmin(): Promise<{ success: boolean }> {
  try {
    await clearCurrentSession();
  } catch (error) {
    console.error("Error logging out platform admin:", error);
  }
  return { success: true };
}