"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { createAuditLog } from "@/server/audit";
import { validateSelfieFile } from "@/server/kyc/validation";
import { generateSlug } from "@/lib/tenant";
import { generateVerificationToken, hashToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import {
  deleteKtmFromKYC,
  deleteSelfieFromKYC,
  uploadKtmForKYC,
  uploadSelfieForKYC,
} from "@/features/kyc/services/kyc-storage.service";

interface BaseRegistration {
  error?: string;
  field?: string;
  user?: {
    id: string;
    name: string;
    nim: string | null;
    email: string | null;
  };
  email?: string;
  nim?: string;
  password?: string;
}

async function resolveAndCompleteRegistration(
  formData: FormData
): Promise<BaseRegistration> {
  const fullName = (formData.get("fullName")?.toString() || "").trim();
  const nim = (formData.get("nim")?.toString() || "").trim();
  const email = (formData.get("email")?.toString() || "").trim().toLowerCase();
  const password = (formData.get("password")?.toString() || "") as string;
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  if (password !== confirmPassword)
    return { error: "Password tidak cocok", field: "confirmPassword" };
  if (password.length < 6)
    return { error: "Password minimal 6 karakter", field: "password" };

  const normalizedInputName = fullName.toLowerCase().trim().replace(/\s+/g, " ");
  const normalizedInputNim = nim.trim();
  const normalizedInputEmail = email;

  const verifiedUser = await prisma.user.findFirst({
    where: { isVerified: true, email: normalizedInputEmail },
  });
  if (verifiedUser) {
    const dbName = verifiedUser.name.toLowerCase().trim().replace(/\s+/g, " ");
    const dbNim = verifiedUser.nim ? verifiedUser.nim.trim() : "";
    if (dbName === normalizedInputName && dbNim === normalizedInputNim) {
      return {
        error: "Akun anda sudah pernah terdaftar, silahkan login menggunakan akun terkait.",
        field: "email",
      };
    }
  }

  const existingUser = await prisma.user.findFirst({
    where: { name: { equals: fullName, mode: "insensitive" } },
  });

  if (!existingUser) {
    return { error: "Maaf, nama anda tidak terdaftar. Silakan hubungi admin.", field: "fullName" };
  }

  const existingName = existingUser.name.toLowerCase().trim().replace(/\s+/g, " ");
  const existingNim = existingUser.nim ? existingUser.nim.trim() : "";
  const existingEmail = existingUser.email ? existingUser.email.toLowerCase().trim() : "";

  if (existingUser.isVerified) {
    if (existingNim && existingNim !== normalizedInputNim)
      return { error: "Maaf, NIM tidak sesuai dengan data terdaftar.", field: "nim" };
    if (existingEmail && existingEmail !== normalizedInputEmail)
      return { error: "Maaf, Gmail tidak sesuai dengan data terdaftar.", field: "email" };
    if (
      existingName === normalizedInputName &&
      existingNim === normalizedInputNim &&
      existingEmail === normalizedInputEmail
    ) {
      return {
        error: "Akun anda sudah pernah terdaftar, silahkan login menggunakan akun terkait.",
        field: "email",
      };
    }
  } else {
    if (existingUser.nim && existingUser.nim.trim() !== normalizedInputNim)
      return { error: "Maaf, NIM tidak sesuai dengan data terdaftar.", field: "nim" };
    if (existingUser.email && existingUser.email.toLowerCase().trim() !== normalizedInputEmail)
      return { error: "Maaf, Gmail tidak sesuai dengan data terdaftar.", field: "email" };
  }

  const conflictUser = await prisma.user.findFirst({
    where: {
      id: { not: existingUser.id },
      OR: [{ email: normalizedInputEmail }, { nim: normalizedInputNim }],
    },
  });

  if (conflictUser) {
    if (conflictUser.email === normalizedInputEmail)
      return { error: "Email ini sudah digunakan oleh akun lain.", field: "email" };
    if (conflictUser.nim === normalizedInputNim)
      return { error: "NIM ini sudah digunakan oleh akun lain.", field: "nim" };
  }

  return {
    user: {
      id: existingUser.id,
      name: existingUser.name,
      nim: existingUser.nim,
      email: existingUser.email,
    },
    email: normalizedInputEmail,
    nim: normalizedInputNim,
    password,
  };
}

async function finalizeUserAccount(
  base: BaseRegistration
): Promise<void> {
  const hashedPassword = await hash(base.password!, 12);

  await prisma.user.update({
    where: { id: base.user!.id },
    data: {
      password: hashedPassword,
      isVerified: false,
      nim: base.nim,
      email: base.email,
    },
  });

  const plainToken = generateVerificationToken();
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { email: base.email } });
  await prisma.verificationToken.create({
    data: { tokenHash, email: base.email!, expiresAt },
  });

  await sendVerificationEmail(base.email!, base.user!.name, plainToken);
}

