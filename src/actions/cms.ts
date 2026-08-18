'use server';

import { prisma } from '@/lib/db';
import { hash, compare } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { generateVerificationToken, hashToken } from '@/lib/auth';
import { sendVerificationEmail, sendForgotPasswordVerificationEmail } from '@/lib/email';
import { getCurrentTenant } from '@/lib/tenant-context';
import { CMS_ROLES } from '@/types';

const PLATFORM_ROLES = ['SUPER_ADMIN_KYC', 'ADMIN_KYC'] as const;
const CLASS_ROLES = [
  'MEMBER',
  'PRESIDENT',
  'VICE_PRESIDENT',
  'TREASURER',
  'VICE_TREASURER',
  'SECRETARY',
] as const;

interface SessionUser {
  id: string;
  name: string;
  email: string;
  nim: string | null;
  platformRole?: string | null;
  role?: string | null;
  cmsRole?: string | null;
  memberships?: Array<{ tenantId: string; role: string; cmsRole?: string | null }>;
}

function readSessionUser(): SessionUser | null {
  try {
    const raw = cookies().get('techfourma_user')?.value;
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch (e) {
    return null;
  }
}

async function resolveTenantId(): Promise<string | null> {
  try {
    const tenant = await getCurrentTenant();
    return tenant?.tenantId ?? null;
  } catch (error) {
    console.error('Error resolving tenant context:', error);
    return null;
  }
}

async function hasCmsAccess(userId: string, tenantId: string): Promise<boolean> {
  if (!userId || !tenantId) return false;
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId, tenantId },
  });
  if (!membership) return false;
  if (membership.role === 'OWNER') return true;
  return !!membership.cmsRole && CMS_ROLES.includes(membership.cmsRole);
}

async function isOwner(userId: string, tenantId: string): Promise<boolean> {
  if (!userId || !tenantId) return false;
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId, tenantId, role: 'OWNER' },
  });
  return !!membership;
}

export async function addUser(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    const nim = (formData.get('nim') as string)?.trim();
    const email = (formData.get('email') as string)?.toLowerCase().trim();
    const role = formData.get('role') as string;

    if (!name || !nim || !email) {
      return { error: 'Nama, NIM, dan email wajib diisi.' };
    }

    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }

    const session = readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menambah anggota.' };
    }

    // Role tingkat kelas (CmsRole). MEMBER = tanpa cmsRole.
    const cmsRole = CLASS_ROLES.includes(role as any) && role !== 'MEMBER' ? (role as any) : null;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'Email sudah terdaftar' };
    }

    const user = await prisma.user.create({
      data: {
        name,
        nim,
        email,
        isVerified: false,
      },
    });

    // Isolasi database per kelas: user di-bind ke tenant sebagai MEMBER + cmsRole.
    await prisma.tenantMembership.create({
      data: {
        userId: user.id,
        tenantId,
        role: 'MEMBER',
        cmsRole,
      },
    });

    await createAuditLog(
      'PEOPLE',
      'CREATE',
      `Menambahkan anggota: ${name} ke kelas`,
      undefined,
      { userId: user.id, name, nim, email, cmsRole, tenantId }
    );

    revalidatePath('/cms/people');
    return { success: 'User berhasil ditambahkan' };
  } catch (error) {
    console.error('Error adding user:', error);
    return { error: 'Gagal menambahkan user' };
  }
}


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

    // Muat memberships untuk konteks role per tenant (isolasi).
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
      const priority = [
        'OWNER',
        'PRESIDENT',
        'VICE_PRESIDENT',
        'TREASURER',
        'VICE_TREASURER',
        'SECRETARY',
        'MEMBER',
      ];
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
    cookieStore.set('techfourma_user', JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
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
  cookieStore.delete('techfourma_user');
  return { success: true };
}


export async function acceptUser(userId: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan.' };

    const session = readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menerima anggota.' };
    }

    const membership = await prisma.tenantMembership.findFirst({ where: { userId, tenantId } });
    if (!membership) return { error: 'Anggota tidak ditemukan dalam kelas ini.' };

    await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
    revalidatePath('/cms/people');
    return { success: 'User diterima' };
  } catch (error: any) {
    console.error('Error accepting user:', error);
    return { error: error.message || 'Gagal menerima user' };
  }
}

