import "server-only";

import {
  findSeminarWithTenant,
  findTenantSeminarMemberIds,
  replaceSeminarSubmissions,
  findTenantRouteSlug,
} from "@/features/seminar/repositories/seminar.repository";

export async function replaceSeminarSubmissionsForTenant(
  seminarId: string,
  tenantId: string,
  userIds: string[]
) {
  const seminar = await findSeminarWithTenant(seminarId);
  if (!seminar) return { error: "Seminar tidak ditemukan" } as const;
  if (seminar.tenantId !== tenantId) {
    return { error: "Akses ditolak: Seminar bukan milik kelas Anda" } as const;
  }

  const validMembers = await findTenantSeminarMemberIds(tenantId, userIds);
  const validUserIds = new Set(validMembers.map((member) => member.userId));
  if (validUserIds.size !== new Set(userIds).size) {
    return { error: "Akses ditolak: terdapat anggota yang bukan bagian dari kelas ini" } as const;
  }

  const count = await replaceSeminarSubmissions(seminarId, userIds);
  return { count } as const;
}

export async function resolveTenantRouteSlugForTenant(tenantId: string) {
  const tenant = await findTenantRouteSlug(tenantId);
  return tenant?.customSlug ?? null;
}