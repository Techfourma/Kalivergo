"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { createAuditLog } from "@/server/audit";
import { validateSelfieFile } from "@/server/kyc/validation";
import {
  createOwnerApplication,
} from "@/features/owner/services/owner-application.service";
import {
  deleteKtmFromKYC,
  deleteSelfieFromKYC,
  uploadKtmForKYC,
  uploadSelfieForKYC,
} from "@/features/kyc/services/kyc-storage.service";

export async function registerOwner(formData: FormData) {
  const fullName = (formData.get("fullName")?.toString() || "").trim();
  const nim = (formData.get("nim")?.toString() || "").trim();
  const email = (formData.get("email")?.toString() || "").trim().toLowerCase();
  const whatsapp = (formData.get("whatsapp")?.toString() || formData.get("phone")?.toString() || "").trim();
  const university = (formData.get("university")?.toString() || "").trim();
  const program = (formData.get("program")?.toString() || "").trim();
  const className = (formData.get("className")?.toString() || "").trim();
  const password = formData.get("password")?.toString() || "";
  const confirmPassword = formData.get("confirmPassword")?.toString() || "";
  const selfieFile = formData.get("selfieFile");
  const ktmFile = formData.get("ktmFile");

  if (!fullName || fullName.length < 2) {
    return { error: "Nama lengkap wajib diisi minimal 2 karakter.", field: "fullName" };
  }

  if (!nim) {
    return { error: "NIM wajib diisi.", field: "nim" };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format email tidak valid.", field: "email" };
  }

  if (!whatsapp || whatsapp.length < 10) {
    return { error: "Nomor WhatsApp minimal 10 digit.", field: "whatsapp" };
  }

  if (!university || university.length < 2) {
    return { error: "Nama universitas wajib diisi.", field: "university" };
  }

  if (!program || program.length < 2) {
    return { error: "Nama program studi wajib diisi.", field: "program" };
  }

  if (!className || className.length < 2) {
    return { error: "Nama kelas wajib diisi.", field: "className" };
  }

  if (password !== confirmPassword) {
    return { error: "Password dan konfirmasi password tidak cocok.", field: "confirmPassword" };
  }

  if (password.length < 6) {
    return { error: "Password minimal 6 karakter.", field: "password" };
  }

  if (!(selfieFile instanceof File) || selfieFile.size === 0) {
    return { error: "Foto selfie wajib diunggah.", field: "selfieFile" };
  }
  const selfieCheck = validateSelfieFile(selfieFile);
  if (!selfieCheck.valid) return { error: selfieCheck.error, field: "selfieFile" };

  if (!(ktmFile instanceof File) || ktmFile.size === 0) {
    return { error: "Foto KTM wajib diunggah.", field: "ktmFile" };
  }
  const ktmCheck = validateSelfieFile(ktmFile);
  if (!ktmCheck.valid) return { error: ktmCheck.error, field: "ktmFile" };

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.isVerified) {
      return { error: "Email sudah terdaftar dan terverifikasi. Silakan login.", field: "email" };
    }
  }

  const existingNimUser = await prisma.user.findFirst({ where: { nim } });
  if (existingNimUser && existingNimUser.id !== existingUser?.id) {
    return { error: "NIM ini sudah digunakan oleh akun lain. Silakan gunakan NIM yang berbeda.", field: "nim" };
  }

  let userId: string;

  try {
    const hashedPassword = await hash(password, 12);

    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());
    const selfieUpload = await uploadSelfieForKYC(selfieBuffer, selfieFile.name);
    if (!selfieUpload.success || !selfieUpload.publicId) {
      return { error: selfieUpload.error || "Gagal mengunggah foto selfie.", field: "selfieFile" };
    }

    const ktmBuffer = Buffer.from(await ktmFile.arrayBuffer());
    const ktmUpload = await uploadKtmForKYC(ktmBuffer, ktmFile.name);
    if (!ktmUpload.success || !ktmUpload.publicId) {
      await deleteSelfieFromKYC(selfieUpload.publicId!);
      return { error: ktmUpload.error || "Gagal mengunggah foto KTM.", field: "ktmFile" };
    }

    if (existingUser) {
      userId = existingUser.id;
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          isVerified: false,
          name: fullName,
          nim,
        },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          name: fullName,
          nim,
          email,
          password: hashedPassword,
          isVerified: false,
        },
      });
      userId = user.id;
    }

    const app = await createOwnerApplication({
      userId,
      universityName: university,
      programName: program,
      className,
      selfieStorageKey: selfieUpload.publicId,
      ktmStorageKey: ktmUpload.publicId,
      whatsappNumber: whatsapp,
    });

    if (!app.success) {
      await deleteSelfieFromKYC(selfieUpload.publicId!);
      await deleteKtmFromKYC(ktmUpload.publicId!);
      return { error: app.error || "Gagal membuat pengajuan owner.", field: "className" };
    }

    await createAuditLog("OWNER_REGISTRATION", "SUBMIT", `Pengajuan owner ${className}`, userId, {
      applicationId: app.applicationId,
      universityName: university,
      programName: program,
      className,
    });

    return {
      success: "Pendaftaran berhasil. Data Anda sudah masuk ke antrian KYC dan akan diproses admin dalam 1x24 jam. Setelah disetujui, email autentikasi akan dikirim ke Gmail Anda.",
    };
  } catch (error) {
    console.error("Error registering owner:", error);
    return { error: "Terjadi kesalahan sistem saat registrasi. Silakan coba lagi." };
  }
}