export async function rejectUser(userId: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan.' };

    const session = readSessionUser();
    if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menolak anggota.' };
    }

    const membership = await prisma.tenantMembership.findFirst({ where: { userId, tenantId } });
    if (!membership) return { error: 'Anggota tidak ditemukan dalam kelas ini.' };

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/cms/people');
    return { success: 'User ditolak' };
  } catch (error: any) {
    console.error('Error rejecting user:', error);
    return { error: error.message || 'Gagal menolak user' };
  }
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

async function requireCmsActor(tenantId: string): Promise<string | null> {
  const session = readSessionUser();
  if (!session?.id || !(await hasCmsAccess(session.id, tenantId))) return null;
  return session.id;
}

async function requireOwner(tenantId: string): Promise<string | null> {
  const session = readSessionUser();
  if (!session?.id || !(await isOwner(session.id, tenantId))) return null;
  return session.id;
}

export async function deleteTransaction(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }
    if (!(await requireCmsActor(tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER atau role CMS yang dapat menghapus transaksi.' };
    }

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) return { error: 'Transaksi tidak ditemukan' };
    if (transaction.tenantId !== tenantId) return { error: 'Akses ditolak: Transaksi bukan milik kelas Anda' };

    if (transaction?.userId && transaction?.type === 'INCOME' && transaction?.categoryId) {
      try {
        const isUangKas = await isUangKasCategory(transaction.categoryId);
        if (isUangKas) {
          await prisma.cashPayment.deleteMany({ where: { userId: transaction.userId, date: transaction.date } });
        }
      } catch (e) {
        console.error('Error deleting cash payment for uang kas:', e);
      }
    }

    await prisma.transaction.delete({ where: { id } });

    let transactionOwnerName: string | undefined;
    if (transaction?.userId) {
      try {
        const member = await prisma.user.findUnique({ where: { id: transaction.userId } });
        transactionOwnerName = member?.name;
      } catch (e) {
        // ignore
      }
    }

    const delDescription = `Menghapus transaksi: ${transaction?.description}${transactionOwnerName ? ` oleh ${transactionOwnerName}` : ''}`;
    await createAuditLog('FINANCE', 'DELETE', delDescription, undefined, {
      transactionId: id,
      amount: transaction?.amount,
      type: transaction?.type,
      userId: transaction?.userId,
      userName: transactionOwnerName,
      tenantId,
    });

    revalidatePath('/cms/finance');
    return { success: 'Transaksi berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return { error: error.message || 'Gagal menghapus transaksi' };
  }
}

export async function deleteTask(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return { error: 'Tugas tidak ditemukan' };
    if (task.tenantId !== tenantId) return { error: 'Akses ditolak: Tugas bukan milik kelas Anda' };

    await prisma.task.delete({ where: { id } });
    await createAuditLog('TASKS', 'DELETE', `Menghapus tugas: ${task?.title}`, 'System', {
      taskId: id,
      title: task?.title,
      tenantId,
    });

    revalidatePath('/cms/tasks');
    return { success: 'Tugas berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return { error: error.message || 'Gagal menghapus tugas' };
  }
}

export async function deleteSchedule(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const schedule = await prisma.schedule.findUnique({ where: { id } });
    if (!schedule) return { error: 'Jadwal tidak ditemukan' };
    if (schedule.tenantId !== tenantId) return { error: 'Akses ditolak: Jadwal bukan milik kelas Anda' };

    await prisma.schedule.delete({ where: { id } });
    await createAuditLog('SCHEDULE', 'DELETE', `Menghapus jadwal: ${schedule?.title}`, 'System', {
      scheduleId: id,
      title: schedule?.title,
      tenantId,
    });

    revalidatePath('/cms/schedule');
    return { success: 'Jadwal berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return { error: error.message || 'Gagal menghapus jadwal' };
  }
}

export async function deleteSeminar(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const seminar = await prisma.seminar.findUnique({ where: { id } });
    if (!seminar) return { error: 'Seminar tidak ditemukan' };
    if (seminar.tenantId !== tenantId) return { error: 'Akses ditolak: Seminar bukan milik kelas Anda' };

    await prisma.seminar.delete({ where: { id } });
    await createAuditLog('SEMINAR', 'DELETE', `Menghapus seminar: ${seminar?.title}`, 'System', {
      seminarId: id,
      title: seminar?.title,
      tenantId,
    });

    revalidatePath('/cms/seminar');
    return { success: 'Seminar berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting seminar:', error);
    return { error: error.message || 'Gagal menghapus seminar' };
  }
}

function isUangKasName(name: string): boolean {
  return name.toLowerCase().includes('uang kas');
}

