import "server-only";

import {
  listSeminarsByTenant,
  listSeminarsByTenantWithSubmissions,
  listUpcomingSeminarsByTenant,
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