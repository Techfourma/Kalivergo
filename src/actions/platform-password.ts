"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, hashToken } from "@/lib/auth";
import { sendPlatformAdminForgotPasswordVerificationEmail } from "@/lib/email";
import { env } from "@/config/env";

const PLATFORM_RESET_PURPOSE = "PLATFORM_ADMIN_PASSWORD_RESET";

export async function requestPlatformAdminPasswordReset(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!name || !email || !phone || !newPassword || !confirmPassword) return { error: "Semua kolom wajib diisi." };
  if (newPassword.length < 6) return { error: "Password baru minimal 6 karakter." };
  if (newPassword !== confirmPassword) return { error: "Password dan ulangi password tidak cocok." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || (user.platformRole !== "ADMIN_KYC" && user.platformRole !== "SUPER_ADMIN_KYC")) {
    return { error: "Data admin platform tidak ditemukan." };
  }
  if (user.name.trim().toLowerCase() !== name.toLowerCase()) return { error: "Nama lengkap tidak sesuai." };
  if ((user.phone || "").trim() !== phone) return { error: "Nomor telepon tidak sesuai." };

  const token = generateVerificationToken();
  const tokenHash = hashToken(token);
  const newPasswordHash = await hash(newPassword, 12);
  await prisma.verificationToken.deleteMany({ where: { email, purpose: PLATFORM_RESET_PURPOSE } });
  await prisma.verificationToken.create({
    data: {
      email,
      tokenHash,
      newPasswordHash,
      purpose: PLATFORM_RESET_PURPOSE,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const baseUrl = env.baseUrl || "http://localhost:3000";
  await sendPlatformAdminForgotPasswordVerificationEmail(
    email,
    `${baseUrl}/api/platform/verify-forgot-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
  );
  return { success: "Permintaan berhasil. Silakan cek email untuk verifikasi." };
}