async function isUangKasCategory(categoryId: string): Promise<boolean> {
  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    return !!category && category.name.toLowerCase().includes('uang kas');
  } catch (e) {
    console.error('Error checking uang kas category:', e);
    return false;
  }
}

function resolveCreatorName(): string {
  return readSessionUser()?.name ?? 'System';
}

export async function createTransaction(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const type = formData.get('type') as string;
    let amount = parseFloat(formData.get('amount') as string) || 10000;
    const description = formData.get('description') as string;
    const date = new Date(formData.get('date') as string);
    const categoryId = formData.get('categoryId') as string;

    if (!userId) return { error: 'Pilih anggota terlebih dahulu' };
    if (!categoryId) return { error: 'Pilih kategori transaksi' };

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    if (type === 'INCOME' && (await isUangKasCategory(categoryId))) {
      amount = 10000;
    }

    const invoiceName = formData.get('invoiceName') as string | null;
    let invoiceUrl: string | null = null;
    if (invoiceName) {
      const safeFileName = `${Date.now()}-${invoiceName.replace(/\s+/g, '_')}`;
      invoiceUrl = `/uploads/${safeFileName}`;
    }

    const creatorName = resolveCreatorName();

    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        userId,
        type,
        amount,
        description,
        date,
        invoiceUrl,
        createdBy: creatorName,
        categoryId,
      },
    });

    if (type === 'INCOME' && userId && (await isUangKasCategory(categoryId))) {
      try {
        await prisma.cashPayment.create({
          data: {
            tenantId,
            userId,
            amount,
            description: description || 'Uang kas',
            date,
          },
        });
      } catch (e) {
        console.error('Error creating cash payment for uang kas:', e);
      }
    }

    let memberName: string | undefined;
    if (userId) {
      try {
        const member = await prisma.user.findUnique({ where: { id: userId } });
        memberName = member?.name;
      } catch (e) {
        // ignore
      }
    }

    const auditDescription = `Menambahkan transaksi ${type === 'INCOME' ? 'pemasukan' : 'pengeluaran'}: ${description}${memberName ? ` oleh ${memberName}` : ''}`;
    await createAuditLog('FINANCE', 'CREATE', auditDescription, undefined, {
      transactionId: transaction.id,
      amount,
      type,
      userId,
      userName: memberName,
      tenantId,
    });

    revalidatePath('/cms/finance');
    return { success: 'Transaksi berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return { error: error.message || 'Gagal menambahkan transaksi' };
  }
}

