import "server-only";

import {
  createMember,
  createTenantMembership,
  deleteUser,
  findTenantMembership,
  findUserByEmail,
  verifyUser,
} from "@/features/cms/repositories/people.repository";
import { createAuditLog } from "@/server/audit";

export async function addMemberToTenant(input: {
  tenantId: string;
  name: string;
  nim: string;
  email: string;
  cmsRole: string | null;
}) {
  const existingUser = await findUserByEmail(input.email);
  if (existingUser) return { error: "Email sudah terdaftar" } as const;

  const user = await createMember({ name: input.name, nim: input.nim, email: input.email });
  await createTenantMembership({ userId: user.id, tenantId: input.tenantId, cmsRole: input.cmsRole });
  await createAuditLog("PEOPLE", "CREATE", `Menambahkan anggota: ${input.name} ke kelas`, undefined, {
    userId: user.id,
    name: input.name,
    nim: input.nim,
    email: input.email,
    cmsRole: input.cmsRole,
    tenantId: input.tenantId,
    isVerified: false,
  });
  return { user } as const;
}

export async function acceptMemberInTenant(userId: string, tenantId: string) {
  const membership = await findTenantMembership(userId, tenantId);
  if (!membership) return { error: "Anggota tidak ditemukan dalam kelas ini." } as const;
  await verifyUser(userId);
  return { success: true } as const;
}

export async function rejectMemberFromTenant(userId: string, tenantId: string) {
  const membership = await findTenantMembership(userId, tenantId);
  if (!membership) return { error: "Anggota tidak ditemukan dalam kelas ini." } as const;
  await deleteUser(userId);
  return { success: true } as const;
}