export async function registerOwnerClass(formData: FormData) {
  const fullName = (formData.get("fullName")?.toString() || "").trim();
  const nim = (formData.get("nim")?.toString() || "").trim();
  const email = (formData.get("email")?.toString() || "").trim().toLowerCase();
  const password = (formData.get("password")?.toString() || "") as string;
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";
  const phone = (formData.get("phone")?.toString() || formData.get("whatsapp")?.toString() || "").trim();
  const customSlug = (formData.get("customSlug")?.toString() || "").trim();

  const universityName = (formData.get("universityName")?.toString() || "").trim();
  const programName = (formData.get("programName")?.toString() || "").trim();
  const className = (formData.get("className")?.toString() || "").trim();
  const selfieFile = formData.get("selfieFile");
  const ktmFile = formData.get("ktmFile");

  if (!fullName || fullName.length < 2)
    return { error: "Nama lengkap wajib diisi.", field: "fullName" };
  if (!nim)
    return { error: "NIM wajib diisi.", field: "nim" };
  if (!email || !email.includes("@"))
    return { error: "Email wajib diisi dan harus valid.", field: "email" };
  if (password !== confirmPassword)
    return { error: "Password tidak cocok", field: "confirmPassword" };
  if (password.length < 6)
    return { error: "Password minimal 6 karakter", field: "password" };
  if (!phone || phone.length < 10)
    return { error: "Nomor telepon minimal 10 digit.", field: "phone" };
  if (!customSlug || customSlug.length < 3)
    return { error: "Nama website kelas minimal 3 karakter.", field: "customSlug" };

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(customSlug)) {
    return {
      error: "Nama website hanya boleh mengandung huruf kecil, angka, dan tanda hubung (-). Tidak boleh ada spasi atau karakter khusus.",
      field: "customSlug"
    };
  }

  if (!universityName || universityName.length < 2)
    return { error: "Nama universitas wajib diisi.", field: "universityName" };
  if (!programName || programName.length < 2)
    return { error: "Nama program studi wajib diisi.", field: "programName" };
  if (!className || className.length < 2)
    return { error: "Nama kelas wajib diisi.", field: "className" };

  if (!(selfieFile instanceof File) || selfieFile.size === 0) {
    return { error: "Foto selfie wajib diunggah.", field: "selfieFile" };
  }
  const fileCheck = validateSelfieFile(selfieFile);
  if (!fileCheck.valid) return { error: fileCheck.error, field: "selfieFile" };

  if (!(ktmFile instanceof File) || ktmFile.size === 0) {
    return { error: "Foto KTM wajib diunggah.", field: "ktmFile" };
  }
  const ktmCheck = validateSelfieFile(ktmFile);
  if (!ktmCheck.valid) return { error: ktmCheck.error, field: "ktmFile" };

  const existingVerifiedUser = await prisma.user.findFirst({
    where: {
      email: email,
      isVerified: true
    },
  });

  if (existingVerifiedUser) {
    return {
      error: "Email ini sudah digunakan oleh akun yang terverifikasi. Silakan login atau gunakan email lain.",
      field: "email"
    };
  }

  const existingNimUser = await prisma.user.findFirst({
    where: { nim },
  });
  if (existingNimUser) {
    return { error: "NIM ini sudah digunakan oleh akun lain. Silakan gunakan NIM yang berbeda.", field: "nim" };
  }

  const normalizedUniversityName = universityName.toLowerCase().trim();
  const normalizedProgramName = programName.toLowerCase().trim();
  const normalizedClassName = className.toLowerCase().trim();
  const normalizedCustomSlug = customSlug.toLowerCase().trim();

  const existingSlugTenant = await prisma.tenant.findFirst({
    where: {
      customSlug: normalizedCustomSlug,
      status: "ACTIVE",
    },
  });

  if (existingSlugTenant) {
    return {
      error: "Nama website kelas ini sudah digunakan oleh kelas lain. Silakan gunakan nama yang berbeda.",
      field: "customSlug"
    };
  }

  const existingApplication = await prisma.ownerApplication.findFirst({
    where: {
      universityName: { equals: normalizedUniversityName, mode: "insensitive" },
      programName: { equals: normalizedProgramName, mode: "insensitive" },
      className: { equals: normalizedClassName, mode: "insensitive" },
      status: { in: ["PENDING_EMAIL", "PENDING_KYC", "APPROVED"] },
    },
  });

  if (existingApplication) {
    return {
      error: "Kelas dengan kombinasi universitas, program studi, dan nama kelas yang sama sudah terdaftar atau sedang dalam proses verifikasi. Hanya satu owner diperbolehkan per kelas.",
      field: "className"
    };
  }

  const existingTenant = await prisma.tenant.findFirst({
    where: {
      slug: generateSlug(className),
      status: "ACTIVE",
      program: {
        slug: generateSlug(programName),
        university: {
          slug: generateSlug(universityName),
        },
      },
      memberships: {
        some: { role: "OWNER" },
      },
    },
  });

  if (existingTenant) {
    return {
      error: "Kelas ini sudah memiliki owner yang aktif. Hanya satu owner diperbolehkan per kelas.",
      field: "className"
    };
  }

  try {
    const hashedPassword = await hash(password, 12);

    const buffer = Buffer.from(await selfieFile.arrayBuffer());
    const upload = await uploadSelfieForKYC(buffer, selfieFile.name);
    if (!upload.success || !upload.publicId) {
      return { error: upload.error || "Gagal mengunggah foto selfie.", field: "selfieFile" };
    }

    const ktmBuffer = Buffer.from(await ktmFile.arrayBuffer());
    const ktmUpload = await uploadKtmForKYC(ktmBuffer, ktmFile.name);
    if (!ktmUpload.success || !ktmUpload.publicId) {
      await deleteSelfieFromKYC(upload.publicId);
      return { error: ktmUpload.error || "Gagal mengunggah foto KTM.", field: "ktmFile" };
    }

    let applicationId: string;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.upsert({
          where: { email: email },
          update: {
            name: fullName,
            nim: nim,
            password: hashedPassword,
            isVerified: false,
          },
          create: {
            name: fullName,
            nim: nim,
            email: email,
            password: hashedPassword,
            isVerified: false,
          },
        });

        const app = await tx.ownerApplication.create({
          data: {
            userId: user.id,
            universityName,
            programName,
            className,
            customSlug: normalizedCustomSlug || undefined,
            selfieStorageKey: upload.publicId,
            ktmStorageKey: ktmUpload.publicId,
            whatsappNumber: phone || undefined,
            status: "PENDING_KYC",
            submittedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: user.id,
            action: "SUBMIT",
            entityType: "OWNER_REGISTRATION",
            entityId: app.id,
            metadata: {
              applicationId: app.id,
              universityName,
              programName,
              className,
            },
          },
        });

        return { applicationId: app.id };
      });

      applicationId = result.applicationId;
      revalidatePath("/platform/kyc/user");
      revalidatePath("/platform");
    } catch (error: any) {
      await deleteSelfieFromKYC(upload.publicId);
      await deleteKtmFromKYC(ktmUpload.publicId);

      if (error.code === 'P2002') {
        return {
          error: "Pendaftaran gagal: data sudah ada. Anda mungkin sudah mengajukan sebelumnya.",
          field: "email",
        };
      }

      console.error("Error in owner registration transaction:", error);
      return { error: "Terjadi kesalahan sistem saat registrasi. Silakan coba lagi." };
    }

    return {
      success: "Pengajuan berhasil dikirim. Data Anda sudah masuk ke antrian KYC dan akan diproses admin dalam 1x24 jam. Setelah disetujui, email autentikasi akan dikirim ke Gmail Anda.",
    };
  } catch (error) {
    console.error("Error registering owner class:", error);
    return { error: "Terjadi kesalahan sistem saat registrasi. Silakan cek terminal server." };
  }
}

