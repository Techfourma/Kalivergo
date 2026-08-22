import "server-only";

import { prisma } from "@/server/db/prisma";
import { hash, compare } from "bcryptjs";
import { generateVerificationToken, hashToken } from "@/lib/auth";
import { sendVerificationEmail, sendForgotPasswordVerificationEmail } from "@/server/email";
import { createAuditLog } from "@/server/audit";

export interface RegisterUserInput {
  fullName: string;
  nim: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginUserInput {
  nim: string;
  password: string;
}

export interface ResetPasswordInput {
  nim: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export async function registerUserService(input: RegisterUserInput) {
  const { fullName, nim, email, password, confirmPassword } = input;

  if (password !== confirmPassword) {
    return { error: "Password tidak cocok" } as const;
  }
  if (password.length < 6) {
    return { error: "Password minimal 6 karakter" } as const;
  }

  const normalizedInputName = fullName.toLowerCase().trim().replace(/\s+/g, " ");
  const normalizedInputNim = nim.trim();
  const normalizedInputEmail = email.toLowerCase().trim();

  const verifiedUser = await prisma.user.findFirst({
    where: { isVerified: true, email: normalizedInputEmail },
  });

  if (verifiedUser) {
    const dbName = verifiedUser.name.toLowerCase().trim().replace(/\s+/g, " ");
    const dbNim = verifiedUser.nim ? verifiedUser.nim.trim() : "";
    if (dbName === normalizedInputName && dbNim === normalizedInputNim) {
      return { error: "Akun anda sudah pernah terdaftar, silahkan login menggunakan akun terkait.", field: "email" } as const;
    }
  }

  const existingUser = await prisma.user.findFirst({
    where: { name: { equals: fullName, mode: "insensitive" } },
  });

  if (!existingUser) {
    return { error: "Maaf, nama anda tidak terdaftar. Silakan hubungi admin.", field: "fullName" } as const;
  }

  const existingName = existingUser.name.toLowerCase().trim().replace(/\s+/g, " ");
  const existingNim = existingUser.nim ? existingUser.nim.trim() : "";
  const existingEmail = existingUser.email ? existingUser.email.toLowerCase().trim() : "";

  if (existingUser.isVerified) {
    if (existingNim && existingNim !== normalizedInputNim) {
      return { error: "Maaf, NIM tidak sesuai dengan data terdaftar.", field: "nim" } as const;
    }
    if (existingEmail && existingEmail !== normalizedInputEmail) {
      return { error: "Maaf, Gmail tidak sesuai dengan data terdaftar.", field: "email" } as const;
    }
    if (existingName === normalizedInputName && existingNim === normalizedInputNim && existingEmail === normalizedInputEmail) {
      return { error: "Akun anda sudah pernah terdaftar, silahkan login menggunakan akun terkait.", field: "email" } as const;
    }
  } else {
    if (existingUser.nim && existingUser.nim.trim() !== normalizedInputNim) {
      return { error: "Maaf, NIM tidak sesuai dengan data terdaftar.", field: "nim" } as const;
    }
    if (existingUser.email && existingUser.email.toLowerCase().trim() !== normalizedInputEmail) {
      return { error: "Maaf, Gmail tidak sesuai dengan data terdaftar.", field: "email" } as const;
    }
  }

  const conflictUser = await prisma.user.findFirst({
    where: {
      id: { not: existingUser.id },
      OR: [{ email: normalizedInputEmail }, { nim: normalizedInputNim }],
    },
  });

  if (conflictUser) {
    if (conflictUser.email === normalizedInputEmail) {
      return { error: "Email ini sudah digunakan oleh akun lain.", field: "email" } as const;
    }
    if (conflictUser.nim === normalizedInputNim) {
      return { error: "NIM ini sudah digunakan oleh akun lain.", field: "nim" } as const;
    }
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      password: hashedPassword,
      isVerified: false,
      nim: normalizedInputNim,
      email: normalizedInputEmail,
    },
  });

  const plainToken = generateVerificationToken();
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { email: normalizedInputEmail } });
  await prisma.verificationToken.create({
    data: { tokenHash, email: normalizedInputEmail, expiresAt },
  });

  await sendVerificationEmail(normalizedInputEmail, existingUser.name, plainToken);

  await createAuditLog("AUTH", "REGISTER", `User registered: ${normalizedInputEmail}`, undefined, {
    module: "AUTH",
    userId: existingUser.id,
    email: normalizedInputEmail,
  });

  return { success: "Registrasi berhasil! Silakan cek email Anda untuk link verifikasi." } as const;
}

export async function loginUserService(input: LoginUserInput) {
  const { nim, password } = input;

  const user = await prisma.user.findFirst({ where: { nim } });
  if (!user) {
    return { error: "Akun tidak terdaftar" } as const;
  }
  if (!user.password) {
    return { error: "Akun belum diaktifkan. Silakan registrasi terlebih dahulu." } as const;
  }
  if (!user.isVerified) {
    return { error: "Akun belum diverifikasi. Silakan cek email Anda untuk link verifikasi." } as const;
  }

  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    return { error: "Password salah" } as const;
  }

  const memberships = await prisma.tenantMembership.findMany({
    where: { userId: user.id },
    include: {
      tenant: {
        include: {
          university: { select: { slug: true } },
          program: { select: { slug: true } },
        },
      },
    },
  });

  await createAuditLog("AUTH", "LOGIN", `User logged in: ${user.email}`, undefined, {
    module: "AUTH",
    userId: user.id,
    email: user.email,
  });

  return { 
    success: true, 
    user: {
      id: user.id,
      name: user.name,
      email: user.email ?? "",
      nim: user.nim,
      platformRole: user.platformRole ?? null,
      memberships: memberships.map((m) => ({
        tenantId: m.tenantId,
        role: m.role,
        cmsRole: m.cmsRole,
      })),
    }
  } as const;
}

export async function resetPasswordService(input: ResetPasswordInput) {
  const { nim, email, newPassword, confirmPassword } = input;

  if (newPassword !== confirmPassword) {
    return { error: "Password baru tidak cocok" } as const;
  }
  if (newPassword.length < 6) {
    return { error: "Password minimal 6 karakter" } as const;
  }

  const user = await prisma.user.findFirst({
    where: { nim, email, isVerified: true },
  });

  if (!user) {
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (!emailExists) {
      return { error: "Gmail tidak terdaftar di akunmu, silahkan hubungi administrator", field: "email" } as const;
    }
    return { error: "NIM tidak cocok dengan email yang terdaftar", field: "nim" } as const;
  }

  const hashedPassword = await hash(newPassword, 12);

  const verificationToken = await prisma.verificationToken.create({
    data: {
      email,
      newPasswordHash: hashedPassword,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      tokenHash: Math.random().toString(36).substring(2),
    },
  });

  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-forgot-password?token=${verificationToken.tokenHash}`;
  await sendForgotPasswordVerificationEmail(email, verificationUrl);

  await createAuditLog("AUTH", "PASSWORD_RESET", `Password reset requested for: ${email}`, undefined, {
    module: "AUTH",
    userId: user.id,
    email,
  });

  return { success: true, message: "Reset password berhasil." } as const;
}