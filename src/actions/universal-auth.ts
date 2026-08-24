"use server";

import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CMS_ROLES } from "@/types";
import {
  clearCurrentSession,
  setCurrentSessionUser,
  type TenantCookie,
} from "@/server/auth/session";

interface SessionMembership {
  tenantId: string;
  role: string;
  cmsRole?: string | null;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  nim: string | null;
  platformRole: string | null;
  role: string | null;
  cmsRole: string | null;
  memberships: SessionMembership[];
}

export async function loginUserUniversal(identifier: string, password: string): Promise<{
  success?: boolean;
  error?: string;
  user?: SessionUser;
  redirectUrl?: string;
}> {
  try {
    const id = (identifier || "").trim();
    if (!id || !password) {
      return { error: "Email/NIM dan password wajib diisi." };
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: id.toLowerCase(), mode: "insensitive" } },
          { nim: { equals: id } },
        ],
      },
      include: {
        tenantMemberships: {
          include: {
            tenant: {
              include: {
                university: { select: { slug: true } },
                program: { select: { slug: true } },
              },
            },
          },
        },
      },
    });

    if (!user || !user.password) {
      return { error: "Email/NIM atau password salah." };
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return { error: "Email/NIM atau password salah." };
    }

    if (!user.isVerified) {
      return { error: "Email belum diverifikasi. Silakan cek inbox Anda." };
    }

    const memberships: SessionMembership[] = user.tenantMemberships.map((m) => ({
      tenantId: m.tenantId,
      role: m.role,
      cmsRole: m.cmsRole,
    }));

    if (user.platformRole) {
      if (user.kycStatus !== "APPROVED") {
        return { error: "Akun belum disetujui oleh SUPER_ADMIN_KYC. Harap tunggu verifikasi." };
      }

      const session: SessionUser = {
        id: user.id,
        name: user.name,
        email: user.email ?? "",
        nim: user.nim ?? null,
        platformRole: user.platformRole,
        role: user.platformRole,
        cmsRole: null,
        memberships,
      };

      await setCurrentSessionUser(session);
      revalidatePath("/platform");
      return { success: true, user: session, redirectUrl: "/platform" };
    }

    const primary = [...user.tenantMemberships].sort((a, b) => {
      const ca = a.cmsRole ? CMS_ROLES.indexOf(a.cmsRole) : -1;
      const cb = b.cmsRole ? CMS_ROLES.indexOf(b.cmsRole) : -1;
      const ra = a.role === "OWNER" ? -1 : (ca >= 0 ? ca : Number.MAX_SAFE_INTEGER);
      const rb = b.role === "OWNER" ? -1 : (cb >= 0 ? cb : Number.MAX_SAFE_INTEGER);
      return ra - rb;
    })[0];

    const primaryRole =
      primary?.role === "OWNER" ? "OWNER" : (primary?.cmsRole ?? primary?.role ?? "MEMBER");

    const session: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email ?? "",
      nim: user.nim ?? null,
      platformRole: null,
      role: primaryRole,
      cmsRole: primary?.cmsRole ?? null,
      memberships,
    };

    const tenants = user.tenantMemberships.map((m) => ({
      tenantId: m.tenant.id,
      role: m.role,
      cmsRole: m.cmsRole,
      universitySlug: m.tenant.university.slug,
      programSlug: m.tenant.program.slug,
      classSlug: m.tenant.slug,
      customSlug: m.tenant.customSlug,
    }));

    if (tenants.length === 0) {
      await setCurrentSessionUser(session);
      return { success: true, user: session, redirectUrl: "/signup" };
    }

    const priorityOrder = ["OWNER", "PRESIDENT", "VICE_PRESIDENT", "TREASURER", "VICE_TREASURER", "SECRETARY", "MEMBER"];
    const rank = (t: (typeof tenants)[number]): number => {
      if (t.role === "OWNER") return 0;
      const idx = t.cmsRole ? CMS_ROLES.indexOf(t.cmsRole) : -1;
      if (idx >= 0) return idx + 1;
      return priorityOrder.indexOf("MEMBER");
    };

    const sortedTenants = [...tenants].sort((a, b) => rank(a) - rank(b));
    const primaryTenant = sortedTenants[0];

    if (!primaryTenant.customSlug) {
      return { error: "Tenant belum memiliki Nama Website yang valid." };
    }

    const redirectUrl = `/${primaryTenant.customSlug}/home`;

    let tenantContext: TenantCookie | undefined;
    if (primaryTenant.role === "OWNER") {
      tenantContext = {
        tenantId: primaryTenant.tenantId,
        universitySlug: primaryTenant.universitySlug,
        programSlug: primaryTenant.programSlug,
        classSlug: primaryTenant.classSlug,
      };
    }

    await setCurrentSessionUser(session, tenantContext);

    return { success: true, user: session, redirectUrl };
  } catch (error) {
    console.error("Error logging in user:", error);
    return { error: "Terjadi kesalahan saat login. Silakan coba lagi." };
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    await clearCurrentSession();
  } catch (error) {
    console.error("Error logging out user:", error);
  }
  return { success: true };
}