export async function createUangKasSchedule(formData: FormData) {
  try {
    const date = new Date(formData.get('date') as string);
    const amount = parseFloat(formData.get('amount') as string) || 10000;
    const description = (formData.get('description') as string) || 'Uang kas';

    if (isNaN(date.getTime())) return { error: 'Tanggal tidak valid' };

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const existing = await prisma.uangKasSchedule.findFirst({ where: { date, tenantId } });
    if (existing) return { error: 'Tanggal uang kas sudah ada dalam jadwal' };

    await prisma.uangKasSchedule.create({
      data: { tenantId, date, amount, description },
    });

    await createAuditLog('FINANCE', 'CREATE', `Menambahkan jadwal uang kas: ${description} (${date.toISOString().split('T')[0]})`, undefined, {
      module: 'UANG_KAS_SCHEDULE',
      date: date.toISOString(),
      amount,
      description,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/dashboard');
    return { success: 'Jadwal uang kas berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating uang kas schedule:', error);
    return { error: error.message || 'Gagal menambahkan jadwal uang kas' };
  }
}

export async function deleteUangKasSchedule(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan.' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const schedule = await prisma.uangKasSchedule.findUnique({ where: { id } });
    if (!schedule) return { error: 'Jadwal uang kas tidak ditemukan' };
    if (schedule.tenantId !== tenantId) return { error: 'Akses ditolak: Jadwal uang kas bukan milik kelas Anda' };

    await prisma.uangKasSchedule.delete({ where: { id } });
    await createAuditLog('FINANCE', 'DELETE', `Menghapus jadwal uang kas: ${schedule.description || schedule.date.toISOString().split('T')[0]}`, undefined, {
      module: 'UANG_KAS_SCHEDULE',
      id,
      date: schedule.date.toISOString(),
      amount: schedule.amount,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/dashboard');
    return { success: 'Jadwal uang kas berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting uang kas schedule:', error);
    return { error: error.message || 'Gagal menghapus jadwal uang kas' };
  }
}


export async function createCategory(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    const type = formData.get('type') as string;

    if (!name) return { error: 'Nama kategori wajib diisi.' };
    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return { error: 'Tipe kategori tidak valid. Pilih Pemasukan atau Pengeluaran.' };
    }

    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }
    if (!(await requireOwner(tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };
    }

    const typeLabel = type === 'INCOME' ? 'pemasukan' : 'pengeluaran';
    const duplicate = await prisma.category.findFirst({ where: { tenantId, name, type } });
    if (duplicate) {
      return { error: `Kategori "${name}" (${typeLabel}) sudah ada.` };
    }

    const category = await prisma.category.create({ data: { tenantId, name, type } });

    await createAuditLog('FINANCE', 'CREATE', `Menambahkan kategori ${typeLabel}: ${name}`, undefined, {
      module: 'CATEGORY',
      categoryId: category.id,
      name,
      type,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/cms/categories');
    return { success: 'Kategori berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { error: error.message || 'Gagal menambahkan kategori' };
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const name = (formData.get('name') as string)?.trim();
    const type = formData.get('type') as string;

    if (!id) return { error: 'Kategori tidak ditemukan.' };
    if (!name) return { error: 'Nama kategori wajib diisi.' };
    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return { error: 'Tipe kategori tidak valid. Pilih Pemasukan atau Pengeluaran.' };
    }

    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }
    if (!(await requireOwner(tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: 'Kategori tidak ditemukan.' };
    if (category.tenantId !== tenantId) {
      return { error: 'Akses ditolak: Kategori bukan milik kelas Anda.' };
    }

    const typeLabel = type === 'INCOME' ? 'pemasukan' : 'pengeluaran';

    // Lindungi kategori khusus sistem uang kas agar tidak kehilangan penandanya.
    if (isUangKasName(category.name) && !isUangKasName(name)) {
      return {
        error: 'Nama kategori "Uang kas" tidak dapat diubah karena merupakan kategori khusus sistem. Silakan tambahkan kategori baru.',
      };
    }

    const duplicate = await prisma.category.findFirst({
      where: { tenantId, name, type, NOT: { id } },
    });
    if (duplicate) {
      return { error: `Kategori "${name}" (${typeLabel}) sudah ada.` };
    }

    await prisma.category.update({ where: { id }, data: { name, type } });

    await createAuditLog('FINANCE', 'UPDATE', `Mengubah kategori ${typeLabel}: ${category.name} menjadi ${name}`, undefined, {
      module: 'CATEGORY',
      categoryId: id,
      name,
      type,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/cms/categories');
    return { success: 'Kategori berhasil diubah' };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { error: error.message || 'Gagal mengubah kategori' };
  }
}

export async function deleteCategory(id: string) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) {
      return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    }
    if (!(await requireOwner(tenantId))) {
      return { error: 'Akses ditolak: hanya OWNER kelas yang dapat mengelola kategori.' };
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return { error: 'Kategori tidak ditemukan.' };
    if (category.tenantId !== tenantId) {
      return { error: 'Akses ditolak: Kategori bukan milik kelas Anda.' };
    }

    // Kategori khusus sistem uang kas tidak boleh dihapus.
    if (isUangKasName(category.name)) {
      return {
        error: 'Kategori "Uang kas" adalah kategori khusus sistem untuk pencatatan iuran dan tidak dapat dihapus.',
      };
    }

    const inUse = await prisma.transaction.count({ where: { categoryId: id } });
    if (inUse > 0) {
      return {
        error: `Tidak dapat menghapus kategori "${category.name}" karena masih digunakan oleh ${inUse} transaksi.`,
      };
    }

    await prisma.category.delete({ where: { id } });

    const typeLabel = category.type === 'INCOME' ? 'pemasukan' : 'pengeluaran';
    await createAuditLog('FINANCE', 'DELETE', `Menghapus kategori ${typeLabel}: ${category.name}`, undefined, {
      module: 'CATEGORY',
      categoryId: id,
      name: category.name,
      type: category.type,
      tenantId,
    });

    revalidatePath('/cms/finance');
    revalidatePath('/cms/categories');
    return { success: 'Kategori berhasil dihapus' };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return { error: error.message || 'Gagal menghapus kategori' };
  }
}

export async function createTask(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const deadline = new Date(formData.get('deadline') as string);

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const task = await prisma.task.create({
      data: { tenantId, title, description, deadline },
    });

    await createAuditLog('TASKS', 'CREATE', `Menambahkan tugas: ${title}`, 'System', {
      taskId: task.id,
      title,
      deadline: deadline.toISOString(),
      tenantId,
    });

    revalidatePath('/cms/tasks');
    return { success: 'Tugas berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating task:', error);
    return { error: error.message || 'Gagal menambahkan tugas' };
  }
}

export async function createSchedule(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const location = formData.get('location') as string;
    const type = formData.get('type') as string;

    const dateTime = time ? new Date(`${date}T${time}`) : new Date(date);

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const schedule = await prisma.schedule.create({
      data: { tenantId, title, date: dateTime, time, location, type },
    });

    await createAuditLog('SCHEDULE', 'CREATE', `Menambahkan jadwal: ${title}`, 'System', {
      scheduleId: schedule.id,
      title,
      date: dateTime.toISOString(),
      location,
      type,
      tenantId,
    });

    revalidatePath('/cms/schedule');
    return { success: 'Jadwal berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return { error: error.message || 'Gagal menambahkan jadwal' };
  }
}

export async function createSeminar(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = new Date(formData.get('date') as string);
    const location = formData.get('location') as string;

    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan. Silakan buka kelas melalui URL /[universitas]/[prodi]/[kelas].' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    const seminar = await prisma.seminar.create({
      data: { tenantId, title, description, date, location },
    });

    await createAuditLog('SEMINAR', 'CREATE', `Menambahkan seminar: ${title}`, 'System', {
      seminarId: seminar.id,
      title,
      date: date.toISOString(),
      location,
      tenantId,
    });

    revalidatePath('/cms/seminar');
    return { success: 'Seminar berhasil ditambahkan' };
  } catch (error: any) {
    console.error('Error creating seminar:', error);
    return { error: error.message || 'Gagal menambahkan seminar' };
  }
}

