import "server-only";

import {
  listSeminarsByTenant,
  listSeminarsByTenantWithSubmissions,
  listUpcomingSeminarsByTenant,
  listSeminarsInNext7Days as repoListSeminarsInNext7Days,
  findTenantSeminarMembers,
} from "@/features/seminar/repositories/seminar.repository";

export async function listSeminars(tenantId: string) {
  return listSeminarsByTenant(tenantId);
}

export async function listSeminarsWithSubmissions(tenantId: string) {
  return listSeminarsByTenantWithSubmissions(tenantId);
}

export async function getSeminarManagementData(tenantId: string) {
  const [seminars, memberships] = await Promise.all([
    listSeminarsByTenantWithSubmissions(tenantId),
    findTenantSeminarMembers(tenantId),
  ]);
  return { seminars, allUsers: memberships.map((membership) => membership.user) };
}

export async function listUpcomingSeminars(tenantId: string) {
  return listUpcomingSeminarsByTenant(tenantId);
}

export async function listSeminarsInNext7Days(tenantId: string) {
  return repoListSeminarsInNext7Days(tenantId);
}