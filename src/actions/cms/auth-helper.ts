'use server';

import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { generateVerificationToken, hashToken } from '@/lib/auth';
import { sendVerificationEmail, sendForgotPasswordVerificationEmail } from '@/lib/email';
import { CMS_ROLES } from '@/types';
import { readSessionUser, SessionUser } from './role-model';

export async function registerUser(formData: FormData) {
  try {
    const fullName = (formData.get('fullName') as string)?.trim();
    const nim = (formData.get('nim') as string)?.trim();
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) return { error: 'Password tidak cocok' };
    if (password.length < 6) return { error: 'Password minimal 6 karakter' };

    const normalizedInputName = fullName.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedInputNim = nim.trim();
    const normalizedInputEmail = email.toLowerCase().trim();

    const verifiedUser = await prisma.user.findFirst({
      where: { isVerified: true, email: normalizedInputEmail },
    });

    if (verifiedUser) {
      const dbName = verifiedUser.name.toLowerCase().trim().replace(/\s+/g, ' ');
      const dbNim = verifiedUser.nim ? verifiedUser.nim.trim() : '';
      if (dbName === normalizedInputName && dbNim === normalizedInputNim) {
        return { error: 'Akun anda sudah pernah terdaftar, silahkan login menggunakan akun terkait.', field: 'email' };
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: { name: { equals: fullName, mode: 'insensitive' } },
    });

    if (!existingUser) {
      return { error: 'Maaf, nama anda tidak terdaftar. Silakan hubungi admin.', field: 'fullName' };
    }

    const existingName = existingUser.name.toLowerCase().trim().replace(/\s+/g, ' ');
    const existingNim = existingUser.nim ? existingUser.nim.trim() : '';
    const existingEmail = existingUser.email ? existingUser.email.toLowerCase().trim() : '';

    if (existingUser.isVerified) {
      if (existingNim && existingNim !== normalizedInputNim) {
        return { error: 'Maaf, NIM tidak sesuai dengan data terdaftar.', field: 'nim' };
      }
      if (existingEmail && existingEmail !== normalizedInputEmail) {
        return { error: 'Maaf, Gmail tidak sesuai dengan data terdaftar.', field: 'email' };
      }
      if (existingName === normalizedInputName && existingNim === normalizedInputNim && existingEmail === normalizedInputEmail) {
        return { error: 'Akun anda sudah pernah terdaftar, silahkan login menggunakan akun terkait.', field: 'email' };
      }
    } else {
      if (existingUser.nim && existingUser.nim.trim() !== normalizedInputNim) {
        return { error: 'Maaf, NIM tidak sesuai dengan data terdaftar.', field: 'nim' };
      }
      if (existingUser.email && existingUser.email.toLowerCase().trim() !== normalizedInputEmail) {
        return { error: 'Maaf, Gmail tidak sesuai dengan data terdaftar.', field: 'email' };
      }
    }

    const conflictUser = await prisma.user.findFirst({
      where: {
        id: { not: existingUser.id },
        OR: [{ email: normalizedInputEmail }, { nim: normalizedInputNim }],
      },
    });

    if (conflictUser) {
      if (conflictUser.email === normalizedInputEmail) return { error: 'Email ini sudah digunakan oleh akun lain.', field: 'email' };
      if (conflictUser.nim === normalizedInputNim) return { error: 'NIM ini sudah digunakan oleh akun lain.', field: 'nim' };
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

    return { success: 'Registrasi berhasil! Silakan cek email Anda untuk link verifikasi.' };
  } catch (error) {
    console.error('Error registering user:', error);
    return { error: 'Terjadi kesalahan sistem saat registrasi. Silakan cek terminal server.' };
  }
}

export async function loginUser(nim: string, password: string) {
  try {
    const user = await prisma.user.findFirst({ where: { nim } });
    if (!user) return { error: 'Akun tidak terdaftar' };
    if (!user.password) return { error: 'Akun belum diaktifkan. Silakan registrasi terlebih dahulu.' };
    if (!user.isVerified) return { error: 'Akun belum diverifikasi. Silakan cek email Anda untuk link verifikasi.' };

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) return { error: 'Password salah' };

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

    const session: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email ?? '',
      nim: user.nim,
      platformRole: user.platformRole ?? null,
      memberships: memberships.map((m) => ({
        tenantId: m.tenantId,
        role: m.role,
        cmsRole: m.cmsRole,
      })),
    };

    if (user.platformRole) {
      session.role = user.platformRole;
      session.cmsRole = null;
    } else {
      const priority = ['OWNER', 'PRESIDENT', 'VICE_PRESIDENT', 'TREASURER', 'VICE_TREASURER', 'SECRETARY', 'MEMBER'];
      const rank = (m: (typeof memberships)[number]): number => {
        if (m.role === 'OWNER') return 0;
        const idx = m.cmsRole ? CMS_ROLES.indexOf(m.cmsRole) : -1;
        if (idx >= 0) return idx + 1;
        return priority.indexOf('MEMBER');
      };
      const primary = [...memberships].sort((a, b) => rank(a) - rank(b))[0];
      session.role = primary?.role === 'OWNER' ? 'OWNER' : primary?.cmsRole ?? primary?.role ?? 'MEMBER';
      session.cmsRole = primary?.cmsRole ?? null;
    }

    const cookieStore = cookies();
    cookieStore.set('kalivergo_user', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });

    return { success: true, user: session };
  } catch (error) {
    console.error('Error logging in:', error);
    return { error: 'Terjadi kesalahan saat login' };
  }
}

export async function logoutUser() {
  const cookieStore = cookies();
  cookieStore.delete('kalivergo_user');
  return { success: true };
}

export async function resetPassword(formData: FormData) {
  try {
    const nim = formData.get('nim') as string;
    const email = formData.get('email') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) return { error: 'Password baru tidak cocok' };
    if (newPassword.length < 6) return { error: 'Password minimal 6 karakter' };

    const user = await prisma.user.findFirst({
      where: { nim, email, isVerified: true },
    });

    if (!user) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (!emailExists) {
        return { error: 'Gmail tidak terdaftar di akunmu, silahkan hubungi administrator', field: 'email' };
      }
      return { error: 'NIM tidak cocok dengan email yang terdaftar', field: 'nim' };
    }

    return await requestPasswordReset(email, newPassword);
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error: 'Terjadi kesalahan saat reset password' };
  }
}

export async function requestPasswordReset(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
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

    return { success: true, message: 'Reset password berhasil.' };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, message: 'Gagal melakukan reset password' };
  }
}