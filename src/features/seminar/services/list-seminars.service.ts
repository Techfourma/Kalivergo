import "server-only";

import {
  listSeminarsByTenant,
  listSeminarsByTenantWithSubmissions,
  listUpcomingSeminarsByTenant,
  listSeminarsInNext7Days as repoListSeminarsInNext7Days,
} from "@/features/seminar/repositories/seminar.repository";

export async function listSeminars(tenantId: string) {
  return listSeminarsByTenant(tenantId);
}

export async function listSeminarsWithSubmissions(tenantId: string) {
  return listSeminarsByTenantWithSubmissions(tenantId);
}

export async function listUpcomingSeminars(tenantId: string) {
  return listUpcomingSeminarsByTenant(tenantId);
}

export async function listSeminarsInNext7Days(tenantId: string) {
  return repoListSeminarsInNext7Days(tenantId);
}