export async function updateTaskSubmissions(taskId: string, userIds: string[]) {
  try {
    const tenantId = await resolveTenantId();
    if (!tenantId) return { error: 'Konteks kelas tidak ditemukan.' };
    if (!(await requireCmsActor(tenantId))) return { error: 'Akses ditolak: hanya OWNER atau role CMS.' };

    await prisma.submission.deleteMany({ where: { taskId } });

    if (userIds.length > 0) {
      await prisma.submission.createMany({
        data: userIds.map((userId) => ({
          taskId,
          userId,
          status: 'SUBMITTED',
        })),
        skipDuplicates: true,
      });
    }

    revalidatePath('/cms/tasks');
    revalidatePath('/home');
    return { success: 'Submission berhasil diperbarui' };
  } catch (error: any) {
    console.error('Error updating task submissions:', error);
    return { error: error.message || 'Gagal memperbarui submission' };
  }
}


export async function createAuditLog(module: string, action: string, description: string, userName?: string, metadata?: any, tenantId?: string) {
  try {
    let resolvedUserName = userName;
    if (!resolvedUserName || resolvedUserName === 'System') {
      const session = readSessionUser();
      if (session?.name) resolvedUserName = session.name;
    }
    if (!resolvedUserName) resolvedUserName = 'System';

    const payload: Record<string, any> = { description, userName: resolvedUserName };
    if (metadata) {
      if (typeof metadata === 'object' && metadata !== null) {
        Object.assign(payload, metadata);
      } else {
        payload.value = metadata;
      }
    }
    if (tenantId) payload.tenantId = tenantId;

    await prisma.auditLog.create({
      data: {
        actorUserId: null,
        action,
        entityType: module,
        entityId: null,
        metadata: payload,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return { error: error.message || 'Gagal membuat audit log' };
  }
}

export async function getAuditLogs(module?: string, startDate?: Date, endDate?: Date, tenantId?: string) {
  try {
    const where: any = {};
    if (module && module !== 'ALL') where.entityType = module;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    if (tenantId) {
      where.metadata = { path: ['tenantId'], equals: tenantId };
    }

    const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' } });

    return rows.map((row) => ({
      id: row.id,
      module: row.entityType,
      action: row.action,
      description: (row.metadata as any)?.description ?? '',
      userId: null,
      userName: (row.metadata as any)?.userName ?? null,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

export async function requestPasswordReset(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const hashedPassword = await hash(newPassword, 12);

    const verificationToken = await prisma.verificationToken.create({
      data: {
        email,
        newPasswordHash: hashedPassword,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
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