export async function registerMember(formData: FormData) {
  const universitySlug = (formData.get("university")?.toString() || "").trim();
  const programSlug = (formData.get("program")?.toString() || "").trim();
  const classSlug = (formData.get("class")?.toString() || "").trim();
  const fullName = (formData.get("fullName")?.toString() || "").trim();
  const nim = (formData.get("nim")?.toString() || "").trim();

  if (!universitySlug || !programSlug || !classSlug) {
    return {
      error: "Silakan pilih universitas, program studi, dan kelas.",
      field: "class",
    };
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      slug: classSlug,
      status: "ACTIVE",
      program: {
        slug: programSlug,
        university: { slug: universitySlug },
      },
    },
    include: {
      university: { select: { name: true } },
      program: { select: { name: true } },
    },
  });

  if (!tenant) {
    return {
      error: "Kelas tidak ditemukan atau belum aktif. Pilih kelas milik owner yang sudah disetujui.",
      field: "class",
    };
  }

  const email = (formData.get("email")?.toString() || "").trim().toLowerCase();
  const password = (formData.get("password")?.toString() || "") as string;
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";

  if (password !== confirmPassword)
    return { error: "Password tidak cocok", field: "confirmPassword" };
  if (password.length < 6)
    return { error: "Password minimal 6 karakter", field: "password" };

  const verifiedUser = await prisma.user.findUnique({
    where: { email },
  });

  if (verifiedUser?.isVerified) {
    return {
      error: "Email ini sudah terdaftar dan terverifikasi. Silakan login atau gunakan email lain.",
      field: "email",
    };
  }

  const profilePhotoFile = formData.get("profilePhoto") as File | null;
  const ktmPhotoFile = formData.get("ktmPhoto") as File | null;

  if (!profilePhotoFile || profilePhotoFile.size === 0) {
    return { error: "Foto profil wajib diunggah.", field: "profilePhoto" };
  }
  if (!ktmPhotoFile || ktmPhotoFile.size === 0) {
    return { error: "Foto KTM wajib diunggah.", field: "ktmPhoto" };
  }

  try {
    const hashedPassword = await hash(password, 12);

    const profileBuffer = Buffer.from(await profilePhotoFile.arrayBuffer());
    const ktmBuffer = Buffer.from(await ktmPhotoFile.arrayBuffer());

    const profileUpload = await uploadSelfieForKYC(profileBuffer, profilePhotoFile.name);
    if (!profileUpload.success || !profileUpload.publicId) {
      return { error: profileUpload.error || "Gagal mengunggah foto profil.", field: "profilePhoto" };
    }

    const ktmUpload = await uploadKtmForKYC(ktmBuffer, ktmPhotoFile.name);
    if (!ktmUpload.success || !ktmUpload.publicId) {
      await deleteSelfieFromKYC(profileUpload.publicId);
      return { error: ktmUpload.error || "Gagal mengunggah foto KTM.", field: "ktmPhoto" };
    }

    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.upsert({
          where: { email },
          update: {
            name: fullName,
            nim: nim,
            password: hashedPassword,
            isVerified: false,
          },
          create: {
            name: fullName,
            nim: nim,
            email: email,
            password: hashedPassword,
            isVerified: false,
          },
        });

        await tx.memberApplication.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            fullName: fullName,
            nim: nim,
            email: email,
            profilePhotoStorageKey: profileUpload.publicId,
            ktmPhotoStorageKey: ktmUpload.publicId,
            status: "PENDING_APPROVAL",
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: user.id,
            action: "JOIN",
            entityType: "MEMBER_REGISTRATION",
            entityId: null,
            metadata: {
              tenantId: tenant.id,
              universityName: tenant.university.name,
              programName: tenant.program.name,
              className: tenant.name,
              role: "MEMBER",
              status: "PENDING_APPROVAL",
            },
          },
        });
      });
    } catch (error: any) {
      await deleteSelfieFromKYC(profileUpload.publicId);
      await deleteKtmFromKYC(ktmUpload.publicId);

      if (error.code === 'P2002') {
        return {
          error: "Pendaftaran gagal: data sudah ada. Anda mungkin sudah mendaftar sebelumnya.",
          field: "email",
        };
      }

      console.error("Error in member registration transaction:", error);
      return { error: "Terjadi kesalahan sistem saat registrasi. Silakan coba lagi." };
    }

    return {
      success: "Pendaftaran berhasil! Pendaftaran Anda sedang menunggu persetujuan admin/owner kelas. Setelah disetujui, akun Anda langsung aktif dan Anda dapat langsung login.",
      tenantId: tenant.id,
      className: tenant.name,
    };
  } catch (error) {
    console.error("Error registering member:", error);
    return { error: "Terjadi kesalahan sistem saat registrasi. Silakan cek terminal server." };
  }
}

export interface RegistrationClass {
  id: string;
  name: string;
  slug: string;
  members?: Array<{
    id: string;
    name: string;
    nim: string | null;
  }>;
}

export interface RegistrationProgram {
  slug: string;
  name: string;
  classes: RegistrationClass[];
}

export interface RegistrationUniversity {
  slug: string;
  name: string;
  programs: RegistrationProgram[];
}

async function loadRegistrationData(): Promise<RegistrationUniversity[]> {
  try {
    const universities = await prisma.university.findMany({
      where: { tenants: { some: { status: "ACTIVE" } } },
      include: {
        programs: {
          where: { tenants: { some: { status: "ACTIVE" } } },
          include: {
            tenants: {
              where: { status: "ACTIVE" },
              select: {
                id: true,
                name: true,
                slug: true,
              },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return universities.map((u) => ({
      slug: u.slug,
      name: u.name,
      programs: u.programs.map((p) => ({
        slug: p.slug,
        name: p.name,
        classes: p.tenants.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
        })),
      })),
    }));
  } catch (error) {
    console.error("Error loading registration data:", error);
    return [];
  }
}

export const getRegistrationData = unstable_cache(
  loadRegistrationData,
  ["registration-data"],
  { revalidate: 300, tags: ["registration-data"] }
);